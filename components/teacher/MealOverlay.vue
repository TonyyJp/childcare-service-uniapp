<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF9068 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <view style="display:flex;align-items:center;gap:20rpx;margin-bottom:12rpx;">
          <view class="back-btn" @click="$emit('back')"><text class="back-icon">‹</text></view>
          <view style="flex:1;">
            <text style="font-size:40rpx;font-weight:800;color:white;display:block;">营养餐管理</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">{{ mealClassName }} · 今日餐次拍照</text>
          </view>
        </view>
        <scroll-view v-if="classes.length > 1" scroll-x style="white-space:nowrap;margin-bottom:16rpx;">
          <view v-for="c in classes" :key="c.id" class="pill" style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
            :style="{ backgroundColor: mealClassId === c.id ? 'white' : 'rgba(255,255,255,0.2)', color: mealClassId === c.id ? '#FF7043' : 'white' }"
            @click="selectMealClass(c.id)"><text style="font-size:24rpx;font-weight:700;">{{ c.name }}</text></view>
        </scroll-view>
        <view style="display:flex;gap:12rpx;">
          <view v-for="m in mealTabs" :key="m.type" style="flex:1;background:rgba(255,255,255,0.2);border-radius:20rpx;padding:16rpx 8rpx;text-align:center;"
            :style="{ outline: selectedMealType === m.type ? '3rpx solid white' : 'none' }"
            @click="selectMealType(m.type)">
            <text style="font-size:32rpx;display:block;">{{ m.emoji }}</text>
            <text style="font-size:22rpx;color:white;font-weight:700;display:block;">{{ m.name }}</text>
            <view class="pill" style="background:rgba(255,255,255,0.3);color:white;margin-top:8rpx;" v-if="m.done"><text style="font-size:20rpx;">已上传</text></view>
            <view class="pill" style="background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.85);margin-top:8rpx;" v-else><text style="font-size:20rpx;">待拍照</text></view>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <LoadingSkeleton v-if="mealLoading" variant="list" :count="2" padding="8rpx 0" />
        <view v-else>
          <view class="card" style="padding:24rpx;margin-bottom:20rpx;">
            <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8rpx;">
              <text style="font-size:28rpx;font-weight:700;color:#2D1F18;">{{ selectedMealLabel }} · {{ mealDate }}</text>
              <view class="pill" :style="{ backgroundColor: isPublished ? '#C8E6C9' : '#FFF3E0', color: isPublished ? '#2E7D32' : '#E65100' }">
                <text style="font-size:20rpx;font-weight:700;">{{ isPublished ? '已发布' : '待发布' }}</text>
              </view>
            </view>
            <text style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:20rpx;">按班级上传餐食实拍，家长首页可见</text>
            <view v-if="mealPhotos.length" style="display:flex;flex-wrap:wrap;gap:12rpx;margin-bottom:20rpx;">
              <image v-for="(p, i) in mealPhotos" :key="i" :src="p" mode="aspectFill"
                style="width:200rpx;height:200rpx;border-radius:16rpx;background:#F5F0EC;"
                @click="previewMealPhotos(i)" />
            </view>
            <view v-else style="padding:40rpx 0;text-align:center;background:#F5F0EC;border-radius:16rpx;margin-bottom:20rpx;">
              <text style="font-size:26rpx;color:#8D6E63;">本餐次尚未上传照片</text>
            </view>
            <view class="primary-btn" style="background:#66BB6A;" :style="{ opacity: mealUploading ? 0.6 : 1 }" @click="uploadMealPhotos">
              <text style="color:white;font-size:30rpx;font-weight:800;">{{ mealUploading ? '上传中…' : (mealPhotos.length ? '+ 追加照片' : '拍照上传') }}</text>
            </view>
            <view style="margin-top:20rpx;">
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">文案（选填）</text>
              <textarea
                class="form-input"
                style="min-height:120rpx;width:100%;box-sizing:border-box;line-height:1.6;"
                :value="mealContent"
                maxlength="500"
                placeholder="补充今日餐食说明，发布后家长可见"
                @input="onMealContentInput"
              />
            </view>
            <view class="primary-btn" style="margin-top:20rpx;" :style="{ opacity: mealPublishing ? 0.6 : 1 }" @click="publishCurrentMeal">
              <text style="color:white;font-size:30rpx;font-weight:800;">{{ mealPublishing ? '发布中…' : '发布给家长' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, computed, inject, onMounted } from 'vue'
import { createMeal, fetchDashboard, fetchMeals, publishMeal } from '../../api/teacher.js'
import { mediaUrl } from '../../config.js'
import { uploadFile } from '../../utils/request.js'

defineEmits(['back'])

const MEAL_TYPE_META = [
  { type: 'breakfast', name: '早餐', emoji: '🌅' },
  { type: 'lunch', name: '午餐', emoji: '🍱' },
  { type: 'dinner', name: '晚餐', emoji: '🌙' },
  { type: 'snack', name: '加餐', emoji: '🍎' },
]
const checkinClassId = inject('teacherCheckinClassId', null)

const mealClassId = ref(null)
const selectedMealType = ref('lunch')
const mealLoading = ref(false)
const mealUploading = ref(false)
const mealPublishing = ref(false)
const mealContent = ref('')
const mealDate = ref('')
const mealRecords = ref([])
const classes = ref([])
const primaryClassName = ref('—')

const mealClassName = computed(() => classes.value.find(c => c.id === mealClassId.value)?.name || primaryClassName.value || '班级')
const selectedMealLabel = computed(() => MEAL_TYPE_META.find(m => m.type === selectedMealType.value)?.name || '餐次')
const mealTabs = computed(() => MEAL_TYPE_META.map(m => ({
  ...m,
  done: mealRecords.value.some(r => r.meal_type === m.type && (r.photos || []).length > 0)
})))
const mealPhotos = computed(() => {
  const row = mealRecords.value.find(r => r.meal_type === selectedMealType.value)
  return (row?.photos || []).map(mediaUrl).filter(Boolean)
})
const currentMeal = computed(() => mealRecords.value.find(r => r.meal_type === selectedMealType.value))
const isPublished = computed(() => currentMeal.value?.status === 'published')

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ensureMealClass() {
  if (mealClassId.value && classes.value.some(c => c.id === mealClassId.value)) return
  mealClassId.value =
    checkinClassId?.value ||
    classes.value.find(c => c.expected > 0)?.id ||
    classes.value[0]?.id ||
    null
}

function selectMealClass(id) {
  mealClassId.value = id
  loadMealsToday()
}

function selectMealType(type) {
  selectedMealType.value = type
  syncMealContent()
}

function syncMealContent() {
  const row = mealRecords.value.find(r => r.meal_type === selectedMealType.value)
  mealContent.value = row?.content || ''
}

function onMealContentInput(e) {
  mealContent.value = e.detail?.value ?? ''
}

async function loadClasses() {
  try {
    const dash = await fetchDashboard()
    classes.value = (dash?.classes || []).map(c => ({
      id: c.id,
      name: c.biz_type === 'care'
        ? `${c.name}·${c.attendance_type_name || '托管'}`
        : `${c.name}·兴趣`,
      expected: c.students_count || (c.periods || []).reduce((s, p) => s + (p.expected || 0), 0),
    }))
    primaryClassName.value = classes.value[0]?.name || '—'
  } catch (_) { /* ignore */ }
}

async function loadMealsToday() {
  ensureMealClass()
  if (!mealClassId.value) {
    mealRecords.value = []
    mealContent.value = ''
    return
  }
  mealLoading.value = true
  mealDate.value = todayStr()
  try {
    const data = await fetchMeals({ date: mealDate.value, classId: mealClassId.value })
    mealRecords.value = data?.list || []
    syncMealContent()
  } catch (e) {
    uni.showToast({ title: e.message || '餐食加载失败', icon: 'none' })
  } finally {
    mealLoading.value = false
  }
}

function previewMealPhotos(index) {
  uni.previewImage({ urls: mealPhotos.value, current: mealPhotos.value[index] })
}

function uploadMealPhotos() {
  if (mealUploading.value) return
  if (!mealClassId.value) {
    uni.showToast({ title: '请先选择班级', icon: 'none' })
    return
  }
  uni.chooseImage({
    count: 3,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const paths = res.tempFilePaths || []
      if (!paths.length) return
      mealUploading.value = true
      try {
        const ids = []
        for (const path of paths) {
          const uploaded = await uploadFile(path, 'meal')
          if (uploaded?.attachment_id) ids.push(uploaded.attachment_id)
        }
        if (!ids.length) throw new Error('上传失败')
        const payload = {
          class_id: mealClassId.value,
          meal_date: mealDate.value || todayStr(),
          meal_type: selectedMealType.value,
          attachment_ids: ids,
        }
        if (mealContent.value) payload.content = mealContent.value
        await createMeal(payload)
        uni.showToast({ title: '已上传', icon: 'success' })
        await loadMealsToday()
      } catch (e) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      } finally {
        mealUploading.value = false
      }
    }
  })
}

async function publishCurrentMeal() {
  if (mealPublishing.value) return
  const row = currentMeal.value
  if (!row) {
    uni.showToast({ title: '请先上传照片', icon: 'none' })
    return
  }
  mealPublishing.value = true
  try {
    await publishMeal(row.id, mealContent.value)
    uni.showToast({ title: '已发布', icon: 'success' })
    await loadMealsToday()
  } catch (e) {
    uni.showToast({ title: e.message || '发布失败', icon: 'none' })
  } finally {
    mealPublishing.value = false
  }
}

onMounted(async () => {
  await loadClasses()
  ensureMealClass()
  await loadMealsToday()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
