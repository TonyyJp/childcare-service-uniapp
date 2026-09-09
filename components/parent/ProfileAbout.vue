<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;padding:0 40rpx;">
            <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;margin-right:20rpx;" @click="goProfilePage('main')">
              <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
            </view>
            <text style="font-size:32rpx;font-weight:800;color:#2D1F18;">关于苗苗</text>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:48rpx 40rpx;text-align:center;">
            <view style="width:140rpx;height:140rpx;border-radius:40rpx;background:linear-gradient(135deg,#3B9EEB,#64B5F6);margin:0 auto 24rpx;display:flex;align-items:center;justify-content:center;">
              <text style="font-size:64rpx;">🌱</text>
            </view>
            <text style="font-size:36rpx;font-weight:800;color:#2D1F18;display:block;">苗苗托育</text>
            <text style="font-size:24rpx;color:#8D6E63;display:block;margin-top:8rpx;">版本 1.0.0</text>
            <view class="card" style="padding:28rpx;margin-top:40rpx;text-align:left;">
              <text style="font-size:26rpx;color:#2D1F18;line-height:1.8;display:block;">面向托管机构、教师与家长的数智托育小程序，覆盖签到、作业、日常、成长档案与家园沟通。</text>
            </view>
            <text style="font-size:22rpx;color:#BDBDBD;display:block;margin-top:40rpx;">© 苗苗托育</text>
          </view>
        </scroll-view>
      </view>
</template>

<script setup>
import { inject } from 'vue'
import { PARENT_CTX_KEY } from './parentContext.js'
const { goProfilePage } = inject(PARENT_CTX_KEY)
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
