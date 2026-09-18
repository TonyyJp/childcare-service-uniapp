<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <view style="display:flex;align-items:center;gap:20rpx;">
          <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
          <view>
            <text style="font-size:40rpx;font-weight:800;color:white;display:block;">近 7 日课消</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.85);">只读汇总 · 详情请用管理后台</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <LoadingSkeleton v-if="loading" variant="list" :count="3" padding="8rpx 0" />
        <view v-else-if="errorMsg" class="card" style="padding:32rpx;text-align:center;">
          <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;margin-bottom:12rpx;">暂时无法加载</text>
          <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:20rpx;">{{ errorMsg }}</text>
          <view style="display:inline-flex;padding:14rpx 28rpx;border-radius:16rpx;background:#AB47BC;" @click="loadSummary">
            <text style="color:white;font-size:26rpx;font-weight:700;">重试</text>
          </view>
        </view>
        <template v-else>
          <view style="display:flex;margin-bottom:24rpx;">
            <view class="card" style="flex:1;padding:24rpx;margin-right:16rpx;text-align:center;">
              <text style="font-size:22rpx;color:#8D6E63;display:block;">近7日消课</text>
              <text style="font-size:44rpx;font-weight:800;color:#AB47BC;display:block;">{{ totalConsume }}</text>
            </view>
            <view class="card" style="flex:1;padding:24rpx;text-align:center;">
              <text style="font-size:22rpx;color:#8D6E63;display:block;">余额预警</text>
              <text style="font-size:44rpx;font-weight:800;color:#FF7043;display:block;">{{ warnCount }}</text>
            </view>
          </view>
          <view v-if="!days.length" class="card" style="padding:32rpx;text-align:center;">
            <text style="font-size:26rpx;color:#8D6E63;">近 7 日暂无消课记录</text>
          </view>
          <view v-for="d in days" :key="d.date" class="card" style="padding:20rpx 24rpx;margin-bottom:12rpx;display:flex;align-items:center;">
            <view style="flex:1;">
              <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">{{ d.date }}</text>
              <text style="font-size:22rpx;color:#8D6E63;">{{ d.class_name || d.hint || '各课班合计' }}</text>
            </view>
            <text style="font-size:32rpx;font-weight:800;color:#AB47BC;">{{ d.count ?? d.consume_count ?? 0 }}</text>
          </view>
          <view class="card" style="padding:24rpx;margin-top:8rpx;">
            <text style="font-size:24rpx;color:#8D6E63;line-height:1.6;">完整课消报表、教师课耗与导出请在机构 Web 管理后台查看。</text>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { computed, ref, watch } from 'vue'
import { fetchLessonConsumeSummary } from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(['navigate'])

function navigate(tab) {
  emit('navigate', tab)
}

const loading = ref(false)
const errorMsg = ref('')
const days = ref([])
const summary = ref({})

const totalConsume = computed(() => {
  if (summary.value.total != null) return summary.value.total
  if (summary.value.consume_count != null) return summary.value.consume_count
  return days.value.reduce((s, d) => s + Number(d.count ?? d.consume_count ?? 0), 0)
})

const warnCount = computed(() => {
  if (summary.value.low_balance_count != null) return summary.value.low_balance_count
  return '—'
})

async function loadSummary() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchLessonConsumeSummary(7)
    summary.value = data || {}
    days.value = data?.list || data?.days || data?.items || []
  } catch (e) {
    days.value = []
    summary.value = {}
    errorMsg.value = e?.statusCode === 404
      ? '课消汇总接口尚未开通'
      : (e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.pageShowCount, () => { loadSummary() }, { immediate: true })
</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
