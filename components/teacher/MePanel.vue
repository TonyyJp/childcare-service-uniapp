<template>
  <view class="tab-page">
    <view class="gradient-header" style="background: linear-gradient(135deg, #ff7043 0%, #ff9068 100%);">
      <view class="safe-nav-bar" style="padding-bottom: 36rpx;">
        <view style="display: flex; align-items: center; gap: 20rpx;">
          <view class="avatar-btn"><text class="avatar-text">{{ avatar }}</text></view>
          <view style="flex: 1; min-width: 0;">
            <text style="font-size: 40rpx; font-weight: 800; color: white; display: block;">{{ name }}</text>
            <text style="font-size: 24rpx; color: rgba(255, 255, 255, 0.82);">{{ tenantName }}</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex: 1; height: 0;">
      <view style="padding: 24rpx 40rpx;">
        <view
          v-for="item in menus"
          :key="item.tab"
          class="card"
          style="padding: 28rpx 24rpx; margin-bottom: 16rpx; display: flex; align-items: center;"
          @click="$emit('navigate', { tab: item.tab })"
        >
          <text style="font-size: 36rpx; margin-right: 20rpx;">{{ item.icon }}</text>
          <text style="flex: 1; font-size: 28rpx; font-weight: 700; color: #2d1f18;">{{ item.label }}</text>
          <text style="font-size: 28rpx; color: #bdbdbd;">›</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchProfile } from '../../api/teacher.js'
import { ensureWechatRuntime, getMpDisplayName } from '../../utils/wechatRuntime.js'

defineEmits(['navigate'])

const name = ref('老师')
const tenantName = ref('')
const avatar = computed(() => (name.value || '师').slice(0, 1))

const menus = [
  { icon: '💬', label: '消息', tab: 'messages' },
  { icon: '📢', label: '通知', tab: 'notices' },
  { icon: '📋', label: '请假审批', tab: 'leave' },
  { icon: '🌱', label: '成长记录', tab: 'life' },
]

onMounted(async () => {
  try {
    const profile = await fetchProfile()
    name.value = profile?.name || '老师'
    await ensureWechatRuntime(false).catch(() => {})
    tenantName.value = profile?.tenant_name || getMpDisplayName()
  } catch (_) {
    /* ignore */
  }
})
</script>
