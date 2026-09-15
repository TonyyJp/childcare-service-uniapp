<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">站内消息</text>
      <view class="subpage-nav__row">
        <view v-if="showBack" class="subpage-nav__back" @click="goProfilePage('main')">
          <text class="subpage-nav__back-icon">‹</text>
        </view>
        <view v-else class="subpage-nav__side" />
        <view class="subpage-nav__side" />
      </view>
    </view>
    <view class="subpage-body">
      <scroll-view scroll-y class="subpage-scroll">
        <view class="subpage-pad">
          <view v-if="messages.length" class="subpage-toolbar">
            <view class="subpage-toolbar__btn" @click="markAllRead">
              <text class="subpage-toolbar__btn-text">全部已读</text>
            </view>
          </view>

          <view v-if="messagesLoading" class="empty-block">
            <text class="empty-block__text">加载中…</text>
          </view>
          <view v-else-if="!messages.length" class="empty-block empty-block--card">
            <text class="empty-block__title">暂无消息</text>
            <text class="empty-block__hint">园所通知与提醒会出现在这里</text>
          </view>

          <view
            v-for="msg in messages"
            :key="msg.id"
            class="list-card msg-card"
            @click="markMessageRead(msg)"
          >
            <view v-if="msg.urgent" class="msg-card__urgent" />
            <view class="list-card__row" style="align-items:flex-start;">
              <view class="msg-card__icon-wrap">
                <view
                  class="msg-card__icon"
                  :style="{ backgroundColor: (msgTypeCfg[msg.type] || msgTypeCfg.system).bg }"
                >
                  <MpIcon
                    :name="(msgTypeCfg[msg.type] || msgTypeCfg.system).icon"
                    :size="40"
                    :color="(msgTypeCfg[msg.type] || msgTypeCfg.system).color"
                  />
                </view>
                <view v-if="msg.unread" class="msg-card__dot" />
              </view>
              <view class="list-card__body">
                <view class="msg-card__head">
                  <view class="msg-card__head-left">
                    <text class="msg-card__sender">{{ msg.sender }}</text>
                    <view
                      class="pill"
                      :style="{
                        backgroundColor: (msgTypeCfg[msg.type] || msgTypeCfg.system).bg,
                        color: (msgTypeCfg[msg.type] || msgTypeCfg.system).color,
                      }"
                    >
                      <text style="font-size:20rpx;">{{ (msgTypeCfg[msg.type] || msgTypeCfg.system).label }}</text>
                    </view>
                  </view>
                  <text class="msg-card__time">{{ msg.time }}</text>
                </view>
                <text class="list-card__title" style="margin-bottom:6rpx;">{{ msg.title }}</text>
                <text class="list-card__sub" style="line-height:1.6;">{{ msg.body }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchMessages, readMessages } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'

const props = defineProps({
  active: { type: Boolean, default: false },
  showBack: { type: Boolean, default: false },
})
const ctx = inject(PARENT_CTX_KEY)
const unreadCount = ctx.unreadCount
const refreshUnreadCount = ctx.refreshUnreadCount
const goProfilePage = ctx.goProfilePage

const msgTypeCfg = {
  notice: { label: '通知', icon: 'megaphone', color: '#1565C0', bg: '#E3F2FD' },
  homework: { label: '作业', icon: 'clipboard-list', color: '#E65100', bg: '#FFF3E0' },
  daily: { label: '动态', icon: 'camera', color: '#7B1FA2', bg: '#F3E5F5' },
  daily_comment: { label: '评论', icon: 'message-circle', color: '#8E24AA', bg: '#F3E5F5' },
  attendance: { label: '考勤', icon: 'circle-check', color: '#00897B', bg: '#E0F2F1' },
  fee: { label: '费用', icon: 'wallet', color: '#EF6C00', bg: '#FFF3E0' },
  system: { label: '系统', icon: 'bell', color: '#2E7D32', bg: '#F1F8E9' },
  audit: { label: '审核', icon: 'notebook-pen', color: '#5E35B1', bg: '#EDE7F6' },
  comment: { label: '点评', icon: 'message-circle', color: '#1565C0', bg: '#E3F2FD' },
  todo: { label: '待办', icon: 'pin', color: '#C62828', bg: '#FFEBEE' },
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
  if (type === 'daily_comment') return '动态评论'
  if (type === 'attendance') return '考勤通知'
  if (type === 'system') return '系统通知'
  return '消息'
}

function syncUnread() {
  unreadCount.value = messages.value.filter(m => m.unread).length
  refreshUnreadCount()
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
@import '../../styles/profile-subpage.scss';

.msg-card {
  position: relative;
  overflow: hidden;
  padding-top: 28rpx;
}

.msg-card__urgent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5rpx;
  background: #e53935;
}

.msg-card__icon-wrap {
  position: relative;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.msg-card__icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-card__dot {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  width: 24rpx;
  height: 24rpx;
  border-radius: 12rpx;
  background: #e53935;
}

.msg-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
  gap: 12rpx;
}

.msg-card__head-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
  flex: 1;
}

.msg-card__sender {
  font-size: 26rpx;
  font-weight: 700;
  color: #2d1f18;
}

.msg-card__time {
  font-size: 20rpx;
  color: #bdbdbd;
  flex-shrink: 0;
}
</style>
