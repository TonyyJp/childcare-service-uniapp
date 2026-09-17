<template>
  <view class="profile-hub">
        <!-- Hero -->
        <view class="safe-nav-header profile-hero-header">
          <view class="safe-nav-bar" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:40rpx;padding-left:0 !important;">
            <view style="width:64rpx;" />
            <text style="color:white;font-size:28rpx;font-weight:700;">我的</text>
            <view style="width:64rpx;" />
          </view>
          <view class="profile-hero" @click="goProfilePage('info')">
            <view class="profile-hero__avatar">
              <image v-if="parentAvatarUrl" :src="parentAvatarUrl" mode="aspectFill" style="width:128rpx;height:128rpx;" />
              <MpIcon v-else name="user" :size="64" color="#FFFFFF" />
            </view>
            <view class="profile-hero__meta">
              <text class="profile-hero__name">{{ parentName }}</text>
              <text class="profile-hero__sub">{{ parentPhoneMasked }} · {{ activeChild.tenant }}</text>
              <view class="pill" style="background:rgba(255,255,255,0.25);color:white;margin-top:16rpx;">
                <text style="font-size:20rpx;">{{ childOptions.length }}个宝贝</text>
              </view>
            </view>
            <text class="profile-hero__arrow">›</text>
          </view>
        </view>
        <scroll-view scroll-y class="profile-hub__scroll" :enable-flex="true">
          <view style="padding:24rpx 40rpx 48rpx;">
            <view v-for="group in profileMenuGroups" :key="group.title" style="margin-bottom:24rpx;">
              <text style="font-size:22rpx;color:#8D6E63;font-weight:700;display:block;margin-bottom:12rpx;padding-left:8rpx;">{{ group.title }}</text>
              <view class="card" style="overflow:hidden;">
                <view v-for="(item, i) in group.items" :key="item.label"
                  style="display:flex;align-items:center;gap:20rpx;padding:24rpx;"
                  :style="{ borderBottom: i < group.items.length - 1 ? '1rpx solid #F5F0EC' : 'none' }"
                  @click="goProfilePage(item.page)">
                  <view style="width:72rpx;height:72rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0;" :style="{ backgroundColor: item.color + '18' }">
                    <MpIcon :name="item.icon" :size="32" :color="item.color" />
                  </view>
                  <view style="flex:1;">
                    <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">{{ item.label }}</text>
                    <text style="font-size:22rpx;color:#8D6E63;">{{ item.sub }}</text>
                  </view>
                  <text style="font-size:28rpx;color:#BDBDBD;">›</text>
                </view>
              </view>
            </view>
            <view style="padding:32rpx;text-align:center;" @click="doLogout">
              <text style="font-size:26rpx;color:#E53935;font-weight:700;">退出登录</text>
            </view>
          </view>
        </scroll-view>
  </view>
</template>

<script setup>
import { computed, inject } from 'vue'
import { logout } from '../../api/mp.js'
import { PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'

const ctx = inject(PARENT_CTX_KEY)
const { parentName, parentPhoneMasked, parentAvatarUrl, activeChild, childOptions, goProfilePage, notifyPrefsOnLabel } = ctx

const profileMenuGroups = computed(() => [
  {
    title: '账户',
    items: [
      { icon: 'users', label: '我的宝贝', sub: activeChild.value.name || '未绑定', page: 'child', color: '#AB47BC' },
      { icon: 'message-circle', label: '站内消息', sub: '通知与提醒', page: 'messages', color: '#3B9EEB' },
      { icon: 'car', label: '接送人', sub: '授权接送人员', page: 'pickup', color: '#26A69A' },
      { icon: 'smile', label: '人脸授权', sub: '刷脸签到采集与撤回', page: 'face', color: '#5C6BC0' },
      { icon: 'file-text', label: '请假申请', sub: '提交与查看审批进度', page: 'leave', color: '#7B1FA2' },
      { icon: 'wallet', label: '课时余额', sub: '兴趣课剩余课时与流水', page: 'lesson-package', color: '#FF8A65' },
      { icon: 'calendar', label: '试课预约', sub: '申请进度与上课时间', page: 'trial', color: '#FF7043' },
      { icon: 'star', label: '服务评价', sub: '本月满意度打分', page: 'satisfaction', color: '#FF7043' },
    ],
  },
  {
    title: '偏好',
    items: [
      { icon: 'bell', label: '消息通知', sub: notifyPrefsOnLabel.value, page: 'notify', color: '#FF7043' },
      { icon: 'lock', label: '隐私与安全', sub: parentPhoneMasked.value || '绑定手机与隐私说明', page: 'privacy', color: '#66BB6A' },
    ],
  },
  {
    title: '支持',
    items: [
      { icon: 'circle-help', label: '帮助与反馈', sub: '常见问题、意见反馈', page: 'help', color: '#FFA726' },
      { icon: 'info', label: '关于智优', sub: '版本 1.0.0', page: 'about', color: '#8D6E63' },
    ],
  },
])

async function doLogout() {
  try {
    await logout()
  } catch {
    // token 已失效等情况：logout 内部 finally 仍会清本地会话，继续退出
  }
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';

.profile-hub {
  flex: 1;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #F0F7FF;
  overflow: hidden;
  box-sizing: border-box;
}

.profile-hub__scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  width: 100%;
}

.profile-hero-header {
  background: linear-gradient(150deg, #3B9EEB 0%, #64B5F6 100%);
  padding-left: 40rpx;
  padding-bottom: 40rpx;
  padding-right: 0 !important;
  flex-shrink: 0;
}

.profile-hero {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding-right: 88rpx;
  display: flex;
  align-items: center;
}

.profile-hero__avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  margin-right: 28rpx;
}

.profile-hero__meta {
  flex: 1;
  min-width: 0;
}

.profile-hero__name {
  font-size: 40rpx;
  font-weight: 800;
  color: white;
  display: block;
}

.profile-hero__sub {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-top: 8rpx;
}

.profile-hero__arrow {
  position: absolute;
  right: 32rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 72rpx;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
}
</style>
