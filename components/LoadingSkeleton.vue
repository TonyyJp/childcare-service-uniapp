<template>
  <view class="sk" :style="{ padding: padding }">
    <!-- 列表：卡片（可选顶部封面 / 前置缩略图）+ 标题 + 两行正文 -->
    <template v-if="variant === 'list'">
      <view v-for="i in count" :key="i" class="sk-card" :style="cover ? 'padding:0;overflow:hidden;' : ''">
        <view v-if="cover" class="sk-cover sk-sh" />
        <view :style="cover ? 'padding:24rpx;' : ''">
          <view class="sk-flex">
            <view v-if="thumb" class="sk-thumb sk-sh" />
            <view class="sk-grow">
              <view class="sk-line sk-sh" style="width:52%;height:30rpx;" />
              <view class="sk-line sk-sh" style="width:88%;" />
              <view class="sk-line sk-sh" style="width:40%;" />
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 动态：头像 + 昵称/时间 + 正文 + 三图 -->
    <template v-else-if="variant === 'feed'">
      <view v-for="i in count" :key="i" class="sk-card">
        <view class="sk-flex" style="align-items:center;">
          <view class="sk-avatar sk-sh" />
          <view class="sk-grow">
            <view class="sk-line sk-sh" style="width:36%;height:28rpx;margin-bottom:10rpx;" />
            <view class="sk-line sk-sh" style="width:24%;height:20rpx;margin-bottom:0;" />
          </view>
        </view>
        <view class="sk-line sk-sh" style="width:96%;margin-top:20rpx;" />
        <view class="sk-line sk-sh" style="width:70%;" />
        <view class="sk-photos">
          <view class="sk-photo sk-sh" />
          <view class="sk-photo sk-sh" />
          <view class="sk-photo sk-sh" />
        </view>
      </view>
    </template>

    <!-- 课程表时间轴：时间列 + 圆点 + 卡片 -->
    <template v-else-if="variant === 'timeline'">
      <view v-for="i in count" :key="i" class="sk-tl">
        <view class="sk-tl-time">
          <view class="sk-line sk-sh" style="width:70rpx;height:26rpx;margin:0 0 8rpx auto;" />
          <view class="sk-line sk-sh" style="width:50rpx;height:18rpx;margin:0 0 0 auto;" />
        </view>
        <view class="sk-tl-rail">
          <view class="sk-dot sk-sh" />
          <view v-if="i < count" class="sk-tl-bar" />
        </view>
        <view class="sk-card sk-grow" style="margin-bottom:20rpx;">
          <view class="sk-line sk-sh" style="width:56%;height:28rpx;" />
          <view class="sk-line sk-sh" style="width:80%;" />
        </view>
      </view>
    </template>

    <!-- 相册网格 -->
    <template v-else-if="variant === 'grid'">
      <view class="sk-grid">
        <view v-for="i in count" :key="i" class="sk-grid-cell sk-sh" />
      </view>
    </template>
  </view>
</template>

<script setup>
defineProps({
  /** list | feed | timeline | grid */
  variant: { type: String, default: 'list' },
  /** 占位条目数量 */
  count: { type: Number, default: 3 },
  /** list 变体是否显示前置缩略图 */
  thumb: { type: Boolean, default: false },
  /** list 变体是否显示顶部封面块 */
  cover: { type: Boolean, default: false },
  /** 外层内边距 */
  padding: { type: String, default: '8rpx 0' },
})
</script>

<style scoped>
.sk {
  width: 100%;
  box-sizing: border-box;
}

/* 通用 shimmer：渐变随背景位移，微信小程序 WXSS 兼容 */
.sk-sh {
  background-color: #e9edf2;
  background-image: linear-gradient(90deg, #e9edf2 25%, #f3f5f8 37%, #e9edf2 63%);
  background-size: 400% 100%;
  animation: skShimmer 1.4s ease infinite;
}

@keyframes skShimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.sk-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(31, 41, 55, 0.06);
}

.sk-flex {
  display: flex;
  gap: 20rpx;
}

.sk-grow {
  flex: 1;
  min-width: 0;
}

.sk-line {
  height: 24rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.sk-line:last-child {
  margin-bottom: 0;
}

.sk-cover {
  width: 100%;
  height: 220rpx;
}

.sk-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.sk-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  flex-shrink: 0;
}

.sk-photos {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
}

.sk-photo {
  flex: 1;
  height: 180rpx;
  border-radius: 12rpx;
}

/* timeline */
.sk-tl {
  display: flex;
  gap: 16rpx;
}

.sk-tl-time {
  width: 92rpx;
  flex-shrink: 0;
  padding-top: 24rpx;
}

.sk-tl-rail {
  width: 24rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sk-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  margin-top: 28rpx;
}

.sk-tl-bar {
  flex: 1;
  width: 2rpx;
  background: #eef1f5;
  margin-top: 6rpx;
}

/* grid */
.sk-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.sk-grid-cell {
  width: calc((100% - 24rpx) / 3);
  height: 220rpx;
  border-radius: 16rpx;
}
</style>
