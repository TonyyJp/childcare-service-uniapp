<template>
      <view class="overlay-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view style="padding:0 40rpx 24rpx;">
            <view style="display:flex;align-items:center;gap:20rpx;margin-bottom:16rpx;">
              <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
              <view style="flex:1;">
                <text style="font-size:40rpx;font-weight:800;color:white;display:block;">课程报名</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">录入报名 · 消耗课时</text>
              </view>
              <view style="background:rgba(255,255,255,0.25);border-radius:20rpx;padding:14rpx 24rpx;" @click="openEnrollmentCompose">
                <text style="color:white;font-size:24rpx;font-weight:700;">+ 录入</text>
              </view>
            </view>
            <scroll-view scroll-x style="white-space:nowrap;">
              <view class="pill" style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
                :style="{ backgroundColor: enrollFilterCourseId == null ? 'white' : 'rgba(255,255,255,0.2)', color: enrollFilterCourseId == null ? '#AB47BC' : 'white' }"
                @click="setEnrollFilter(null)"><text style="font-size:22rpx;font-weight:700;">全部</text></view>
              <view v-for="c in enrollCourseOptions" :key="c.id" class="pill" style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
                :style="{ backgroundColor: enrollFilterCourseId === c.id ? 'white' : 'rgba(255,255,255,0.2)', color: enrollFilterCourseId === c.id ? '#AB47BC' : 'white' }"
                @click="setEnrollFilter(c.id)"><text style="font-size:22rpx;font-weight:700;">{{ c.title }}</text></view>
            </scroll-view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view v-if="enrollmentsLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
            <view v-else-if="!filteredEnrollments.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无报名记录</text></view>
            <view v-for="row in filteredEnrollments" :key="row.id" class="card" style="padding:24rpx;margin-bottom:16rpx;">
              <view style="display:flex;justify-content:space-between;align-items:flex-start;gap:12rpx;margin-bottom:12rpx;">
                <view style="flex:1;">
                  <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;">{{ row.course_title || '课程' }}</text>
                  <text style="font-size:24rpx;color:#8D6E63;display:block;margin-top:6rpx;">学员 {{ row.student?.name || '—' }}</text>
                </view>
                <view class="pill" :style="{ backgroundColor: row.status === 'completed' ? '#EEEEEE' : '#E8F5E9', color: row.status === 'completed' ? '#757575' : '#2E7D32' }">
                  <text style="font-size:20rpx;font-weight:700;">{{ row.status === 'completed' ? '已结课' : '进行中' }}</text>
                </view>
              </view>
              <view style="display:flex;justify-content:space-between;margin-bottom:8rpx;">
                <text style="font-size:22rpx;color:#8D6E63;">课时进度</text>
                <text style="font-size:22rpx;font-weight:700;color:#AB47BC;">{{ row.used_sessions }}/{{ row.total_sessions }} · 剩 {{ row.sessions_left }}</text>
              </view>
              <view style="height:12rpx;border-radius:12rpx;background:#F5F0EC;overflow:hidden;margin-bottom:12rpx;">
                <view style="height:100%;border-radius:12rpx;background:#AB47BC;"
                  :style="{ width: (row.total_sessions ? (row.used_sessions / row.total_sessions * 100) : 0) + '%' }" />
              </view>
              <text style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:16rpx;">
                {{ row.schedule_note || '课表待定' }}{{ row.next_class_on ? ' · 下次 ' + row.next_class_on : '' }}
              </text>
              <view v-if="row.status === 'active' && row.sessions_left > 0" style="padding:16rpx;border-radius:16rpx;background:linear-gradient(135deg,#AB47BC,#CE93D8);text-align:center;" @click="doConsumeEnrollment(row)">
                <text style="font-size:26rpx;font-weight:700;color:white;">消耗 1 课时</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view v-if="showEnrollCompose" class="overlay-mask" style="z-index:70;" @click="showEnrollCompose = false">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">录入报名</text>
            <view style="display:flex;flex-direction:column;gap:20rpx;">
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">课程</text>
                <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
                  <view v-for="c in publishedCourses" :key="c.id" class="pill" style="padding:12rpx 20rpx;"
                    :style="{ backgroundColor: newEnroll.courseId === c.id ? '#AB47BC18' : '#F5F0EC', color: newEnroll.courseId === c.id ? '#AB47BC' : '#8D6E63' }"
                    @click="selectEnrollCourse(c)">
                    <text style="font-size:22rpx;">{{ c.title }}</text>
                  </view>
                </view>
                <text v-if="!publishedCourses.length" style="font-size:22rpx;color:#E53935;">请先上架营销课程</text>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">学员</text>
                <scroll-view scroll-y style="max-height:240rpx;">
                  <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
                    <view v-for="s in studentList" :key="s.id" class="pill" style="padding:12rpx 20rpx;"
                      :style="{ backgroundColor: newEnroll.studentId === s.id ? '#AB47BC18' : '#F5F0EC', color: newEnroll.studentId === s.id ? '#AB47BC' : '#8D6E63' }"
                      @click="newEnroll.studentId = s.id">
                      <text style="font-size:22rpx;">{{ s.name }}</text>
                    </view>
                  </view>
                </scroll-view>
                <text v-if="!studentList.length" style="font-size:22rpx;color:#E53935;">暂无学员，请先维护学生档案</text>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">总课时</text>
                <input class="form-input" type="number" :value="newEnroll.totalSessions" @input="e => newEnroll.totalSessions = e.detail.value" placeholder="默认取课程课时" />
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">课表备注</text>
                <input class="form-input" :value="newEnroll.scheduleNote" @input="e => newEnroll.scheduleNote = e.detail.value" placeholder="如：每周三 16:00" />
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">下次上课</text>
                <picker mode="date" :value="newEnroll.nextClassOn" @change="e => newEnroll.nextClassOn = e.detail.value">
                  <view class="form-input">{{ newEnroll.nextClassOn || '可选' }}</view>
                </picker>
              </view>
              <view class="primary-btn" :style="{ opacity: enrollBusy ? 0.6 : 1 }" @click="submitEnrollment">
                <text style="color:white;font-size:30rpx;font-weight:800;">确认报名</text>
              </view>
            </view>
          </view>
        </view>
      </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  consumeEnrollment,
  createEnrollment,
  fetchCourses,
  fetchEnrollments,
  fetchStudents,
} from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}

