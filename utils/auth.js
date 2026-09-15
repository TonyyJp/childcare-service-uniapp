const TOKEN_KEY = 'mp_token'
const ROLE_KEY = 'mp_role'
const PROFILE_KEY = 'mp_profile'
/** TEMP_IDENTITY_RESELECT_BACK：受 DEBUG_MODE 控制，首页返回重选身份 */
const FORCE_RESELECT_KEY = 'mp_force_reselect'

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
}

