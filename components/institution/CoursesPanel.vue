<template>
  <view class="tab-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
      <view style="padding:0 40rpx 0;">
        <view style="display:flex;align-items:flex-start;justify-content:space-between;">
          <view style="flex:1;min-width:0;">
            <text style="font-size:44rpx;font-weight:800;color:white;display:block;">机构课程</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.8);margin-bottom:16rpx;display:block;">查看 · 上下架（请在管理后台维护课程）</text>
          </view>
          <view style="display:flex;flex-shrink:0;margin-top:8rpx;">
            <view style="background:rgba(255,255,255,0.25);border-radius:20rpx;padding:14rpx 20rpx;" @click="navigate('enrollments')">
              <text style="color:white;font-size:24rpx;font-weight:700;">报名</text>
            </view>
          </view>
        </view>
        <view style="display:flex;gap:16rpx;margin-bottom:20rpx;">
          <view v-for="s in courseStats" :key="s.label" style="flex:1;background:rgba(255,255,255,0.2);border-radius:20rpx;padding:16rpx;text-align:center;">
            <text style="font-size:36rpx;font-weight:800;color:white;display:block;">{{ s.val }}</text>
            <text style="font-size:20rpx;color:rgba(255,255,255,0.75);display:block;">{{ s.label }}</text>
          </view>
        </view>
      </view>
      <view style="display:flex;padding:0 40rpx;border-top:1rpx solid rgba(255,255,255,0.2);">
        <view v-for="f in courseFilters" :key="f"
          style="padding:20rpx 32rpx 20rpx 0;font-size:26rpx;font-weight:700;"
          :style="{ color: courseFilter === f ? 'white' : 'rgba(255,255,255,0.5)', borderBottom: courseFilter === f ? '3rpx solid white' : '3rpx solid transparent' }"
          @click="courseFilter = f"><text>{{ f }}</text></view>
      </view>
    </view>

    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="courseLoading" style="padding:48rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#8D6E63;">加载中…</text>
        </view>
        <view v-else-if="!filteredCourses.length" style="padding:48rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#8D6E63;">暂无课程</text>
        </view>
        <view v-for="c in filteredCourses" :key="c.id" class="card" style="margin-bottom:24rpx;overflow:hidden;">
          <view style="height:140rpx;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(135deg,#AB47BC22 0%,#AB47BC10 100%);">
            <image v-if="c.coverUrl" :src="c.coverUrl" mode="aspectFill" style="width:100%;height:100%;" />
          </view>
          <view style="padding:24rpx;">
            <view style="margin-bottom:20rpx;">
              <view style="display:flex;align-items:center;gap:12rpx;flex-wrap:wrap;margin-bottom:8rpx;">
                <text style="font-size:28rpx;font-weight:800;color:#2D1F18;">{{ c.title }}</text>
                <view class="pill" :style="{ backgroundColor: courseStatusColor[c.status].bg, color: courseStatusColor[c.status].fg }">
                  <text style="font-size:20rpx;font-weight:700;">{{ courseStatusLabel[c.status] }}</text>
                </view>
              </view>
              <text style="font-size:22rpx;color:#8D6E63;">{{ c.teacher || '教师待定' }} · {{ c.age || '—' }} · {{ c.sessions }}节 · ¥{{ c.price }}</text>
            </view>
            <view v-if="c.status !== 'draft'" style="margin-bottom:16rpx;">
              <view style="display:flex;justify-content:space-between;margin-bottom:8rpx;">
                <text style="font-size:22rpx;color:#8D6E63;">报名情况</text>
                <text style="font-size:22rpx;font-weight:700;color:#AB47BC;">{{ c.enrollCount }}/{{ c.maxEnroll }}人</text>
              </view>
              <view style="height:12rpx;border-radius:12rpx;background:#F5F0EC;overflow:hidden;">
                <view style="height:100%;border-radius:12rpx;background:#AB47BC;" :style="{ width: (c.maxEnroll ? (c.enrollCount/c.maxEnroll*100) : 0)+'%' }" />
              </view>
            </view>
            <view style="display:flex;gap:12rpx;">
              <view v-if="c.status === 'published'" style="flex:1;padding:16rpx;border-radius:16rpx;background:#FFF3E0;text-align:center;" @click="toggleCourseStatus(c.id, 'ended')">
                <text style="font-size:24rpx;font-weight:700;color:#E65100;">下架</text>
              </view>
              <view v-if="c.status === 'draft' || c.status === 'ended'" style="flex:1;padding:16rpx;border-radius:16rpx;text-align:center;background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);" @click="toggleCourseStatus(c.id, 'published')">
                <text style="font-size:24rpx;font-weight:700;color:white;">{{ c.status === 'draft' ? '上架' : '重新上架' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  fetchCourses,
  publishCourse,
  unpublishCourse,
} from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(['navigate'])

function navigate(tab) {
  emit('navigate', tab)
}

watch(() => props.pageShowCount, () => { loadCourses() }, { immediate: true })

const courseFilters = ['全部', '已上架', '草稿', '已下架']
const courseFilter = ref('全部')
const courseLoading = ref(false)
const courseBusy = ref(false)
const courseStatusLabel = { published: '已上架', draft: '草稿', ended: '已下架' }
const courseStatusColor = {
  published: { bg: '#C8E6C9', fg: '#2E7D32' },
  draft: { bg: '#FFF9C4', fg: '#F57F17' },
  ended: { bg: '#EEEEEE', fg: '#757575' },
}
const courses = ref([])
const filteredCourses = computed(() => {
  const map = { '全部': null, '已上架': 'published', '草稿': 'draft', '已下架': 'ended' }
  const s = map[courseFilter.value]
  return s ? courses.value.filter(c => c.status === s) : courses.value
})
const courseStats = computed(() => [
  { label: '在招课程', val: courses.value.filter(c => c.status === 'published').length + '门' },
  { label: '总报名', val: courses.value.filter(c => c.status === 'published').reduce((s, c) => s + (c.enrollCount || 0), 0) + '人' },
  { label: '草稿', val: courses.value.filter(c => c.status === 'draft').length + '门' },
])

async function loadCourses() {
  courseLoading.value = true
  try {
    const data = await fetchCourses()
    courses.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '课程加载失败', icon: 'none' })
  } finally {
    courseLoading.value = false
  }
}

async function toggleCourseStatus(id, status) {
  if (courseBusy.value) return
  courseBusy.value = true
  try {
    if (status === 'published') await publishCourse(id)
    else await unpublishCourse(id)
    await loadCourses()
    uni.showToast({ title: status === 'published' ? '已上架' : '已下架', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    courseBusy.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
