<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">关于智优</text>
      <view class="subpage-nav__row">
        <view class="subpage-nav__back" @click="goProfilePage('main')">
          <text class="subpage-nav__back-icon">‹</text>
        </view>
        <view class="subpage-nav__side" />
      </view>
    </view>
    <view class="subpage-body">
      <scroll-view scroll-y class="subpage-scroll">
        <view class="subpage-pad" style="text-align:center;padding-top:48rpx;">
          <view class="about-logo">
            <MpIcon name="sprout" :size="64" color="#FFFFFF" />
          </view>
          <text class="about-name">{{ brandName || '—' }}</text>
          <text class="about-ver">版本 1.0.0</text>
          <view class="list-card" style="margin-top:40rpx;text-align:left;">
            <text style="font-size:26rpx;color:#1F2937;line-height:1.8;display:block;">
              面向托管机构、教师与家长的数智托育小程序，覆盖签到、作业、日常、成长档案与家园沟通。
            </text>
          </view>
          <text v-if="brandName" class="about-copy">© {{ brandName }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { inject } from 'vue'
import { PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'
const { goProfilePage, brandName } = inject(PARENT_CTX_KEY)
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
@import '../../styles/profile-subpage.scss';

.about-logo {
  width: 140rpx;
  height: 140rpx;
  border-radius: 40rpx;
  background: linear-gradient(135deg, #3b9eeb, #64b5f6);
  margin: 0 auto 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.about-name {
  font-size: 36rpx;
  font-weight: 800;
  color: #1f2937;
  display: block;
}

.about-ver {
  font-size: 24rpx;
  color: #6b7280;
  display: block;
  margin-top: 8rpx;
}

.about-copy {
  font-size: 22rpx;
  color: #9ca3af;
  display: block;
  margin-top: 40rpx;
}
</style>
