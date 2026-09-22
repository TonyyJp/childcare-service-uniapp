<template>
  <view class="tab-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF9068 100%);">
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
        <view
          v-if="faceAvailable"
          style="display:flex;gap:16rpx;margin-top:24rpx;background:rgba(255,255,255,0.15);border-radius:20rpx;padding:8rpx;"
        >
          <view style="flex:1;text-align:center;padding:16rpx;border-radius:16rpx;font-size:26rpx;font-weight:700;"
            :style="{ backgroundColor: checkinMode === 'list' ? 'white' : 'transparent', color: checkinMode === 'list' ? '#FF7043' : 'rgba(255,255,255,0.75)' }"
            @click="checkinMode = 'list'"><text>📋 名单签到</text></view>
          <view style="flex:1;text-align:center;padding:16rpx;border-radius:16rpx;font-size:26rpx;font-weight:700;"
            :style="{ backgroundColor: checkinMode === 'face' ? 'white' : 'transparent', color: checkinMode === 'face' ? '#FF7043' : 'rgba(255,255,255,0.75)' }"
            @click="checkinMode = 'face'"><text>😊 刷脸</text></view>
        </view>
      </view>
    </view>

    <view v-if="checkinMode === 'face'" style="flex:1;display:flex;flex-direction:column;background:#1A120E;">
      <view style="position:relative;flex-shrink:0;">
        <camera
          v-if="faceCameraOn && faceCameraMounted"
          :key="'face-cam-' + faceCameraEpoch"
          :device-position="faceCameraPosition"
          flash="off"
          style="width:100%;height:640rpx;"
          @error="onFaceCameraError"
        />
        <view v-else-if="!faceCameraOn" style="width:100%;height:640rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#26201C;">
          <text style="font-size:80rpx;">📷</text>
          <text style="font-size:26rpx;color:#BCAAA4;margin-top:24rpx;">点击下方按钮开启摄像头</text>
          <text style="font-size:22rpx;color:#8D6E63;margin-top:12rpx;">需家长先在「我的 → 人脸授权」完成采集</text>
        </view>
        <view v-else style="width:100%;height:640rpx;background:#26201C;" />
        <view v-if="faceCameraOn" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:420rpx;height:520rpx;border:6rpx dashed rgba(255,255,255,0.85);border-radius:40rpx;pointer-events:none;z-index:1;" />
        <view
          v-if="faceCameraOn"
          class="face-cam-switch"
          :style="{ opacity: faceBusy ? 0.45 : 1 }"
          @tap.stop="toggleFaceCamera"
        >
          <image class="face-cam-switch__icon" src="/static/icons/camera-switch.png" mode="aspectFit" />
        </view>
        <view v-if="faceLastMsg" style="position:absolute;left:0;right:0;bottom:24rpx;display:flex;justify-content:center;pointer-events:none;z-index:10;">
          <view style="background:rgba(0,0,0,0.65);border-radius:24rpx;padding:18rpx 36rpx;max-width:80%;">
            <text style="color:white;font-size:26rpx;font-weight:700;">{{ faceLastMsg }}</text>
          </view>
        </view>
      </view>

      <scroll-view scroll-y style="flex:1;height:0;">
        <view style="padding:24rpx 40rpx 40rpx;">
          <text style="font-size:22rpx;color:#BCAAA4;display:block;margin-bottom:20rpx;">
            本轮已识别：{{ faceHits.length ? faceHitNames : '无' }}（一帧可同时识别多名已授权学员）
          </text>
          <view style="display:flex;gap:16rpx;">
            <template v-if="faceCameraOn">
              <view class="primary-btn" style="flex:2;" :style="{ backgroundColor: faceBusy ? '#F5F0EC' : '#FF7043' }" @click="manualFaceScan">
                <text :style="{ color: faceBusy ? '#8D6E63' : 'white', fontSize: '28rpx', fontWeight: 800 }">
                  {{ faceBusy ? '识别中…' : '拍摄识别' }}
                </text>
              </view>
              <view class="primary-btn" style="flex:1;background:#F5F0EC;" @click="stopFaceCamera">
                <text style="color:#8D6E63;font-size:28rpx;font-weight:800;">关闭</text>
              </view>
            </template>
            <view v-else class="primary-btn" style="flex:1;" @click="startFaceCamera">
              <text style="color:white;font-size:28rpx;font-weight:800;">开启摄像头</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <scroll-view v-else scroll-y style="flex:1;height:0;">
      <view style="padding:0 40rpx;">
        <LoadingSkeleton v-if="checkinLoading" variant="list" :count="5" thumb padding="8rpx 0" />
        <view v-else-if="!checkinList.length" style="padding:60rpx 0;text-align:center;">
          <text style="color:#8D6E63;">{{ emptyHint }}</text>
        </view>
        <view v-for="row in checkinList" :key="row.id" style="display:flex;align-items:center;gap:24rpx;padding:24rpx 0;border-bottom:1rpx solid #F5F0EC;">
          <view style="width:80rpx;height:80rpx;border-radius:40rpx;display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:700;"
            :style="{ backgroundColor: row.color + '20', color: row.color }"><text>{{ row.avatar }}</text></view>
          <view style="flex:1;">
            <text style="font-size:30rpx;font-weight:700;color:#2D1F18;display:block;">{{ row.name }}</text>
            <text style="font-size:22rpx;color:#8D6E63;">{{ row.subLabel }}</text>
          </view>
          <view v-if="row.status === 'waiting'" style="display:flex;flex-direction:column;gap:8rpx;align-items:flex-end;">
            <view class="action-btn" style="background:#66BB6A;" @click="doCheckin(row)">
              <text style="color:white;font-size:24rpx;font-weight:700;">签到</text>
            </view>
            <text style="font-size:22rpx;color:#C62828;font-weight:700;" @click="doMarkAbsent(row)">缺勤</text>
          </view>
          <view v-else-if="row.status === 'arrived'" class="action-btn" style="background:#3B9EEB;" @click="doCheckout(row)">
            <text style="color:white;font-size:24rpx;font-weight:700;">签退</text>
          </view>
          <view class="pill" :style="statusStyle(row.statusLabel)"><text style="font-size:22rpx;font-weight:700;">{{ row.statusLabel }}</text></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, inject, nextTick, onMounted, onUnmounted, watch } from 'vue'
