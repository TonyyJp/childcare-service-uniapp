<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF8A65 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <view style="display:flex;align-items:center;margin-bottom:16rpx;">
          <view class="back-btn" style="margin-right:20rpx;" @click="$emit('back')"><text class="back-icon">‹</text></view>
          <view style="flex:1;min-width:0;">
            <text style="font-size:40rpx;font-weight:800;color:white;display:block;">学生考勤</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">{{ checkinClassName || '请选择班级' }} · {{ checkinPeriodName || '请选择时段' }}</text>
          </view>
          <view style="padding:12rpx 20rpx;border-radius:16rpx;background:rgba(255,255,255,0.25);" @click="$emit('go-checkin')">
            <text style="font-size:24rpx;font-weight:700;color:white;">去签到</text>
          </view>
        </view>
        <scroll-view v-if="checkinClassOptions.length" scroll-x style="margin-bottom:12rpx;white-space:nowrap;">
          <view
            v-for="c in checkinClassOptions"
            :key="'att-c-' + c.id"
            @click="selectCheckinClass(c.id)"
            style="display:inline-flex;padding:10rpx 24rpx;border-radius:24rpx;margin-right:12rpx;font-size:24rpx;font-weight:700;"
            :style="{ background: checkinClassId === c.id ? 'white' : 'rgba(255,255,255,0.2)', color: checkinClassId === c.id ? '#FF7043' : 'white' }"
          >
            <text>{{ c.name }}</text>
          </view>
        </scroll-view>
        <scroll-view v-if="checkinPeriodOptions.length" scroll-x style="margin-bottom:16rpx;white-space:nowrap;">
          <view
            v-for="p in checkinPeriodOptions"
            :key="'att-p-' + p.id"
            @click="selectCheckinPeriod(p.id)"
            style="display:inline-flex;padding:10rpx 24rpx;border-radius:24rpx;margin-right:12rpx;font-size:24rpx;font-weight:700;"
            :style="{ background: checkinPeriodId === p.id ? 'white' : 'rgba(255,255,255,0.2)', color: checkinPeriodId === p.id ? '#FF7043' : 'white' }"
          >
            <text>{{ p.name }}</text>
          </view>
        </scroll-view>
        <view style="display:flex;">
          <view v-for="(s, idx) in attStats" :key="s.label" style="flex:1;border-radius:16rpx;padding:16rpx;text-align:center;box-sizing:border-box;"
            :style="{ backgroundColor: s.bg, marginRight: idx < attStats.length - 1 ? '12rpx' : '0' }">
            <text style="font-size:36rpx;font-weight:800;display:block;" :style="{ color: s.color }">{{ s.val }}</text>
            <text style="font-size:20rpx;font-weight:700;" :style="{ color: s.color }">{{ s.label }}</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="checkinLoading" style="padding:48rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#8D6E63;">加载考勤…</text>
        </view>
        <view v-else-if="!attStudents.length" style="padding:48rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#8D6E63;">{{ emptyHint }}</text>
        </view>
        <view v-for="s in attStudents" :key="s.id" class="card" style="padding:20rpx 24rpx;margin-bottom:16rpx;display:flex;align-items:center;">
          <view style="width:72rpx;height:72rpx;border-radius:36rpx;margin-right:20rpx;display:flex;align-items:center;justify-content:center;font-size:28rpx;font-weight:700;flex-shrink:0;" :style="{ backgroundColor: s.color + '20', color: s.color }"><text>{{ s.avatar }}</text></view>
          <view style="flex:1;min-width:0;">
            <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">{{ s.name }}</text>
            <text style="font-size:22rpx;color:#8D6E63;">{{ s.sub }}</text>
          </view>
          <view v-if="s.rawStatus === 'waiting'" style="display:flex;flex-direction:column;gap:8rpx;align-items:flex-end;margin-right:12rpx;">
            <text style="font-size:22rpx;color:#C62828;font-weight:700;" @click="doMarkAbsent(s)">缺勤</text>
          </view>
          <view v-else-if="s.rawStatus === 'arrived'" class="action-btn" style="background:#3B9EEB;margin-right:12rpx;" @click="doCheckout(s)">
            <text style="color:white;font-size:22rpx;font-weight:700;">签退</text>
          </view>
          <view class="pill" :style="attStatusStyle(s.status)"><text style="font-size:22rpx;font-weight:700;">{{ s.status }}</text></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import {
  checkoutStudent,
  fetchAttendanceToday,
  fetchDashboard,
  fetchPeriods,
  markAbsent,
} from '../../api/teacher.js'

