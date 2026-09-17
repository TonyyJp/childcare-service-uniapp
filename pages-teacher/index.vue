<template>
  <view class="page" :style="navSafeStyle">
    <view class="content">
      <HomePanel
        v-if="shellTab === 'home'"
        @navigate="navigate"
        @go-checkin="onGoCheckin"
      />
      <CheckinPanel v-else-if="shellTab === 'checkin'" />
      <HomeworkPanel v-else-if="shellTab === 'homework'" />
      <DailyPanel v-else-if="shellTab === 'daily'" />
      <StatsPanel v-else-if="shellTab === 'stats'" />

      <!-- 内页：page-container 承接右滑/系统返回，避免退出小程序 -->
      <page-container
        :show="innerShow"
        :position="pcProps.position"
        :overlay="pcProps.overlay"
        :round="pcProps.round"
        :close-on-slide-down="pcProps.closeOnSlideDown"
        :custom-style="pcProps.customStyle"
        @beforeleave="onInnerBeforeLeave"
        @afterleave="onInnerAfterLeave"
      >
        <view class="mp-inner-wrap">
          <MealOverlay v-if="innerKey === 'meal'" @back="activeTab = 'home'" />
          <AttendanceOverlay
            v-else-if="innerKey === 'attendance'"
            @back="activeTab = 'home'"
            @go-checkin="activeTab = 'checkin'"
          />
          <LeaveOverlay v-else-if="innerKey === 'leave'" @back="activeTab = 'home'" />
          <NoticesOverlay v-else-if="innerKey === 'notices'" @back="activeTab = 'home'" />
          <MessagesOverlay v-else-if="innerKey === 'messages'" @back="activeTab = 'home'" />
          <ScheduleOverlay
            v-else-if="innerKey === 'schedule'"
            @back="activeTab = 'home'"
            @detail="onCourseDetail"
            @lesson-attend="onLessonAttend"
          />
          <CourseDetailOverlay
            v-else-if="innerKey === 'course-detail'"
            @back="activeTab = 'schedule'"
            @lesson-attend="onLessonAttendFromDetail"
          />
          <LessonAttendOverlay v-else-if="innerKey === 'lesson-attend'" @back="onLessonAttendBack" />
          <GrowthOverlay v-else-if="innerKey === 'life'" @back="activeTab = 'home'" />
        </view>
      </page-container>
    </view>

    <view v-if="isMainTab">
      <BottomNav :tabs="navTabs" :active="activeTab" accent="#FF7043" @change="(id) => navigate({ tab: id })" />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, provide, watch } from 'vue'
import BottomNav from '../components/bottom-nav.vue'
import HomePanel from '../components/teacher/HomePanel.vue'
import CheckinPanel from '../components/teacher/CheckinPanel.vue'
import HomeworkPanel from '../components/teacher/HomeworkPanel.vue'
import DailyPanel from '../components/teacher/DailyPanel.vue'
import StatsPanel from '../components/teacher/StatsPanel.vue'
import MealOverlay from '../components/teacher/MealOverlay.vue'
import AttendanceOverlay from '../components/teacher/AttendanceOverlay.vue'
import LeaveOverlay from '../components/teacher/LeaveOverlay.vue'
import NoticesOverlay from '../components/teacher/NoticesOverlay.vue'
import MessagesOverlay from '../components/teacher/MessagesOverlay.vue'
import ScheduleOverlay from '../components/teacher/ScheduleOverlay.vue'
import CourseDetailOverlay from '../components/teacher/CourseDetailOverlay.vue'
import LessonAttendOverlay from '../components/teacher/LessonAttendOverlay.vue'
import GrowthOverlay from '../components/teacher/GrowthOverlay.vue'
import { navSafeCssVars } from './utils/safeArea.js'
import { todayYmd } from '../utils/lessonAttend.js'
import { MP_PAGE_CONTAINER_PROPS, createPageContainerBridge } from './utils/mpPageContainer.js'

const navSafeStyle = navSafeCssVars()
const activeTab = ref('home')
const checkinClassId = ref(null)
const checkinPeriodId = ref(null)
const courseDetail = ref(null)
const lessonAttendCtx = ref(null)
const lastMainTab = ref('home')
const innerKey = ref('')

