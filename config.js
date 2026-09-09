/**
 * 本地联调配置。微信开发者工具需勾选「不校验合法域名」。
 * 后端默认：http://127.0.0.1:8001（与 admin-web 代理一致）
 */
export const API_BASE_URL = 'http://127.0.0.1:8001/api/v1'

/**
 * true：入口走 uni.login → 真 code（须配置 WECHAT_MINIAPP_* 且 FAKE=false）
 * false：使用下方演示 code（本地默认）
 */
export const USE_WX_LOGIN = false

/** 开发假登录 code（后端 Wechat fakeMode：code 即 openid） */
export const DEMO_LOGIN_CODES = {
  teacher: 'demo-teacher',
  parent: 'demo-parent',
  institution: 'demo-teacher'
}

/**
 * 微信订阅消息模板 ID（公众平台申请后填写；空则仅上报后端余额，不调 requestSubscribeMessage）
 * key 与家长偏好 / 后端 template_code 对齐（无 parent_ 前缀）
 */
export const WX_SUBSCRIBE_TEMPLATES = {
  homework: '',
  attendance: '',
  notice: '',
  daily: '',
}

/** 附件相对 path → 可访问 URL（本地 public disk） */
export function mediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  return `${origin}/storage/${String(path).replace(/^\//, '')}`
}