defineEmits(['back', 'go-checkin'])

const AVATAR_COLORS = ['#FF7043', '#AB47BC', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']
const STATUS_LABEL = {
  waiting: '未到',
  arrived: '已签到',
  left: '已签退',
  leave: '请假',
  absent: '缺勤'
}

const injectedClassId = inject('teacherCheckinClassId', null)
const checkinClassIdLocal = ref(null)
const checkinClassId = computed({
  get: () => (injectedClassId ? injectedClassId.value : checkinClassIdLocal.value),
  set: (v) => {
    if (injectedClassId) injectedClassId.value = v
    else checkinClassIdLocal.value = v
  }
})

const checkinLoading = ref(false)
const checkinBusy = ref(false)
const checkinPeriodId = ref(null)
const allPeriods = ref([])
const checkinSummary = ref({ expected: 0, arrived: 0, left: 0, leave: 0, absent: 0 })
const checkinRawList = ref([])
const classes = ref([])

const checkinClassOptions = computed(() => classes.value.map(c => ({
  id: c.id,
  name: c.tag ? `${c.name}·${c.tag}` : c.name
})))
const checkinPeriodOptions = computed(() => {
  const cls = classes.value.find(c => c.id === checkinClassId.value)
  if (cls?.periods?.length) {
    return cls.periods.map(p => ({
      id: p.period_id,
      name: p.start_time ? `${p.period_name} ${p.start_time}` : p.period_name
    }))
  }
  if (cls?.attendanceTypeId) {
    return allPeriods.value
      .filter(p => p.attendance_type_id === cls.attendanceTypeId)
      .map(p => ({ id: p.id, name: p.start_time ? `${p.name} ${p.start_time}` : p.name }))
  }
  return []
})
const checkinClassName = computed(() => classes.value.find(c => c.id === checkinClassId.value)?.name || '')
const checkinPeriodName = computed(() => checkinPeriodOptions.value.find(p => p.id === checkinPeriodId.value)?.name || '')
const emptyHint = computed(() => {
  if (!classes.value.length) return '暂无可查看的托管考勤（兴趣课请看课表）'
  if (!checkinPeriodOptions.value.length) return '该托管班暂无考勤时段'
  return '当前班级/时段暂无应到学生'
})

const attStats = computed(() => {
  const s = checkinSummary.value
  const arrived = (s.arrived || 0) + (s.left || 0)
  const late = checkinRawList.value.filter(r => r.is_late && (r.status === 'arrived' || r.status === 'left')).length
  const waiting = Math.max(0, (s.expected || 0) - arrived - (s.leave || 0) - (s.absent || 0))
  return [
    { label: '到园', val: arrived, color: '#2E7D32', bg: '#C8E6C9' },
    { label: '迟到', val: late, color: '#E65100', bg: '#FFE0B2' },
    { label: '请假', val: s.leave || 0, color: '#7B1FA2', bg: '#EDE7F6' },
    { label: '未到', val: waiting, color: '#757575', bg: '#EEEEEE' },
  ]
})

const attStudents = computed(() => checkinRawList.value.map((row, i) => {
  const name = row.student?.name || '学员'
  let status = STATUS_LABEL[row.status] || row.status
  if ((row.status === 'arrived' || row.status === 'left') && row.is_late) {
    status = '迟到'
  } else if (row.status === 'arrived') {
    status = '到园'
  } else if (row.status === 'left') {
    status = '已签退'
  }
  let sub = status
  if (row.status === 'arrived' || row.status === 'left') {
    sub = `${row.arrive_time || ''}${row.is_late ? ' · 迟到' : ''}${row.status === 'left' && row.leave_time ? ` · 离托 ${row.leave_time}` : row.status === 'arrived' ? ' · 在班中' : ''}`
  } else if (row.status === 'leave') {
    sub = '已请假'
  } else if (row.status === 'absent') {
    sub = '已记缺勤'
  } else {
    sub = '尚未签到'
  }
  return {
    id: row.id || `att-${i}`,
    name,
    avatar: name.slice(0, 1),
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    status,
    rawStatus: row.status,
    sub: sub.trim()
  }
}))

function attStatusStyle(s) {
  const map = {
    '到园': { backgroundColor: '#C8E6C9', color: '#2E7D32' },
    '已签退': { backgroundColor: '#E3F2FD', color: '#1565C0' },
    '迟到': { backgroundColor: '#FFE0B2', color: '#E65100' },
    '请假': { backgroundColor: '#EDE7F6', color: '#7B1FA2' },
    '未到': { backgroundColor: '#EEEEEE', color: '#757575' },
    '缺勤': { backgroundColor: '#FFCDD2', color: '#C62828' },
  }
  return map[s] || map['未到']
}

async function ensurePeriods() {
  if (allPeriods.value.length) return
  const data = await fetchPeriods()
  allPeriods.value = data?.list || []
}

async function loadClasses() {
  try {
    const dash = await fetchDashboard()
    classes.value = (dash?.classes || [])
      .filter(c => c.biz_type === 'care' || c.can_period_checkin || c.attendance_type_id)
      .map((c, i) => ({
        id: c.id,
        name: c.name,
        tag: c.attendance_type_name || (c.biz_type === 'care' ? '托管' : ''),
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        attendanceTypeId: c.attendance_type_id,
        periods: c.periods || [],
        periodCount: (c.periods || []).length,
      }))
    if (!checkinClassId.value || !classes.value.some(c => c.id === checkinClassId.value)) {
      const preferred = classes.value.find(c => c.periodCount > 0) || classes.value[0]
      checkinClassId.value = preferred?.id || null
    }
  } catch (e) {
    uni.showToast({ title: e.message || '班级加载失败', icon: 'none' })
  }
}

async function loadCheckinToday() {
  if (!checkinClassId.value) {
    checkinRawList.value = []
    checkinSummary.value = { expected: 0, arrived: 0, left: 0, leave: 0, absent: 0 }
    return
  }
  checkinLoading.value = true
  try {
    await ensurePeriods()
    const options = checkinPeriodOptions.value
    if (!options.length) {
      checkinRawList.value = []
      checkinSummary.value = { expected: 0, arrived: 0, left: 0, leave: 0, absent: 0 }
      return
    }
    if (!checkinPeriodId.value || !options.some(p => p.id === checkinPeriodId.value)) {
      checkinPeriodId.value = options[0].id
    }
    const data = await fetchAttendanceToday({
      classId: checkinClassId.value,
      periodId: checkinPeriodId.value
    })
    checkinSummary.value = data?.summary || { expected: 0, arrived: 0, left: 0, leave: 0, absent: 0 }
    checkinRawList.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '考勤加载失败', icon: 'none' })
  } finally {
    checkinLoading.value = false
  }
}

