import { http } from '../utils/request.js'

/** GET /teacher/dashboard */
export function fetchDashboard(date) {
  return http.get('/teacher/dashboard', date ? { date } : undefined)
}

/** GET /teacher/profile */
export function fetchProfile() {
  return http.get('/teacher/profile')
}

/** GET /teacher/attendance/periods */
export function fetchPeriods() {
  return http.get('/teacher/attendance/periods')
}

/** GET /teacher/attendance/today */
export function fetchAttendanceToday({ classId, periodId, date }) {
  const data = { class_id: classId, period_id: periodId }
  if (date) data.date = date
  return http.get('/teacher/attendance/today', data)
}

/** POST /teacher/attendance/checkin */
export function checkinStudents({ classId, periodId, studentIds, date, method = 'manual' }) {
  const data = {
    class_id: classId,
    period_id: periodId,
    student_ids: studentIds,
    method
  }
  if (date) data.date = date
  return http.post('/teacher/attendance/checkin', data)
}

/** POST /teacher/attendance/records/{id}/mark-absent */
export function markAbsent(recordId) {
  return http.post(`/teacher/attendance/records/${recordId}/mark-absent`)
}

/** GET /teacher/homeworks */
export function fetchHomeworks({ classId, status, page, perPage } = {}) {
  const data = {}
  if (classId) data.class_id = classId
  if (status) data.status = status
  if (page) data.page = page
  if (perPage) data.per_page = perPage
  return http.get('/teacher/homeworks', data)
}

/** POST /teacher/homeworks */
export function createHomework(payload) {
  return http.post('/teacher/homeworks', payload)
}

/** GET /teacher/homeworks/{id} */
export function fetchHomework(id) {
  return http.get(`/teacher/homeworks/${id}`)
}

/** POST /teacher/homeworks/{id}/withdraw */
export function withdrawHomework(id) {
  return http.post(`/teacher/homeworks/${id}/withdraw`)
}

/** GET /teacher/homeworks/{id}/submissions */
export function fetchHomeworkSubmissions(id, status) {
  const data = {}
  if (status) data.status = status
  return http.get(`/teacher/homeworks/${id}/submissions`, data)
}

/** GET /teacher/submissions/{id} */
export function fetchSubmission(id) {
  return http.get(`/teacher/submissions/${id}`)
}

/** POST /teacher/submissions/{id}/review */
export function reviewSubmission(id, payload) {
  return http.post(`/teacher/submissions/${id}/review`, payload)
}

/** GET /teacher/meals */
export function fetchMeals({ date, classId, mealType } = {}) {
  const data = {}
  if (date) data.date = date
  if (classId) data.class_id = classId
  if (mealType) data.meal_type = mealType
  return http.get('/teacher/meals', data)
}

/** POST /teacher/meals */
export function createMeal(payload) {
  return http.post('/teacher/meals', payload)
}

/** GET /teacher/daily-posts */
export function fetchDailyPosts({ classId, status } = {}) {
  const data = {}
  if (classId) data.class_id = classId
  if (status) data.status = status
  return http.get('/teacher/daily-posts', data)
}

/** POST /teacher/daily-posts */
export function createDailyPost(payload) {
  return http.post('/teacher/daily-posts', payload)
}

/** PUT /teacher/daily-posts/{id} */
export function updateDailyPost(id, payload) {
  return http.put(`/teacher/daily-posts/${id}`, payload)
}

/** POST /teacher/daily-posts/{id}/ai-generate */
export function aiGenerateDailyPost(id, content) {
  const data = {}
  if (content) data.content = content
  return http.post(`/teacher/daily-posts/${id}/ai-generate`, data)
}

/** POST /teacher/daily-posts/{id}/publish */
export function publishDailyPost(id) {
  return http.post(`/teacher/daily-posts/${id}/publish`)
}

/** POST /teacher/daily-posts/{id}/withdraw */
export function withdrawDailyPost(id) {
  return http.post(`/teacher/daily-posts/${id}/withdraw`)
}

/** GET /teacher/classes/{id}/students */
export function fetchClassStudents(classId, date) {
  const data = {}
  if (date) data.date = date
  return http.get(`/teacher/classes/${classId}/students`, data)
}

/** GET /teacher/growth/milestones */
export function fetchGrowthMilestones(classId) {
  const data = {}
  if (classId) data.class_id = classId
  return http.get('/teacher/growth/milestones', data)
}

/** POST /teacher/growth/milestones */
export function createGrowthMilestone(payload) {
  return http.post('/teacher/growth/milestones', payload)
}

/** GET /teacher/growth/physique */
export function fetchGrowthPhysique(classId) {
  const data = {}
  if (classId) data.class_id = classId
  return http.get('/teacher/growth/physique', data)
}

/** POST /teacher/growth/physique */
export function createGrowthPhysique(payload) {
  return http.post('/teacher/growth/physique', payload)
}

/** GET /teacher/schedules?day_of_week=&class_id= */
export function fetchSchedules({ dayOfWeek, classId } = {}) {
  const data = {}
  if (dayOfWeek) data.day_of_week = dayOfWeek
  if (classId) data.class_id = classId
  return http.get('/teacher/schedules', data)
}

/** GET /teacher/analytics?class_id= */
export function fetchAnalytics(classId) {
  const data = {}
  if (classId) data.class_id = classId
  return http.get('/teacher/analytics', data)
}

/** GET /teacher/events?class_id= */
export function fetchEvents(classId) {
  const data = {}
  if (classId) data.class_id = classId
  return http.get('/teacher/events', data)
}

/** GET /teacher/notices?class_id= */
export function fetchNotices(classId) {
  const data = {}
  if (classId) data.class_id = classId
  return http.get('/teacher/notices', data)
}

/** GET /teacher/leaves */
export function fetchLeaves(status) {
  const data = { per_page: 50 }
  if (status) data.status = status
  return http.get('/teacher/leaves', data)
}

/** POST /teacher/leaves/{id}/audit */
export function auditLeave(id, result, rejectReason) {
  const data = { result }
  if (rejectReason) data.reject_reason = rejectReason
  return http.post(`/teacher/leaves/${id}/audit`, data)
}

/** GET /teacher/messages */
export function fetchMessages(type) {
  const data = { per_page: 50 }
  if (type) data.type = type
  return http.get('/teacher/messages', data)
}

/** POST /teacher/messages/read */
export function readMessages(ids) {
  return http.post('/teacher/messages/read', { ids })
}
