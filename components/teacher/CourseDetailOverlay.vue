<template>
  <view class="overlay-page">
    <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #F0E6DC;flex-shrink:0;">
      <view class="safe-nav-bar" style="display:flex;align-items:center;padding-bottom:16rpx;">
        <view class="back-btn" style="background:#FFF8F5;margin-right:20rpx;" @click="$emit('back')">
          <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
        </view>
        <view style="flex:1;min-width:0;">
          <text style="font-size:36rpx;font-weight:800;color:#2D1F18;display:block;">课程详情</text>
          <text style="font-size:22rpx;color:#8D6E63;">{{ className }}</text>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
          <text style="font-size:26rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">课班名称</text>
          <text style="font-size:32rpx;font-weight:800;color:#2D1F18;display:block;">{{ className }}</text>
        </view>
        <view class="card" style="padding:24rpx;">
          <text style="font-size:26rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:16rpx;">课程大纲</text>
          <view v-if="outlines.length">
            <view v-for="(o, i) in outlines" :key="o.id || i" style="display:flex;gap:16rpx;margin-bottom:16rpx;">
              <view style="width:40rpx;height:40rpx;border-radius:50%;background:#FFF8F5;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <text style="font-size:22rpx;font-weight:700;color:#FF7043;">{{ i + 1 }}</text>
              </view>
              <text style="font-size:26rpx;color:#2D1F18;line-height:1.6;flex:1;">{{ o.content }}</text>
            </view>
          </view>
          <view v-else style="padding:40rpx 0;text-align:center;">
            <text style="font-size:26rpx;color:#8D6E63;">暂无课程大纲</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, inject } from 'vue'

defineEmits(['back'])

const courseDetail = inject('teacherCourseDetail', null)
const detail = computed(() => (courseDetail && courseDetail.value) || {})
/** 课班名（实际开班名称） */
const className = computed(() => detail.value.name || detail.value.class_name || '课班')
const outlines = computed(() => detail.value.outlines || [])
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
