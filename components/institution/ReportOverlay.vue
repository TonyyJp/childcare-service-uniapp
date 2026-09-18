<template>
      <view class="overlay-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view style="padding:0 40rpx 32rpx;">
            <view style="display:flex;align-items:center;gap:20rpx;margin-bottom:12rpx;">
              <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
              <view>
                <text style="font-size:40rpx;font-weight:800;color:white;display:block;">数据报表</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">{{ reportSubtitle }}</text>
              </view>
            </view>
            <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
              <view v-for="p in periods" :key="p.id"
                style="padding:12rpx 28rpx;border-radius:16rpx;font-size:24rpx;font-weight:700;"
                :style="{ backgroundColor: period === p.id ? 'white' : 'rgba(255,255,255,0.2)', color: period === p.id ? '#AB47BC' : 'rgba(255,255,255,0.75)' }"
                @click="switchReportPeriod(p.id)"><text>{{ p.label }}</text></view>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <LoadingSkeleton v-if="reportLoading" variant="list" :count="3" padding="8rpx 0" />
            <template v-else>
            <view style="display:flex;flex-wrap:wrap;margin-bottom:24rpx;">
              <view v-for="(k, idx) in reportKpis" :key="k.key || k.label" class="card" style="width:48%;box-sizing:border-box;padding:24rpx;margin-bottom:16rpx;"
                :style="{ marginRight: idx % 2 === 0 ? '4%' : '0' }">
                <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:8rpx;">{{ k.label }}</text>
                <text style="font-size:48rpx;font-weight:800;display:block;" :style="{ color: k.color }">{{ k.val }}</text>
                <text style="font-size:20rpx;color:#8D6E63;">{{ k.trend }}</text>
              </view>
            </view>
            <view v-if="satisfaction && satisfaction.length" class="card" style="padding:24rpx;margin-bottom:24rpx;">
              <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">⭐ 家长满意度</text>
              <view v-for="s in satisfaction" :key="s.label" style="margin-bottom:16rpx;">
                <view style="display:flex;justify-content:space-between;margin-bottom:8rpx;">
                  <text style="font-size:24rpx;color:#2D1F18;">{{ s.label }}</text>
                  <text style="font-size:24rpx;font-weight:700;color:#AB47BC;">{{ s.val }}%</text>
                </view>
                <view style="height:12rpx;border-radius:12rpx;background:#F5F0EC;overflow:hidden;">
                  <view style="height:100%;border-radius:12rpx;background:linear-gradient(90deg,#AB47BC,#CE93D8);" :style="{ width: s.val+'%' }" />
                </view>
              </view>
            </view>
            <view v-else class="card" style="padding:24rpx;margin-bottom:24rpx;">
              <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:8rpx;">⭐ 家长满意度</text>
              <text style="font-size:24rpx;color:#8D6E63;">暂无评价数据，后续接入家长评分后展示</text>
            </view>
            <view class="card" style="padding:24rpx;">
              <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">💰 收费情况</text>
              <view v-if="!financeItems.length" style="padding:16rpx 0;"><text style="font-size:24rpx;color:#8D6E63;">本周期暂无账单</text></view>
              <view v-for="f in financeItems" :key="f.label" style="display:flex;justify-content:space-between;padding:16rpx 0;border-bottom:1rpx solid #F5F0EC;">
                <text style="font-size:26rpx;color:#2D1F18;">{{ f.label }}</text>
                <text style="font-size:26rpx;font-weight:700;" :style="{ color: f.color }">{{ f.val }}</text>
              </view>
            </view>
            </template>
          </view>
        </scroll-view>
      </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, computed, watch } from 'vue'
import { fetchReports } from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}

watch(() => props.pageShowCount, () => { loadReports() }, { immediate: true })

const periods = [
  { id: 'month', label: '本月' },
  { id: 'half', label: '本半年' },
  { id: 'year', label: '本年' },
]
const period = ref('month')
const reportLoading = ref(false)
const reportLabel = ref('')
const reportTenantName = ref('')
const reportSubtitle = computed(() => {
  const left = reportLabel.value || '运营数据'
  const right = reportTenantName.value || ''
  return right ? `${left} · ${right}` : left
})
const reportKpis = ref([])
const satisfaction = ref(null)
const financeItems = ref([])

async function loadReports() {
  reportLoading.value = true
  try {
    const data = await fetchReports(period.value)
    reportLabel.value = data?.label || ''
    reportTenantName.value = data?.tenant_name || ''
    reportKpis.value = data?.kpis || []
    financeItems.value = data?.finance || []
    satisfaction.value = data?.satisfaction || null
  } catch (e) {
    uni.showToast({ title: e.message || '报表加载失败', icon: 'none' })
  } finally {
    reportLoading.value = false
  }
}

function switchReportPeriod(id) {
  if (period.value === id) return
  period.value = id
  loadReports()
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
