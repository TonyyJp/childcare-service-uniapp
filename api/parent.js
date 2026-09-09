import { http } from '../utils/request.js'

/** GET /parent/students */
export function fetchStudents() {
  return http.get('/parent/students')
}

/** GET /parent/class-info?invite_code= */
export function fetchClassInfo(inviteCode) {
  return http.get('/parent/class-info', { invite_code: inviteCode })
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

/** GET /parent/courses?student_id= */
export function fetchCourses(studentId) {
  return http.get('/parent/courses', { student_id: studentId })
}

/** GET /parent/courses/{id}?student_id= */
export function fetchCourse(id, studentId) {
  return http.get(`/parent/courses/${id}`, { student_id: studentId })
}

/** GET /parent/messages */
export function fetchMessages(type) {
  const data = { per_page: 50 }
  if (type) data.type = type
  return http.get('/parent/messages', data)
}

/** POST /parent/messages/read */
export function readMessages(ids) {
  return http.post('/parent/messages/read', { ids })
}

/** GET /parent/messages/unread-count */
export function fetchUnreadCount() {
  return http.get('/parent/messages/unread-count')
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

/** GET /parent/events?student_id= */
export function fetchEvents(studentId) {
  return http.get('/parent/events', { student_id: studentId })
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
