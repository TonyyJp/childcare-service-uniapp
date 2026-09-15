import { http } from '../utils/request.js'

/** GET /common/dicts?type= */
export function fetchDicts(type) {
  return http.get('/common/dicts', { type })
}
