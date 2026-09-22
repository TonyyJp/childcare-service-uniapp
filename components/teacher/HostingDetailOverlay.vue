<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background: linear-gradient(135deg, #ff7043 0%, #ff9068 100%);">
      <view style="padding: 0 40rpx 32rpx;">
        <view style="display: flex; align-items: center; margin-bottom: 12rpx;">
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
      <view style="padding: 24rpx 32rpx 180rpx;">
        <LoadingSkeleton v-if="loading" variant="list" :count="2" padding="8rpx 0" />
        <template v-else>
          <view class="folder">
            <view class="folder-head">
              <text class="folder-title">未到校</text>
              <text class="folder-count">{{ waiting.length }}</text>
            </view>
            <view class="folder-grid">
              <view v-for="s in waiting" :key="s.id" class="stu-cell">
                <view class="stu-avatar" :style="{ background: s.color }">
                  <text>{{ s.initial }}</text>
                </view>
                <text class="stu-name">{{ s.name }}</text>
              </view>
              <view v-if="!waiting.length" class="folder-empty"><text>暂无</text></view>
            </view>
          </view>

          <view class="folder" style="margin-top: 24rpx;">
            <view class="folder-head">
              <text class="folder-title">已到校</text>
              <text class="folder-count">{{ arrived.length }}</text>
            </view>
            <view class="folder-grid">
              <view v-for="s in arrived" :key="s.id" class="stu-cell">
                <view class="stu-avatar" :style="{ background: s.color }">
                  <text>{{ s.initial }}</text>
                </view>
                <text class="stu-name">{{ s.name }}</text>
              </view>
              <view v-if="!arrived.length" class="folder-empty"><text>暂无</text></view>
            </view>
          </view>
        </template>
      </view>
    </scroll-view>

    <view class="detail-bar">
      <view class="detail-btn primary" @click="showCheckin = true">
        <text>签到/签退</text>
      </view>
      <view class="detail-btn" @click="showMessage = true">
        <text>发消息</text>
      </view>
      <view class="detail-btn" @click="$emit('homework', hosting)">
        <text>作业辅导</text>
      </view>
    </view>

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
import { computed, inject, onMounted, ref, watch } from 'vue'
import LoadingSkeleton from '../LoadingSkeleton.vue'
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

const emit = defineEmits(['back', 'homework'])
const hosting = inject('teacherHosting', ref(null))

const AVATAR_COLORS = ['#FF7043', '#AB47BC', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']
const loading = ref(false)
const busy = ref(false)
const students = ref([])
const records = ref([])
const periodId = ref(null)
const showCheckin = ref(false)
const showMessage = ref(false)
const checkinMode = ref('in')
const selectedIds = ref([])
const photos = ref([])
const msgText = ref('')
const msgPhotos = ref([])
const msgStudentIds = ref([])
const msgBusy = ref(false)

const classId = computed(() => hosting.value?.id || null)
const className = computed(() => hosting.value?.name || '托管详情')
const teacherLabel = computed(() => hosting.value?.teacherLabel || '—')
const dateLabel = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

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
const arrived = computed(() => students.value.filter((s) => ['arrived', 'left'].includes(s.status)))

const checkinCandidates = computed(() =>
  checkinMode.value === 'in' ? waiting.value : arrived.value.filter((s) => s.status === 'arrived'),
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
    const prefer = (hosting.value?.periods || [])[0]?.period_id
      || periodList[0]?.id
      || null
    periodId.value = prefer

    let todayRows = []
    if (prefer) {
      try {
        const today = await fetchAttendanceToday({ classId: classId.value, periodId: prefer })
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
        if (vals.includes('arrived') || vals.includes('left')) {
          status = vals.includes('left') ? 'left' : 'arrived'
        } else {
          status = 'waiting'
        }
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
    uni.showToast({ title: '今日无可用考勤时段', icon: 'none' })
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
.folder {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(45, 31, 24, 0.04);
}
.folder-head {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}
.folder-title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 800;
  color: #2d1f18;
}
.folder-count {
  font-size: 24rpx;
  color: #8d6e63;
  font-weight: 700;
}
.folder-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx 12rpx;
}
.folder-empty {
  width: 100%;
  padding: 24rpx 0;
  text-align: center;
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
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f0e6dc;
  z-index: 20;
}
.detail-btn {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  border-radius: 20rpx;
  background: #f5f0ec;
  font-size: 26rpx;
  font-weight: 800;
  color: #2d1f18;
}
.detail-btn.primary {
  background: #ff7043;
  color: #fff;
}
.detail-btn.primary text {
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
