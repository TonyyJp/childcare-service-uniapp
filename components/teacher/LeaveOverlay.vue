<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF9068 100%);">
      <view style="padding:0 40rpx 24rpx;">
        <view style="display:flex;align-items:center;gap:20rpx;margin-bottom:16rpx;">
          <view class="back-btn" @click="$emit('back')"><text class="back-icon">‹</text></view>
          <view style="flex:1;">
            <text style="font-size:40rpx;font-weight:800;color:white;display:block;">请假审批</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">所带班级家长申请</text>
          </view>
        </view>
        <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
          <view v-for="f in leaveFilters" :key="f.id" style="padding:12rpx 24rpx;border-radius:16rpx;"
            :style="{ backgroundColor: leaveFilter === f.id ? 'white' : 'rgba(255,255,255,0.2)', color: leaveFilter === f.id ? '#FF7043' : 'rgba(255,255,255,0.85)' }"
            @click="setLeaveFilter(f.id)">
            <text style="font-size:24rpx;font-weight:700;">{{ f.label }}</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <LoadingSkeleton v-if="leaveLoading" variant="list" :count="3" padding="8rpx 0" />
        <view v-else-if="!leaveList.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无请假记录</text></view>
        <view v-for="item in leaveList" :key="item.id" class="card" style="padding:24rpx;margin-bottom:20rpx;">
          <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12rpx;">
            <text style="font-size:30rpx;font-weight:800;color:#2D1F18;">{{ item.student?.name || '学员' }}</text>
            <view class="pill" :style="leaveStatusStyle(item.status)"><text style="font-size:20rpx;font-weight:700;">{{ leaveStatusLabel(item.status) }}</text></view>
          </view>
          <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:8rpx;">{{ item.start_date }} ~ {{ item.end_date }} · {{ leaveTypeLabel(item.leave_type) }}</text>
          <text style="font-size:26rpx;color:#2D1F18;line-height:1.6;display:block;">{{ item.reason }}</text>
          <text v-if="item.reject_reason" style="font-size:22rpx;color:#E53935;display:block;margin-top:8rpx;">驳回：{{ item.reject_reason }}</text>
          <view v-if="item.status === 'pending'" style="display:flex;gap:12rpx;margin-top:20rpx;">
            <view style="flex:1;padding:16rpx;border-radius:16rpx;background:#FFF3E0;text-align:center;" @click="rejectLeave(item)">
              <text style="font-size:26rpx;font-weight:700;color:#E65100;">驳回</text>
            </view>
            <view style="flex:1;padding:16rpx;border-radius:16rpx;background:linear-gradient(135deg,#FF7043,#FF8A65);text-align:center;" @click="approveLeave(item)">
              <text style="font-size:26rpx;font-weight:700;color:white;">通过</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="showLeaveReject" class="overlay" style="z-index:80;" @click="closeLeaveReject">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">驳回请假</text>
        <text style="font-size:26rpx;color:#8D6E63;display:block;margin-bottom:16rpx;">{{ leaveRejectTarget?.student?.name || '学员' }} · {{ leaveRejectTarget?.start_date }} ~ {{ leaveRejectTarget?.end_date }}</text>
        <textarea class="form-input" style="height:160rpx;margin-bottom:24rpx;" :value="leaveRejectReason" @input="e => leaveRejectReason = e.detail.value" placeholder="请填写驳回原因" />
        <view class="primary-btn" @click="confirmLeaveReject">
          <text style="color:white;font-size:30rpx;font-weight:800;">确认驳回</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, onMounted } from 'vue'
import { auditLeave, fetchLeaves } from '../../api/teacher.js'

defineEmits(['back'])

const leaveFilters = [
  { id: 'pending', label: '待审批' },
  { id: 'approved', label: '已通过' },
  { id: 'rejected', label: '已驳回' },
  { id: '', label: '全部' },
]
const leaveFilter = ref('pending')
const leaveLoading = ref(false)
const leaveBusy = ref(false)
const leaveList = ref([])
const showLeaveReject = ref(false)
const leaveRejectTarget = ref(null)
const leaveRejectReason = ref('')

function leaveStatusLabel(s) {
  return ({ pending: '待审批', approved: '已通过', rejected: '已驳回', cancelled: '已撤回' })[s] || s
}
function leaveStatusStyle(s) {
  const map = {
    pending: { backgroundColor: '#FFF9C4', color: '#F57F17' },
    approved: { backgroundColor: '#C8E6C9', color: '#2E7D32' },
    rejected: { backgroundColor: '#FFCDD2', color: '#C62828' },
    cancelled: { backgroundColor: '#EEEEEE', color: '#757575' },
  }
  return map[s] || map.cancelled
}
function leaveTypeLabel(t) {
  return ({ personal: '事假', sick: '病假', other: '其他' })[t] || t || '请假'
}

async function loadTeacherLeaves() {
  leaveLoading.value = true
  try {
    const data = await fetchLeaves(leaveFilter.value || undefined)
    leaveList.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '请假列表加载失败', icon: 'none' })
  } finally {
    leaveLoading.value = false
  }
}

function setLeaveFilter(id) {
  leaveFilter.value = id
  loadTeacherLeaves()
}

async function approveLeave(item) {
  if (leaveBusy.value) return
  leaveBusy.value = true
  try {
    await auditLeave(item.id, 'approve')
    uni.showToast({ title: '已通过', icon: 'success' })
    await loadTeacherLeaves()
  } catch (e) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    leaveBusy.value = false
  }
}

function rejectLeave(item) {
  if (leaveBusy.value) return
  leaveRejectTarget.value = item
  leaveRejectReason.value = ''
  showLeaveReject.value = true
}

function closeLeaveReject() {
  showLeaveReject.value = false
  leaveRejectTarget.value = null
  leaveRejectReason.value = ''
}

async function confirmLeaveReject() {
  if (leaveBusy.value || !leaveRejectTarget.value) return
  const reason = leaveRejectReason.value.trim()
  if (!reason) {
    uni.showToast({ title: '请填写原因', icon: 'none' })
    return
  }
  leaveBusy.value = true
  try {
    await auditLeave(leaveRejectTarget.value.id, 'reject', reason)
    uni.showToast({ title: '已驳回', icon: 'success' })
    closeLeaveReject()
    await loadTeacherLeaves()
  } catch (e) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    leaveBusy.value = false
  }
}

onMounted(loadTeacherLeaves)
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
