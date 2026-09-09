<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;padding:0 40rpx;">
            <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;margin-right:20rpx;" @click="goProfilePage('main')">
              <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
            </view>
            <view style="flex:1;min-width:0;">
              <text style="font-size:32rpx;font-weight:800;color:#2D1F18;display:block;">服务评价</text>
              <text style="font-size:22rpx;color:#8D6E63;">{{ activeChild.name }} · {{ satisfactionPeriodLabel || '本月' }}</text>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view v-if="satisfactionLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
            <template v-else>
              <view v-if="satisfactionCurrent" class="card" style="padding:24rpx;margin-bottom:24rpx;">
                <text style="font-size:26rpx;font-weight:700;color:#2E7D32;display:block;">本月已评 · 综合 {{ satisfactionCurrent.score_overall }} 分</text>
                <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:8rpx;">可修改后重新提交，覆盖本月评价</text>
              </view>
              <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
                <view v-for="(d, di) in satisfactionDims" :key="d.key" :style="{ marginBottom: di < satisfactionDims.length - 1 ? '28rpx' : '0' }">
                  <view style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12rpx;">
                    <text style="font-size:28rpx;font-weight:700;color:#2D1F18;">{{ d.label }}</text>
                    <text style="font-size:22rpx;color:#FF7043;">{{ starLabel(satisfactionForm[d.key]) }}</text>
                  </view>
                  <view style="display:flex;">
                    <text v-for="n in 5" :key="d.key + '-' + n"
                      style="font-size:44rpx;margin-right:12rpx;"
                      :style="{ color: n <= satisfactionForm[d.key] ? '#FFB300' : '#E0E0E0' }"
                      @click="setSatisfactionScore(d.key, n)">★</text>
                  </view>
                </view>
              </view>
              <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">想说的话（可选）</text>
                <textarea class="form-input" style="height:140rpx;" :value="satisfactionForm.comment" @input="e => satisfactionForm.comment = e.detail.value" placeholder="哪些地方做得好，或希望改进的点…" maxlength="500" />
              </view>
              <view class="primary-btn" :style="{ opacity: satisfactionBusy ? 0.6 : 1 }" @click="saveSatisfaction">
                <text style="color:white;font-size:30rpx;font-weight:800;">{{ satisfactionCurrent ? '更新本月评价' : '提交本月评价' }}</text>
              </view>
              <view v-if="satisfactionHistory.length > 1" style="margin-top:32rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;padding-left:8rpx;">历史评价</text>
                <view v-for="h in satisfactionHistory" :key="h.id" class="card" style="padding:20rpx 24rpx;margin-bottom:12rpx;display:flex;justify-content:space-between;align-items:center;">
                  <text style="font-size:26rpx;color:#2D1F18;">{{ h.period_label }}</text>
                  <text style="font-size:26rpx;font-weight:800;color:#FF7043;">{{ h.score_overall }} 分</text>
                </view>
              </view>
            </template>
          </view>
        </scroll-view>
      </view>

</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchSatisfaction, submitSatisfaction } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const { activeChild, activeChildId, goProfilePage } = ctx

const satisfactionLoading = ref(false)
const satisfactionBusy = ref(false)
const satisfactionPeriodLabel = ref('')
const satisfactionCurrent = ref(null)
const satisfactionHistory = ref([])
const satisfactionDims = ref([
  { key: 'score_teaching', label: '教学辅导' },
  { key: 'score_meals', label: '餐食营养' },
  { key: 'score_service', label: '服务沟通' },
  { key: 'score_environment', label: '环境安全' },
])
const satisfactionForm = ref({
  score_teaching: 5, score_meals: 5, score_service: 5, score_environment: 5, comment: '',
})

function starLabel(n) {
  return ({ 1: '很差', 2: '一般', 3: '还行', 4: '满意', 5: '非常满意' })[n] || ''
}
function setSatisfactionScore(key, val) { satisfactionForm.value[key] = val }

async function loadSatisfaction() {
  if (!activeChildId.value) {
    satisfactionCurrent.value = null
    satisfactionHistory.value = []
    return
  }
  satisfactionLoading.value = true
  try {
    const data = await fetchSatisfaction(activeChildId.value)
    satisfactionPeriodLabel.value = data?.period_label || ''
    satisfactionCurrent.value = data?.current || null
    satisfactionHistory.value = data?.history || []
    if (data?.dimensions?.length) satisfactionDims.value = data.dimensions
    if (data?.current) {
      satisfactionForm.value = {
        score_teaching: data.current.score_teaching,
        score_meals: data.current.score_meals,
        score_service: data.current.score_service,
        score_environment: data.current.score_environment,
        comment: data.current.comment || '',
      }
    } else {
      satisfactionForm.value = {
        score_teaching: 5, score_meals: 5, score_service: 5, score_environment: 5, comment: '',
      }
    }
  } catch (e) {
    uni.showToast({ title: e.message || '评价加载失败', icon: 'none' })
  } finally {
    satisfactionLoading.value = false
  }
}

async function saveSatisfaction() {
  if (!activeChildId.value) { uni.showToast({ title: '请先选择宝贝', icon: 'none' }); return }
  if (satisfactionBusy.value) return
  satisfactionBusy.value = true
  try {
    await submitSatisfaction({
      student_id: activeChildId.value,
      score_teaching: satisfactionForm.value.score_teaching,
      score_meals: satisfactionForm.value.score_meals,
      score_service: satisfactionForm.value.score_service,
      score_environment: satisfactionForm.value.score_environment,
      comment: (satisfactionForm.value.comment || '').trim() || undefined,
    })
    uni.showToast({ title: '评价已提交', icon: 'success' })
    await loadSatisfaction()
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    satisfactionBusy.value = false
  }
}

watch(() => props.active, (v) => { if (v) loadSatisfaction() }, { immediate: true })
watch(activeChildId, () => { if (props.active) loadSatisfaction() })

onShow(() => { if (props.active) loadSatisfaction() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
