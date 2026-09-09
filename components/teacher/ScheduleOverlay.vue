<template>
  <view class="overlay-page">
    <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #F0E6DC;flex-shrink:0;">
      <view class="safe-nav-bar" style="display:flex;align-items:center;padding-bottom:16rpx;">
        <view class="back-btn" style="background:#FFF8F5;margin-right:20rpx;" @click="$emit('back')">
          <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
        </view>
        <view>
          <text style="font-size:36rpx;font-weight:800;color:#2D1F18;display:block;">课程排布</text>
          <text style="font-size:22rpx;color:#8D6E63;">{{ scheduleSubtitle }}</text>
        </view>
      </view>
      <scroll-view scroll-x style="padding:0 40rpx;">
        <view style="display:flex;gap:16rpx;">
          <view v-for="(d, i) in weekDays" :key="d" style="padding:16rpx 24rpx;border-radius:20rpx;flex-shrink:0;text-align:center;font-size:26rpx;font-weight:700;"
            :style="{ backgroundColor: scheduleDay === i ? '#FF7043' : '#F5F0EC', color: scheduleDay === i ? 'white' : '#8D6E63' }"
            @click="setScheduleDay(i)"><text>{{ d }}</text></view>
        </view>
      </scroll-view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="scheduleLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
        <view v-else-if="!dayScheduleItems.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">当日暂无排课</text></view>
        <view v-for="c in dayScheduleItems" :key="c.id" class="card" style="display:flex;overflow:hidden;margin-bottom:16rpx;">
          <view style="width:12rpx;" :style="{ backgroundColor: c.color }" />
          <view style="flex:1;padding:20rpx 24rpx;display:flex;align-items:center;gap:20rpx;">
            <view style="min-width:96rpx;">
              <text style="font-size:28rpx;font-weight:800;" :style="{ color: c.color }">{{ c.time }}</text>
            </view>
            <view style="flex:1;">
              <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">{{ c.subject }}</text>
              <text style="font-size:22rpx;color:#8D6E63;">👩‍🏫 {{ c.teacher }} · 📍 {{ c.room }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchDashboard, fetchSchedules } from '../../api/teacher.js'

defineEmits(['back'])

const weekDays = ['一', '二', '三', '四', '五', '六', '日']
const scheduleDay = ref((new Date().getDay() + 6) % 7)
const scheduleLoading = ref(false)
const dayScheduleItems = ref([])
const scheduleClassNames = ref([])
const primaryClassName = ref('—')

const scheduleSubtitle = computed(() => {
  const names = scheduleClassNames.value.filter(Boolean).join(' · ') || primaryClassName.value || '所带班级'
  const now = new Date()
  return `${names} · ${now.getFullYear()}年${now.getMonth() + 1}月`
})

async function loadTeacherSchedules() {
  scheduleLoading.value = true
  try {
    const data = await fetchSchedules({ dayOfWeek: scheduleDay.value + 1 })
    dayScheduleItems.value = data?.list || []
    scheduleClassNames.value = (data?.classes || []).map(c => c.name)
  } catch (e) {
    uni.showToast({ title: e.message || '课表加载失败', icon: 'none' })
  } finally {
    scheduleLoading.value = false
  }
}

function setScheduleDay(i) {
  scheduleDay.value = i
  loadTeacherSchedules()
}

onMounted(async () => {
  try {
    const dash = await fetchDashboard()
    primaryClassName.value = dash?.classes?.[0]?.name || '—'
  } catch (_) { /* ignore */ }
  await loadTeacherSchedules()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
