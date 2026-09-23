<template>
  <view class="page" :style="navSafeStyle">
    <view class="content">
      <HomePanel
        v-if="shellTab === 'home'"
        @navigate="navigate"
        @go-checkin="onGoCheckin"
      />
      <WorkbenchPanel
        v-else-if="shellTab === 'workbench'"
        @navigate="navigate"
      />
      <DailyPanel v-else-if="shellTab === 'circle'" />
      <MePanel v-else-if="shellTab === 'me'" @navigate="navigate" />

      <!-- #ifndef H5 -->
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
          <TeacherInnerPages
            :inner-key="innerKey"
            @back="onOverlayBack"
            @go-checkin="onInnerGoCheckin"
            @detail="onCourseDetail"
            @lesson-attend="onLessonAttend"
            @lesson-attend-from-detail="onLessonAttendFromDetail"
            @lesson-attend-back="onLessonAttendBack"
            @open-hosting="onOpenHosting"
            @homework="onHomeworkTutoring"
            @period-settings="onPeriodSettings"
          />
        </view>
      </page-container>
      <!-- #endif -->

      <!-- #ifdef H5 -->
      <view v-if="innerShow" class="h5-inner-overlay">
        <view class="mp-inner-wrap">
          <TeacherInnerPages
            :inner-key="innerKey"
            @back="onOverlayBack"
            @go-checkin="onInnerGoCheckin"
            @detail="onCourseDetail"
            @lesson-attend="onLessonAttend"
            @lesson-attend-from-detail="onLessonAttendFromDetail"
            @lesson-attend-back="onLessonAttendBack"
            @open-hosting="onOpenHosting"
            @homework="onHomeworkTutoring"
            @period-settings="onPeriodSettings"
          />
        </view>
      </view>
      <!-- #endif -->
    </view>

    <view v-if="isMainTab">
      <BottomNav :tabs="navTabs" :active="activeTab" accent="#FF7043" @change="(id) => navigate({ tab: id })" />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, provide, watch } from 'vue'
import { onBackPress, onShow } from '@dcloudio/uni-app'
import BottomNav from '../components/bottom-nav.vue'
import HomePanel from '../components/teacher/HomePanel.vue'
import WorkbenchPanel from '../components/teacher/WorkbenchPanel.vue'
import DailyPanel from '../components/teacher/DailyPanel.vue'
import MePanel from '../components/teacher/MePanel.vue'
import TeacherInnerPages from '../components/teacher/TeacherInnerPages.vue'
import { navSafeCssVars } from './utils/safeArea.js'
import { todayYmd } from '../utils/lessonAttend.js'
import { MP_PAGE_CONTAINER_PROPS, createPageContainerBridge } from './utils/mpPageContainer.js'
import { loadApps, MP_APPS_KEY } from '../utils/apps.js'

const navSafeStyle = navSafeCssVars()
const activeTab = ref('home')
const checkinClassId = ref(null)
const checkinPeriodId = ref(null)
const courseDetail = ref(null)
const lessonAttendCtx = ref(null)
const hostingCtx = ref(null)
const lastMainTab = ref('home')
const innerKey = ref('')
const mpApps = ref([])

provide('teacherActiveTab', activeTab)
provide('teacherCheckinClassId', checkinClassId)
provide('teacherCheckinPeriodId', checkinPeriodId)
provide('teacherCourseDetail', courseDetail)
provide('teacherLessonAttend', lessonAttendCtx)
provide('teacherHosting', hostingCtx)
provide(MP_APPS_KEY, mpApps)

const MAIN_TABS = ['home', 'workbench', 'circle', 'me']
const isMainTab = computed(() => MAIN_TABS.includes(activeTab.value))
const shellTab = computed(() => (isMainTab.value ? activeTab.value : lastMainTab.value))
const pcProps = MP_PAGE_CONTAINER_PROPS

const navTabs = [
  { id: 'home', label: '首页', emoji: '🏠' },
  { id: 'workbench', label: '工作台', emoji: '🧰' },
  { id: 'circle', label: '家校圈', emoji: '📷' },
  { id: 'me', label: '我的', emoji: '👤' },
]

async function refreshApps() {
  try {
    mpApps.value = await loadApps({ force: true })
  } catch {
    mpApps.value = mpApps.value.length ? mpApps.value : []
  }
}

onShow(() => {
  refreshApps()
})

function resolveInnerKey() {
  if (MAIN_TABS.includes(activeTab.value)) return ''
  return activeTab.value
}

function isInnerOpen() {
  return !!resolveInnerKey()
}

watch(activeTab, (tab) => {
  if (MAIN_TABS.includes(tab)) lastMainTab.value = tab
})

watch(activeTab, () => {
  const key = resolveInnerKey()
  if (key) innerKey.value = key
}, { immediate: true })

function popInnerOnce() {
  if (MAIN_TABS.includes(activeTab.value)) return false
  if (activeTab.value === 'lesson-attend') {
    activeTab.value = lessonAttendCtx.value?.backTab || 'schedule'
  } else if (activeTab.value === 'course-detail') {
    activeTab.value = 'schedule'
  } else if (activeTab.value === 'homework-tutoring') {
    activeTab.value = 'hosting-detail'
  } else if (activeTab.value === 'attendance-period') {
    activeTab.value = 'hosting-detail'
  } else if (activeTab.value === 'hosting-detail') {
    activeTab.value = 'hosting-list'
  } else if (activeTab.value === 'hosting-list') {
    activeTab.value = 'workbench'
  } else if (['schedule', 'messages', 'notices', 'leave', 'life', 'meal', 'attendance', 'checkin'].includes(activeTab.value)) {
    activeTab.value = lastMainTab.value || 'workbench'
  } else {
    activeTab.value = lastMainTab.value || 'home'
  }
  const key = resolveInnerKey()
  if (key) innerKey.value = key
  return !MAIN_TABS.includes(activeTab.value)
}

const pc = createPageContainerBridge({
  isOpen: isInnerOpen,
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

onBackPress(() => {
  if (!isInnerOpen()) return false
  popInnerOnce()
  return true
})

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
  applyCheckinPayload(payload)
  // 旧签到入口：进托管列表更符合新 IA
  activeTab.value = 'hosting-list'
}

function onInnerGoCheckin(payload) {
  applyCheckinPayload(payload)
  activeTab.value = 'hosting-list'
}

function applyCheckinPayload(payload) {
  if (payload != null && typeof payload === 'object') {
    if (payload.classId != null) checkinClassId.value = payload.classId
    if (payload.periodId != null) checkinPeriodId.value = payload.periodId
  } else if (payload != null) {
    checkinClassId.value = payload
  }
}

function onOverlayBack() {
  popInnerOnce()
}

function onCourseDetail(cls) {
  courseDetail.value = cls || null
  activeTab.value = 'course-detail'
}

function onOpenHosting(item) {
  hostingCtx.value = item || null
  activeTab.value = 'hosting-detail'
}

function onHomeworkTutoring(item) {
  if (item) hostingCtx.value = item
  activeTab.value = 'homework-tutoring'
}

function onPeriodSettings() {
  activeTab.value = 'attendance-period'
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

/* #ifdef H5 */
.h5-inner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  overflow: hidden;
}
/* #endif */
</style>
