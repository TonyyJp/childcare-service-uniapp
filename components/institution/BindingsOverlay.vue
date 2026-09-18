<template>
      <view class="overlay-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view style="padding:0 40rpx 24rpx;">
            <view style="display:flex;align-items:center;margin-bottom:16rpx;">
              <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
              <view style="flex:1;margin-left:20rpx;">
                <text style="font-size:40rpx;font-weight:800;color:white;display:block;">绑定审核</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">待审 {{ bindingPendingCount }} 条</text>
              </view>
            </view>
            <view style="display:flex;">
              <view v-for="f in bindingFilters" :key="f.value" class="pill" style="padding:12rpx 24rpx;margin-right:12rpx;"
                :style="{ backgroundColor: bindingFilter === f.value ? 'white' : 'rgba(255,255,255,0.2)', color: bindingFilter === f.value ? '#AB47BC' : 'white' }"
                @click="setBindingFilter(f.value)">
                <text style="font-size:22rpx;font-weight:700;">{{ f.label }}</text>
              </view>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <LoadingSkeleton v-if="bindingsLoading" variant="list" :count="3" padding="8rpx 0" />
            <view v-else-if="!bindings.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无记录</text></view>
            <view v-for="row in bindings" :key="row.id" class="card" style="padding:24rpx;margin-bottom:16rpx;">
              <view style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12rpx;">
                <view style="flex:1;min-width:0;">
                  <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;">
                    {{ row.guardian?.name || row.guardian?.nickname || '家长' }}
                    <text style="font-size:22rpx;font-weight:500;color:#8D6E63;"> · {{ row.relation || '监护人' }}</text>
                  </text>
                  <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:6rpx;">{{ row.guardian?.phone || '手机未填' }}</text>
                </view>
                <view class="pill" :style="{ backgroundColor: bindingStatusMeta[row.status]?.bg || '#EEEEEE', color: bindingStatusMeta[row.status]?.fg || '#757575' }">
                  <text style="font-size:20rpx;font-weight:700;">{{ bindingStatusMeta[row.status]?.label || row.status }}</text>
                </view>
              </view>
              <view style="background:#FAF5FF;border-radius:16rpx;padding:16rpx 20rpx;margin-bottom:12rpx;">
                <text style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:6rpx;">申请孩子</text>
                <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">
                  {{ row.apply_snapshot?.name || row.student?.name || '—' }}
                  <text v-if="row.apply_snapshot?.school || row.student?.school" style="font-size:22rpx;font-weight:500;color:#8D6E63;">
                    · {{ row.apply_snapshot?.school || row.student?.school }} {{ row.apply_snapshot?.grade_level || row.student?.grade_level || '' }}
                  </text>
                </text>
                <text v-if="row.student" style="font-size:22rpx;color:#2E7D32;display:block;margin-top:8rpx;">已匹配：{{ row.student.name }}</text>
                <text v-else style="font-size:22rpx;color:#E53935;display:block;margin-top:8rpx;">未匹配在园学生</text>
              </view>
              <text style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:12rpx;">申请于 {{ row.applied_at || '—' }}</text>
              <text v-if="row.reject_reason" style="font-size:22rpx;color:#E53935;display:block;margin-bottom:12rpx;">驳回原因：{{ row.reject_reason }}</text>
              <view v-if="row.status === 'pending'" style="display:flex;">
                <view style="flex:1;padding:16rpx;border-radius:16rpx;background:#E8F5E9;text-align:center;margin-right:16rpx;" @click="approveBinding(row)">
                  <text style="font-size:26rpx;font-weight:700;color:#2E7D32;">通过</text>
                </view>
                <view style="flex:1;padding:16rpx;border-radius:16rpx;background:#FFEBEE;text-align:center;" @click="openRejectBinding(row)">
                  <text style="font-size:26rpx;font-weight:700;color:#E53935;">驳回</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <view v-if="showRejectSheet" class="overlay-mask" style="z-index:70;" @click="showRejectSheet = false">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">驳回申请</text>
            <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:16rpx;">
              {{ rejectTarget?.guardian?.name || rejectTarget?.guardian?.nickname || '家长' }}
              → {{ rejectTarget?.apply_snapshot?.name || rejectTarget?.student?.name || '孩子' }}
            </text>
            <textarea v-model="rejectReason" placeholder="请填写驳回原因（必填）" maxlength="255"
              style="width:100%;min-height:160rpx;padding:20rpx;border-radius:16rpx;background:#F5F0EC;font-size:26rpx;color:#2D1F18;box-sizing:border-box;" />
            <view style="margin-top:24rpx;padding:24rpx;border-radius:20rpx;background:linear-gradient(135deg,#E53935,#EF5350);text-align:center;" @click="confirmRejectBinding">
              <text style="color:white;font-size:30rpx;font-weight:800;">确认驳回</text>
            </view>
          </view>
        </view>
      </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, watch } from 'vue'
import { auditBinding, fetchBindings } from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}

watch(() => props.pageShowCount, () => { loadBindings() }, { immediate: true })

const bindingFilters = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'unbound', label: '已驳回' },
]
const bindingFilter = ref('pending')
const bindings = ref([])
const bindingsLoading = ref(false)
const bindingBusy = ref(false)
const bindingPendingCount = ref(0)
const bindingStatusMeta = {
  pending: { label: '待审核', bg: '#FFF9C4', fg: '#F57F17' },
  approved: { label: '已通过', bg: '#C8E6C9', fg: '#2E7D32' },
  unbound: { label: '已驳回', bg: '#EEEEEE', fg: '#757575' },
}
const showRejectSheet = ref(false)
const rejectTarget = ref(null)
const rejectReason = ref('')

function setBindingFilter(status) {
  bindingFilter.value = status
  loadBindings()
}

async function loadBindings() {
  bindingsLoading.value = true
  try {
    const data = await fetchBindings(bindingFilter.value)
    bindings.value = data?.list || []
    bindingPendingCount.value = data?.pending_count ?? 0
  } catch (e) {
    uni.showToast({ title: e.message || '绑定列表加载失败', icon: 'none' })
  } finally {
    bindingsLoading.value = false
  }
}

async function approveBinding(row) {
  if (!row?.id || bindingBusy.value) return
  bindingBusy.value = true
  try {
    await auditBinding(row.id, 'approve')
    uni.showToast({ title: '已通过', icon: 'success' })
    await loadBindings()
  } catch (e) {
    uni.showToast({ title: e.message || '审核失败', icon: 'none' })
  } finally {
    bindingBusy.value = false
  }
}

function openRejectBinding(row) {
  rejectTarget.value = row
  rejectReason.value = ''
  showRejectSheet.value = true
}

async function confirmRejectBinding() {
  const reason = (rejectReason.value || '').trim()
  if (!reason) {
    uni.showToast({ title: '请填写驳回原因', icon: 'none' })
    return
  }
  if (!rejectTarget.value?.id || bindingBusy.value) return
  bindingBusy.value = true
  try {
    await auditBinding(rejectTarget.value.id, 'reject', reason)
    showRejectSheet.value = false
    rejectTarget.value = null
    uni.showToast({ title: '已驳回', icon: 'success' })
    await loadBindings()
  } catch (e) {
    uni.showToast({ title: e.message || '审核失败', icon: 'none' })
  } finally {
    bindingBusy.value = false
  }
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
