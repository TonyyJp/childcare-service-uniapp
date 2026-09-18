<template>
      <view class="overlay-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#66BB6A 0%,#A5D6A7 100%);">
          <view style="padding:0 40rpx 24rpx;">
            <view style="display:flex;align-items:center;margin-bottom:16rpx;">
              <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
              <view style="flex:1;margin-left:20rpx;">
                <text style="font-size:40rpx;font-weight:800;color:white;display:block;">营养餐</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.85);">今日代上传</text>
              </view>
            </view>
            <scroll-view scroll-x style="white-space:nowrap;">
              <view v-for="c in orgMealClasses" :key="c.id" class="pill" style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
                :style="{ backgroundColor: orgMealClassId === c.id ? 'white' : 'rgba(255,255,255,0.2)', color: orgMealClassId === c.id ? '#2E7D32' : 'white' }"
                @click="orgMealClassId = c.id; loadOrgMeals()">
                <text style="font-size:22rpx;font-weight:700;">{{ c.name }}</text>
              </view>
            </scroll-view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view style="display:flex;flex-wrap:wrap;margin-bottom:20rpx;">
              <view v-for="t in orgMealTypes" :key="t.type" class="pill" style="padding:12rpx 20rpx;margin-right:12rpx;margin-bottom:12rpx;"
                :style="{ backgroundColor: orgMealType === t.type ? '#C8E6C9' : '#F5F0EC', color: orgMealType === t.type ? '#2E7D32' : '#8D6E63' }"
                @click="orgMealType = t.type">
                <text style="font-size:22rpx;">{{ t.emoji }} {{ t.name }}</text>
              </view>
            </view>
            <view style="padding:24rpx;border-radius:20rpx;background:linear-gradient(135deg,#66BB6A,#A5D6A7);text-align:center;margin-bottom:24rpx;" @click="uploadOrgMeal">
              <text style="color:white;font-size:28rpx;font-weight:800;">{{ orgMealUploading ? '上传中…' : '拍照/选图上传' }}</text>
            </view>
            <LoadingSkeleton v-if="orgMealsLoading" variant="list" :count="2" padding="8rpx 0" />
            <view v-for="m in orgMeals" :key="m.id" class="card" style="padding:20rpx;margin-bottom:16rpx;">
              <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">{{ m.class_name }} · {{ mealTypeName(m.meal_type) }}</text>
              <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:6rpx;">{{ m.photos?.length || 0 }} 张 · {{ m.staff_name || '—' }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, watch } from 'vue'
import { createMeal, fetchMeals } from '../../api/institution.js'
import { uploadFile } from '../../utils/request.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}



const orgMealTypes = [
  { type: 'breakfast', name: '早餐', emoji: '🌅' },
  { type: 'lunch', name: '午餐', emoji: '🍱' },
  { type: 'dinner', name: '晚餐', emoji: '🌙' },
  { type: 'snack', name: '加餐', emoji: '🍎' },
]
const orgMealClasses = ref([])
const orgMealClassId = ref(null)
const orgMealType = ref('lunch')
const orgMeals = ref([])
const orgMealsLoading = ref(false)
const orgMealUploading = ref(false)

function mealTypeName(t) {
  return orgMealTypes.find(x => x.type === t)?.name || t
}

async function loadOrgMeals() {
  orgMealsLoading.value = true
  try {
    const data = await fetchMeals({ classId: orgMealClassId.value || undefined })
    orgMealClasses.value = data?.classes || []
    if (!orgMealClassId.value && orgMealClasses.value.length) {
      orgMealClassId.value = orgMealClasses.value[0].id
    }
    orgMeals.value = (data?.list || []).filter(m => !orgMealClassId.value || m.class_id === orgMealClassId.value)
  } catch (e) {
    uni.showToast({ title: e.message || '餐食加载失败', icon: 'none' })
  } finally {
    orgMealsLoading.value = false
  }
}

function uploadOrgMeal() {
  if (!orgMealClassId.value || orgMealUploading.value) return
  uni.chooseImage({
    count: 3,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const paths = res.tempFilePaths || []
      if (!paths.length) return
      orgMealUploading.value = true
      try {
        const ids = []
        for (const path of paths) {
          const uploaded = await uploadFile(path, 'meal')
          if (uploaded?.attachment_id) ids.push(uploaded.attachment_id)
        }
        if (!ids.length) throw new Error('上传失败')
        const d = new Date()
        const pad = n => String(n).padStart(2, '0')
        await createMeal({
          class_id: orgMealClassId.value,
          meal_date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
          meal_type: orgMealType.value,
          attachment_ids: ids,
        })
        uni.showToast({ title: '已上传', icon: 'success' })
        await loadOrgMeals()
      } catch (e) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      } finally {
        orgMealUploading.value = false
      }
    },
  })
}

watch(() => props.pageShowCount, () => { loadOrgMeals() }, { immediate: true })
</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
