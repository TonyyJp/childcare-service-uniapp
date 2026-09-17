import { http } from '../utils/request.js'
import { ssePost } from '../utils/streamRequest.js'

/** GET /institution/dashboard */
export function fetchDashboard() {
  return http.get('/institution/dashboard')
}

/** GET /institution/staffs */
export function fetchStaffs() {
  return http.get('/institution/staffs')
}

/** GET /institution/students */
export function fetchStudents() {
  return http.get('/institution/students')
}

/** GET /institution/bindings?status= */
export function fetchBindings(status = 'pending') {
  const data = {}
  if (status !== undefined && status !== null) data.status = status
  return http.get('/institution/bindings', data)
}

/** POST /institution/bindings/{id}/audit */
export function auditBinding(id, result, rejectReason) {
  const data = { result }
  if (rejectReason) data.reject_reason = rejectReason
  return http.post(`/institution/bindings/${id}/audit`, data)
}

/** GET /institution/leaves?status= */
export function fetchLeaves(status = 'pending') {
  const data = {}
  if (status !== undefined && status !== null) data.status = status
  return http.get('/institution/leaves', data)
}

/** POST /institution/leaves/{id}/audit */
export function auditLeave(id, result, rejectReason) {
  const data = { result }
  if (rejectReason) data.reject_reason = rejectReason
  return http.post(`/institution/leaves/${id}/audit`, data)
}

/** GET /institution/notices */
export function fetchNotices() {
  return http.get('/institution/notices')
}

/** POST /institution/notices */
export function createNotice(payload) {
  return http.post('/institution/notices', payload)
}

/** GET /institution/courses */
export function fetchCourses(status) {
  const data = {}
  if (status) data.status = status
  return http.get('/institution/courses', data)
}

/** GET /institution/catalogs/options */
export function fetchCatalogOptions() {
  return http.get('/institution/catalogs/options')
}

/** POST /institution/courses */
export function createCourse(payload) {
  return http.post('/institution/courses', payload)
}

/** PUT /institution/courses/{id} */
export function updateCourse(id, payload) {
  return http.put(`/institution/courses/${id}`, payload)
}

/** POST /institution/courses/{id}/publish */
export function publishCourse(id) {
  return http.post(`/institution/courses/${id}/publish`)
}

/** POST /institution/courses/{id}/unpublish */
export function unpublishCourse(id) {
  return http.post(`/institution/courses/${id}/unpublish`)
}

/** GET /institution/settings */
export function fetchSettings() {
  return http.get('/institution/settings')
}

/** PUT /institution/settings */
export function updateSettings(settings) {
  return http.put('/institution/settings', { settings })
}

/** GET /institution/reports?period=month|term|year */
export function fetchReports(period) {
  const data = {}
  if (period) data.period = period
  return http.get('/institution/reports', data)
}

/** GET /institution/platform-notices?popup=1 */
export function fetchPlatformNotices(popupOnly = false) {
  const data = {}
  if (popupOnly) data.popup = 1
  return http.get('/institution/platform-notices', data)
}

/** GET /institution/events */
export function fetchEvents() {
  return http.get('/institution/events')
}

/** POST /institution/events */
export function createEvent(payload) {
  return http.post('/institution/events', payload)
}

/** GET /institution/enrollments */
export function fetchEnrollments(params = {}) {
  const data = {}
  if (params.courseId) data.course_id = params.courseId
  if (params.studentId) data.student_id = params.studentId
  return http.get('/institution/enrollments', data)
}

/** POST /institution/enrollments */
export function createEnrollment(payload) {
  return http.post('/institution/enrollments', payload)
}

/** POST /institution/enrollments/{id}/consume */
export function consumeEnrollment(id) {
  return http.post(`/institution/enrollments/${id}/consume`)
}

/** GET /institution/meals */
export function fetchMeals(params = {}) {
  const data = {}
  if (params.date) data.date = params.date
  if (params.classId) data.class_id = params.classId
  if (params.mealType) data.meal_type = params.mealType
  return http.get('/institution/meals', data)
}

/** POST /institution/meals */
export function createMeal(payload) {
  return http.post('/institution/meals', payload)
}

/** GET /institution/submissions */
export function fetchSubmissions(status = 'submitted') {
  const data = {}
  if (status) data.status = status
  return http.get('/institution/submissions', data)
}

/** POST /institution/submissions/{id}/review */
export function reviewSubmission(id, grade, textFeedback) {
  const data = { grade }
  if (textFeedback) data.text_feedback = textFeedback
  return http.post(`/institution/submissions/${id}/review`, data)
}

/** GET /institution/attendance/periods */
export function fetchAttendancePeriods() {
  return http.get('/institution/attendance/periods')
}

