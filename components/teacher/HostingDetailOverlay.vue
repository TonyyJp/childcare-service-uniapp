<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background: linear-gradient(135deg, #ff7043 0%, #ff9068 100%);">
      <view class="safe-nav-bar" style="padding-bottom: 32rpx;">
        <view style="display: flex; align-items: center;">
          <view class="back-btn" style="margin-right: 20rpx;" @click="$emit('back')">
            <text class="back-icon">‹</text>
          </view>
          <view style="flex: 1; min-width: 0;">
            <text style="font-size: 40rpx; font-weight: 800; color: white; display: block;">{{ className }}</text>
            <text style="font-size: 24rpx; color: rgba(255, 255, 255, 0.85);">
              {{ teacherLabel }} · {{ dateLabel }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y style="flex: 1; height: 0;">
      <view style="padding: 24rpx 28rpx 200rpx;">
        <view class="period-tip">
          <MpIcon name="clock" :size="28" color="#E64A19" />
          <view class="period-tip__main" @click="onPeriodTipClick">
            <text class="period-tip__text">{{ periodTipText }}</text>
            <text v-if="!hasPeriod" class="period-tip__action">设置</text>
          </view>
          <view
            id="hosting-detail-more"
            class="period-more tap-feedback"
            hover-class="mp-tap"
            :hover-stay-time="80"
            @click.stop="openMore"
          >
            <text class="period-more__dots">···</text>
          </view>
        </view>

        <LoadingSkeleton v-if="loading" variant="list" :count="2" padding="8rpx 0" />
        <template v-else>
          <view v-for="sec in sections" :key="sec.key" class="section">
            <view class="section-head">
              <view class="section-dot" :style="{ background: sec.dot }" />
              <text class="section-title">{{ sec.title }}</text>
              <text class="section-count">{{ sec.list.length }}</text>
            </view>
            <view class="folder-grid">
              <view v-for="s in sec.list" :key="s.id" class="stu-cell">
                <view class="stu-avatar" :style="{ background: s.color }">
                  <text>{{ s.initial }}</text>
                </view>
                <text class="stu-name">{{ s.name }}</text>
              </view>
              <view v-if="!sec.list.length" class="folder-empty"><text>暂无</text></view>
            </view>
          </view>
        </template>
      </view>
    </scroll-view>

    <view class="detail-bar">
      <view class="detail-btn primary" @click="showCheckin = true">
        <MpIcon name="circle-check" :size="40" color="#fff" />
        <text class="detail-btn__label on">签到/签退</text>
      </view>
      <view class="detail-btn" @click="showMessage = true">
        <MpIcon name="message-circle" :size="40" color="#E64A19" />
        <text class="detail-btn__label">发消息</text>
      </view>
      <view class="detail-btn" @click="$emit('homework', hosting)">
        <MpIcon name="notebook-pen" :size="40" color="#E64A19" />
        <text class="detail-btn__label">作业辅导</text>
      </view>
    </view>

    <PopoverMenu
      :visible="menuVisible"
      :items="moreItems"
      :anchor="menuAnchor"
      @close="menuVisible = false"
      @select="onMoreSelect"
    />

    <!-- 签到/签退抽屉 -->
    <template v-if="showCheckin">
      <view class="drawer-mask" @click="showCheckin = false" />
      <view class="drawer is-open">
        <view class="drawer-handle" />
        <view class="drawer-head">
          <view class="drawer-tabs">
            <view
              class="drawer-tab"
              :class="{ on: checkinMode === 'in' }"
              @click="checkinMode = 'in'"
            >签到</view>
            <view
              class="drawer-tab"
              :class="{ on: checkinMode === 'out' }"
              @click="checkinMode = 'out'"
            >签退</view>
          </view>
          <text class="drawer-all" @click="toggleSelectAll">{{ allSelected ? '取消全选' : '全选' }}</text>
        </view>
        <scroll-view scroll-y class="drawer-body">
          <view class="folder-grid" style="padding: 8rpx 0 24rpx;">
            <view
              v-for="s in checkinCandidates"
              :key="s.id"
              class="stu-cell selectable"
              :class="{ selected: selectedIds.includes(s.id) }"
              @click="toggleStudent(s.id)"
            >
              <view class="stu-avatar" :style="{ background: s.color }">
                <text>{{ s.initial }}</text>
              </view>
              <text class="stu-name">{{ s.name }}</text>
              <view v-if="selectedIds.includes(s.id)" class="sel-mark">✓</view>
            </view>
          </view>
          <view class="photo-row">
            <view
              v-for="(p, i) in photos"
              :key="i"
              class="photo-chip"
              @click="previewPhoto(i)"
            >
              <image :src="p" mode="aspectFill" style="width: 100%; height: 100%; border-radius: 12rpx;" />
              <text class="photo-del" @click.stop="photos.splice(i, 1)">×</text>
            </view>
            <view v-if="photos.length < 3" class="photo-add" @click="pickPhotos">
              <text>+ 照片</text>
            </view>
          </view>
        </scroll-view>
        <view class="drawer-foot">
          <view class="primary-btn" :style="{ opacity: busy || !selectedIds.length ? 0.55 : 1 }" @click="submitCheckin">
            <text style="color: white; font-weight: 800;">
              {{ checkinMode === 'in' ? '签到' : '签退' }}（{{ selectedIds.length }}）
            </text>
          </view>
        </view>
      </view>
    </template>

    <!-- 发消息抽屉 -->
    <template v-if="showMessage">
      <view class="drawer-mask" @click="showMessage = false" />
      <view class="drawer is-open">
        <view class="drawer-handle" />
        <view class="drawer-head">
          <text class="drawer-title">发消息</text>
          <text class="drawer-all" @click="showMessage = false">关闭</text>
        </view>
        <scroll-view scroll-y class="drawer-body">
          <textarea
            class="msg-input"
            v-model="msgText"
            maxlength="500"
            placeholder="输入要发给家长的内容…"
            placeholder-style="color:#BCAAA4;"
            :show-confirm-bar="false"
          />
          <text class="msg-count">{{ msgText.length }}/500</text>
          <view class="photo-row" style="margin-top: 16rpx;">
            <view v-for="(p, i) in msgPhotos" :key="i" class="photo-chip" @click="previewMsgPhoto(i)">
              <image :src="p" mode="aspectFill" style="width: 100%; height: 100%; border-radius: 12rpx;" />
              <text class="photo-del" @click.stop="msgPhotos.splice(i, 1)">×</text>
            </view>
            <view v-if="msgPhotos.length < 9" class="photo-add" @click="pickMsgPhotos">
              <text>+ 图片</text>
            </view>
          </view>
          <text style="font-size: 24rpx; font-weight: 700; color: #2d1f18; display: block; margin: 20rpx 0 12rpx;">
            选择学员家长
          </text>
          <view class="folder-grid">
            <view
              v-for="s in students"
              :key="'m' + s.id"
              class="stu-cell selectable"
              :class="{ selected: msgStudentIds.includes(s.id) }"
              @click="toggleMsgStudent(s.id)"
            >
              <view class="stu-avatar" :style="{ background: s.color }">
                <text>{{ s.initial }}</text>
              </view>
              <text class="stu-name">{{ s.name }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="drawer-foot">
          <view
            class="primary-btn"
            :style="{ opacity: msgBusy || !msgText.trim() || !msgStudentIds.length ? 0.55 : 1 }"
            @click="submitMessage"
          >
            <text style="color: white; font-weight: 800;">发送</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, inject, nextTick, onMounted, ref, watch } from 'vue'
import LoadingSkeleton from '../LoadingSkeleton.vue'
import MpIcon from '../MpIcon.vue'
import PopoverMenu from '../PopoverMenu.vue'
import {
  checkinStudents,
  checkoutStudent,
  createDailyPost,
  fetchAttendanceToday,
  fetchClassStudents,
  fetchPeriods,
  publishDailyPost,
} from '../../api/teacher.js'
import { uploadFile } from '../../utils/request.js'

const emit = defineEmits(['back', 'homework', 'period-settings'])
const hosting = inject('teacherHosting', ref(null))
const instance = getCurrentInstance()

const AVATAR_COLORS = ['#FF7043', '#AB47BC', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']
const moreItems = [
  { key: 'period', label: '设置考勤时段' },
  { key: 'group', label: '新增学员分组' },
]

const loading = ref(false)
const busy = ref(false)
const students = ref([])
const records = ref([])
const periodId = ref(null)
const periodTipText = ref('未设置考勤时段')
const hasPeriod = ref(false)
const showCheckin = ref(false)
const showMessage = ref(false)
const checkinMode = ref('in')
const selectedIds = ref([])
const photos = ref([])
const msgText = ref('')
const msgPhotos = ref([])
const msgStudentIds = ref([])
const msgBusy = ref(false)
const menuVisible = ref(false)
const menuAnchor = ref(null)

const classId = computed(() => hosting.value?.id || null)
const className = computed(() => hosting.value?.name || '托管详情')
const teacherLabel = computed(() => hosting.value?.teacherLabel || '—')
const dateLabel = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

function parseHm(hm) {
  if (!hm || typeof hm !== 'string') return null
  const parts = hm.slice(0, 5).split(':')
  if (parts.length < 2) return null
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

function formatHm(hm) {
  if (!hm) return ''
  return String(hm).slice(0, 5)
}

/** 离当前时间最近：优先进行中 → 即将开始 → 否则最近一场 */
function pickNearestPeriod(list) {
  const rows = (list || [])
    .map((p) => ({
      id: p.period_id || p.id,
      name: p.period_name || p.name || '时段',
      start_time: p.start_time,
      end_time: p.end_time,
      startM: parseHm(p.start_time),
      endM: parseHm(p.end_time),
    }))
    .filter((p) => p.id)
  if (!rows.length) return null

  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  const timed = rows.filter((p) => p.startM != null)
  if (!timed.length) return rows[0]

  const ongoing = timed.find(
    (p) => p.startM <= mins && (p.endM == null || mins < p.endM),
  )
  if (ongoing) return ongoing

  const upcoming = timed
    .filter((p) => p.startM >= mins)
    .sort((a, b) => a.startM - b.startM)[0]
  if (upcoming) return upcoming

  return timed.sort((a, b) => Math.abs(a.startM - mins) - Math.abs(b.startM - mins))[0]
}

function applyPeriodTip(period) {
  if (!period) {
    hasPeriod.value = false
    periodId.value = null
    periodTipText.value = '未设置考勤时段'
    return
  }
  hasPeriod.value = true
  periodId.value = period.id
  const range = [formatHm(period.start_time), formatHm(period.end_time)]
    .filter(Boolean)
    .join(' - ')
  periodTipText.value = range
    ? `即将：${range} ${period.name}`
    : `即将：${period.name}`
}

function decorate(list) {
  return (list || []).map((s, i) => ({
    id: s.id,
    name: s.name,
    initial: (s.name || '?').slice(0, 1),
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    recordId: s.recordId || null,
    status: s.status || 'waiting',
  }))
}

const waiting = computed(() => students.value.filter((s) => !['arrived', 'left'].includes(s.status)))
const arrived = computed(() => students.value.filter((s) => s.status === 'arrived'))
const left = computed(() => students.value.filter((s) => s.status === 'left'))

const sections = computed(() => [
  { key: 'waiting', title: '未到校', list: waiting.value, dot: '#FFA726' },
  { key: 'arrived', title: '已到校', list: arrived.value, dot: '#66BB6A' },
  { key: 'left', title: '已离校', list: left.value, dot: '#90A4AE' },
])

const checkinCandidates = computed(() =>
  checkinMode.value === 'in' ? waiting.value : arrived.value,
)

const allSelected = computed(() => {
  const ids = checkinCandidates.value.map((s) => s.id)
  return ids.length > 0 && ids.every((id) => selectedIds.value.includes(id))
})

watch(checkinMode, () => {
  selectedIds.value = []
})
watch(showCheckin, (v) => {
  if (v) selectedIds.value = []
})

function goPeriodSettings() {
  emit('period-settings')
}

function onPeriodTipClick() {
  if (!hasPeriod.value) goPeriodSettings()
}

function openMore() {
  nextTick(() => {
    const q = uni.createSelectorQuery()
    // #ifndef H5
    if (instance?.proxy) q.in(instance.proxy)
    // #endif
    q.select('#hosting-detail-more')
      .boundingClientRect((rect) => {
        menuAnchor.value = rect || null
        menuVisible.value = true
      })
      .exec()
  })
}

function onMoreSelect(opt) {
  if (opt?.key === 'period') {
    goPeriodSettings()
    return
  }
  uni.showToast({ title: `${opt?.label || '该功能'}即将开放`, icon: 'none' })
}

function toggleStudent(id) {
  const i = selectedIds.value.indexOf(id)
  if (i >= 0) selectedIds.value.splice(i, 1)
  else selectedIds.value.push(id)
}

function toggleSelectAll() {
  if (allSelected.value) selectedIds.value = []
  else selectedIds.value = checkinCandidates.value.map((s) => s.id)
}

function toggleMsgStudent(id) {
  const i = msgStudentIds.value.indexOf(id)
  if (i >= 0) msgStudentIds.value.splice(i, 1)
  else msgStudentIds.value.push(id)
}

function pickPhotos() {
  uni.chooseImage({
    count: 3 - photos.value.length,
    success: (res) => {
      photos.value.push(...(res.tempFilePaths || []))
    },
  })
}

function pickMsgPhotos() {
  uni.chooseImage({
    count: 9 - msgPhotos.value.length,
    success: (res) => {
      msgPhotos.value.push(...(res.tempFilePaths || []))
    },
  })
}

function previewPhoto(i) {
  uni.previewImage({ urls: photos.value, current: photos.value[i] })
}
function previewMsgPhoto(i) {
  uni.previewImage({ urls: msgPhotos.value, current: msgPhotos.value[i] })
}

async function load() {
  if (!classId.value) return
  loading.value = true
  try {
    const [stuRes, periods] = await Promise.all([
      fetchClassStudents(classId.value),
      fetchPeriods().catch(() => ({ list: [] })),
    ])
    const periodList = periods?.list || periods || []
    const hostPeriods = hosting.value?.periods || []
    const candidates = hostPeriods.length
      ? hostPeriods
      : periodList
    const nearest = pickNearestPeriod(candidates)
    applyPeriodTip(nearest)

    let todayRows = []
    if (nearest?.id) {
      try {
        const today = await fetchAttendanceToday({ classId: classId.value, periodId: nearest.id })
        todayRows = today?.list || today?.students || []
      } catch (_) {
        todayRows = []
      }
    }

    const byId = {}
    todayRows.forEach((r) => {
      const sid = r.student_id || r.student?.id
      if (!sid) return
      byId[sid] = {
        status: r.status || 'waiting',
        recordId: r.id || null,
      }
    })

    const raw = (stuRes?.list || []).map((s) => {
      const hit = byId[s.id]
      let status = hit?.status
      if (!status && s.today) {
        const vals = Object.values(s.today)
        if (vals.includes('left')) status = 'left'
        else if (vals.includes('arrived')) status = 'arrived'
        else status = 'waiting'
      }
      return {
        id: s.id,
        name: s.name,
        status: status || 'waiting',
        recordId: hit?.recordId || null,
      }
    })
    records.value = todayRows
    students.value = decorate(raw)
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function submitCheckin() {
  if (busy.value || !selectedIds.value.length) return
  if (!periodId.value && checkinMode.value === 'in') {
    uni.showToast({ title: '请先设置考勤时段', icon: 'none' })
    return
  }
  busy.value = true
  try {
    if (photos.value.length) {
      for (const path of photos.value) {
        await uploadFile(path, 'attendance').catch(() => null)
      }
    }
    if (checkinMode.value === 'in') {
      await checkinStudents({
        classId: classId.value,
        periodId: periodId.value,
        studentIds: selectedIds.value,
        method: 'manual',
      })
      uni.showToast({ title: '签到成功', icon: 'success' })
    } else {
      const targets = students.value.filter((s) => selectedIds.value.includes(s.id) && s.recordId)
      for (const s of targets) {
        await checkoutStudent(s.recordId)
      }
      if (!targets.length) {
        uni.showToast({ title: '请选择已签到学员', icon: 'none' })
        return
      }
      uni.showToast({ title: '签退成功', icon: 'success' })
    }
    showCheckin.value = false
    photos.value = []
    await load()
  } catch (e) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}

async function submitMessage() {
  if (msgBusy.value || !msgText.value.trim() || !msgStudentIds.value.length) return
  msgBusy.value = true
  try {
    const attachmentIds = []
    for (const path of msgPhotos.value) {
      const up = await uploadFile(path, 'daily')
      if (up?.attachment_id) attachmentIds.push(up.attachment_id)
    }
    const post = await createDailyPost({
      class_id: classId.value,
      content: msgText.value.trim(),
      student_ids: msgStudentIds.value,
      attachment_ids: attachmentIds,
    })
    if (post?.id) {
      await publishDailyPost(post.id).catch(() => null)
    }
    uni.showToast({ title: '已发送', icon: 'success' })
    showMessage.value = false
    msgText.value = ''
    msgPhotos.value = []
    msgStudentIds.value = []
  } catch (e) {
    uni.showToast({ title: e.message || '发送失败', icon: 'none' })
  } finally {
    msgBusy.value = false
  }
}

onMounted(load)
watch(classId, () => load())
</script>

<style scoped lang="scss">
.period-tip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 22rpx 20rpx;
  margin-bottom: 28rpx;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(45, 31, 24, 0.04);
}
.period-tip__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.period-tip__text {
  flex: 1;
  font-size: 26rpx;
  color: #2d1f18;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.period-tip__action {
  font-size: 26rpx;
  font-weight: 800;
  color: #ff7043;
  flex-shrink: 0;
}
.period-more {
  width: 56rpx;
  height: 56rpx;
  margin: -8rpx -4rpx -8rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14rpx;
  flex-shrink: 0;
}
.period-more__dots {
  font-size: 36rpx;
  font-weight: 800;
  color: #8d6e63;
  letter-spacing: 2rpx;
  line-height: 1;
  transform: translateY(-2rpx);
}
.section {
  margin-bottom: 36rpx;
}
.section-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.section-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.section-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #2d1f18;
}
.section-count {
  font-size: 28rpx;
  font-weight: 700;
  color: #8d6e63;
  margin-left: 4rpx;
}
.folder-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx 12rpx;
}
.folder-empty {
  width: 100%;
  padding: 16rpx 0 8rpx;
  color: #bcaaa4;
  font-size: 24rpx;
}
.stu-cell {
  width: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.stu-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32rpx;
  font-weight: 800;
}
.stu-name {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #2d1f18;
  max-width: 140rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
.stu-cell.selectable.selected .stu-avatar {
  box-shadow: 0 0 0 4rpx #ff7043;
}
.sel-mark {
  position: absolute;
  top: 0;
  right: 20rpx;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #ff7043;
  color: #fff;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f0e6dc;
  z-index: 20;
}
.detail-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 18rpx 0;
  border-radius: 20rpx;
  background: #fff3e0;
}
.detail-btn.primary {
  background: #ff7043;
}
.detail-btn__label {
  font-size: 22rpx;
  font-weight: 800;
  color: #e64a19;
}
.detail-btn__label.on {
  color: #fff;
}
.drawer-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 40;
}
.drawer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 78%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}
.drawer-handle {
  width: 64rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #e0e0e0;
  margin: 16rpx auto 8rpx;
}
.drawer-head {
  display: flex;
  align-items: center;
  padding: 8rpx 32rpx 16rpx;
}
.drawer-tabs {
  flex: 1;
  display: flex;
  gap: 24rpx;
}
.drawer-tab {
  font-size: 30rpx;
  font-weight: 700;
  color: #bdbdbd;
  padding-bottom: 8rpx;
}
.drawer-tab.on {
  color: #ff7043;
  border-bottom: 4rpx solid #ff7043;
}
.drawer-title {
  flex: 1;
  font-size: 32rpx;
  font-weight: 800;
  color: #2d1f18;
}
.drawer-all {
  font-size: 26rpx;
  font-weight: 700;
  color: #ff7043;
}
.drawer-body {
  flex: 1;
  height: 0;
  padding: 0 32rpx;
  max-height: 52vh;
}
.drawer-foot {
  padding: 16rpx 32rpx 24rpx;
}
.photo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.photo-chip,
.photo-add {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  position: relative;
}
.photo-add {
  background: #f5f0ec;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8d6e63;
  font-size: 24rpx;
  font-weight: 700;
}
.photo-del {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 24rpx;
  text-align: center;
  line-height: 36rpx;
}
.msg-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  box-sizing: border-box;
  background: #f5f0ec;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #2d1f18;
}
.msg-count {
  display: block;
  text-align: right;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #bcaaa4;
}
</style>
