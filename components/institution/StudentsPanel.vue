<template>
      <view class="tab-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view style="display:flex;align-items:center;justify-content:space-between;padding:0 40rpx 32rpx;">
            <view>
              <text style="font-size:44rpx;font-weight:800;color:white;display:block;">学生管理</text>
              <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">共 {{ studentList.length }} 名在园</text>
            </view>
            <view style="background:rgba(255,255,255,0.25);border-radius:20rpx;padding:14rpx 24rpx;" @click="navigate('bindings')">
              <text style="color:white;font-size:24rpx;font-weight:700;">绑定审核</text>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view style="display:flex;gap:12rpx;margin-bottom:20rpx;flex-wrap:wrap;">
              <view v-for="f in classFilters" :key="f.name" class="pill"
                :style="{ backgroundColor: studentFilter === f.name ? '#AB47BC' : '#F5F0EC', color: studentFilter === f.name ? 'white' : '#8D6E63', padding: '12rpx 24rpx' }"
                @click="studentFilter = f.name">
                <text style="font-size:24rpx;font-weight:700;">{{ f.name }}</text>
              </view>
            </view>
            <view v-if="studentsLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
            <view v-else-if="!filteredStudents.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无学生</text></view>
            <view v-for="s in filteredStudents" :key="s.id || s.name" class="card" style="padding:20rpx 24rpx;margin-bottom:16rpx;">
              <view style="display:flex;align-items:center;gap:20rpx;">
                <view style="width:80rpx;height:80rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;font-size:36rpx;flex-shrink:0;background:#FAF5FF;">
                  <text>{{ s.emoji }}</text>
                </view>
                <view style="flex:1;">
                  <view style="display:flex;align-items:center;gap:12rpx;margin-bottom:8rpx;">
                    <text style="font-size:28rpx;font-weight:700;color:#2D1F18;">{{ s.name }}</text>
                    <view class="pill" style="background:#AB47BC18;"><text style="font-size:20rpx;color:#AB47BC;">{{ s.class }}</text></view>
                  </view>
                  <text style="font-size:22rpx;color:#8D6E63;">{{ s.age }} · 家长：{{ s.parent }}</text>
                </view>
                <view class="pill" :style="{ backgroundColor: s.present ? '#C8E6C9' : '#EEEEEE', color: s.present ? '#2E7D32' : '#757575' }">
                  <text style="font-size:20rpx;font-weight:700;">{{ s.present ? '在园' : '缺勤' }}</text>
                </view>
              </view>
              <view style="display:flex;gap:12rpx;margin-top:16rpx;">
                <view
                  style="flex:1;padding:14rpx;border-radius:14rpx;background:#FFF3E0;text-align:center;"
                  @click="openGrant(s)"
                >
                  <text style="font-size:24rpx;font-weight:700;color:#E65100;">发放课包</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <view v-if="grantVisible" class="overlay-mask" style="z-index:80;" @click="grantVisible = false">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">发放课包 · {{ grantForm.studentName }}</text>
            <view style="display:flex;flex-direction:column;gap:20rpx;margin-bottom:28rpx;">
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">兴趣课班</text>
                <picker
                  :range="interestClassNames"
                  :value="grantClassIndex"
                  @change="onGrantClassChange"
                >
                  <view class="form-input">{{ interestClassNames[grantClassIndex] || '请选择课班' }}</view>
                </picker>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">课时数</text>
                <input
                  class="form-input"
                  type="number"
                  :value="grantForm.totalLessons"
                  placeholder="如 10"
                  @input="e => grantForm.totalLessons = e.detail.value"
                />
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">有效期至</text>
                <picker mode="date" :value="grantForm.validTo" @change="e => grantForm.validTo = e.detail.value">
                  <view class="form-input">{{ grantForm.validTo || '选择日期（可选）' }}</view>
                </picker>
              </view>
            </view>
            <view
              class="primary-btn"
              :style="{ opacity: grantBusy ? 0.6 : 1 }"
              @click="submitGrant"
            >
              <text style="color:white;font-size:30rpx;font-weight:800;">{{ grantBusy ? '提交中…' : '确认发放' }}</text>
            </view>
          </view>
        </view>
      </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  createLessonPackage,
  fetchInterestClasses,
  fetchStudents,
} from '../../api/institution.js'
import { todayYmd } from '../../utils/lessonAttend.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}

watch(() => props.pageShowCount, () => { loadStudents() }, { immediate: true })

const classFilters = ref([{ id: null, name: '全部' }])
const studentFilter = ref('全部')
const studentList = ref([])
const studentsLoading = ref(false)
const filteredStudents = computed(() =>
  studentFilter.value === '全部'
    ? studentList.value
    : studentList.value.filter(s => s.class === studentFilter.value)
)

const grantVisible = ref(false)
const grantBusy = ref(false)
const interestClasses = ref([])
const grantClassIndex = ref(0)
const grantForm = ref({
  studentId: null,
  studentName: '',
  totalLessons: '10',
  validTo: '',
})

const interestClassNames = computed(() =>
  interestClasses.value.map(c => c.name || c.title || `课班#${c.id}`)
)

async function loadStudents() {
  studentsLoading.value = true
  try {
    const data = await fetchStudents()
    studentList.value = data?.list || []
    classFilters.value = data?.class_filters?.length
      ? data.class_filters
      : [{ id: null, name: '全部' }]
    if (!classFilters.value.some(f => f.name === studentFilter.value)) {
      studentFilter.value = '全部'
    }
  } catch (e) {
    uni.showToast({ title: e.message || '学生加载失败', icon: 'none' })
  } finally {
    studentsLoading.value = false
  }
}

async function ensureInterestClasses() {
  if (interestClasses.value.length) return
  try {
    const data = await fetchInterestClasses()
    interestClasses.value = data?.list || data?.classes || []
  } catch (e) {
    interestClasses.value = []
    uni.showToast({
      title: e?.statusCode === 404 ? '课班接口尚未开通' : (e.message || '课班加载失败'),
      icon: 'none',
    })
  }
}

async function openGrant(s) {
  grantForm.value = {
    studentId: s.id,
    studentName: s.name,
    totalLessons: '10',
    validTo: '',
  }
  grantClassIndex.value = 0
  await ensureInterestClasses()
  if (!interestClasses.value.length) return
  grantVisible.value = true
}

function onGrantClassChange(e) {
  grantClassIndex.value = Number(e.detail.value) || 0
}

async function submitGrant() {
  if (grantBusy.value) return
  const cls = interestClasses.value[grantClassIndex.value]
  const lessons = parseInt(String(grantForm.value.totalLessons), 10)
  if (!cls?.id) {
    uni.showToast({ title: '请选择课班', icon: 'none' })
    return
  }
  if (!lessons || lessons < 1) {
    uni.showToast({ title: '请填写有效课时数', icon: 'none' })
    return
  }
  const from = todayYmd()
  let validTo = grantForm.value.validTo
  if (!validTo) {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    validTo = `${d.getFullYear()}-${m}-${day}`
  }
  grantBusy.value = true
  try {
    await createLessonPackage({
      student_id: grantForm.value.studentId,
      class_id: cls.id,
      total_lessons: lessons,
      valid_from: from,
      valid_to: validTo,
    })
    uni.showToast({ title: '已发放课包', icon: 'success' })
    grantVisible.value = false
  } catch (e) {
    uni.showToast({
      title: e?.statusCode === 404 ? '发放接口尚未开通' : (e.message || '发放失败'),
      icon: 'none',
    })
  } finally {
    grantBusy.value = false
  }
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
