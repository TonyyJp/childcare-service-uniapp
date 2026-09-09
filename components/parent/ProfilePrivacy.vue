<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;padding:0 40rpx;">
            <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;margin-right:20rpx;" @click="goProfilePage('main')">
              <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
            </view>
            <text style="font-size:32rpx;font-weight:800;color:#2D1F18;">隐私与安全</text>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view class="card" style="overflow:hidden;margin-bottom:24rpx;">
              <view style="display:flex;justify-content:space-between;align-items:center;padding:24rpx;border-bottom:1rpx solid #F5F0EC;">
                <view>
                  <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">绑定手机</text>
                  <text style="font-size:22rpx;color:#8D6E63;">用于登录与接收重要通知</text>
                </view>
                <text style="font-size:26rpx;font-weight:700;color:#2D1F18;">{{ parentPhoneMasked || '未绑定' }}</text>
              </view>
              <view style="padding:24rpx;border-bottom:1rpx solid #F5F0EC;">
                <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">登录方式</text>
                <text style="font-size:22rpx;color:#8D6E63;">微信授权登录</text>
              </view>
              <view style="padding:24rpx;" @click="clearLocalCache">
                <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">清除本地缓存</text>
                <text style="font-size:22rpx;color:#8D6E63;">清除通知偏好等本机设置，不影响账号数据</text>
              </view>
            </view>
            <view class="card" style="padding:24rpx;">
              <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;margin-bottom:12rpx;">隐私说明</text>
              <text style="font-size:24rpx;color:#8D6E63;line-height:1.7;display:block;">我们仅收集为托育服务所必需的信息（孩子档案、考勤、作业与消息）。监护人绑定关系由机构审核。您可随时联系机构或平台申请更正、删除相关数据。</text>
            </view>
          </view>
        </scroll-view>
      </view>

</template>

<script setup>
import { inject } from 'vue'
import { PARENT_CTX_KEY } from './parentContext.js'
const ctx = inject(PARENT_CTX_KEY)
const { parentPhoneMasked, clearLocalCache, goProfilePage } = ctx
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
