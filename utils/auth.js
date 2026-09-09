const TOKEN_KEY = 'mp_token'
const ROLE_KEY = 'mp_role'
const PROFILE_KEY = 'mp_profile'

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

export function clearSession() {
  setToken('')
  setRole('')
  setProfile(null)
}
