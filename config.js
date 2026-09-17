/**
 * 静态配置。微信运行时请用 utils/wechatRuntime.js（避免与 request 循环依赖）。
 */
// 远程联调：服务器 https（cs.agentos.yun，真机调试勾选「不校验合法域名」即可用）
// 本机联调使用：http://127.0.0.1/api/v1
export const API_BASE_URL = 'https://cs.agentos.yun/api/v1'

/** 机构独立小程序时可填 AppID；空则使用平台后台默认小程序 */
export const MP_APPID = ''

/**
 * 调试模式：仅联调/测试阶段开放的能力统一挂此开关。
 * 正式打包上线前改为 false。
 *
 * 当前纳入能力（检索各处注释标记即可）：
 * - TEMP_IDENTITY_RESELECT_BACK：各端首页「‹」返回身份选择（清本地身份、保留登录）
 */
export const DEBUG_MODE = true

/** 调试直登（H5 预览 /mp/dev/login）默认使用的测试账号手机号 */
export const DEBUG_LOGIN_PHONE = '13268028272'

/** 附件相对 path → 可访问 URL（真机要求 https；http 会被微信拦截且不跟随 301） */
export function mediaUrl(path) {
  if (!path) return ''
  let url = String(path).trim()
  if (/^https?:\/\//i.test(url)) {
    // 后端 Storage::url 可能吐出 http://（APP_URL 未配 https）
    if (url.startsWith('http://')) url = `https://${url.slice(7)}`
    return url
  }
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  // path 有时已带 storage/ 前缀
  const rel = url.replace(/^\//, '').replace(/^storage\//, '')
  return `${origin}/storage/${rel}`
}
