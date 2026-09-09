<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;">
        <!-- Hero -->
        <view class="safe-nav-header" style="background:linear-gradient(150deg,#3B9EEB 0%,#64B5F6 100%);padding-left:40rpx;padding-bottom:40rpx;flex-shrink:0;">
          <view class="safe-nav-bar" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:40rpx;padding-left:0 !important;">
            <view style="width:64rpx;height:64rpx;border-radius:32rpx;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;" @click="closeProfile">
              <text style="font-size:40rpx;color:white;font-weight:700;line-height:1;">‹</text>
            </view>
            <text style="color:white;font-size:28rpx;font-weight:700;">我的</text>
            <view style="width:64rpx;" />
          </view>
          <view style="display:flex;align-items:center;gap:28rpx;">
            <view style="width:128rpx;height:128rpx;border-radius:40rpx;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:64rpx;flex-shrink:0;"><text>🧒</text></view>
            <view>
              <text style="font-size:40rpx;font-weight:800;color:white;display:block;">{{ parentName }}</text>
              <text style="font-size:24rpx;color:rgba(255,255,255,0.8);display:block;margin-top:8rpx;">{{ parentPhoneMasked }} · {{ activeChild.tenant }}</text>
              <view style="display:flex;gap:12rpx;margin-top:16rpx;">
                <view class="pill" style="background:rgba(255,255,255,0.25);color:white;"><text style="font-size:20rpx;">{{ childOptions.length }}个宝贝</text></view>
              </view>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;background:#F0F7FF;">
          <view style="padding:24rpx 40rpx;">
            <view v-for="group in profileMenuGroups" :key="group.title" style="margin-bottom:24rpx;">
              <text style="font-size:22rpx;color:#8D6E63;font-weight:700;display:block;margin-bottom:12rpx;padding-left:8rpx;">{{ group.title }}</text>
              <view class="card" style="overflow:hidden;">
                <view v-for="(item, i) in group.items" :key="item.label"
                  style="display:flex;align-items:center;gap:20rpx;padding:24rpx;"
                  :style="{ borderBottom: i < group.items.length - 1 ? '1rpx solid #F5F0EC' : 'none' }"
                  @click="goProfilePage(item.page)">
                  <view style="width:72rpx;height:72rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center;font-size:32rpx;flex-shrink:0;" :style="{ backgroundColor: item.color + '18' }"><text>{{ item.icon }}</text></view>
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
import { clearSession } from '../../utils/auth.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const ctx = inject(PARENT_CTX_KEY)
const { parentName, parentPhoneMasked, activeChild, childOptions, closeProfile, goProfilePage, notifyPrefsOnLabel } = ctx

const profileMenuGroups = computed(() => [
  {
    title: '账户',
    items: [
      { icon: '👤', label: '个人资料', sub: `${parentName.value} · ${parentPhoneMasked.value}`, page: 'info', color: '#3B9EEB' },
      { icon: '🧒', label: '我的宝贝', sub: activeChild.value.name || '未绑定', page: 'child', color: '#AB47BC' },
      { icon: '💚', label: '健康档案', sub: '过敏与紧急联系', page: 'health', color: '#66BB6A' },
      { icon: '🚗', label: '接送人', sub: '授权接送人员', page: 'pickup', color: '#26A69A' },
      { icon: '📋', label: '请假申请', sub: '提交与查看审批进度', page: 'leave', color: '#7B1FA2' },
      { icon: '⭐', label: '服务评价', sub: '本月满意度打分', page: 'satisfaction', color: '#FF7043' },
    ],
  },
  {
    title: '偏好',
    items: [
      { icon: '🔔', label: '消息通知', sub: notifyPrefsOnLabel.value, page: 'notify', color: '#FF7043' },
      { icon: '🔒', label: '隐私与安全', sub: parentPhoneMasked.value || '绑定手机与隐私说明', page: 'privacy', color: '#66BB6A' },
    ],
  },
  {
    title: '支持',
    items: [
      { icon: '💬', label: '帮助与反馈', sub: '常见问题、意见反馈', page: 'help', color: '#FFA726' },
      { icon: 'ℹ️', label: '关于苗苗', sub: '版本 1.0.0', page: 'about', color: '#8D6E63' },
    ],
  },
])

function doLogout() {
  clearSession()
  closeProfile()
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
