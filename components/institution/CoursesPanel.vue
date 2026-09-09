<template>
      <view class="tab-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view style="padding:0 40rpx 0;">
            <view style="display:flex;align-items:flex-start;justify-content:space-between;">
              <view style="flex:1;min-width:0;">
                <text style="font-size:44rpx;font-weight:800;color:white;display:block;">机构课程</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.8);margin-bottom:16rpx;display:block;">新建 · 编辑 · 上下架</text>
              </view>
              <view style="display:flex;flex-shrink:0;margin-top:8rpx;">
                <view style="background:rgba(255,255,255,0.25);border-radius:20rpx;padding:14rpx 20rpx;margin-right:12rpx;" @click="openNewCourse">
                  <text style="color:white;font-size:24rpx;font-weight:700;">+ 新建</text>
                </view>
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
              <view style="height:140rpx;display:flex;align-items:center;justify-content:center;overflow:hidden;" :style="{ background: 'linear-gradient(135deg,' + c.color + '22 0%,' + c.color + '10 100%)' }">
                <image v-if="c.coverPath" :src="courseMediaUrl(c.coverPath)" mode="aspectFill" style="width:100%;height:100%;" />
                <text v-else style="font-size:80rpx;">{{ c.coverImage }}</text>
              </view>
              <view style="padding:24rpx;">
                <view style="display:flex;align-items:flex-start;gap:16rpx;margin-bottom:20rpx;">
                  <view style="flex:1;">
                    <view style="display:flex;align-items:center;gap:12rpx;flex-wrap:wrap;margin-bottom:8rpx;">
                      <text style="font-size:28rpx;font-weight:800;color:#2D1F18;">{{ c.title }}</text>
                      <view class="pill" :style="{ backgroundColor: courseStatusColor[c.status].bg, color: courseStatusColor[c.status].fg }">
                        <text style="font-size:20rpx;font-weight:700;">{{ courseStatusLabel[c.status] }}</text>
                      </view>
                    </view>
                    <text style="font-size:22rpx;color:#8D6E63;">{{ c.teacher }} · {{ c.age }} · {{ c.sessions }}节 · ¥{{ c.price }}</text>
                  </view>
                  <view style="background:#F5F0EC;width:64rpx;height:64rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center;" @click="editingCourse = JSON.parse(JSON.stringify(c))">
                    <text style="font-size:28rpx;">✏️</text>
                  </view>
                </view>
                <view v-if="c.status !== 'draft'" style="margin-bottom:16rpx;">
                  <view style="display:flex;justify-content:space-between;margin-bottom:8rpx;">
                    <text style="font-size:22rpx;color:#8D6E63;">报名情况</text>
                    <text style="font-size:22rpx;font-weight:700;" :style="{ color: c.color }">{{ c.enrollCount }}/{{ c.maxEnroll }}人</text>
                  </view>
                  <view style="height:12rpx;border-radius:12rpx;background:#F5F0EC;overflow:hidden;">
                    <view style="height:100%;border-radius:12rpx;" :style="{ width: (c.enrollCount/c.maxEnroll*100)+'%', backgroundColor: c.color }" />
                  </view>
                </view>
                <view style="display:flex;gap:12rpx;">
                  <view v-if="c.status === 'published'" style="flex:1;padding:16rpx;border-radius:16rpx;background:#FFF3E0;text-align:center;" @click="toggleCourseStatus(c.id, 'ended')">
                    <text style="font-size:24rpx;font-weight:700;color:#E65100;">下架</text>
                  </view>
                  <view v-if="c.status === 'draft' || c.status === 'ended'" style="flex:1;padding:16rpx;border-radius:16rpx;text-align:center;background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);" @click="toggleCourseStatus(c.id, 'published')">
                    <text style="font-size:24rpx;font-weight:700;color:white;">{{ c.status === 'draft' ? '上架' : '重新上架' }}</text>
                  </view>
                  <view style="flex:1;padding:16rpx;border-radius:16rpx;background:#FAF5FF;text-align:center;" @click="editingCourse = JSON.parse(JSON.stringify(c))">
                    <text style="font-size:24rpx;font-weight:700;color:#AB47BC;">编辑信息</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <view v-if="editingCourse" class="overlay-page" style="background:#FAF5FF;">
        <view class="safe-nav-header" style="background:white;flex-shrink:0;border-bottom:1rpx solid #E1BEE7;">
          <view style="display:flex;align-items:center;gap:20rpx;padding:0 40rpx 24rpx;">
            <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#FAF5FF;display:flex;align-items:center;justify-content:center;" @click="editingCourse = null">
              <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
            </view>
            <text style="font-size:32rpx;font-weight:800;color:#2D1F18;flex:1;">{{ editingCourse.id ? '编辑课程' : '新建课程' }}</text>
            <view style="width:72rpx;height:72rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;font-size:36rpx;" :style="{ backgroundColor: editingCourse.color + '22' }">
              <text>{{ editingCourse.coverImage }}</text>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view class="card" style="padding:24rpx;margin-bottom:20rpx;">
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:16rpx;">主图</text>
              <view style="height:200rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:linear-gradient(135deg,#FAF5FF 0%,#F3E5F5 100%);border:3rpx dashed #CE93D8;" @click="pickCourseCover">
                <image v-if="editingCourse.coverPath" :src="courseMediaUrl(editingCourse.coverPath)" mode="aspectFill" style="width:100%;height:100%;" />
                <text v-else style="font-size:80rpx;">{{ editingCourse.coverImage }}</text>
                <view style="position:absolute;bottom:16rpx;right:16rpx;padding:8rpx 20rpx;border-radius:12rpx;background:rgba(171,71,188,0.85);">
                  <text style="font-size:20rpx;font-weight:700;color:white;">{{ courseCoverUploading ? '上传中…' : '上传图片' }}</text>
                </view>
              </view>
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-top:20rpx;margin-bottom:12rpx;">轮播图</text>
              <view style="display:flex;flex-wrap:wrap;">
                <view v-for="(img, i) in (editingCourse.carouselPaths || [])" :key="'p'+i" style="width:120rpx;height:120rpx;border-radius:16rpx;margin-right:16rpx;margin-bottom:16rpx;overflow:hidden;position:relative;">
                  <image :src="courseMediaUrl(img)" mode="aspectFill" style="width:100%;height:100%;" />
                  <view style="position:absolute;top:0;right:0;padding:4rpx 8rpx;background:rgba(0,0,0,0.45);" @click="removeCourseCarousel(i)">
                    <text style="color:white;font-size:18rpx;">×</text>
                  </view>
                </view>
                <view style="width:120rpx;height:120rpx;border-radius:16rpx;display:flex;align-items:center;justify-content:center;border:2rpx dashed #CE93D8;background:#F5F0EC;margin-bottom:16rpx;" @click="pickCourseCarousel">
                  <text style="font-size:40rpx;color:#CE93D8;">+</text>
                </view>
              </view>
            </view>
            <view class="card" style="padding:24rpx;margin-bottom:20rpx;">
              <view style="margin-bottom:20rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">课程名称 *</text>
                <input class="form-input" :value="editingCourse.title" @input="e => editingCourse.title = e.detail.value" placeholder="如：语言发展启蒙课" />
              </view>
              <view style="display:flex;gap:16rpx;margin-bottom:20rpx;">
                <view style="flex:1;">
                  <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">适合年龄</text>
                  <input class="form-input" :value="editingCourse.age" @input="e => editingCourse.age = e.detail.value" placeholder="2-4岁" />
                </view>
                <view style="flex:1;">
                  <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">价格（元）</text>
                  <input class="form-input" :value="editingCourse.price" @input="e => editingCourse.price = e.detail.value" placeholder="0" />
                </view>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">课程简介</text>
                <textarea class="form-input" style="height:120rpx;" :value="editingCourse.desc" @input="e => editingCourse.desc = e.detail.value" placeholder="课程核心定位和特色" />
              </view>
            </view>
          </view>
        </scroll-view>
        <view style="display:flex;gap:16rpx;padding:24rpx 40rpx;background:white;border-top:1rpx solid #E1BEE7;flex-shrink:0;padding-bottom:env(safe-area-inset-bottom,24rpx);">
          <view v-if="editingCourse.id && editingCourse.status === 'published'" style="flex:1;padding:28rpx;border-radius:24rpx;background:#FFF3E0;display:flex;align-items:center;justify-content:center;" @click="toggleCourseStatus(editingCourse.id,'ended'); editingCourse = null">
            <text style="font-size:26rpx;font-weight:700;color:#E65100;">下架课程</text>
          </view>
          <view style="flex:2;padding:28rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);" @click="saveCourse">
            <text style="color:white;font-size:28rpx;font-weight:800;">{{ editingCourse.id ? '保存' : '创建草稿' }}</text>
          </view>
        </view>
      </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  createCourse,
  fetchCourses,
  publishCourse,
  unpublishCourse,
  updateCourse,
} from '../../api/institution.js'
import { mediaUrl } from '../../config.js'
import { uploadFile } from '../../utils/request.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

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
const editingCourse = ref(null)
const courseCoverUploading = ref(false)

