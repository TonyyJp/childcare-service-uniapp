<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;padding:0 40rpx;">
            <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;margin-right:20rpx;" @click="goProfilePage('main')">
              <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
            </view>
            <text style="font-size:32rpx;font-weight:800;color:#2D1F18;">消息通知</text>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view class="card" style="overflow:hidden;margin-bottom:24rpx;">
              <view v-for="(n, i) in notifyPrefs" :key="n.key" style="display:flex;align-items:center;padding:24rpx;"
                :style="{ borderBottom: i < notifyPrefs.length - 1 ? '1rpx solid #F5F0EC' : 'none' }">
                <view style="flex:1;min-width:0;margin-right:20rpx;">
                  <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">{{ n.label }}</text>
                  <text style="font-size:22rpx;color:#8D6E63;">{{ n.desc }}</text>
                </view>
                <view style="width:88rpx;height:48rpx;border-radius:24rpx;position:relative;flex-shrink:0;"
                  :style="{ backgroundColor: n.on ? '#3B9EEB' : '#E0E0E0' }"
                  @click="toggleNotifyPref(n.key)">
                  <view style="position:absolute;top:4rpx;width:40rpx;height:40rpx;border-radius:20rpx;background:white;box-shadow:0 2rpx 8rpx rgba(0,0,0,0.15);"
                    :style="{ left: n.on ? '44rpx' : '4rpx' }" />
                </view>
              </view>
            </view>
            <view class="card" style="padding:24rpx;">
              <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;margin-bottom:8rpx;">说明</text>
              <text style="font-size:24rpx;color:#8D6E63;line-height:1.7;display:block;">以下为本机偏好。站内消息始终可在「消息」页查看；开启偏好会上报订阅意向，微信模板推送待正式开通后生效。</text>
            </view>
          </view>
        </scroll-view>
      </view>

</template>

<script setup>
import { inject } from 'vue'
import { PARENT_CTX_KEY } from './parentContext.js'
const ctx = inject(PARENT_CTX_KEY)
const { notifyPrefs, toggleNotifyPref, goProfilePage } = ctx
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
