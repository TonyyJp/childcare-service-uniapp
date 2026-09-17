<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF8A65 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <view style="display:flex;align-items:center;margin-bottom:16rpx;">
          <view class="back-btn" style="margin-right:20rpx;" @click="$emit('back')">
            <text class="back-icon">‹</text>
          </view>
          <view style="flex:1;min-width:0;">
            <text style="font-size:40rpx;font-weight:800;color:white;display:block;">课次点名</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.85);">
              {{ headerSub }}
            </text>
          </view>
          <view class="pill" style="background:rgba(255,255,255,0.25);">
            <text style="font-size:20rpx;font-weight:700;color:white;">仅兴趣课</text>
          </view>
        </view>
        <view style="display:flex;">
          <view
            v-for="(s, idx) in stats"
            :key="s.label"
            style="flex:1;border-radius:16rpx;padding:16rpx;text-align:center;box-sizing:border-box;"
            :style="{ backgroundColor: s.bg, marginRight: idx < stats.length - 1 ? '12rpx' : '0' }"
          >
            <text style="font-size:36rpx;font-weight:800;display:block;" :style="{ color: s.color }">{{ s.val }}</text>
            <text style="font-size:20rpx;font-weight:700;" :style="{ color: s.color }">{{ s.label }}</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <LessonAttendRoster
          :rows="rows"
          :loading="loading"
          :error-msg="errorMsg"
          :consume-policy="consumePolicy"
          :busy="busy"
          :update-fn="doUpdate"
          empty-text="本课次暂无应到学员"
          @retry="loadRoster"
          @updated="onUpdated"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import {
  fetchLessonAttendances,
  updateLessonAttendanceStatus,
} from '../../api/teacher.js'
import {
  mapLessonAttendError,
  todayYmd,
} from '../../utils/lessonAttend.js'
import LessonAttendRoster from '../shared/LessonAttendRoster.vue'

defineEmits(['back'])

const AVATAR_COLORS = ['#FF7043', '#AB47BC', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']
const ctx = inject('teacherLessonAttend', null)

const loading = ref(false)
const busy = ref(false)
const errorMsg = ref('')
const rows = ref([])
const consumePolicy = ref('strict')
const meta = ref({})

const headerSub = computed(() => {
  const c = meta.value.class_name || ctx?.value?.className || '兴趣课'
  const d = meta.value.date || ctx?.value?.date || todayYmd()
  const t = meta.value.start_time || ctx?.value?.startTime || ''
  const mode = meta.value.match_mode
  const tip = mode === 'weekday' ? '（按星期匹配）' : (mode === 'all' ? '（全部课次）' : '')
  return t ? `${c} · ${d} ${t}${tip}` : `${c} · ${d}${tip}`
})

const stats = computed(() => {
  const list = rows.value
  const present = list.filter(r => r.status === 'present').length
  const leave = list.filter(r => r.status === 'leave').length
  const absent = list.filter(r => r.status === 'absent').length
  const waiting = list.filter(r => r.status === 'waiting' || !r.status).length
  return [
    { label: '到课', val: present, color: '#2E7D32', bg: '#C8E6C9' },
    { label: '请假', val: leave, color: '#7B1FA2', bg: '#EDE7F6' },
    { label: '缺勤', val: absent, color: '#C62828', bg: '#FFCDD2' },
    { label: '未点', val: waiting, color: '#757575', bg: '#EEEEEE' },
  ]
})

function normalizeRow(raw, i) {
  const name = raw.student_name || raw.student?.name || raw.name || '学员'
  return {
    ...raw,
    id: raw.id,
    student_name: name,
    name,
    status: raw.status || 'waiting',
    remain_lessons: raw.remain_lessons ?? raw.remain ?? null,
    is_settled: !!raw.is_settled,
    attend_kind: raw.attend_kind || 'formal',
    remark: raw.remark || '',
    staff_remark: raw.staff_remark || '',
    can_present: raw.can_present,
    lesson_content: raw.lesson_content || raw.content || '',
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    avatar: name.slice(0, 1),
  }
}

async function loadRoster() {
  const payload = ctx?.value || {}
  if (!payload.classId) {
    errorMsg.value = '未选择课班，请从课表进入'
    rows.value = []
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchLessonAttendances({
      classId: payload.classId,
      date: payload.date || todayYmd(),
      scheduleId: payload.scheduleId,
      startTime: payload.startTime,
    })
    consumePolicy.value = data?.policy || data?.consume_policy || data?.settings?.consume_policy || 'strict'
    meta.value = {
      class_name: data?.class?.name || payload.className,
      date: data?.date || payload.date,
      start_time: data?.lesson?.start_time || payload.startTime,
      match_mode: data?.match_mode || 'exact',
      feature_enabled: data?.feature_enabled !== false,
    }
    const list = data?.list || data?.students || []
    rows.value = list.map((raw, i) => normalizeRow(raw, i))
    if (!list.length) {
      errorMsg.value = '该班暂无课次名单，请确认学员已报名兴趣课'
    }
  } catch (e) {
    rows.value = []
    errorMsg.value = mapLessonAttendError(e)
  } finally {
    loading.value = false
  }
}

async function doUpdate(id, status) {
  busy.value = true
  try {
    return await updateLessonAttendanceStatus(id, status)
  } finally {
    busy.value = false
  }
}

function onUpdated({ row, nextStatus, data }) {
  const idx = rows.value.findIndex(r => r.id === row.id)
  if (idx < 0) return
  const next = { ...rows.value[idx] }
  next.status = data?.status || nextStatus
  if (data?.remain_lessons != null) next.remain_lessons = data.remain_lessons
  else if (data?.remain != null) next.remain_lessons = data.remain
  if (data?.is_settled != null) next.is_settled = !!data.is_settled
  else if (nextStatus === 'present') next.is_settled = true
  else if (row.is_settled && nextStatus !== 'present') next.is_settled = false
  if (data?.attend_kind) next.attend_kind = data.attend_kind
  if (data?.consumed != null) next.consumed = data.consumed
  if (data?.message != null) next.message = data.message
  rows.value.splice(idx, 1, next)
}

onMounted(loadRoster)
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
