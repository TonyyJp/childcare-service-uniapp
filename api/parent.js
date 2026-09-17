import { http } from '../utils/request.js'

/** GET /parent/students */
export function fetchStudents() {
  return http.get('/parent/students')
}

/** PUT /parent/students/{id} */
export function updateStudent(id, payload) {
  return http.put(`/parent/students/${id}`, payload)
}

/** GET /parent/invite-info?invite_code= */
export function fetchInviteInfo(inviteCode) {
  return http.get('/parent/invite-info', { invite_code: inviteCode })
}

/** GET /parent/bindings */
export function fetchBindings() {
  return http.get('/parent/bindings')
}

/** POST /parent/bindings */
export function createBinding(payload) {
  return http.post('/parent/bindings', payload)
}

/** GET /parent/profile */
export function fetchProfile() {
  return http.get('/parent/profile')
}

/** PUT /parent/profile */
export function updateProfile(payload) {
  return http.put('/parent/profile', payload)
}

/** GET /parent/tickets */
export function fetchTickets() {
  return http.get('/parent/tickets')
}

/** POST /parent/tickets */
export function createTicket(payload) {
  return http.post('/parent/tickets', payload)
}

/** GET /parent/satisfaction?student_id= */
export function fetchSatisfaction(studentId) {
  return http.get('/parent/satisfaction', { student_id: studentId })
}

/** POST /parent/satisfaction */
export function submitSatisfaction(payload) {
  return http.post('/parent/satisfaction', payload)
}

/** GET /parent/home?student_id=&date= */
export function fetchHome(studentId, date) {
  const data = { student_id: studentId }
  if (date) data.date = date
  return http.get('/parent/home', data)
}

/** GET /parent/menus/current */
export function fetchCurrentMenu() {
  return http.get('/parent/menus/current')
}

/** POST /parent/subscribe/report */
export function reportSubscribe(templateCode, count = 1) {
  return http.post('/parent/subscribe/report', {
    template_code: templateCode,
    count,
  })
}

/** GET /parent/attendance/daily?student_id=&date= */
export function fetchAttendanceDaily(studentId, date) {
  const data = { student_id: studentId }
  if (date) data.date = date
  return http.get('/parent/attendance/daily', data)
}

/** GET /parent/homeworks?student_id= */
export function fetchHomeworks(studentId, status) {
  const data = { student_id: studentId }
  if (status) data.status = status
  return http.get('/parent/homeworks', data)
}

/** GET /parent/homeworks/{id}?student_id= */
export function fetchHomework(id, studentId) {
  return http.get(`/parent/homeworks/${id}`, { student_id: studentId })
}

/** POST /parent/homeworks/{id}/submit */
export function submitHomework(id, payload) {
  return http.post(`/parent/homeworks/${id}/submit`, payload)
}

/** GET /parent/meals/today?student_id=&date= */
export function fetchMealsToday(studentId, date) {
  const data = { student_id: studentId }
  if (date) data.date = date
  return http.get('/parent/meals/today', data)
}

/** GET /parent/courses?student_id= | tenant_id= */
export function fetchCourses(studentId, tenantId) {
  const data = {}
  if (studentId) data.student_id = studentId
  else if (tenantId) data.tenant_id = tenantId
  return http.get('/parent/courses', data)
}

/** GET /parent/courses/{id}?student_id= | tenant_id= */
export function fetchCourse(id, studentId, tenantId) {
  const data = {}
  if (studentId) data.student_id = studentId
  else if (tenantId) data.tenant_id = tenantId
  return http.get(`/parent/courses/${id}`, data)
}

/** GET /parent/messages */
export function fetchMessages(type) {
  const data = { per_page: 50 }
  if (type) data.type = type
  return http.get('/parent/messages', data)
}

/** POST /parent/messages/read — ids 或 type */
export function readMessages(payload) {
  if (Array.isArray(payload)) {
    return http.post('/parent/messages/read', { ids: payload })
  }
  return http.post('/parent/messages/read', payload)
}

/** GET /parent/messages/unread-count */
export function fetchUnreadCount() {
  return http.get('/parent/messages/unread-count')
}

/** GET /parent/daily-posts */
export function fetchDailyPosts(studentId, page = 1) {
  return http.get('/parent/daily-posts', { student_id: studentId, page, per_page: 20 })
}

/** GET /parent/daily-posts/{id} */
export function fetchDailyPost(id, studentId) {
  return http.get(`/parent/daily-posts/${id}`, { student_id: studentId })
}

