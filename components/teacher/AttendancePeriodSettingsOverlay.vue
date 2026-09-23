<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background: linear-gradient(135deg, #ff7043 0%, #ff9068 100%);">
      <view class="safe-nav-bar" style="padding-bottom: 32rpx;">
        <view style="display: flex; align-items: center;">
          <view class="back-btn" style="margin-right: 20rpx;" @click="$emit('back')">
            <text class="back-icon">‹</text>
          </view>
          <view style="flex: 1; min-width: 0;">
            <text style="font-size: 40rpx; font-weight: 800; color: white; display: block;">设置考勤时段</text>
            <text style="font-size: 24rpx; color: rgba(255, 255, 255, 0.85);">{{ className }}</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex: 1; height: 0;">
      <view style="padding: 24rpx 32rpx 48rpx;">
        <LoadingSkeleton v-if="loading" variant="list" :count="3" padding="8rpx 0" />
        <template v-else>
          <view v-if="!periods.length" class="empty card">
            <MpIcon name="clock" :size="56" color="#BCAAA4" />
            <text class="empty-title">未设置考勤时段</text>
            <text class="empty-desc">设置后可用于托管签到 / 签退</text>
          </view>
          <view v-for="p in periods" :key="p.id" class="card period-row">
            <view class="period-icon">
              <MpIcon name="clock" :size="36" color="#E64A19" />
            </view>
            <view style="flex: 1; min-width: 0;">
              <text class="period-name">{{ p.name }}</text>
              <text class="period-time">{{ p.timeLabel }}</text>
            </view>
          </view>
          <view class="primary-btn add-btn" @click="onAdd">
            <text style="color: white; font-weight: 800; font-size: 28rpx;">新增时段</text>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import LoadingSkeleton from '../LoadingSkeleton.vue'
import MpIcon from '../MpIcon.vue'
import { fetchPeriods } from '../../api/teacher.js'

defineEmits(['back'])
const hosting = inject('teacherHosting', ref(null))

const loading = ref(false)
const periods = ref([])
const className = computed(() => hosting.value?.name || '托管班')

function onAdd() {
  uni.showToast({ title: '新增时段即将开放', icon: 'none' })
}

onMounted(async () => {
  loading.value = true
  try {
    const fromHosting = (hosting.value?.periods || []).map((p) => ({
      id: p.period_id || p.id,
      name: p.period_name || p.name || '时段',
      timeLabel: [p.start_time, p.end_time].filter(Boolean).join(' - ') || '全天',
    }))
    if (fromHosting.length) {
      periods.value = fromHosting
      return
    }
    const data = await fetchPeriods()
    periods.value = (data?.list || []).map((p) => ({
      id: p.id,
      name: p.name,
      timeLabel: [p.start_time, p.end_time].filter(Boolean).join(' - ') || '全天',
    }))
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.empty {
  padding: 64rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}
.empty-title {
  margin-top: 12rpx;
  font-size: 30rpx;
  font-weight: 800;
  color: #2d1f18;
}
.empty-desc {
  font-size: 24rpx;
  color: #8d6e63;
}
.period-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
}
.period-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: rgba(255, 112, 67, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.period-name {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: #2d1f18;
}
.period-time {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #8d6e63;
}
.add-btn {
  margin-top: 32rpx;
}
</style>
