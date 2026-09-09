import { http } from '../utils/request.js'
import { clearSession, setProfile, setRole, setToken } from '../utils/auth.js'

/** POST /mp/login */
export function login(code, appid) {
  const data = { code }
  if (appid) data.appid = appid
  return http.post('/mp/login', data, { auth: false })
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

/**
 * 登录并落到目标角色，写入本地会话。
 * @param {string} code 假登录可用 demo-teacher / demo-parent
 * @param {'teacher'|'parent'|'institution'} targetRole
 */
export async function loginAs(code, targetRole) {
  const data = await login(code)

  if (data.need_phone) {
    const err = new Error('需要绑定手机号后才能进入')
    err.code = 'NEED_PHONE'
    err.login_ticket = data.login_ticket
    throw err
  }

  setToken(data.token)
  setProfile({ identities: data.identities, current_role: data.current_role })

  let role = data.current_role
  if (targetRole && targetRole !== role) {
    if ((targetRole === 'teacher' || targetRole === 'institution') && !data.identities?.is_staff) {
      throw Object.assign(new Error('当前账号无员工身份'), { code: 40300 })
    }
    const switched = await switchRole(targetRole)
    role = switched.current_role
    setProfile({
      identities: data.identities,
      current_role: role,
      staff_id: switched.staff_id
    })
  }

  setRole(role)
  return { ...data, current_role: role }
}