import {
  checkinStudents,
  checkoutStudent,
  faceSearch,
  fetchAttendanceToday,
  fetchDashboard,
  fetchPeriods,
  markAbsent,
} from '../../api/teacher.js'
import { uploadFile } from '../../utils/request.js'
import { faceCheckinEnabled, MP_APPS_KEY } from '../../utils/apps.js'

const AVATAR_COLORS = ['#FF7043', '#AB47BC', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']
const STATUS_LABEL = {
  waiting: '未到',
  arrived: '已签到',
  left: '已签退',
  leave: '请假',
  absent: '缺勤'
}

const mpApps = inject(MP_APPS_KEY, ref([]))
const faceAvailable = computed(() => faceCheckinEnabled(mpApps.value))

const injectedClassId = inject('teacherCheckinClassId', null)
const injectedPeriodId = inject('teacherCheckinPeriodId', null)
const checkinClassIdLocal = ref(null)
const checkinClassId = computed({
  get: () => (injectedClassId ? injectedClassId.value : checkinClassIdLocal.value),
  set: (v) => {
    if (injectedClassId) injectedClassId.value = v
    else checkinClassIdLocal.value = v
  }
})
const checkinPeriodIdLocal = ref(null)
const checkinPeriodId = computed({
  get: () => (injectedPeriodId ? injectedPeriodId.value : checkinPeriodIdLocal.value),
  set: (v) => {
    if (injectedPeriodId) injectedPeriodId.value = v
    else checkinPeriodIdLocal.value = v
  }
})

const checkinMode = ref('list')
const checkinLoading = ref(false)
const checkinBusy = ref(false)
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
  if (!classes.value.length) return '今日暂无可点名的托管班'
  if (!checkinPeriodOptions.value.length) return '该托管班暂无考勤时段'
  return '当前班级/时段暂无应到学生'
})

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
    // 时段点名仅托管班
    classes.value = (dash?.classes || [])
      .filter(c => c.can_period_checkin || ((c.biz_type === 'care' || c.attendance_type_id) && c.has_schedule_today))
      .map((c, i) => ({
        id: c.id,
        name: c.name,
        tag: c.attendance_type_name || (c.biz_type === 'care' ? '托管' : ''),
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        attendanceTypeId: c.attendance_type_id,
        periods: c.periods || [],
        periodCount: (c.periods || []).length,
        canCheckin: !!c.can_period_checkin,
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

// ---- 刷脸识别（手动拍摄 → 云端 1:N → 命中签到）----
const faceCameraOn = ref(false)
const faceCameraMounted = ref(true)
const faceCameraEpoch = ref(0)
const faceBusy = ref(false)
const faceLastMsg = ref('')
const faceHits = ref([]) // 本轮已识别学生 {id, name}
const faceCameraPosition = ref('front') // front | back
let cameraCtx = null

watch(faceAvailable, (ok) => {
  if (!ok && checkinMode.value === 'face') {
    checkinMode.value = 'list'
    faceCameraOn.value = false
  }
})

const faceHitNames = computed(() => faceHits.value.map(h => h.name).join('、'))

function bindCameraContext() {
  cameraCtx = null
  setTimeout(() => { cameraCtx = uni.createCameraContext() }, 450)
}

function startFaceCamera() {
  if (!checkinClassId.value || !checkinPeriodId.value) {
    uni.showToast({ title: '请先在名单页选择班级与时段', icon: 'none' })
    return
  }
  faceCameraOn.value = true
  faceCameraMounted.value = true
  faceHits.value = []
  faceLastMsg.value = ''
  bindCameraContext()
}

function stopFaceCamera() {
  faceCameraOn.value = false
  faceCameraMounted.value = true
  faceHits.value = []
  faceLastMsg.value = ''
  cameraCtx = null
}

/** 微信 camera 仅改 device-position 常不生效，需销毁重建 */
function toggleFaceCamera() {
  if (!faceCameraOn.value || faceBusy.value || !faceCameraMounted.value) return
  faceCameraPosition.value = faceCameraPosition.value === 'front' ? 'back' : 'front'
  faceCameraEpoch.value += 1
  faceCameraMounted.value = false
  cameraCtx = null
  nextTick(() => {
    faceCameraMounted.value = true
    bindCameraContext()
  })
}

function onFaceCameraError() {
  stopFaceCamera()
  uni.showToast({ title: '摄像头开启失败，请检查小程序相机权限', icon: 'none' })
}

function manualFaceScan() {
  if (!faceCameraOn.value || faceBusy.value || !cameraCtx) return
  faceBusy.value = true
  faceLastMsg.value = ''
  cameraCtx.takePhoto({
    quality: 'high',
    success: async res => {
      try {
        const up = await uploadFile(res.tempImagePath, 'face')
        const hit = await faceSearch({ attachment_id: up.attachment_id, class_id: checkinClassId.value })
        if (! hit.matched) {
          faceLastMsg.value = hit.hint || '未识别到已授权学员'
          return
        }
        const matches = Array.isArray(hit.matches) ? hit.matches : []
        const fresh = matches.filter(m => m?.student?.id && !faceHits.value.some(h => h.id === m.student.id))
        if (!fresh.length) {
          faceLastMsg.value = matches.length
            ? `${matches.map(m => m.student.name).join('、')} 已识别过`
            : (hit.hint || '未识别到已授权学员')
          return
        }
        await checkinStudents({
          classId: checkinClassId.value,
          periodId: checkinPeriodId.value,
          studentIds: fresh.map(m => m.student.id),
          method: 'face'
        })
        faceHits.value.push(...fresh.map(m => m.student))
        faceLastMsg.value = `✓ ${fresh.map(m => m.student.name).join('、')} 已签到`
        uni.vibrateShort()
        await loadCheckinToday()
      } catch (e) {
        faceLastMsg.value = e.message || '识别失败，请重试'
      } finally {
        faceBusy.value = false
      }
    },
    fail: () => {
      faceBusy.value = false
      faceLastMsg.value = '拍摄失败，请重试'
    }
  })
}

onUnmounted(stopFaceCamera)

onMounted(async () => {
  await loadClasses()
  await loadCheckinToday()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';

.face-cam-switch {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.face-cam-switch__icon {
  width: 40rpx;
  height: 40rpx;
}
</style>
