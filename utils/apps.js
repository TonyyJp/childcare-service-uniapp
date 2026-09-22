/**
 * 小程序已购应用：拉取 /mp/apps 并缓存，供入口裁剪。
 * 契约见 docs/tech/app-center/05-frontend.md
 */
import { http } from './request.js'
import { getRole } from './auth.js'

const CACHE_KEY = 'mp_apps_cache'
const CACHE_ROLE_KEY = 'mp_apps_cache_role'
const CACHE_STUDENT_KEY = 'mp_apps_cache_student'

/** @type {import('vue').Ref | null} 可选：页面注入的 reactive list */
let memoryList = []

export function getCachedApps() {
  if (memoryList?.length) return memoryList
  try {
    const raw = uni.getStorageSync(CACHE_KEY)
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function persist(list, role, studentId) {
  memoryList = list
  try {
    uni.setStorageSync(CACHE_KEY, list)
    uni.setStorageSync(CACHE_ROLE_KEY, role || '')
    uni.setStorageSync(CACHE_STUDENT_KEY, studentId != null ? String(studentId) : '')
  } catch {
    // ignore
  }
}

export function clearAppsCache() {
  memoryList = []
  try {
    uni.removeStorageSync(CACHE_KEY)
    uni.removeStorageSync(CACHE_ROLE_KEY)
    uni.removeStorageSync(CACHE_STUDENT_KEY)
  } catch {
    // ignore
  }
}

/**
 * @param {{ studentId?: number|string|null, force?: boolean }} [opts]
 * @returns {Promise<array>}
 */
export async function loadApps(opts = {}) {
  const role = getRole() || ''
  const studentId = opts.studentId != null && opts.studentId !== '' ? opts.studentId : null
  if (!opts.force) {
    try {
      const cachedRole = uni.getStorageSync(CACHE_ROLE_KEY) || ''
      const cachedStudent = uni.getStorageSync(CACHE_STUDENT_KEY) || ''
      const wantStudent = studentId != null ? String(studentId) : ''
      if (cachedRole === role && cachedStudent === wantStudent) {
        const cached = getCachedApps()
        if (cached.length) return cached
      }
    } catch {
      // fallthrough
    }
  }

  const params = {}
  if (studentId != null) params.student_id = studentId
  const data = await http.get('/mp/apps', params)
  const list = Array.isArray(data?.list) ? data.list : []
  persist(list, role, studentId)
  return list
}

export function findApp(appCode, list) {
  const apps = list || getCachedApps()
  return apps.find((a) => a.app_code === appCode && a.effective !== false) || null
}

export function hasApp(appCode, list) {
  return !!findApp(appCode, list)
}

export function hasFeature(appCode, feature, list) {
  const app = findApp(appCode, list)
  if (!app) return false
  const features = app.features || {}
  return !!features[feature]
}

export function sceneEnabled(appCode, sceneCode, list) {
  const app = findApp(appCode, list)
  if (!app) return false
  const scenes = app.scenes || []
  const hit = scenes.find((s) => s.scene_code === sceneCode)
  if (!hit) return true
  return !!hit.enabled
}

/** 刷脸入口：ATTENDANCE ∧ L3 场景 ∧ L5 face_checkin */
export function faceCheckinEnabled(list) {
  if (!hasApp('ATTENDANCE', list)) return false
  if (!sceneEnabled('ATTENDANCE', 'attendance.face_1n', list)) return false
  const app = findApp('ATTENDANCE', list)
  const l5 = app?.l5
  if (l5 && Object.prototype.hasOwnProperty.call(l5, 'face_checkin')) {
    return !!l5.face_checkin
  }
  return false
}

/** 注入 key，页面 provide / 组件 inject */
export const MP_APPS_KEY = 'mpApps'
