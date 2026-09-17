import { API_BASE_URL, MP_APPID } from '../config.js'

/** 微信后台配置运行时缓存（display_name 仅来自接口，无本地品牌兜底） */
let runtime = {
  loaded: false,
  configured: false,
  appid: null,
  display_name: '',
  templates: {
    homework: '',
    attendance: '',
    notice: '',
    daily: '',
    trial_confirm: '',
    trial_remind: '',
    trial_cancel: '',
    trial_convert: '',
  },
}

export function getWechatRuntime() {
  return runtime
}

export function getMpDisplayName() {
  return (runtime.display_name || '').trim()
}

export function getSubscribeTemplates() {
  return runtime.templates
}

/**
 * 拉取后台微信配置（独立用 uni.request，避免与 request.js 循环依赖）。
 * @param {boolean} force 强制刷新（登录前应传 true）
 */
export function ensureWechatRuntime(force = false) {
  if (runtime.loaded && !force) {
    return Promise.resolve(runtime)
  }

  const q = MP_APPID ? `?appid=${encodeURIComponent(MP_APPID)}` : ''
  const url = `${API_BASE_URL}/mp/wechat-config${q}`

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      header: { Accept: 'application/json' },
      success(res) {
        const body = res.data || {}
        const httpOk = res.statusCode >= 200 && res.statusCode < 300
        if (!httpOk || body.code !== 0) {
          const err = Object.assign(new Error(body.message || `请求失败(${res.statusCode})`), {
            code: body.code,
            statusCode: res.statusCode,
          })
          if (force) {
            runtime = { ...runtime, loaded: false }
            reject(err)
            return
          }
          runtime = { ...runtime, loaded: true, configured: false }
          resolve(runtime)
          return
        }
        const data = body.data || {}
        runtime = {
          loaded: true,
          configured: !!data.configured,
          appid: data.appid || MP_APPID || null,
          display_name: data.display_name ? String(data.display_name).trim() : '',
          templates: {
            homework: data.templates?.homework || '',
            attendance: data.templates?.attendance || '',
            notice: data.templates?.notice || '',
            daily: data.templates?.daily || '',
            trial_confirm: data.templates?.trial_confirm || '',
            trial_remind: data.templates?.trial_remind || '',
            trial_cancel: data.templates?.trial_cancel || '',
            trial_convert: data.templates?.trial_convert || '',
          },
        }
        resolve(runtime)
      },
      fail(err) {
        const e = Object.assign(new Error(err.errMsg || '网络异常'), { cause: err })
        if (force) {
          runtime = { ...runtime, loaded: false }
          reject(e)
          return
        }
        runtime = { ...runtime, loaded: true, configured: false }
        resolve(runtime)
      },
    })
  })
}
