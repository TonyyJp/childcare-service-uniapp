<template>
  <view class="overlay-page hw">
    <view class="hw-nav">
      <view class="hw-nav-inner safe-nav-bar">
        <view class="back-btn" style="background: #f5f0ec;" @click="$emit('back')">
          <text class="back-icon" style="color: #2d1f18;">‹</text>
        </view>
        <view class="hw-nav-center">
          <text class="hw-title">作业辅导</text>
          <text class="hw-sub">{{ className }}（{{ students.length }}人）</text>
        </view>
        <view class="hw-date" @click="noop">
          <text>今日</text>
          <text style="margin-left: 4rpx;">▾</text>
        </view>
      </view>
    </view>

    <view class="hw-body">
      <scroll-view scroll-y class="hw-side">
        <view
          v-for="s in students"
          :key="s.id"
          class="hw-side-item"
          :class="{ on: s.id === activeId }"
          @click="activeId = s.id"
        >
          <view class="hw-side-avatar" :style="{ background: s.color }">
            <text>{{ s.initial }}</text>
          </view>
          <text class="hw-side-name">{{ s.shortName }}</text>
        </view>
        <view v-if="!students.length && !loading" class="hw-side-empty">
          <text>暂无学员</text>
        </view>
      </scroll-view>

      <view class="hw-main">
        <view class="hw-main-head" @click="noop">
          <text class="hw-main-name">{{ activeStudent?.name || '—' }} ›</text>
        </view>
        <view class="hw-actions">
          <view v-for="a in actions" :key="a.key" class="hw-action" @click="onAction(a)">
            <text class="hw-action-icon">{{ a.icon }}</text>
            <text class="hw-action-label">{{ a.label }}</text>
          </view>
        </view>
        <view class="hw-empty">
          <text class="hw-empty-title">暂无作业</text>
          <view class="hw-empty-line">
            <text class="hw-empty-hint">你可以 </text>
            <text class="hw-empty-link" @click="onRegister">登记作业</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, inject, onMounted, ref, watch } from 'vue'
import { fetchClassStudents } from '../../api/teacher.js'

defineEmits(['back'])
const hosting = inject('teacherHosting', ref(null))

const AVATAR_COLORS = ['#FF7043', '#AB47BC', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']
const loading = ref(false)
const students = ref([])
const activeId = ref(null)

const className = computed(() => hosting.value?.name || '托管')
const activeStudent = computed(() => students.value.find((s) => s.id === activeId.value) || null)

const actions = [
  { key: 'photo', icon: '📷', label: '拍照' },
  { key: 'video', icon: '🎬', label: '拍视频' },
  { key: 'wrong', icon: '📕', label: '错题本' },
  { key: 'summary', icon: '✍️', label: '写总结' },
]

function noop() {}

function onAction(a) {
  uni.showToast({ title: `${a.label}即将开放`, icon: 'none' })
}

function onRegister() {
  uni.showToast({ title: '登记作业即将开放', icon: 'none' })
}

async function load() {
  const classId = hosting.value?.id
  if (!classId) return
  loading.value = true
  try {
    const data = await fetchClassStudents(classId)
    students.value = (data?.list || []).map((s, i) => ({
      id: s.id,
      name: s.name,
      shortName: (s.name || '').length > 4 ? `${(s.name || '').slice(0, 4)}…` : s.name,
      initial: (s.name || '?').slice(0, 1),
      color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    }))
    if (!activeId.value && students.value[0]) activeId.value = students.value[0].id
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => hosting.value?.id, () => {
  activeId.value = null
  load()
})
</script>

<style scoped lang="scss">
.hw {
  background: #f5f5f5;
}
.hw-nav {
  background: #fff;
  border-bottom: 1rpx solid #eee;
}
.hw-nav-inner {
  display: flex;
  align-items: center;
  padding: 8rpx 24rpx 20rpx;
  gap: 12rpx;
}
.hw-nav-center {
  flex: 1;
  text-align: center;
  min-width: 0;
}
.hw-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: #1a1a1a;
}
.hw-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #999;
}
.hw-date {
  padding: 10rpx 16rpx;
  font-size: 24rpx;
  color: #666;
  font-weight: 600;
}
.hw-body {
  flex: 1;
  display: flex;
  min-height: 0;
  height: 0;
}
.hw-side {
  width: 168rpx;
  background: #f0f0f0;
  height: 100%;
}
.hw-side-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 12rpx;
}
.hw-side-item.on {
  background: #ff7043;
  border-radius: 20rpx;
  margin: 8rpx 10rpx;
  padding: 20rpx 8rpx;
}
.hw-side-item.on .hw-side-name {
  color: #fff;
}
.hw-side-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
}
.hw-side-name {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #333;
  max-width: 140rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
.hw-side-empty {
  padding: 40rpx 8rpx;
  text-align: center;
  font-size: 22rpx;
  color: #999;
}
.hw-main {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.hw-main-head {
  padding: 24rpx 28rpx 8rpx;
}
.hw-main-name {
  font-size: 30rpx;
  font-weight: 800;
  color: #1a1a1a;
}
.hw-actions {
  display: flex;
  padding: 16rpx 12rpx 8rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.hw-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.hw-action-icon {
  font-size: 40rpx;
}
.hw-action-label {
  font-size: 22rpx;
  color: #666;
}
.hw-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 80rpx;
}
.hw-empty-title {
  font-size: 28rpx;
  color: #bbb;
  margin-bottom: 12rpx;
}
.hw-empty-line {
  display: flex;
  align-items: center;
}
.hw-empty-hint {
  font-size: 26rpx;
  color: #999;
}
.hw-empty-link {
  font-size: 26rpx;
  color: #3b9eeb;
  font-weight: 700;
}
</style>
