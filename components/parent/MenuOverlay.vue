<template>
  <view class="overlay-page" style="background:linear-gradient(150deg,#3B9EEB 0%,#7BC8F5 100%);">
    <view class="safe-nav-header" style="padding-left:40rpx;padding-bottom:40rpx;flex-shrink:0;">
      <view class="safe-nav-bar" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32rpx;padding-left:0 !important;">
        <view class="back-btn" @click="$emit('close')"><text class="back-icon">‹</text></view>
        <text style="color:white;font-size:28rpx;font-weight:700;">本周食谱</text>
        <view style="width:64rpx;" />
      </view>
      <view style="display:flex;align-items:flex-end;gap:24rpx;">
        <view style="width:120rpx;height:120rpx;border-radius:36rpx;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <MpIcon name="utensils" :size="64" color="#FFFFFF" />
        </view>
        <view style="flex:1;padding-bottom:8rpx;">
          <text style="font-size:36rpx;font-weight:800;color:white;display:block;line-height:1.3;">{{ weekLabel }}</text>
          <text style="font-size:22rpx;color:rgba(255,255,255,0.85);display:block;margin-top:8rpx;">由机构发布，如有过敏原疑问请联系老师</text>
        </view>
      </view>
    </view>
    <view style="flex:1;background:white;border-radius:40rpx 40rpx 0 0;overflow:hidden;">
      <scroll-view scroll-y style="height:100%;">
        <view style="padding:32rpx 40rpx;">
          <view v-if="loading" style="padding:48rpx 0;text-align:center;">
            <text style="font-size:26rpx;color:#8D6E63;">加载中…</text>
          </view>

          <view v-else-if="!meals.length" style="padding:64rpx 24rpx;text-align:center;">
            <view style="display:flex;justify-content:center;margin-bottom:16rpx;">
              <MpIcon name="utensils" :size="56" color="#BDBDBD" />
            </view>
            <text style="font-size:28rpx;color:#2D1F18;font-weight:700;display:block;">本周食谱暂未发布</text>
            <text style="font-size:22rpx;color:#BDBDBD;display:block;margin-top:12rpx;">机构发布后可在此查看每日餐点安排</text>
          </view>

          <view v-else>
            <view v-for="m in meals" :key="m.meal_type" class="card" style="padding:24rpx;margin-bottom:20rpx;">
              <view style="display:flex;align-items:center;gap:16rpx;margin-bottom:16rpx;">
                <view style="width:72rpx;height:72rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center;background:#E3F2FD;flex-shrink:0;">
                  <MpIcon :name="m.icon" :size="36" color="#3B9EEB" />
                </view>
                <text style="font-size:28rpx;font-weight:800;color:#2D1F18;flex:1;">{{ m.label }}</text>
              </view>
              <view v-for="(dish, i) in m.dishLines" :key="i" style="display:flex;align-items:flex-start;gap:12rpx;margin-bottom:10rpx;">
                <text style="font-size:20rpx;color:#3B9EEB;margin-top:4rpx;">•</text>
                <text style="font-size:26rpx;color:#2D1F18;line-height:1.6;flex:1;">{{ dish }}</text>
              </view>
              <text v-if="!m.dishLines.length" style="font-size:24rpx;color:#BDBDBD;">未填写</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { fetchCurrentMenu } from '../../api/parent.js'
import MpIcon from '../MpIcon.vue'

defineEmits(['close'])

const MEAL_META = [
  { type: 'breakfast', label: '早餐', icon: 'sunrise' },
  { type: 'lunch', label: '午餐', icon: 'utensils' },
  { type: 'dinner', label: '晚餐', icon: 'moon' },
  { type: 'snack', label: '点心', icon: 'apple' },
]

const loading = ref(true)
const list = ref([])
const weekStart = ref('')

async function load() {
  loading.value = true
  try {
    const res = await fetchCurrentMenu()
    list.value = res?.list || []
    weekStart.value = res?.week_start || ''
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}
load()

const meals = computed(() => {
  const byType = {}
  for (const row of list.value) byType[row.meal_type] = row.dishes || ''
  return MEAL_META.map(m => ({
    ...m,
    dishLines: String(byType[m.type] || '')
      .split(/\r?\n|;/)
      .map(s => s.trim())
      .filter(Boolean),
  }))
})

const weekLabel = computed(() => {
  if (!weekStart.value) return '本周食谱'
  return `${weekStart.value.slice(5).replace('-', '月')}日起`
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
