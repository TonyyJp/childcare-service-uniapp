<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#26C6DA 0%,#4DD0E1 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <view style="display:flex;align-items:center;">
          <view class="back-btn" style="margin-right:20rpx;" @click="$emit('back')"><text class="back-icon">‹</text></view>
          <view style="flex:1;min-width:0;">
            <text style="font-size:40rpx;font-weight:800;color:white;display:block;">园所通知</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.85);">全园与所带班级 · 只读</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="teacherNoticesLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
        <view v-else-if="!teacherNotices.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无通知</text></view>
        <view v-for="n in teacherNotices" :key="n.id" class="card" style="padding:24rpx;margin-bottom:16rpx;" @click="toggleTeacherNotice(n.id)">
          <view style="display:flex;align-items:flex-start;">
            <view style="width:72rpx;height:72rpx;border-radius:20rpx;margin-right:16rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0;" :style="{ backgroundColor: noticeTypeMeta(n.type).bg }">
              <text style="font-size:32rpx;">{{ noticeTypeMeta(n.type).icon }}</text>
            </view>
            <view style="flex:1;min-width:0;">
              <view style="display:flex;align-items:center;flex-wrap:wrap;margin-bottom:8rpx;">
                <text style="font-size:28rpx;font-weight:800;color:#2D1F18;margin-right:12rpx;">{{ n.title }}</text>
                <view class="pill" :style="{ backgroundColor: noticeTypeMeta(n.type).bg, color: noticeTypeMeta(n.type).color }">
                  <text style="font-size:20rpx;font-weight:700;">{{ noticeTypeMeta(n.type).label }}</text>
                </view>
              </view>
              <text style="font-size:22rpx;color:#8D6E63;display:block;">{{ n.target }} · {{ n.sent_at || '' }}</text>
              <text v-if="expandedNoticeId === n.id" style="font-size:26rpx;color:#2D1F18;line-height:1.6;display:block;margin-top:16rpx;">{{ n.body }}</text>
              <text v-else style="font-size:24rpx;color:#8D6E63;display:block;margin-top:12rpx;">{{ noticePreview(n.body) }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchNotices } from '../../api/teacher.js'

defineEmits(['back'])

const NOTICE_TYPE_META = {
  notice: { label: '通知', icon: '📢', color: '#1565C0', bg: '#E3F2FD' },
  activity: { label: '活动', icon: '🎉', color: '#C2185B', bg: '#FCE4EC' },
  urgent: { label: '紧急', icon: '⚠️', color: '#E65100', bg: '#FFE0B2' },
  holiday: { label: '放假', icon: '🏖️', color: '#2E7D32', bg: '#C8E6C9' },
}
const teacherNotices = ref([])
const teacherNoticesLoading = ref(false)
const expandedNoticeId = ref(null)

function noticeTypeMeta(type) {
  return NOTICE_TYPE_META[type] || NOTICE_TYPE_META.notice
}
function noticePreview(body) {
  const t = (body || '').replace(/\s+/g, ' ').trim()
  return t.length > 48 ? `${t.slice(0, 48)}…` : t
}
function toggleTeacherNotice(id) {
  expandedNoticeId.value = expandedNoticeId.value === id ? null : id
}

async function loadTeacherNotices() {
  teacherNoticesLoading.value = true
  try {
    const data = await fetchNotices()
    teacherNotices.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '通知加载失败', icon: 'none' })
  } finally {
    teacherNoticesLoading.value = false
  }
}

onMounted(loadTeacherNotices)
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
