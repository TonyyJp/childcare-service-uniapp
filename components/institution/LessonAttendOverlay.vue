<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <view style="display:flex;align-items:center;margin-bottom:16rpx;">
          <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
          <view style="flex:1;margin-left:20rpx;min-width:0;">
            <text style="font-size:40rpx;font-weight:800;color:white;display:block;">兴趣课点名</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.85);">{{ headerSub }}</text>
          </view>
          <view class="pill" style="background:rgba(255,255,255,0.25);">
            <text style="font-size:20rpx;font-weight:700;color:white;">代点名</text>
          </view>
        </view>
        <scroll-view v-if="classOptions.length" scroll-x style="white-space:nowrap;margin-bottom:12rpx;">
          <view
            v-for="c in classOptions"
            :key="c.id"
            class="pill"
            style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
            :style="{ backgroundColor: classId === c.id ? 'white' : 'rgba(255,255,255,0.2)', color: classId === c.id ? '#AB47BC' : 'white' }"
            @click="selectClass(c.id)"
          >
            <text style="font-size:22rpx;font-weight:700;">{{ c.name }}</text>
          </view>
        </scroll-view>
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
        <picker mode="date" :value="date" @change="onDateChange">
          <view class="card" style="padding:20rpx 24rpx;margin-bottom:16rpx;display:flex;justify-content:space-between;align-items:center;">
            <text style="font-size:26rpx;color:#8D6E63;">课次日期</text>
            <text style="font-size:28rpx;font-weight:700;color:#2D1F18;">{{ date }} ›</text>
          </view>
        </picker>
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
import { computed, ref, watch } from 'vue'
import {
  fetchInterestClasses,
  fetchLessonAttendances,
  updateLessonAttendanceStatus,
} from '../../api/institution.js'
import {
  mapLessonAttendError,
  todayYmd,
} from '../../utils/lessonAttend.js'
import LessonAttendRoster from '../shared/LessonAttendRoster.vue'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(['navigate'])

function navigate(tab) {
  emit('navigate', tab)
}

const AVATAR_COLORS = ['#AB47BC', '#FF7043', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']
const classOptions = ref([])
const classId = ref(null)
const date = ref(todayYmd())
const loading = ref(false)
const busy = ref(false)
const errorMsg = ref('')
const rows = ref([])
const consumePolicy = ref('strict')
const meta = ref({})

const headerSub = computed(() => {
  const c = classOptions.value.find(x => x.id === classId.value)?.name || meta.value.class_name || '选择兴趣课班'
  return `${c} · ${date.value}`
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

async function loadClasses() {
  try {
    const data = await fetchInterestClasses()
    classOptions.value = data?.list || data?.classes || []
    if (!classId.value && classOptions.value.length) {
      classId.value = classOptions.value[0].id
    }
  } catch (e) {
    classOptions.value = []
    if (!errorMsg.value) {
      errorMsg.value = mapLessonAttendError(e)
    }
  }
}

async function loadRoster() {
  if (!classId.value) {
    if (!classOptions.value.length) {
      errorMsg.value = errorMsg.value || '暂无兴趣课班，或接口尚未开通'
    }
    rows.value = []
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchLessonAttendances({
      classId: classId.value,
      date: date.value,
    })
    consumePolicy.value = data?.policy || data?.consume_policy || data?.settings?.consume_policy || 'strict'
    meta.value = { class_name: data?.class?.name }
    rows.value = (data?.list || data?.students || []).map((raw, i) => normalizeRow(raw, i))
  } catch (e) {
    rows.value = []
    errorMsg.value = mapLessonAttendError(e)
  } finally {
    loading.value = false
  }
}

function selectClass(id) {
  classId.value = id
  loadRoster()
}

function onDateChange(e) {
  date.value = e.detail.value
  loadRoster()
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

watch(() => props.pageShowCount, async () => {
  await loadClasses()
  await loadRoster()
}, { immediate: true })
</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
