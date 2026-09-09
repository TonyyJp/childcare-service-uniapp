<template>
  <view class="tab-page">
    <view class="safe-nav-header" style="background:white;flex-shrink:0;border-bottom:1rpx solid #E3F2FD;padding-bottom:24rpx;">
      <view class="safe-nav-bar" style="display:flex;align-items:center;justify-content:space-between;">
        <text style="font-size:40rpx;font-weight:800;color:#2D1F18;">消息</text>
        <view style="padding:10rpx 24rpx;background:#E3F2FD;border-radius:16rpx;" @click="markAllRead">
          <text style="font-size:22rpx;font-weight:700;color:#3B9EEB;">全部已读</text>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;background:#F0F7FF;">
      <view style="padding:20rpx 40rpx;">
        <view v-if="messagesLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
        <view v-else-if="!messages.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无消息</text></view>
        <view v-for="msg in messages" :key="msg.id" class="card" style="margin-bottom:16rpx;overflow:hidden;" @click="markMessageRead(msg)">
          <view v-if="msg.urgent" style="height:5rpx;background:#E53935;" />
          <view style="padding:24rpx;display:flex;align-items:flex-start;gap:20rpx;">
            <view style="position:relative;flex-shrink:0;">
              <view style="width:88rpx;height:88rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;font-size:40rpx;" :style="{ backgroundColor: (msgTypeCfg[msg.type] || msgTypeCfg.system).bg }">
                <text>{{ (msgTypeCfg[msg.type] || msgTypeCfg.system).icon }}</text>
              </view>
              <view v-if="msg.unread" style="position:absolute;top:-6rpx;right:-6rpx;width:24rpx;height:24rpx;border-radius:12rpx;background:#E53935;" />
            </view>
            <view style="flex:1;min-width:0;">
              <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8rpx;">
                <view style="display:flex;align-items:center;gap:12rpx;">
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;">{{ msg.sender }}</text>
                  <view class="pill" :style="{ backgroundColor: (msgTypeCfg[msg.type] || msgTypeCfg.system).bg, color: (msgTypeCfg[msg.type] || msgTypeCfg.system).color }">
                    <text style="font-size:20rpx;">{{ (msgTypeCfg[msg.type] || msgTypeCfg.system).label }}</text>
                  </view>
                </view>
                <text style="font-size:20rpx;color:#BDBDBD;flex-shrink:0;">{{ msg.time }}</text>
              </view>
              <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;margin-bottom:6rpx;">{{ msg.title }}</text>
              <text style="font-size:22rpx;color:#8D6E63;line-height:1.6;">{{ msg.body }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchMessages, readMessages } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const unreadCount = ctx.unreadCount

const msgTypeCfg = {
  notice: { label: '通知', icon: '📢', color: '#1565C0', bg: '#E3F2FD' },
  homework: { label: '作业', icon: '📋', color: '#E65100', bg: '#FFF3E0' },
  daily: { label: '动态', icon: '📷', color: '#7B1FA2', bg: '#F3E5F5' },
  attendance: { label: '考勤', icon: '✅', color: '#00897B', bg: '#E0F2F1' },
  fee: { label: '费用', icon: '💰', color: '#EF6C00', bg: '#FFF3E0' },
  system: { label: '系统', icon: '🔔', color: '#2E7D32', bg: '#F1F8E9' },
  audit: { label: '审核', icon: '📝', color: '#5E35B1', bg: '#EDE7F6' },
  comment: { label: '点评', icon: '💬', color: '#1565C0', bg: '#E3F2FD' },
  todo: { label: '待办', icon: '📌', color: '#C62828', bg: '#FFEBEE' },
}
const messages = ref([])
const messagesLoading = ref(false)

function formatMsgTime(raw) {
  if (!raw) return ''
  const d = new Date(String(raw).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return String(raw).slice(0, 16)
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return `今天 ${hm}`
  const y = new Date(now); y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return `昨天 ${hm}`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function senderForType(type) {
  if (type === 'notice') return '机构通知'
  if (type === 'homework') return '作业提醒'
  if (type === 'daily') return '日常动态'
  if (type === 'attendance') return '考勤通知'
  if (type === 'system') return '系统通知'
  return '消息'
}

function syncUnread() {
  unreadCount.value = messages.value.filter(m => m.unread).length
}

async function loadMessages() {
  messagesLoading.value = true
  try {
    const data = await fetchMessages()
    messages.value = (data?.list || []).map(m => ({
      id: m.id,
      type: msgTypeCfg[m.type] ? m.type : 'system',
      sender: senderForType(m.type),
      title: m.title,
      body: m.content,
      time: formatMsgTime(m.created_at),
      unread: !m.read_at,
      urgent: m.type === 'notice' && /紧急|urgent/i.test(`${m.title}${m.content}`),
    }))
    syncUnread()
  } catch (e) {
    uni.showToast({ title: e.message || '消息加载失败', icon: 'none' })
  } finally {
    messagesLoading.value = false
  }
}

async function markMessageRead(msg) {
  if (!msg?.unread) return
  msg.unread = false
  syncUnread()
  try {
    await readMessages([msg.id])
  } catch {
    msg.unread = true
    syncUnread()
  }
}

async function markAllRead() {
  const ids = messages.value.filter(m => m.unread).map(m => m.id)
  if (!ids.length) return
  messages.value.forEach(m => { m.unread = false })
  syncUnread()
  try {
    await readMessages(ids)
  } catch (e) {
    uni.showToast({ title: e.message || '标记失败', icon: 'none' })
    await loadMessages()
  }
}

watch(() => props.active, (v) => { if (v) loadMessages() }, { immediate: true })

onShow(() => { if (props.active) loadMessages() })

defineExpose({ loadMessages })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
