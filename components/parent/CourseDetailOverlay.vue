<template>
  <view v-if="course" class="overlay-page" :style="{ background: `linear-gradient(135deg, ${course.color} 0%, ${course.color}BB 100%)` }">
    <view class="safe-nav-header" style="padding-left:40rpx;padding-bottom:40rpx;flex-shrink:0;">
      <view class="safe-nav-bar" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32rpx;padding-left:0 !important;">
        <view class="back-btn" @click="$emit('close')"><text class="back-icon">‹</text></view>
        <text style="color:white;font-size:28rpx;font-weight:700;">课程详情</text>
        <view style="width:64rpx;" />
      </view>
      <view style="display:flex;align-items:flex-end;gap:24rpx;">
        <view style="width:120rpx;height:120rpx;border-radius:36rpx;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;font-size:64rpx;flex-shrink:0;"><text>{{ course.icon }}</text></view>
        <view style="flex:1;padding-bottom:8rpx;">
          <text style="font-size:36rpx;font-weight:800;color:white;display:block;line-height:1.3;">{{ course.title }}</text>
          <text style="font-size:22rpx;color:rgba(255,255,255,0.8);display:block;margin-top:8rpx;">{{ course.teacher }} · {{ course.age }}</text>
          <view style="display:flex;gap:12rpx;margin-top:16rpx;flex-wrap:wrap;">
            <view class="pill" style="background:rgba(255,255,255,0.28);color:white;"><text style="font-size:20rpx;">{{ course.tag }}</text></view>
            <view class="pill" style="background:rgba(255,255,255,0.2);color:white;"><text style="font-size:20rpx;">共{{ course.sessions }}节</text></view>
            <view class="pill" style="background:rgba(255,255,255,0.3);color:white;"><text style="font-size:20rpx;font-weight:800;">{{ course.price }}</text></view>
          </view>
        </view>
      </view>
    </view>
    <view style="flex:1;background:white;border-radius:40rpx 40rpx 0 0;overflow:hidden;">
      <scroll-view scroll-y style="height:100%;">
        <view style="padding:32rpx 40rpx;">
          <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;display:block;margin-bottom:24rpx;">{{ course.desc }}</text>
          <view v-for="h in course.highlights" :key="h" style="display:flex;align-items:flex-start;gap:16rpx;margin-bottom:16rpx;">
            <view style="width:40rpx;height:40rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:4rpx;" :style="{ backgroundColor: course.color }">
              <text style="color:white;font-size:18rpx;">✓</text>
            </view>
            <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;flex:1;">{{ h }}</text>
          </view>
          <view class="primary-btn" style="margin-top:32rpx;" :style="{ background: `linear-gradient(135deg, ${course.color} 0%, ${course.color}CC 100%)`, opacity: busy ? 0.6 : 1 }" @click="consult">
            <text style="color:white;font-size:30rpx;font-weight:800;">立即咨询报名</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { inject, ref } from 'vue'
import { createTicket } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ course: Object })
const emit = defineEmits(['close'])
const ctx = inject(PARENT_CTX_KEY)
const busy = ref(false)

async function consult() {
  const c = props.course
  if (!c || busy.value) return
  busy.value = true
  try {
    await createTicket({
      category: 'consult',
      title: `课程咨询：${c.title || '未命名课程'}`,
      content: `希望咨询报名「${c.title || ''}」（${c.teacher || '教师待定'} · ${c.age || ''} · ${c.price || ''}）。请机构老师回电联系。`,
      contact: ctx.parentPhone.value || undefined,
    })
    emit('close')
    uni.showToast({ title: '已提交咨询', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