/** GET /institution/attendance/classes */
export function fetchAttendanceClasses() {
  return http.get('/institution/attendance/classes')
}

/** GET /institution/attendance/today */
export function fetchAttendanceToday({ classId, periodId, date }) {
  const data = { class_id: classId, period_id: periodId }
  if (date) data.date = date
  return http.get('/institution/attendance/today', data)
}

/** POST /institution/attendance/checkin */
export function checkinStudents({ classId, periodId, studentIds, date, method = 'manual' }) {
  const data = {
    class_id: classId,
    period_id: periodId,
    student_ids: studentIds,
    method,
  }
  if (date) data.date = date
  return http.post('/institution/attendance/checkin', data)
}

/** GET /institution/daily-posts */
export function fetchDailyPosts(params = {}) {
  const data = {}
  if (params.classId != null) data.class_id = params.classId
  if (params.status) data.status = params.status
  return http.get('/institution/daily-posts', data)
}

/** POST /institution/daily-posts */
export function createDailyPost(payload) {
  return http.post('/institution/daily-posts', payload)
}

/** PUT /institution/daily-posts/{id} */
export function updateDailyPost(id, payload) {
  return http.put(`/institution/daily-posts/${id}`, payload)
}

/** POST /institution/daily-posts/{id}/ai-generate */
export function aiGenerateDailyPost(id, data = {}) {
  return http.post(`/institution/daily-posts/${id}/ai-generate`, data)
}

/** POST /institution/daily-posts/{id}/ai-generate/stream（SSE 流式生成） */
export function streamAiGenerateDailyPost(id, handlers = {}) {
  return ssePost(`/institution/daily-posts/${id}/ai-generate/stream`, {}, handlers)
}

/** POST /institution/daily-posts/{id}/publish */
export function publishDailyPost(id) {
  return http.post(`/institution/daily-posts/${id}/publish`)
}

/** POST /institution/daily-posts/{id}/withdraw */
export function withdrawDailyPost(id) {
  return http.post(`/institution/daily-posts/${id}/withdraw`)
}

/** GET /institution/lesson-attendances — 兴趣课次名单（代点名） */
export function fetchLessonAttendances({ classId, date, lessonDate, lessonSort } = {}) {
  const data = {}
  if (classId) data.class_id = classId
  const d = lessonDate || date
  if (d) data.lesson_date = d
  if (lessonSort != null) data.lesson_sort = lessonSort
  return http.get('/institution/lesson-attendances', data)
}

/** PUT /institution/lesson-attendances/{id} */
export function updateLessonAttendanceStatus(id, status) {
  return http.put(`/institution/lesson-attendances/${id}`, { status })
}

/** GET /institution/classes?biz_type=interest — 兴趣课班列表 */
export function fetchInterestClasses() {
  return http.get('/institution/classes', { biz_type: 'interest' })
}

/** POST /institution/lesson-packages — 简化发放课包 */
export function createLessonPackage(payload) {
  return http.post('/institution/lesson-packages', payload)
}

/** GET /institution/lesson-consume/summary?days=7 — 近 N 日课消汇总 */
export function fetchLessonConsumeSummary(days = 7) {
  return http.get('/institution/lesson-consume/summary', { days })
}

/** GET /institution/trial-bookings */
export function fetchTrialBookings(params = {}) {
  const data = {}
  if (params.status) data.status = params.status
  if (params.studentId) data.student_id = params.studentId
  if (params.classId) data.class_id = params.classId
  return http.get('/institution/trial-bookings', data)
}

/**
 * GET /institution/trial-bookings/lessons?class_id=
 * 排课次列表（与 org 课班 lesson_plan 对齐）。后端若未挂此路由，调用方会回退 class.lesson_plan。
 */
export function fetchTrialBookingLessons(classId) {
  return http.get('/institution/trial-bookings/lessons', { class_id: classId })
}

/** POST /institution/trial-bookings — 代录（已有学生，source=staff_mp） */
export function createTrialBooking(payload) {
  return http.post('/institution/trial-bookings', payload)
}

/** POST /institution/trial-bookings/{id}/schedule */
export function scheduleTrialBooking(id, payload) {
  return http.post(`/institution/trial-bookings/${id}/schedule`, payload)
}

/** POST /institution/trial-bookings/{id}/cancel */
export function cancelTrialBooking(id, reason) {
  return http.post(`/institution/trial-bookings/${id}/cancel`, { reason })
}

/** POST /institution/trial-bookings/{id}/convert */
export function convertTrialBooking(id, payload) {
  return http.post(`/institution/trial-bookings/${id}/convert`, payload)
}