function selectCheckinClass(id) {
  if (checkinClassId.value === id) return
  checkinClassId.value = id
  checkinPeriodId.value = null
  loadCheckinToday()
}

function selectCheckinPeriod(id) {
  if (checkinPeriodId.value === id) return
  checkinPeriodId.value = id
  loadCheckinToday()
}

async function doCheckout(row) {
  if (checkinBusy.value || !row.id) return
  checkinBusy.value = true
  try {
    await checkoutStudent(row.id)
    uni.showToast({ title: `${row.name} 已签退`, icon: 'success' })
    await loadCheckinToday()
  } catch (e) {
    uni.showToast({ title: e.message || '签退失败', icon: 'none' })
  } finally {
    checkinBusy.value = false
  }
}

async function doMarkAbsent(row) {
  if (checkinBusy.value || !row.id) return
  try {
    await new Promise((resolve, reject) => {
      uni.showModal({
        title: '标记缺勤',
        content: `确认将「${row.name}」记为缺勤？`,
        success: (res) => (res.confirm ? resolve() : reject('cancel')),
        fail: reject
      })
    })
  } catch (_) {
    return
  }
  checkinBusy.value = true
  try {
    await markAbsent(row.id)
    uni.showToast({ title: '已记缺勤', icon: 'success' })
    await loadCheckinToday()
  } catch (e) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    checkinBusy.value = false
  }
}

onMounted(async () => {
  await loadClasses()
  await loadCheckinToday()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
