<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">隐私与安全</text>
      <view class="subpage-nav__row">
        <view class="subpage-nav__back" @click="goProfilePage('main')">
          <text class="subpage-nav__back-icon">‹</text>
        </view>
        <view class="subpage-nav__side" />
      </view>
    </view>
    <view class="subpage-body">
      <scroll-view scroll-y class="subpage-scroll">
        <view class="subpage-pad">
          <view class="list-card" style="padding:0;overflow:hidden;">
            <view class="pref-row" style="border-bottom:1rpx solid #E3F2FD;">
              <view class="pref-row__meta">
                <text class="list-card__title">绑定手机</text>
                <text class="list-card__sub">用于登录与接收重要通知</text>
              </view>
              <text style="font-size:26rpx;font-weight:700;color:#1F2937;flex-shrink:0;">{{ parentPhoneMasked || '未绑定' }}</text>
            </view>
            <view class="pref-row" style="border-bottom:1rpx solid #E3F2FD;">
              <view class="pref-row__meta">
                <text class="list-card__title">登录方式</text>
                <text class="list-card__sub">微信授权登录</text>
              </view>
            </view>
            <view class="pref-row" @click="clearLocalCache">
              <view class="pref-row__meta">
                <text class="list-card__title">清除本地缓存</text>
                <text class="list-card__sub">清除通知偏好等本机设置，不影响账号数据</text>
              </view>
            </view>
          </view>

          <view class="list-card">
            <text class="list-card__title" style="margin-bottom:12rpx;">隐私说明</text>
            <text class="list-card__sub" style="line-height:1.7;">
              我们仅收集为托育服务所必需的信息（孩子档案、考勤、作业与消息）。监护人绑定关系由机构审核。您可随时联系机构或平台申请更正、删除相关数据。
            </text>
          </view>
        </view>
      </scroll-view>
    </view>
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
@import '../../styles/profile-subpage.scss';

.pref-row {
  display: flex;
  align-items: center;
  padding: 28rpx;
}

.pref-row__meta {
  flex: 1;
  min-width: 0;
  margin-right: 20rpx;
}
</style>