async function loadCourses() {
  courseLoading.value = true
  try {
    const data = await fetchCourses()
    courses.value = (data?.list || []).map(c => ({
      ...c,
      carouselImages: c.carouselImages || []
    }))
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

async function saveCourse() {
  if (!editingCourse.value || courseBusy.value) return
  const c = editingCourse.value
  if (!(c.title || '').trim()) {
    uni.showToast({ title: '请填写课程名称', icon: 'none' })
    return
  }
  courseBusy.value = true
  try {
    const payload = {
      title: c.title.trim(),
      age_range: c.age,
      price: Number(c.price) || 0,
      desc: c.desc,
      teacher_name: c.teacher,
      sessions: Number(c.sessions) || 0,
      cover_emoji: c.coverImage || '📚',
      cover_path: c.coverPath || null,
      carousel_paths: c.carouselPaths || [],
      color: c.color || '#AB47BC',
      tag: c.tag,
      max_enroll: Number(c.maxEnroll) || 20,
      enroll_count: Number(c.enrollCount) || 0,
    }
    if (c.id) {
      await updateCourse(c.id, payload)
      uni.showToast({ title: '已保存', icon: 'success' })
    } else {
      await createCourse({ ...payload, status: 'draft' })
      uni.showToast({ title: '已创建草稿', icon: 'success' })
    }
    editingCourse.value = null
    await loadCourses()
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    courseBusy.value = false
  }
}

function openNewCourse() {
  editingCourse.value = {
    id: null,
    title: '',
    age: '',
    price: '',
    desc: '',
    teacher: '',
    sessions: 12,
    coverImage: '📚',
    coverPath: '',
    carouselPaths: [],
    color: '#AB47BC',
    tag: '',
    maxEnroll: 20,
    enrollCount: 0,
    status: 'draft',
  }
}

function courseMediaUrl(path) {
  return mediaUrl(path)
}

function pickCourseCover() {
  if (courseCoverUploading.value || !editingCourse.value) return
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const path = (res.tempFilePaths || [])[0]
      if (!path) return
      courseCoverUploading.value = true
      try {
        const uploaded = await uploadFile(path, 'course')
        if (!uploaded?.path && !uploaded?.url) throw new Error('上传失败')
        editingCourse.value.coverPath = uploaded.path || uploaded.url
      } catch (e) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      } finally {
        courseCoverUploading.value = false
      }
    },
  })
}

function pickCourseCarousel() {
  if (!editingCourse.value || courseCoverUploading.value) return
  const cur = editingCourse.value.carouselPaths || []
  const left = 9 - cur.length
  if (left <= 0) return
  uni.chooseImage({
    count: left,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const paths = res.tempFilePaths || []
      courseCoverUploading.value = true
      try {
        for (const path of paths) {
          const uploaded = await uploadFile(path, 'course')
          if (uploaded?.path || uploaded?.url) {
            if (!editingCourse.value.carouselPaths) editingCourse.value.carouselPaths = []
            editingCourse.value.carouselPaths.push(uploaded.path || uploaded.url)
          }
        }
      } catch (e) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      } finally {
        courseCoverUploading.value = false
      }
    },
  })
}

function removeCourseCarousel(i) {
  editingCourse.value?.carouselPaths?.splice(i, 1)
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
