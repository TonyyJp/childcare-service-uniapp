<template>
      <view class="overlay-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#3B9EEB 0%,#64B5F6 100%);">
          <view style="padding:0 40rpx 24rpx;">
            <view style="display:flex;align-items:center;">
              <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
              <view style="flex:1;margin-left:20rpx;">
                <text style="font-size:40rpx;font-weight:800;color:white;display:block;">作业批改</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.85);">待批 {{ orgHwPending }} 份</text>
              </view>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view v-if="orgHwLoading" style="padding:48rpx;text-align:center;"><text style="color:#8D6E63;">加载中…</text></view>
            <view v-else-if="!orgSubmissions.length" style="padding:48rpx;text-align:center;"><text style="color:#8D6E63;">暂无待批作业</text></view>
            <view v-for="s in orgSubmissions" :key="s.id" class="card" style="padding:24rpx;margin-bottom:16rpx;">
              <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;">{{ s.student?.name }} · {{ s.homework?.title }}</text>
              <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:6rpx;margin-bottom:16rpx;">{{ s.homework?.class_name }} · {{ s.submitted_at }}</text>
              <view style="display:flex;flex-wrap:wrap;">
                <view v-for="g in orgHwGrades" :key="g.value" style="padding:12rpx 20rpx;border-radius:16rpx;margin-right:12rpx;margin-bottom:8rpx;"
                  :style="{ backgroundColor: g.bg }" @click="reviewOrgSubmission(s, g.value)">
                  <text style="font-size:22rpx;font-weight:700;" :style="{ color: g.fg }">{{ g.label }}</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { fetchSubmissions, reviewSubmission } from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}

watch(() => props.pageShowCount, () => { loadOrgHomework() }, { immediate: true })

const orgSubmissions = ref([])
const orgHwLoading = ref(false)
const orgHwPending = ref(0)
const orgHwBusy = ref(false)
const orgHwGrades = [
  { value: 'excellent', label: '优', bg: '#C8E6C9', fg: '#2E7D32' },
  { value: 'good', label: '良', bg: '#BBDEFB', fg: '#1565C0' },
  { value: 'fair', label: '中', bg: '#FFE0B2', fg: '#E65100' },
  { value: 'weak', label: '待加强', bg: '#FFCDD2', fg: '#C62828' },
]

async function loadOrgHomework() {
  orgHwLoading.value = true
  try {
    const data = await fetchSubmissions('submitted')
    orgSubmissions.value = data?.list || []
    orgHwPending.value = data?.pending_count ?? orgSubmissions.value.length
  } catch (e) {
    uni.showToast({ title: e.message || '作业加载失败', icon: 'none' })
  } finally {
    orgHwLoading.value = false
  }
}

async function reviewOrgSubmission(row, grade) {
  if (!row?.id || orgHwBusy.value) return
  orgHwBusy.value = true
  try {
    await reviewSubmission(row.id, grade)
    uni.showToast({ title: '已批改', icon: 'success' })
    await loadOrgHomework()
  } catch (e) {
    uni.showToast({ title: e.message || '批改失败', icon: 'none' })
  } finally {
    orgHwBusy.value = false
  }
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