/** POST /parent/daily-posts/{id}/comments */
export function createDailyComment(id, payload) {
  return http.post(`/parent/daily-posts/${id}/comments`, payload)
}

/** POST /parent/daily-posts/{id}/like — 切换点赞 */
export function toggleDailyLike(id, studentId) {
  return http.post(`/parent/daily-posts/${id}/like`, { student_id: studentId })
}

/** GET /parent/daily-interactions */
export function fetchDailyInteractions() {
  return http.get('/parent/daily-interactions')
}

/** GET /parent/growth-album — 成长影集（日常动态照片） */
export function fetchGrowthAlbum(studentId, { classId, page = 1, perPage = 30 } = {}) {
  const data = { student_id: studentId, page, per_page: perPage }
  if (classId) data.class_id = classId
  return http.get('/parent/growth-album', data)
}

/** GET /parent/growth?student_id= */
export function fetchGrowth(studentId) {
  return http.get('/parent/growth', { student_id: studentId })
}

/** GET /parent/schedules?student_id=&day_of_week= */
export function fetchSchedules(studentId, dayOfWeek) {
  const data = { student_id: studentId }
  if (dayOfWeek) data.day_of_week = dayOfWeek
  return http.get('/parent/schedules', data)
}

/** GET /parent/events?student_id= | tenant_id= */
export function fetchEvents(studentId, tenantId) {
  const data = {}
  if (studentId) data.student_id = studentId
  else if (tenantId) data.tenant_id = tenantId
  return http.get('/parent/events', data)
}

/** GET /parent/enrollments?student_id= */
export function fetchEnrollments(studentId) {
  return http.get('/parent/enrollments', { student_id: studentId })
}

/** GET /parent/leaves?student_id= */
export function fetchLeaves(studentId) {
  return http.get('/parent/leaves', { student_id: studentId })
}

/** POST /parent/leaves */
export function createLeave(payload) {
  return http.post('/parent/leaves', payload)
}

/** POST /parent/leaves/{id}/cancel */
export function cancelLeave(id) {
  return http.post(`/parent/leaves/${id}/cancel`)
}

/** GET /parent/pickup-persons?student_id= */
export function fetchPickupPersons(studentId) {
  return http.get('/parent/pickup-persons', { student_id: studentId })
}

/** POST /parent/pickup-persons */
export function createPickupPerson(payload) {
  return http.post('/parent/pickup-persons', payload)
}

/** DELETE /parent/pickup-persons/{id} */
export function deletePickupPerson(id) {
  return http.delete(`/parent/pickup-persons/${id}`)
}

/** GET /parent/face/status 学生人脸授权状态 */
export function fetchFaceStatus() {
  return http.get('/parent/face/status')
}

/** POST /parent/face/authorize（需单独同意 consent:true + 附件 id） */
export function authorizeFace(payload) {
  return http.post('/parent/face/authorize', payload)
}

/** POST /parent/face/revoke 撤回授权（删云库 + 本地照片） */
export function revokeFace(studentId) {
  return http.post('/parent/face/revoke', { student_id: studentId })
}

/** GET /parent/lesson-packages — 课时余额 */
export function fetchLessonPackages(studentId) {
  const data = {}
  if (studentId) data.student_id = studentId
  return http.get('/parent/lesson-packages', data)
}

/** GET /parent/lesson-consume-logs — 消课流水 */
export function fetchLessonConsumeLogs({ studentId, classId, packageId, page, perPage } = {}) {
  const data = {}
  if (studentId) data.student_id = studentId
  if (classId) data.class_id = classId
  if (packageId) data.package_id = packageId
  if (page) data.page = page
  if (perPage) data.per_page = perPage
  return http.get('/parent/lesson-consume-logs', data)
}

/** GET /parent/trial-bookings?student_id= */
export function fetchTrialBookings(studentId) {
  const data = {}
  if (studentId) data.student_id = studentId
  return http.get('/parent/trial-bookings', data)
}

/** GET /parent/trial-bookings/classes?student_id= */
export function fetchTrialClasses(studentId) {
  const data = {}
  if (studentId) data.student_id = studentId
  return http.get('/parent/trial-bookings/classes', data)
}

/** POST /parent/trial-bookings */
export function createTrialBooking(payload) {
  return http.post('/parent/trial-bookings', payload)
}

/** POST /parent/trial-bookings/{id}/cancel */
export function cancelTrialBooking(id, reason) {
  const data = {}
  if (reason) data.reason = reason
  return http.post(`/parent/trial-bookings/${id}/cancel`, data)
}
