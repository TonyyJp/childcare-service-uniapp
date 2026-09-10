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
 */
export async function applySession(data, targetRole) {
  setToken(data.token)
  setProfile({ identities: data.identities, current_role: data.current_role })

  let role = data.current_role
  if (targetRole && targetRole !== role) {
    if ((targetRole === 'teacher' || targetRole === 'institution') && !data.identities?.is_staff) {
      throw Object.assign(new Error('当前手机号不是在职员工，无法进入教师/机构端'), { code: 40300 })
    }
    const switched = await switchRole(targetRole)
    role = switched.current_role
    setProfile({
      identities: data.identities,
      current_role: role,
      staff_id: switched.staff_id,
    })
  }

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

/** 是否已关联机构：员工身份或家长已有学生绑定 */
export function hasOrgAffiliation(me) {
  if (!me) return false
  return !!me.identities?.is_staff || Number(me.bindings || 0) > 0
}

/**
 * 已登录且已关联机构时，解析应直达的身份；否则返回 null（停留选身份页）。
 */
export function resolveBoundRole(me) {
  if (!hasOrgAffiliation(me)) return null
  const isStaff = !!me.identities?.is_staff
  const bindings = Number(me.bindings || 0)
  const saved = getRole() || me.current_role || ''

  if (saved === 'institution' && isStaff) return 'institution'
  if (saved === 'teacher' && isStaff) return 'teacher'
  if (saved === 'parent' && bindings > 0) return 'parent'

  if (isStaff && bindings > 0) return saved === 'teacher' || saved === 'institution' ? saved : 'parent'
  if (isStaff) return 'teacher'
  if (bindings > 0) return 'parent'
  return null
}

