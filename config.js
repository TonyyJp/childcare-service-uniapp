/**
 * 静态配置。微信运行时请用 utils/wechatRuntime.js（避免与 request 循环依赖）。
 */
export const API_BASE_URL = 'http://127.0.0.1:8001/api/v1'

/** 机构独立小程序时可填 AppID；空则使用平台后台默认小程序 */
export const MP_APPID = ''

/** 附件相对 path → 可访问 URL */
export function mediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  return `${origin}/storage/${String(path).replace(/^\//, '')}`
}
