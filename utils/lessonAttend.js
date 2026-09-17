/**
 * 兴趣课次点名 / 消课：共享文案与交互（教师端、机构端共用）。
 * 与托管时段考勤、营销课 Enrollments 消课互不混用。
 */

export const LESSON_STATUS = {
  waiting: 'waiting',
  present: 'present',
  absent: 'absent',
  leave: 'leave',
}

export const LESSON_STATUS_LABEL = {
  waiting: '未点',
  present: '到课',
  absent: '缺勤',
  leave: '请假',
}

export const LESSON_STATUS_STYLE = {
  waiting: { background: '#EEEEEE', color: '#757575' },
  present: { background: '#C8E6C9', color: '#2E7D32' },
  absent: { background: '#FFCDD2', color: '#C62828' },
  leave: { background: '#EDE7F6', color: '#7B1FA2' },
}

/** 业务错误码（与 SF-01 草案一致） */
export const LESSON_ERR = {
  INSUFFICIENT: 41001,
  EXPIRED: 41002,
  NO_REVERSE: 41003,
}

export function lessonStatusLabel(status) {
  return LESSON_STATUS_LABEL[status] || status || '—'
}

export function lessonStatusStyle(status) {
  return LESSON_STATUS_STYLE[status] || LESSON_STATUS_STYLE.waiting
}

/** remain 可能为 null（接口未就绪）；优先信任后端 can_present；试课生不看课包余额 */
export function canMarkPresent(row, consumePolicy = 'strict') {
  if (!row) return false
  if (row.status === LESSON_STATUS.present) return false
  if (row.attend_kind === 'trial') return true
  if (typeof row.can_present === 'boolean') return row.can_present
  const remain = row.remain_lessons
  if (consumePolicy === 'soft') return true
  if (remain == null) return true
  return Number(remain) > 0
}

export function isTrialAttend(row) {
  return row?.attend_kind === 'trial'
}

/** 试课生置顶，其余保持相对顺序（稳定排序） */
export function sortTrialFirst(rows) {
  const list = Array.isArray(rows) ? [...rows] : []
  list.sort((a, b) => {
    const at = a?.attend_kind === 'trial' ? 0 : 1
    const bt = b?.attend_kind === 'trial' ? 0 : 1
    return at - bt
  })
  return list
}

export function presentBlockedHint(row, consumePolicy = 'strict') {
  if (canMarkPresent(row, consumePolicy)) return ''
  const remain = Number(row?.remain_lessons)
  if (remain <= 0) return '余额不足，请联系教务补课包'
  return '当前无法标记到课'
}

export function mapLessonAttendError(err) {
  const code = err?.code
  if (code === LESSON_ERR.INSUFFICIENT) return err.message || '余额不足，请先补课包'
  if (code === LESSON_ERR.EXPIRED) return err.message || '课包已过期'
  if (code === LESSON_ERR.NO_REVERSE) return err.message || '不可冲正，请联系财务'
  if (err?.statusCode === 404) return '课次点名接口尚未开通，请稍后重试'
  return err?.message || '操作失败'
}

/**
 * present → 非到课：确认退回课时。
 * @returns {Promise<boolean>}
 */
export function confirmReverseConsume(studentName) {
  const name = studentName || '该学员'
  return new Promise((resolve) => {
    uni.showModal({
      title: '退回课时',
      content: `将退回 1 课时（${name}）。确认改为非到课状态？`,
      confirmText: '确认退回',
      cancelText: '取消',
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false),
    })
  })
}

export function toastConsumeSuccess(remain) {
  const n = remain == null ? '—' : String(remain)
  uni.showToast({ title: `已消课 1 课时，剩余 ${n}`, icon: 'none', duration: 2200 })
}

export function toastReverseSuccess(remain) {
  const n = remain == null ? '—' : String(remain)
  uni.showToast({ title: `已退回 1 课时，剩余 ${n}`, icon: 'none', duration: 2200 })
}

export function formatRemainBadge(remain) {
  // 始终展示，避免 null/0 时角标消失让老师误以为无余额字段
  if (remain == null || remain === '') return '课包余—'
  const n = Number(remain)
  if (Number.isNaN(n)) return '课包余—'
  return `课包余${n}`
}

export function remainBadgeStyle(remain) {
  if (remain == null || remain === '') {
    return { background: '#EEEEEE', color: '#757575' }
  }
  const n = Number(remain)
  if (Number.isNaN(n) || n <= 0) return { background: '#FFCDD2', color: '#C62828' }
  if (n <= 3) return { background: '#FFE0B2', color: '#E65100' }
  return { background: '#E3F2FD', color: '#1565C0' }
}

/** 本周某星期几（0=周一…6=周日）对应的 Y-m-d */
export function dateForWeekdayIndex(weekdayIndex) {
  const now = new Date()
  const todayIdx = (now.getDay() + 6) % 7
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (weekdayIndex - todayIdx))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 统一改状态：冲正确认 + 错误提示 + toast。
 * @param {object} opts
 * @param {object} opts.row
 * @param {string} opts.nextStatus
 * @param {string} [opts.consumePolicy]
 * @param {(id:number, status:string) => Promise<object>} opts.updateFn
 */
export async function applyLessonStatus({ row, nextStatus, consumePolicy = 'strict', updateFn }) {
  if (!row?.id || !nextStatus || nextStatus === row.status) return null

  if (nextStatus === LESSON_STATUS.present && !canMarkPresent(row, consumePolicy)) {
    uni.showToast({ title: presentBlockedHint(row, consumePolicy), icon: 'none' })
    return null
  }

  const reversing = row.status === LESSON_STATUS.present
    && nextStatus !== LESSON_STATUS.present
    && !!row.is_settled
    && row.attend_kind !== 'trial'
  if (reversing) {
    const ok = await confirmReverseConsume(row.student_name || row.name)
    if (!ok) return null
  }

  try {
    const data = await updateFn(row.id, nextStatus)
    const remain = data?.remain_lessons ?? data?.remain ?? row.remain_lessons
    if (nextStatus === LESSON_STATUS.present) {
      const msg = String(data?.message || '')
      const trial = row.attend_kind === 'trial'
        || data?.attend_kind === 'trial'
        || msg.includes('试课')
      if (trial && data?.consumed === false) {
        uni.showToast({ title: '试课签到', icon: 'none', duration: 2200 })
      } else if (data?.consumed === false && data?.message) {
        uni.showToast({ title: data.message, icon: 'none', duration: 2200 })
      } else {
        toastConsumeSuccess(remain)
      }
    } else if (reversing) {
      toastReverseSuccess(remain)
    } else {
      uni.showToast({ title: `已标记${lessonStatusLabel(nextStatus)}`, icon: 'none' })
    }
    return data
  } catch (e) {
    uni.showToast({ title: mapLessonAttendError(e), icon: 'none' })
    throw e
  }
}
