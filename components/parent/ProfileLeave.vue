<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;justify-content:space-between;padding:0 40rpx;">
            <view style="display:flex;align-items:center;gap:20rpx;">
              <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;" @click="goProfilePage('main')">
                <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
              </view>
              <view>
                <text style="font-size:32rpx;font-weight:800;color:#2D1F18;display:block;">请假申请</text>
                <text style="font-size:22rpx;color:#8D6E63;">{{ activeChild.name }}</text>
              </view>
            </view>
            <view style="padding:12rpx 24rpx;border-radius:16rpx;background:#E3F2FD;" @click="openLeaveCompose">
              <text style="font-size:24rpx;font-weight:700;color:#3B9EEB;">+ 申请</text>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view v-if="parentLeaveLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
            <view v-else-if="!parentLeaves.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无请假记录</text></view>
            <view v-for="item in parentLeaves" :key="item.id" class="card" style="padding:24rpx;margin-bottom:16rpx;">
              <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12rpx;">
                <text style="font-size:26rpx;font-weight:700;color:#2D1F18;">{{ item.start_date }} ~ {{ item.end_date }}</text>
                <view class="pill" :style="parentLeaveStatusStyle(item.status)"><text style="font-size:20rpx;font-weight:700;">{{ parentLeaveStatusLabel(item.status) }}</text></view>
              </view>
              <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:8rpx;">{{ parentLeaveTypeLabel(item.leave_type) }} · 全天时段</text>
              <text style="font-size:26rpx;color:#2D1F18;line-height:1.6;">{{ item.reason }}</text>
              <text v-if="item.reject_reason" style="font-size:22rpx;color:#E53935;display:block;margin-top:8rpx;">驳回：{{ item.reject_reason }}</text>
              <view v-if="item.status === 'pending'" style="margin-top:16rpx;padding:14rpx;border-radius:16rpx;background:#FFF3E0;text-align:center;" @click="doCancelLeave(item)">
                <text style="font-size:24rpx;font-weight:700;color:#E65100;">撤回申请</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view v-if="showLeaveCompose" class="overlay" style="z-index:80;" @click="showLeaveCompose = false">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">提交请假</text>
            <view style="display:flex;flex-direction:column;gap:20rpx;">
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">类型</text>
                <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
                  <view v-for="t in leaveTypes" :key="t.id" class="pill" style="padding:12rpx 20rpx;"
                    :style="{ backgroundColor: newLeave.type === t.id ? '#3B9EEB18' : '#F5F0EC', color: newLeave.type === t.id ? '#3B9EEB' : '#8D6E63' }"
                    @click="newLeave.type = t.id">
                    <text style="font-size:22rpx;">{{ t.label }}</text>
                  </view>
                </view>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">开始日期</text>
                <picker mode="date" :value="newLeave.start" @change="e => newLeave.start = e.detail.value">
                  <view class="form-input">{{ newLeave.start || '选择日期' }}</view>
                </picker>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">结束日期</text>
                <picker mode="date" :value="newLeave.end" @change="e => newLeave.end = e.detail.value">
                  <view class="form-input">{{ newLeave.end || '选择日期' }}</view>
                </picker>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">请假原因</text>
                <textarea class="form-input" style="height:140rpx;" :value="newLeave.reason" @input="e => newLeave.reason = e.detail.value" placeholder="请填写请假原因" />
              </view>
              <view class="primary-btn" @click="submitLeave">
                <text style="color:white;font-size:30rpx;font-weight:800;">提交申请</text>
              </view>
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
</style>
