<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#3B9EEB 0%,#64B5F6 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <view style="display:flex;align-items:center;">
          <view class="back-btn" @click="$emit('back')"><text class="back-icon">‹</text></view>
          <view style="flex:1;margin-left:20rpx;">
            <text style="font-size:40rpx;font-weight:800;color:white;display:block;">消息</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.85);">站内通知</text>
          </view>
          <view v-if="teacherUnreadCount" style="background:rgba(255,255,255,0.25);border-radius:20rpx;padding:12rpx 20rpx;" @click="markAllTeacherMessagesRead">
            <text style="color:white;font-size:22rpx;font-weight:700;">全部已读</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="teacherMessagesLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
        <view v-else-if="!teacherMessages.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无消息</text></view>
        <view v-for="m in teacherMessages" :key="m.id" class="card" style="padding:24rpx;margin-bottom:16rpx;" @click="openTeacherMessage(m)">
          <view style="display:flex;justify-content:space-between;margin-bottom:8rpx;">
            <text style="font-size:28rpx;font-weight:800;color:#2D1F18;">{{ m.title }}</text>
            <view v-if="!m.read_at" style="width:16rpx;height:16rpx;border-radius:8rpx;background:#E53935;margin-top:12rpx;" />
          </view>
          <text style="font-size:24rpx;color:#8D6E63;display:block;line-height:1.5;">{{ m.content }}</text>
          <text style="font-size:20rpx;color:#BCAAA4;display:block;margin-top:12rpx;">{{ m.created_at }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchMessages, readMessages } from '../../api/teacher.js'

defineEmits(['back'])

const teacherMessages = ref([])
const teacherMessagesLoading = ref(false)
const teacherUnreadCount = computed(() => teacherMessages.value.filter(m => !m.read_at).length)

async function loadTeacherMessages() {
  teacherMessagesLoading.value = true
  try {
    const data = await fetchMessages()
    teacherMessages.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '消息加载失败', icon: 'none' })
  } finally {
    teacherMessagesLoading.value = false
  }
}

async function openTeacherMessage(m) {
  if (!m?.id) return
  if (!m.read_at) {
    try {
      await readMessages([m.id])
      m.read_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
    } catch (_) { /* ignore */ }
  }
}

async function markAllTeacherMessagesRead() {
  const ids = teacherMessages.value.filter(m => !m.read_at).map(m => m.id)
  if (!ids.length) return
  try {
    await readMessages(ids)
    teacherMessages.value.forEach(m => {
      if (!m.read_at) m.read_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
    })
    uni.showToast({ title: '已全部已读', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

onMounted(loadTeacherMessages)
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