provide('teacherActiveTab', activeTab)
provide('teacherCheckinClassId', checkinClassId)
provide('teacherCheckinPeriodId', checkinPeriodId)
provide('teacherCourseDetail', courseDetail)
provide('teacherLessonAttend', lessonAttendCtx)

const MAIN_TABS = ['home', 'checkin', 'homework', 'daily', 'stats']
const isMainTab = computed(() => MAIN_TABS.includes(activeTab.value))
const shellTab = computed(() => (isMainTab.value ? activeTab.value : lastMainTab.value))
const pcProps = MP_PAGE_CONTAINER_PROPS

watch(activeTab, (tab) => {
  if (MAIN_TABS.includes(tab)) {
    lastMainTab.value = tab
  } else {
    innerKey.value = tab
  }
})

function popInnerOnce() {
  if (MAIN_TABS.includes(activeTab.value)) return false
  if (activeTab.value === 'lesson-attend') {
    activeTab.value = lessonAttendCtx.value?.backTab || 'schedule'
  } else if (activeTab.value === 'course-detail') {
    activeTab.value = 'schedule'
  } else {
    activeTab.value = 'home'
  }
  return !MAIN_TABS.includes(activeTab.value)
}

const pc = createPageContainerBridge({
  isOpen: () => !MAIN_TABS.includes(activeTab.value),
  onBack: popInnerOnce,
})
const {
  show: innerShow,
  contentAlive,
  onBeforeLeave: onInnerBeforeLeave,
  onAfterLeave: onInnerAfterLeave,
} = pc

watch(contentAlive, (alive) => {
  if (!alive) innerKey.value = ''
})

const navTabs = [
  { id: 'home', label: '首页', emoji: '🏠' },
  { id: 'checkin', label: '签到', emoji: '✅' },
  { id: 'homework', label: '作业', emoji: '📋' },
  { id: 'daily', label: '日常', emoji: '📷' },
  { id: 'stats', label: '学情', emoji: '📊' },
]

function navigate(nav) {
  if (!nav) return
  if (nav.toast) {
    uni.showToast({ title: nav.toast, icon: 'none' })
    return
  }
  if (nav.interestAttend && nav.classId) {
    openLessonAttend({
      classId: nav.classId,
      className: nav.className,
      date: todayYmd(),
      backTab: 'home',
    })
    return
  }
  if (nav.tab) activeTab.value = nav.tab
}

function onGoCheckin(payload) {
  if (payload != null && typeof payload === 'object') {
    if (payload.classId != null) checkinClassId.value = payload.classId
    if (payload.periodId != null) checkinPeriodId.value = payload.periodId
  } else if (payload != null) {
    checkinClassId.value = payload
  }
  activeTab.value = 'checkin'
}

function onCourseDetail(cls) {
  courseDetail.value = cls || null
  activeTab.value = 'course-detail'
}

function openLessonAttend(payload) {
  lessonAttendCtx.value = {
    classId: payload?.classId || payload?.class_id || null,
    className: payload?.className || payload?.class_name || payload?.name || '',
    date: payload?.date || todayYmd(),
    scheduleId: payload?.scheduleId || payload?.schedule_id || payload?.id || null,
    startTime: payload?.startTime || payload?.start_time || payload?.time || '',
    weekdayIndex: payload?.weekdayIndex,
    backTab: payload?.backTab || 'schedule',
  }
  activeTab.value = 'lesson-attend'
}

function onLessonAttend(payload) {
  openLessonAttend({ ...payload, backTab: 'schedule' })
}

function onLessonAttendFromDetail() {
  const cls = courseDetail.value || {}
  openLessonAttend({
    classId: cls.id || cls.class_id,
    className: cls.name || cls.class_name,
    date: todayYmd(),
    backTab: 'course-detail',
  })
}

function onLessonAttendBack() {
  activeTab.value = lessonAttendCtx.value?.backTab || 'schedule'
}
</script>

<style lang="scss">
@import '../styles/mp-common.scss';

.mp-inner-wrap {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}
</style>
