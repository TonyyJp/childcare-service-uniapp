<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#EC407A 0%,#F48FB1 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <view style="display:flex;align-items:center;gap:20rpx;">
          <view class="back-btn" @click="$emit('back')"><text class="back-icon">‹</text></view>
          <view style="flex:1;">
            <text style="font-size:40rpx;font-weight:800;color:white;display:block;">活动日历</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.85);">所带班级与全园活动</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="teacherEventsLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
        <view v-else-if="!teacherEvents.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">近期暂无活动</text></view>
        <view v-for="ev in teacherEvents" :key="ev.id" class="card" style="padding:24rpx;margin-bottom:16rpx;display:flex;gap:20rpx;align-items:center;">
          <view style="width:80rpx;height:80rpx;border-radius:24rpx;background:#FCE4EC;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
            <text style="font-size:20rpx;font-weight:800;color:#C2185B;">{{ ev.month }}</text>
            <text style="font-size:34rpx;font-weight:800;color:#C2185B;">{{ ev.date }}</text>
          </view>
          <view style="flex:1;">
            <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;">{{ ev.icon }} {{ ev.title }}</text>
            <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:8rpx;">{{ ev.weekday }}{{ ev.location ? ' · ' + ev.location : '' }}{{ ev.class_name ? ' · ' + ev.class_name : ' · 全园' }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchEvents } from '../../api/teacher.js'

defineEmits(['back'])

const teacherEvents = ref([])
const teacherEventsLoading = ref(false)

async function loadTeacherEvents() {
  teacherEventsLoading.value = true
  try {
    const data = await fetchEvents()
    teacherEvents.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '活动加载失败', icon: 'none' })
  } finally {
    teacherEventsLoading.value = false
  }
}

onMounted(loadTeacherEvents)
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
