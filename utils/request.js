import { API_BASE_URL } from '../config.js'
import { clearSession, getToken } from './auth.js'

/**
 * 统一请求：信封 { code, message, data }，code===0 为成功。
 * @param {object} options
 * @param {string} options.url 相对 /api/v1 的路径，如 /mp/login
 * @param {string} [options.method]
 * @param {object} [options.data]
 * @param {boolean} [options.auth=true] 是否带 Bearer token
 */
export function request(options = {}) {
  const { url, method = 'GET', data, auth = true } = options
  const header = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
  if (auth) {
    const token = getToken()
    if (token) header.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header,
      success(res) {
        const body = res.data || {}
        const httpOk = res.statusCode >= 200 && res.statusCode < 300
        if (res.statusCode === 401 || body.code === 40100) {
          clearSession()
          reject(Object.assign(new Error(body.message || '未登录或登录已失效'), { code: body.code || 40100, body }))
          return
        }
        if (!httpOk || body.code !== 0) {
          reject(Object.assign(new Error(body.message || `请求失败(${res.statusCode})`), {
            code: body.code,
            statusCode: res.statusCode,
            body
          }))
          return
        }
        resolve(body.data)
      },
      fail(err) {
        reject(Object.assign(new Error(err.errMsg || '网络异常'), { cause: err }))
      }
    })
  })
}

export const http = {
  get: (url, data, opts) => request({ url, method: 'GET', data, ...opts }),
  post: (url, data, opts) => request({ url, method: 'POST', data, ...opts }),
  put: (url, data, opts) => request({ url, method: 'PUT', data, ...opts }),
  delete: (url, data, opts) => request({ url, method: 'DELETE', data, ...opts })
}

/**
 * 两步上传第 1 步：POST /common/uploads
 * @returns {Promise<{ attachment_id: number, url?: string }>}
 */
export function uploadFile(filePath, bizType = 'submission') {
  const token = getToken()
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/common/uploads`,
      filePath,
      name: 'file',
      formData: { biz_type: bizType },
      header: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success(res) {
        let body = {}
        try {
          body = typeof res.data === 'string' ? JSON.parse(res.data) : (res.data || {})
        } catch (e) {
          reject(new Error('上传响应解析失败'))
          return
        }
        if (res.statusCode === 401 || body.code === 40100) {
          clearSession()
          reject(Object.assign(new Error(body.message || '未登录或登录已失效'), { code: body.code || 40100, body }))
          return
        }
        if (res.statusCode < 200 || res.statusCode >= 300 || body.code !== 0) {
          reject(Object.assign(new Error(body.message || `上传失败(${res.statusCode})`), { code: body.code, body }))
          return
        }
        resolve(body.data)
      },
      fail(err) {
        reject(Object.assign(new Error(err.errMsg || '上传异常'), { cause: err }))
      }
    })
  })
}
