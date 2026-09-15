import { API_BASE_URL } from '../config.js'
import { getToken } from './auth.js'

/** 是否尝试流式（仅微信小程序；低版本基础库由运行时探测 task.onChunkReceived 后再降级，
 *  勿用 wx.canIUse 判定——对 requestTask 实例方法不可靠，开发者工具下常误报 false） */
export function supportsChunkedStream() {
  // #ifdef MP-WEIXIN
  return typeof wx !== 'undefined' && typeof wx.request === 'function'
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
}

/** 完整行的 UTF-8 解码（按 \n=0x0A 切行，0x0A 不会出现在多字节序列中间，故无截断问题） */
function utf8Decode(bytes) {
  let out = ''
  let i = 0
  const n = bytes.length
  while (i < n) {
    const b = bytes[i]
    if (b < 0x80) {
      out += String.fromCharCode(b)
      i += 1
    } else if (b < 0xe0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f))
      i += 2
    } else if (b < 0xf0) {
      out += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f))
      i += 3
    } else {
      const cp = (((b & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f)) - 0x10000
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff))
      i += 4
    }
  }
  return out
}

/**
 * SSE 流式 POST（微信 enableChunked 分块传输）。事件契约见 docs/api-design.md：
 *   data: {"delta":"..."}  正文增量；data: {"done":true,"content","post"} 结束；data: {"error":"..."} 失败
 * 非 200 时响应体为统一信封 JSON，取 message 报错。
 * @param {string} url 相对 /api/v1 的路径
 * @param {object} data JSON 请求体
 * @param {{onDelta?: Function}} handlers.onDelta(增量文本) 流式回调
 * @returns {Promise<{done:true, content:string, post:object}>}
 */
export function ssePost(url, data = {}, handlers = {}) {
  return new Promise((resolve, reject) => {
    const header = {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json'
    }
    const token = getToken()
    if (token) header.Authorization = `Bearer ${token}`

    let pending = [] // 未成行的字节缓冲
    let settled = false
    let sawEvent = false

    const settle = (fn, arg) => {
      if (settled) return
      settled = true
      fn(arg)
    }

    /** 消费一段新字节；返回是否已终结（done / error） */
    const consume = bytes => {
      for (let i = 0; i < bytes.length; i++) pending.push(bytes[i])
      let nl
      while ((nl = pending.indexOf(10)) !== -1) {
        const lineBytes = pending.splice(0, nl + 1)
        const line = utf8Decode(lineBytes.slice(0, -1)).trim()
        if (!line.startsWith('data:')) continue
        let payload
        try {
          payload = JSON.parse(line.slice(5).trim())
        } catch (e) {
          continue
        }
        sawEvent = true
        if (payload.error) {
          settle(reject, new Error(payload.error))
          return true
        }
        if (payload.done) {
          settle(resolve, payload)
          return true
        }
        if (typeof payload.delta === 'string' && payload.delta && handlers.onDelta) {
          handlers.onDelta(payload.delta)
        }
      }
      return false
    }

    const task = wx.request({
      url: `${API_BASE_URL}${url}`,
      method: 'POST',
      enableChunked: true,
      timeout: 120000,
      header,
      data,
      success: res => {
        if (settled) return
        if (res.statusCode >= 200 && res.statusCode < 300) {
          settle(reject, new Error(sawEvent ? '连接中断，请重试' : '服务无响应，请重试'))
          return
        }
        // 非 200：整体 body 为信封 JSON（已随分块到达 pending）
        let msg = `请求失败(${res.statusCode})`
        try {
          const body = JSON.parse(utf8Decode(pending))
          if (body.message) msg = body.message
        } catch (e) { /* 非 JSON，用默认 */ }
        settle(reject, new Error(msg))
      },
      fail: err => settle(reject, new Error(err.errMsg || '网络异常'))
    })

    if (task && typeof task.onChunkReceived === 'function') {
      task.onChunkReceived(res => {
        if (settled) return
        consume(new Uint8Array(res.data))
      })
    } else {
      // 基础库确实过低（< 2.20.1）：中止请求，调用方按 unsupported 降级
      if (task && typeof task.abort === 'function') task.abort()
      settle(reject, Object.assign(new Error('当前基础库不支持流式接收'), { unsupported: true }))
    }
  })
}
