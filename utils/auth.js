const TOKEN_KEY = 'mp_token'
const ROLE_KEY = 'mp_role'
const PROFILE_KEY = 'mp_profile'
/** TEMP_IDENTITY_RESELECT_BACK：受 DEBUG_MODE 控制，首页返回重选身份 */
const FORCE_RESELECT_KEY = 'mp_force_reselect'
/** 暂不登录：无 token 浏览临时家长端 */
const GUEST_KEY = 'mp_guest'

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) uni.setStorageSync(TOKEN_KEY, token)
  else uni.removeStorageSync(TOKEN_KEY)
}

export function getRole() {
  return uni.getStorageSync(ROLE_KEY) || ''
}

export function setRole(role) {
  if (role) uni.setStorageSync(ROLE_KEY, role)
  else uni.removeStorageSync(ROLE_KEY)
}

export function getProfile() {
  try {
    return uni.getStorageSync(PROFILE_KEY) || null
  } catch {
    return null
  }
}

export function setProfile(profile) {
  if (profile) uni.setStorageSync(PROFILE_KEY, profile)
  else uni.removeStorageSync(PROFILE_KEY)
}

export function isGuest() {
  return !!uni.getStorageSync(GUEST_KEY)
}

/** 进入临时家长端（无登录态） */
export function enterGuestParent() {
  clearSession()
  uni.setStorageSync(GUEST_KEY, '1')
  setRole('parent')
}

export function clearGuest() {
  try {
    uni.removeStorageSync(GUEST_KEY)
  } catch {
    // ignore
  }
}

/**
 * TEMP_IDENTITY_RESELECT_BACK（DEBUG_MODE）：清本地已选身份（保留 token），并标记下次勿直达首页。
 */
export function clearRoleSelection() {
  setRole('')
  const profile = getProfile()
  if (profile && typeof profile === 'object') {
    const next = { ...profile }
    delete next.current_role
    setProfile(next)
  }
  uni.setStorageSync(FORCE_RESELECT_KEY, '1')
}

/** TEMP_IDENTITY_RESELECT_BACK（DEBUG_MODE）：消费一次「强制重选身份」标记 */
export function consumeForceReselect() {
  const flag = uni.getStorageSync(FORCE_RESELECT_KEY)
  if (!flag) return false
  uni.removeStorageSync(FORCE_RESELECT_KEY)
  return true
}

export function clearSession() {
  setToken('')
  setRole('')
  setProfile(null)
  uni.removeStorageSync(FORCE_RESELECT_KEY)
  clearGuest()
  try {
    // 与 utils/apps.js 缓存同步清理（避免角色切换串租户）
    uni.removeStorageSync('mp_apps_cache')
    uni.removeStorageSync('mp_apps_cache_role')
    uni.removeStorageSync('mp_apps_cache_student')
  } catch {
    // ignore
  }
}
