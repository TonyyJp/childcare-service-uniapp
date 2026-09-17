<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">服务评价</text>
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
          <text class="subpage-hint">{{ activeChild.name || '—' }} · {{ satisfactionPeriodLabel || '本月' }}</text>

          <LoadingSkeleton v-if="satisfactionLoading" variant="list" :count="2" padding="8rpx 0" />
          <template v-else>
            <view v-if="satisfactionCurrent" class="tip-card tip-card--ok">
              <text class="tip-card__text">本月已评 · 综合 {{ satisfactionCurrent.score_overall }} 分。可修改后重新提交，覆盖本月评价。</text>
            </view>

            <view class="list-card">
              <view
                v-for="(d, di) in satisfactionDims"
                :key="d.key"
                :style="{ marginBottom: di < satisfactionDims.length - 1 ? '28rpx' : '0' }"
              >
                <view style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12rpx;">
                  <text style="font-size:28rpx;font-weight:700;color:#1F2937;">{{ d.label }}</text>
                  <text style="font-size:22rpx;" :style="{ color: satisfactionForm[d.key] ? '#3B9EEB' : '#9CA3AF' }">
                    {{ starLabel(satisfactionForm[d.key]) }}
                  </text>
                </view>
                <view style="display:flex;">
                  <text
                    v-for="n in 5"
                    :key="d.key + '-' + n"
                    style="font-size:44rpx;margin-right:12rpx;"
                    :style="{ color: n <= satisfactionForm[d.key] ? '#FFB300' : '#E0E0E0' }"
                    @click="setSatisfactionScore(d.key, n)"
                  >★</text>
                </view>
              </view>
            </view>

            <view class="list-card">
              <text class="form-label">想说的话（可选）</text>
              <textarea
                class="form-input"
                style="height:140rpx;"
                :value="satisfactionForm.comment"
                @input="e => satisfactionForm.comment = e.detail.value"
                placeholder="哪些地方做得好，或希望改进的点…"
                maxlength="500"
              />
            </view>

            <view class="primary-btn" :style="{ opacity: satisfactionBusy ? 0.6 : 1 }" @click="saveSatisfaction">
              <text style="color:white;font-size:30rpx;font-weight:800;">{{ satisfactionCurrent ? '更新本月评价' : '提交本月评价' }}</text>
            </view>

            <view v-if="satisfactionHistory.length > 1" style="margin-top:32rpx;">
              <text class="subpage-section-title">历史评价</text>
              <view
                v-for="h in satisfactionHistory"
                :key="h.id"
                class="list-card"
                style="padding:20rpx 24rpx;display:flex;justify-content:space-between;align-items:center;"
              >
                <text style="font-size:26rpx;color:#1F2937;">{{ h.period_label }}</text>
                <text style="font-size:26rpx;font-weight:800;color:#3B9EEB;">{{ h.score_overall }} 分</text>
              </view>
            </view>
          </template>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
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
const emptyScores = () => ({
  score_teaching: 0,
  score_meals: 0,
  score_service: 0,
  score_environment: 0,
  comment: '',
})
const satisfactionForm = ref(emptyScores())

function starLabel(n) {
  return ({ 1: '很差', 2: '一般', 3: '还行', 4: '满意', 5: '非常满意' })[n] || '请评分'
}
function setSatisfactionScore(key, val) { satisfactionForm.value[key] = val }

async function loadSatisfaction() {
  if (!activeChildId.value) {
    satisfactionCurrent.value = null
    satisfactionHistory.value = []
    satisfactionForm.value = emptyScores()
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
      satisfactionForm.value = emptyScores()
    }
  } catch (e) {
    uni.showToast({ title: e.message || '评价加载失败', icon: 'none' })
  } finally {
    satisfactionLoading.value = false
  }
}

async function saveSatisfaction() {
  if (!activeChildId.value) { uni.showToast({ title: '请先选择宝贝', icon: 'none' }); return }
  const scores = satisfactionDims.value.map(d => satisfactionForm.value[d.key])
  if (scores.some(s => !s || s < 1 || s > 5)) {
    uni.showToast({ title: '请先为各项打分', icon: 'none' })
    return
  }
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
@import '../../styles/profile-subpage.scss';
</style>
