import { http } from '../utils/request.js'
import { clearSession, getRole, setProfile, setRole, setToken } from '../utils/auth.js'
import { MP_APPID } from '../config.js'

/** POST /mp/login（仅微信 code，可能返回 need_phone） */
export function login(code, appid) {
  const data = { code }
  if (appid) data.appid = appid
  return http.post('/mp/login', data, { auth: false })
}

/** POST /mp/sms/send（备用） */
export function sendSms(phone, scene = 'login') {
  return http.post('/mp/sms/send', { phone, scene }, { auth: false })
}

/**
 * POST /mp/phone/login
 * 微信手机号快捷登录
 * @param {{ code: string, phone_code: string, appid?: string }} payload
 */
export function phoneLogin(payload) {
  return http.post('/mp/phone/login', payload, { auth: false })
}

/** POST /mp/phone/bind（备用短信绑手机） */
export function phoneBind({ login_ticket, phone, sms_code }) {
  return http.post('/mp/phone/bind', { login_ticket, phone, sms_code }, { auth: false })
}

/**
 * POST /mp/dev/login（仅调试环境）
 * H5 预览无法走微信授权，用此接口按角色直接换取真实 token。
 * 返回结构与 /mp/phone/login 一致：{ token, current_role, identities }
 * @param {{ role: 'teacher'|'parent'|'institution', phone?: string }} payload
 */
export function devLogin(payload) {
  return http.post('/mp/dev/login', payload, { auth: false })
}

/** GET /mp/me */
export function fetchMe() {
  return http.get('/mp/me')
}

/** POST /mp/role/switch */
export function switchRole(role, staffId) {
  const data = { role }
  if (staffId != null) data.staff_id = staffId
  return http.post('/mp/role/switch', data)
}

/** POST /mp/logout */
export function logout() {
  return http.post('/mp/logout').finally(() => clearSession())
}

function wxLoginCode() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        if (res.code) resolve(res.code)
        else reject(new Error('微信登录未返回 code'))
      },
      fail: (err) => reject(new Error(err?.errMsg || '微信登录失败')),
    })
  })
}

/**
 * 写入会话并切到目标角色。
 * 登录凭证一律先落盘；若目标角色无权限则保留会话并抛出，便于重选身份无需再登录。
 */
export async function applySession(data, targetRole) {
  setToken(data.token)
  const baseRole = data.current_role || 'parent'
  setProfile({ identities: data.identities, current_role: baseRole })
  setRole(baseRole)

  if (!targetRole || targetRole === baseRole) {
    return { ...data, current_role: baseRole }
  }

  if ((targetRole === 'teacher' || targetRole === 'institution') && !data.identities?.is_staff) {
    // 选择的身份无权限：本次未成功进入任何身份，清除角色记录，避免下次被误直达
    setRole('')
    throw Object.assign(new Error('当前手机号不是在职员工，无法进入教师/机构端'), {
      code: 40300,
      sessionEstablished: true,
    })
  }

  const switched = await switchRole(targetRole)
  const role = switched.current_role
  setProfile({
    identities: data.identities,
    current_role: role,
    staff_id: switched.staff_id,
  })
  setRole(role)
  return { ...data, current_role: role }
}

/**
 * 已登录用户切换身份（不重新走微信手机号登录）。
 * @param {'teacher'|'parent'|'institution'} targetRole
 */
export async function enterAsRole(targetRole) {
  const me = await fetchMe()
  const identities = me.identities || {}
  if ((targetRole === 'teacher' || targetRole === 'institution') && !identities.is_staff) {
    throw Object.assign(new Error('当前账号无员工身份，无法进入教师/机构端'), { code: 40300 })
  }

  let role = me.current_role
  let staffId = null
  if (targetRole && targetRole !== role) {
    const switched = await switchRole(targetRole)
    role = switched.current_role
    staffId = switched.staff_id
  }

  setProfile({
    identities,
    current_role: role,
    staff_id: staffId,
    guardian: me.guardian,
    bindings: me.bindings,
  })
  setRole(role)
  return { ...me, current_role: role, staff_id: staffId }
}

/**
 * 微信手机号快捷登录：wx.login + getPhoneNumber.code
 */
export async function loginWithWxPhone(phoneCode, targetRole) {
  const code = await wxLoginCode()
  const data = await phoneLogin({
    code,
    phone_code: phoneCode,
    appid: MP_APPID || undefined,
  })
  return applySession(data, targetRole)
}

/**
 * 调试直登（H5 预览）：不走微信授权，按角色向后端换取真实 token。
 * @param {'teacher'|'parent'|'institution'} targetRole
 * @param {string} [phone] 可选，指定测试账号手机号
 */
export async function loginWithDev(targetRole, phone) {
  const data = await devLogin({ role: targetRole, phone })
  return applySession(data, targetRole)
}

/** 是否已关联机构：员工身份、家长已有学生绑定或已登记机构名册（后台登记/邀请码建孩） */
export function hasOrgAffiliation(me) {
  if (!me) return false
  return !!me.identities?.is_staff || parentAffiliated(me)
}

/** 家长侧是否已关联机构：有学生绑定或已在机构名册 */
function parentAffiliated(me) {
  return Number(me.bindings || 0) > 0 || Number(me.tenants || 0) > 0
}

/**
 * 已登录时解析应直达的身份；否则返回 null（停留选身份页）。
 * 仅当用户主动选择过某身份（本地有成功进入记录）且当前仍拥有该身份时才直达：
 * - 教师/机构端：须仍是在职员工
 * - 家长端：所有 guardian 天然拥有家长身份
 * 注意：后端 current_role 是发 token 时的服务端默认值，不代表用户选择，不作为直达依据。
 */
export function resolveBoundRole(me) {
  const saved = getRole()
  if (!saved || !me) return null
  const isStaff = !!me.identities?.is_staff
  if (saved === 'institution' && isStaff) return 'institution'
  if (saved === 'teacher' && isStaff) return 'teacher'
  if (saved === 'parent') return 'parent'
  return null
}

