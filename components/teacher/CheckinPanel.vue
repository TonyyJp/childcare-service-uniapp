<template>
  <view class="tab-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF8A65 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <text style="font-size:44rpx;font-weight:800;color:white;display:block;">签到管理</text>
        <text style="font-size:24rpx;color:rgba(255,255,255,0.8);display:block;margin-top:8rpx;">
          {{ checkinClassName || '请选择班级' }} · {{ checkinPeriodName || '请选择时段' }}
        </text>

        <scroll-view v-if="checkinClassOptions.length" scroll-x style="margin-top:20rpx;white-space:nowrap;">
          <view
            v-for="c in checkinClassOptions"
            :key="c.id"
            @click="selectCheckinClass(c.id)"
            style="display:inline-flex;padding:10rpx 24rpx;border-radius:24rpx;margin-right:12rpx;font-size:24rpx;font-weight:700;"
            :style="{ background: checkinClassId === c.id ? 'white' : 'rgba(255,255,255,0.2)', color: checkinClassId === c.id ? '#FF7043' : 'white' }"
          >
            <text>{{ c.name }}</text>
          </view>
        </scroll-view>

        <scroll-view v-if="checkinPeriodOptions.length" scroll-x style="margin-top:12rpx;white-space:nowrap;">
          <view
            v-for="p in checkinPeriodOptions"
            :key="p.id"
            @click="selectCheckinPeriod(p.id)"
            style="display:inline-flex;padding:10rpx 24rpx;border-radius:24rpx;margin-right:12rpx;font-size:24rpx;font-weight:700;"
            :style="{ background: checkinPeriodId === p.id ? 'white' : 'rgba(255,255,255,0.2)', color: checkinPeriodId === p.id ? '#FF7043' : 'white' }"
          >
            <text>{{ p.name }}</text>
          </view>
        </scroll-view>

        <view style="display:flex;gap:16rpx;margin-top:24rpx;">
          <view v-for="s in checkinCounts" :key="s.label" style="flex:1;border-radius:16rpx;padding:16rpx;text-align:center;" :style="{ backgroundColor: s.bg }">
            <text style="font-size:40rpx;font-weight:800;display:block;" :style="{ color: s.color }">{{ s.val }}</text>
            <text style="font-size:20rpx;font-weight:700;" :style="{ color: s.color }">{{ s.label }}</text>
          </view>
        </view>
        <view style="display:flex;gap:16rpx;margin-top:24rpx;background:rgba(255,255,255,0.15);border-radius:20rpx;padding:8rpx;">
          <view style="flex:1;text-align:center;padding:16rpx;border-radius:16rpx;font-size:26rpx;font-weight:700;"
            :style="{ backgroundColor: checkinMode === 'list' ? 'white' : 'transparent', color: checkinMode === 'list' ? '#FF7043' : 'rgba(255,255,255,0.75)' }"
            @click="checkinMode = 'list'"><text>📋 名单签到</text></view>
          <view style="flex:1;text-align:center;padding:16rpx;border-radius:16rpx;font-size:26rpx;font-weight:700;"
            :style="{ backgroundColor: checkinMode === 'face' ? 'white' : 'transparent', color: checkinMode === 'face' ? '#FF7043' : 'rgba(255,255,255,0.75)' }"
            @click="checkinMode = 'face'"><text>😊 刷脸</text></view>
        </view>
      </view>
    </view>

    <view v-if="checkinMode === 'face'" style="flex:1;display:flex;flex-direction:column;align-items:center;padding:60rpx 40rpx;">
      <view style="width:400rpx;height:400rpx;border-radius:200rpx;border:4rpx dashed #FFCCBC;display:flex;align-items:center;justify-content:center;margin-bottom:40rpx;" :style="{ background: scanStep === 2 ? '#C8E6C930' : '#FFF8F5' }">
        <text style="font-size:120rpx;">{{ scanStep === 2 ? '✅' : '👤' }}</text>
      </view>
      <view v-if="scanResult" style="padding:20rpx 40rpx;background:#C8E6C9;border-radius:20rpx;margin-bottom:32rpx;">
        <text style="color:#2E7D32;font-weight:700;font-size:30rpx;">{{ scanResult }}</text>
      </view>
      <view class="primary-btn" :style="{ backgroundColor: scanning ? '#F5F0EC' : '#FF7043', color: scanning ? '#8D6E63' : 'white' }" @click="startFaceScan">
        <text style="font-weight:800;font-size:30rpx;">{{ scanning ? '识别中...' : '模拟刷脸（写入 method=face）' }}</text>
      </view>
    </view>

    <scroll-view v-else scroll-y style="flex:1;height:0;">
      <view style="padding:0 40rpx;">
        <view v-if="checkinLoading" style="padding:60rpx 0;text-align:center;">
          <text style="color:#8D6E63;">加载点名名单…</text>
        </view>
        <view v-else-if="!checkinList.length" style="padding:60rpx 0;text-align:center;">
          <text style="color:#8D6E63;">当前班级/时段暂无应到学生</text>
        </view>
        <view v-for="row in checkinList" :key="row.id" style="display:flex;align-items:center;gap:24rpx;padding:24rpx 0;border-bottom:1rpx solid #F5F0EC;">
          <view style="width:80rpx;height:80rpx;border-radius:40rpx;display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:700;"
            :style="{ backgroundColor: row.color + '20', color: row.color }"><text>{{ row.avatar }}</text></view>
          <view style="flex:1;">
            <text style="font-size:30rpx;font-weight:700;color:#2D1F18;display:block;">{{ row.name }}</text>
            <text style="font-size:22rpx;color:#8D6E63;">{{ row.subLabel }}</text>
          </view>
          <view v-if="row.status === 'waiting'" class="action-btn" style="background:#66BB6A;" @click="doCheckin(row)">
            <text style="color:white;font-size:24rpx;font-weight:700;">签到</text>
          </view>
          <view class="pill" :style="statusStyle(row.statusLabel)"><text style="font-size:22rpx;font-weight:700;">{{ row.statusLabel }}</text></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import {
  checkinStudents,
  fetchAttendanceToday,
  fetchDashboard,
  fetchPeriods,
} from '../../api/teacher.js'

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

