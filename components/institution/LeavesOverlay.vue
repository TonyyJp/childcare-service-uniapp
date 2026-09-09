<template>
      <view class="overlay-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view style="padding:0 40rpx 24rpx;">
            <view style="display:flex;align-items:center;margin-bottom:16rpx;">
              <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
              <view style="flex:1;margin-left:20rpx;">
                <text style="font-size:40rpx;font-weight:800;color:white;display:block;">请假审批</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">待审 {{ leavePendingCount }} 条</text>
              </view>
            </view>
            <view style="display:flex;">
              <view v-for="f in leaveFilters" :key="f.value" class="pill" style="padding:12rpx 24rpx;margin-right:12rpx;"
                :style="{ backgroundColor: leaveFilter === f.value ? 'white' : 'rgba(255,255,255,0.2)', color: leaveFilter === f.value ? '#AB47BC' : 'white' }"
                @click="setLeaveFilter(f.value)">
                <text style="font-size:22rpx;font-weight:700;">{{ f.label }}</text>
              </view>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view v-if="leavesLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
            <view v-else-if="!orgLeaves.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无记录</text></view>
            <view v-for="row in orgLeaves" :key="row.id" class="card" style="padding:24rpx;margin-bottom:16rpx;">
              <view style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12rpx;">
                <view style="flex:1;min-width:0;">
                  <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;">{{ row.student?.name || '学员' }}</text>
                  <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:6rpx;">{{ row.start_date }} ~ {{ row.end_date }} · {{ leaveTypeLabel(row.leave_type) }}</text>
                </view>
                <view class="pill" :style="{ backgroundColor: leaveStatusMeta[row.status]?.bg || '#EEEEEE', color: leaveStatusMeta[row.status]?.fg || '#757575' }">
                  <text style="font-size:20rpx;font-weight:700;">{{ leaveStatusMeta[row.status]?.label || row.status }}</text>
                </view>
              </view>
              <text style="font-size:24rpx;color:#2D1F18;display:block;margin-bottom:8rpx;">事由：{{ row.reason || '—' }}</text>
              <text style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:12rpx;">申请于 {{ row.applied_at || '—' }}</text>
              <text v-if="row.reject_reason" style="font-size:22rpx;color:#E53935;display:block;margin-bottom:12rpx;">驳回原因：{{ row.reject_reason }}</text>
              <view v-if="row.status === 'pending'" style="display:flex;">
                <view style="flex:1;padding:16rpx;border-radius:16rpx;background:#E8F5E9;text-align:center;margin-right:16rpx;" @click="approveLeave(row)">
                  <text style="font-size:26rpx;font-weight:700;color:#2E7D32;">通过</text>
                </view>
                <view style="flex:1;padding:16rpx;border-radius:16rpx;background:#FFEBEE;text-align:center;" @click="openRejectLeave(row)">
                  <text style="font-size:26rpx;font-weight:700;color:#E53935;">驳回</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <view v-if="showLeaveRejectSheet" class="overlay-mask" style="z-index:70;" @click="showLeaveRejectSheet = false">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">驳回请假</text>
            <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:16rpx;">
              {{ leaveRejectTarget?.student?.name || '学员' }} · {{ leaveRejectTarget?.start_date }} ~ {{ leaveRejectTarget?.end_date }}
            </text>
            <textarea v-model="leaveRejectReason" placeholder="请填写驳回原因（必填）" maxlength="255"
              style="width:100%;min-height:160rpx;padding:20rpx;border-radius:16rpx;background:#F5F0EC;font-size:26rpx;color:#2D1F18;box-sizing:border-box;" />
            <view style="margin-top:24rpx;padding:24rpx;border-radius:20rpx;background:linear-gradient(135deg,#E53935,#EF5350);text-align:center;" @click="confirmRejectLeave">
              <text style="color:white;font-size:30rpx;font-weight:800;">确认驳回</text>
            </view>
          </view>
        </view>
      </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { auditLeave, fetchLeaves } from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}

watch(() => props.pageShowCount, () => { loadOrgLeaves() }, { immediate: true })

const leaveFilters = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
]
const leaveFilter = ref('pending')
const orgLeaves = ref([])
const leavesLoading = ref(false)
const leaveBusy = ref(false)
const leavePendingCount = ref(0)
const leaveStatusMeta = {
  pending: { label: '待审核', bg: '#FFF9C4', fg: '#F57F17' },
  approved: { label: '已通过', bg: '#C8E6C9', fg: '#2E7D32' },
  rejected: { label: '已驳回', bg: '#EEEEEE', fg: '#757575' },
  cancelled: { label: '已撤回', bg: '#EEEEEE', fg: '#757575' },
}
const showLeaveRejectSheet = ref(false)
const leaveRejectTarget = ref(null)
const leaveRejectReason = ref('')

function leaveTypeLabel(t) {
  return ({ sick: '病假', personal: '事假', other: '其他' })[t] || t || '请假'
}

function setLeaveFilter(status) {
  leaveFilter.value = status
  loadOrgLeaves()
}

async function loadOrgLeaves() {
  leavesLoading.value = true
  try {
    const data = await fetchLeaves(leaveFilter.value)
    orgLeaves.value = data?.list || []
    leavePendingCount.value = data?.pending_count ?? 0
  } catch (e) {
    uni.showToast({ title: e.message || '请假列表加载失败', icon: 'none' })
  } finally {
    leavesLoading.value = false
  }
}

async function approveLeave(row) {
  if (!row?.id || leaveBusy.value) return
  leaveBusy.value = true
  try {
    await auditLeave(row.id, 'approve')
    uni.showToast({ title: '已通过', icon: 'success' })
    await loadOrgLeaves()
  } catch (e) {
    uni.showToast({ title: e.message || '审核失败', icon: 'none' })
  } finally {
    leaveBusy.value = false
  }
}

function openRejectLeave(row) {
  leaveRejectTarget.value = row
  leaveRejectReason.value = ''
  showLeaveRejectSheet.value = true
}

async function confirmRejectLeave() {
  const reason = (leaveRejectReason.value || '').trim()
  if (!reason) {
    uni.showToast({ title: '请填写驳回原因', icon: 'none' })
    return
  }
  if (!leaveRejectTarget.value?.id || leaveBusy.value) return
  leaveBusy.value = true
  try {
    await auditLeave(leaveRejectTarget.value.id, 'reject', reason)
    showLeaveRejectSheet.value = false
    leaveRejectTarget.value = null
    uni.showToast({ title: '已驳回', icon: 'success' })
    await loadOrgLeaves()
  } catch (e) {
    uni.showToast({ title: e.message || '审核失败', icon: 'none' })
  } finally {
    leaveBusy.value = false
  }
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