watch(() => props.pageShowCount, () => { loadOrgEnrollments() }, { immediate: true })

const enrollments = ref([])
const enrollmentsLoading = ref(false)
const enrollBusy = ref(false)
const showEnrollCompose = ref(false)
const enrollFilterCourseId = ref(null)
const courses = ref([])
const studentList = ref([])
const newEnroll = ref({
  courseId: null,
  studentId: null,
  totalSessions: '',
  scheduleNote: '',
  nextClassOn: '',
})

const publishedCourses = computed(() =>
  (courses.value || []).filter(c => c.status === 'published')
)
const enrollCourseOptions = computed(() => {
  const map = new Map()
  for (const row of enrollments.value) {
    if (row.course_id && !map.has(row.course_id)) {
      map.set(row.course_id, { id: row.course_id, title: row.course_title || `课程${row.course_id}` })
    }
  }
  for (const c of publishedCourses.value) {
    if (!map.has(c.id)) map.set(c.id, { id: c.id, title: c.title })
  }
  return [...map.values()]
})
const filteredEnrollments = computed(() => {
  if (enrollFilterCourseId.value == null) return enrollments.value
  return enrollments.value.filter(e => e.course_id === enrollFilterCourseId.value)
})

async function loadCourses() {
  const data = await fetchCourses()
  courses.value = (data?.list || []).map(c => ({
    ...c,
    carouselImages: c.carouselImages || []
  }))
}

async function loadStudents() {
  const data = await fetchStudents()
  studentList.value = data?.list || []
}

async function loadOrgEnrollments() {
  enrollmentsLoading.value = true
  try {
    if (!courses.value.length) await loadCourses()
    if (!studentList.value.length) await loadStudents()
    const data = await fetchEnrollments()
    enrollments.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '报名加载失败', icon: 'none' })
  } finally {
    enrollmentsLoading.value = false
  }
}

function setEnrollFilter(id) {
  enrollFilterCourseId.value = id
}

function openEnrollmentCompose() {
  const firstCourse = publishedCourses.value[0]
  newEnroll.value = {
    courseId: firstCourse?.id || null,
    studentId: studentList.value[0]?.id || null,
    totalSessions: firstCourse?.sessions ? String(firstCourse.sessions) : '',
    scheduleNote: '',
    nextClassOn: '',
  }
  showEnrollCompose.value = true
  if (!studentList.value.length) loadStudents()
  if (!courses.value.length) loadCourses()
}

function selectEnrollCourse(c) {
  newEnroll.value.courseId = c.id
  if (c.sessions) newEnroll.value.totalSessions = String(c.sessions)
}

async function submitEnrollment() {
  if (enrollBusy.value) return
  const form = newEnroll.value
  if (!form.courseId) {
    uni.showToast({ title: '请选择课程', icon: 'none' })
    return
  }
  if (!form.studentId) {
    uni.showToast({ title: '请选择学员', icon: 'none' })
    return
  }
  enrollBusy.value = true
  try {
    const payload = {
      course_id: form.courseId,
      student_id: form.studentId,
      schedule_note: form.scheduleNote.trim() || null,
      next_class_on: form.nextClassOn || null,
      used_sessions: 0,
    }
    const total = parseInt(form.totalSessions, 10)
    if (total > 0) payload.total_sessions = total
    await createEnrollment(payload)
    uni.showToast({ title: '已报名', icon: 'success' })
    showEnrollCompose.value = false
    await loadOrgEnrollments()
    await loadCourses()
  } catch (e) {
    uni.showToast({ title: e.message || '报名失败', icon: 'none' })
  } finally {
    enrollBusy.value = false
  }
}

async function doConsumeEnrollment(row) {
  if (enrollBusy.value) return
  uni.showModal({
    title: '消耗课时',
    content: `确认给 ${row.student?.name || '学员'} 消耗 1 节「${row.course_title || '课程'}」？`,
    success: async (res) => {
      if (!res.confirm) return
      enrollBusy.value = true
      try {
        await consumeEnrollment(row.id)
        uni.showToast({ title: '已消课', icon: 'success' })
        await loadOrgEnrollments()
      } catch (e) {
        uni.showToast({ title: e.message || '消课失败', icon: 'none' })
      } finally {
        enrollBusy.value = false
      }
    },
  })
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