const checkinMode = ref('list')
const scanning = ref(false)
const scanStep = ref(0)
const scanResult = ref('')
const checkinLoading = ref(false)
const checkinBusy = ref(false)
const checkinPeriodId = ref(null)
const allPeriods = ref([])
const checkinSummary = ref({ expected: 0, arrived: 0, left: 0, leave: 0, absent: 0 })
const checkinRawList = ref([])
const classes = ref([])

const checkinClassOptions = computed(() => classes.value.map(c => ({ id: c.id, name: c.name })))
const checkinPeriodOptions = computed(() => {
  const cls = classes.value.find(c => c.id === checkinClassId.value)
  if (cls?.periods?.length) {
    return cls.periods.map(p => ({ id: p.period_id, name: p.period_name }))
  }
  return allPeriods.value.map(p => ({ id: p.id, name: p.name }))
})
const checkinClassName = computed(() => checkinClassOptions.value.find(c => c.id === checkinClassId.value)?.name || '')
const checkinPeriodName = computed(() => checkinPeriodOptions.value.find(p => p.id === checkinPeriodId.value)?.name || '')

const checkinList = computed(() => checkinRawList.value.map((row, i) => {
  const name = row.student?.name || '学员'
  const status = row.status
  const label = STATUS_LABEL[status] || status
  let subLabel = label
  if (status === 'arrived' || status === 'left') {
    subLabel = `${row.arrive_time || ''}${row.is_late ? ' · 迟到' : ''}${status === 'left' && row.leave_time ? ` · 离托 ${row.leave_time}` : ' · 在班中'}`
  }
  return {
    id: row.id,
    studentId: row.student?.id,
    name,
    avatar: name.slice(-1),
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    status,
    statusLabel: label,
    subLabel: subLabel.trim()
  }
}))

const checkinCounts = computed(() => {
  const s = checkinSummary.value
  const waiting = Math.max(0, (s.expected || 0) - (s.arrived || 0) - (s.left || 0) - (s.leave || 0) - (s.absent || 0))
  return [
    { label: '到园', val: (s.arrived || 0) + (s.left || 0), color: '#2E7D32', bg: '#C8E6C9' },
    { label: '未到', val: waiting, color: '#E65100', bg: '#FFE0B2' },
    { label: '请假', val: s.leave || 0, color: '#7B1FA2', bg: '#EDE7F6' },
    { label: '总人数', val: s.expected || 0, color: '#1565C0', bg: '#E3F2FD' },
  ]
})

function statusStyle(s) {
  const map = {
    '已签到': { backgroundColor: '#C8E6C9', color: '#2E7D32' },
    '未到': { backgroundColor: '#EEEEEE', color: '#757575' },
    '已签退': { backgroundColor: '#E3F2FD', color: '#1565C0' },
    '请假': { backgroundColor: '#EDE7F6', color: '#7B1FA2' },
    '缺勤': { backgroundColor: '#FFCDD2', color: '#C62828' },
  }
  return map[s] || {}
}

async function ensurePeriods() {
  if (allPeriods.value.length) return
  const data = await fetchPeriods()
  allPeriods.value = data?.list || []
}

async function loadClasses() {
  try {
    const dash = await fetchDashboard()
    classes.value = (dash?.classes || []).map((c, i) => ({
      id: c.id,
      name: c.name,
      color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      periods: c.periods || [],
      periodCount: (c.periods || []).length,
    }))
    if (!checkinClassId.value) {
      const preferred = classes.value.find(c => c.periodCount > 0) || classes.value[0]
      if (preferred) checkinClassId.value = preferred.id
    }
  } catch (e) {
    uni.showToast({ title: e.message || '班级加载失败', icon: 'none' })
  }
}

async function loadCheckinToday() {
  if (!checkinClassId.value) return
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
    uni.showToast({ title: e.message || '点名名单加载失败', icon: 'none' })
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

async function doCheckin(row, method = 'manual') {
  if (checkinBusy.value || !row.studentId) return
  checkinBusy.value = true
  try {
    await checkinStudents({
      classId: checkinClassId.value,
      periodId: checkinPeriodId.value,
      studentIds: [row.studentId],
      method,
    })
    uni.showToast({ title: `${row.name} 已签到`, icon: 'success' })
    await loadCheckinToday()
  } catch (e) {
    uni.showToast({ title: e.message || '签到失败', icon: 'none' })
  } finally {
    checkinBusy.value = false
  }
}

function startFaceScan() {
  if (scanning.value) return
  const waiting = checkinList.value.find(r => r.status === 'waiting')
  if (!waiting) {
    uni.showToast({ title: '没有待签到学员', icon: 'none' })
    return
  }
  scanning.value = true
  scanStep.value = 1
  scanResult.value = ''
  setTimeout(async () => {
    try {
      await doCheckin(waiting, 'face')
      scanStep.value = 2
      scanResult.value = `✓ ${waiting.name} 签到成功（模拟刷脸）`
    } finally {
      setTimeout(() => { scanning.value = false }, 1200)
    }
  }, 800)
}

onMounted(async () => {
  await loadClasses()
  await loadCheckinToday()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
