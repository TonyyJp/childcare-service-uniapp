<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">请假申请</text>
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
          <text class="subpage-hint">{{ activeChild.name || '请先绑定宝贝' }} · 提交与查看审批进度</text>

          <view v-if="!activeChildId" class="empty-block empty-block--card">
            <text class="empty-block__title">请先绑定宝贝</text>
            <text class="empty-block__hint">绑定后可为孩子提交请假</text>
          </view>
          <view v-else-if="parentLeaveLoading" class="empty-block">
            <text class="empty-block__text">加载中…</text>
          </view>
          <view v-else-if="!parentLeaves.length" class="empty-block empty-block--card">
            <text class="empty-block__title">暂无请假记录</text>
            <text class="empty-block__hint">点击下方发起请假申请</text>
          </view>

          <view v-for="item in parentLeaves" :key="item.id" class="list-card">
            <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12rpx;">
              <text class="list-card__title">{{ item.start_date }} ~ {{ item.end_date }}</text>
              <view class="pill" :style="parentLeaveStatusStyle(item.status)">
                <text style="font-size:20rpx;font-weight:700;">{{ parentLeaveStatusLabel(item.status) }}</text>
              </view>
            </view>
            <text class="list-card__sub" style="margin-bottom:8rpx;">{{ parentLeaveTypeLabel(item.leave_type) }} · 全天时段</text>
            <text style="font-size:26rpx;color:#1F2937;line-height:1.6;">{{ item.reason }}</text>
            <text v-if="item.reject_reason" style="font-size:22rpx;color:#E53935;display:block;margin-top:8rpx;">驳回：{{ item.reject_reason }}</text>
            <view
              v-if="item.status === 'pending'"
              class="list-card__action list-card__action--primary"
              style="margin:16rpx 0 0;text-align:center;display:block;"
              @click="doCancelLeave(item)"
            >
              <text class="list-card__action-text" style="color:#E65100;">撤回申请</text>
            </view>
          </view>

          <view v-if="activeChildId" class="add-dashed" @click="openLeaveCompose">
            <text class="add-dashed__text">+ 申请请假</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="showLeaveCompose" class="overlay" style="z-index:80;" @click="showLeaveCompose = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">提交请假</text>
        <view class="form-section">
          <view class="form-field">
            <text class="form-label">类型</text>
            <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
              <view
                v-for="t in leaveTypes"
                :key="t.id"
                class="pill"
                style="padding:12rpx 20rpx;"
                :style="{ backgroundColor: newLeave.type === t.id ? '#3B9EEB18' : '#F5F7FA', color: newLeave.type === t.id ? '#3B9EEB' : '#6B7280' }"
                @click="newLeave.type = t.id"
              >
                <text style="font-size:22rpx;">{{ t.label }}</text>
              </view>
            </view>
          </view>
          <view class="form-field">
            <text class="form-label">开始日期</text>
            <picker mode="date" :value="newLeave.start" @change="e => newLeave.start = e.detail.value">
              <view class="form-input">{{ newLeave.start || '选择日期' }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-label">结束日期</text>
            <picker mode="date" :value="newLeave.end" @change="e => newLeave.end = e.detail.value">
              <view class="form-input">{{ newLeave.end || '选择日期' }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-label">请假原因</text>
            <textarea class="form-input" style="height:140rpx;" :value="newLeave.reason" @input="e => newLeave.reason = e.detail.value" placeholder="请填写请假原因" />
          </view>
        </view>
        <view class="primary-btn" @click="submitLeave">
          <text style="color:white;font-size:30rpx;font-weight:800;">提交申请</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { cancelLeave, createLeave, fetchLeaves } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const { activeChild, activeChildId, goProfilePage } = ctx

const leaveTypes = [
  { id: 'sick', label: '病假' },
  { id: 'personal', label: '事假' },
  { id: 'other', label: '其他' },
]
const parentLeaves = ref([])
const parentLeaveLoading = ref(false)
const parentLeaveBusy = ref(false)
const showLeaveCompose = ref(false)
const newLeave = ref({ type: 'sick', start: '', end: '', reason: '' })

function parentLeaveStatusLabel(s) {
  return ({ pending: '待审批', approved: '已通过', rejected: '已驳回', cancelled: '已撤回' })[s] || s
}
function parentLeaveStatusStyle(s) {
  const map = {
    pending: { background: '#FFF3E0', color: '#E65100' },
    approved: { background: '#E8F5E9', color: '#2E7D32' },
    rejected: { background: '#FFEBEE', color: '#C62828' },
    cancelled: { background: '#F5F5F5', color: '#757575' },
  }
  return map[s] || map.cancelled
}
function parentLeaveTypeLabel(t) {
  return ({ sick: '病假', personal: '事假', other: '其他' })[t] || t || '请假'
}

async function loadParentLeaves() {
  if (!activeChildId.value) { parentLeaves.value = []; return }
  parentLeaveLoading.value = true
  try {
    const data = await fetchLeaves(activeChildId.value)
    parentLeaves.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '请假列表加载失败', icon: 'none' })
  } finally {
    parentLeaveLoading.value = false
  }
}

function openLeaveCompose() {
  if (!activeChildId.value) {
    uni.showToast({ title: '请先绑定宝贝', icon: 'none' })
    return
  }
  const today = new Date()
  const pad = n => String(n).padStart(2, '0')
  const d = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  newLeave.value = { type: 'sick', start: d, end: d, reason: '' }
  showLeaveCompose.value = true
}

async function submitLeave() {
  if (parentLeaveBusy.value || !activeChildId.value) return
  const { type, start, end, reason } = newLeave.value
  if (!start || !end) { uni.showToast({ title: '请选择日期', icon: 'none' }); return }
  if (!reason.trim()) { uni.showToast({ title: '请填写原因', icon: 'none' }); return }
  parentLeaveBusy.value = true
  try {
    await createLeave({
      student_id: activeChildId.value,
      start_date: start,
      end_date: end,
      reason: reason.trim(),
      leave_type: type,
      period_scope: 'all',
    })
    uni.showToast({ title: '已提交', icon: 'success' })
    showLeaveCompose.value = false
    await loadParentLeaves()
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    parentLeaveBusy.value = false
  }
}

async function doCancelLeave(item) {
  if (parentLeaveBusy.value) return
  uni.showModal({
    title: '撤回请假',
    content: '确定撤回该请假申请？',
    success: async (res) => {
      if (!res.confirm) return
      parentLeaveBusy.value = true
      try {
        await cancelLeave(item.id)
        uni.showToast({ title: '已撤回', icon: 'success' })
        await loadParentLeaves()
      } catch (e) {
        uni.showToast({ title: e.message || '撤回失败', icon: 'none' })
      } finally {
        parentLeaveBusy.value = false
      }
    },
  })
}

watch(() => props.active, (v) => { if (v) loadParentLeaves() }, { immediate: true })
watch(activeChildId, () => { if (props.active) loadParentLeaves() })

onShow(() => { if (props.active) loadParentLeaves() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
@import '../../styles/profile-subpage.scss';
</style>
