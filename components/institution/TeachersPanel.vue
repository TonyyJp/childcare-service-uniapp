<template>
      <view class="tab-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view style="padding:0 40rpx 32rpx;">
            <text style="font-size:44rpx;font-weight:800;color:white;display:block;">师资管理</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">共 {{ teachers.length }} 名员工</text>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <LoadingSkeleton v-if="teachersLoading" variant="list" :count="4" thumb padding="8rpx 0" />
            <view v-else-if="!teachers.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无教师</text></view>
            <view v-for="t in teachers" :key="t.id || t.name" class="card" style="padding:24rpx;margin-bottom:20rpx;">
              <view style="display:flex;align-items:center;gap:20rpx;margin-bottom:16rpx;">
                <view style="width:96rpx;height:96rpx;border-radius:28rpx;display:flex;align-items:center;justify-content:center;font-size:40rpx;font-weight:700;flex-shrink:0;" :style="{ backgroundColor: t.color + '20', color: t.color }">
                  <text style="font-size:40rpx;font-weight:800;" :style="{ color: t.color }">{{ t.name[0] }}</text>
                </view>
                <view style="flex:1;">
                  <view style="display:flex;align-items:center;gap:12rpx;margin-bottom:8rpx;flex-wrap:wrap;">
                    <text style="font-size:30rpx;font-weight:800;color:#2D1F18;">{{ t.name }}</text>
                    <view class="pill" :style="{ backgroundColor: t.color + '18', color: t.color }"><text style="font-size:20rpx;">{{ t.role }}</text></view>
                  </view>
                  <text style="font-size:22rpx;color:#8D6E63;display:block;">{{ t.class }} · {{ t.cert }}</text>
                </view>
                <view class="pill" :style="{ backgroundColor: t.status === '在职' ? '#C8E6C9' : '#EEEEEE', color: t.status === '在职' ? '#2E7D32' : '#757575' }">
                  <text style="font-size:20rpx;font-weight:700;">{{ t.status }}</text>
                </view>
              </view>
              <view style="display:flex;gap:16rpx;">
                <view v-for="m in t.metrics" :key="m.label" style="flex:1;text-align:center;padding:16rpx;background:#FAF5FF;border-radius:16rpx;">
                  <text style="font-size:28rpx;font-weight:800;color:#AB47BC;display:block;">{{ m.val }}</text>
                  <text style="font-size:20rpx;color:#8D6E63;">{{ m.label }}</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, watch } from 'vue'
import { fetchStaffs } from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}

watch(() => props.pageShowCount, () => { loadTeachers() }, { immediate: true })

const teachers = ref([])
const teachersLoading = ref(false)

async function loadTeachers() {
  teachersLoading.value = true
  try {
    const data = await fetchStaffs()
    teachers.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '师资加载失败', icon: 'none' })
  } finally {
    teachersLoading.value = false
  }
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
