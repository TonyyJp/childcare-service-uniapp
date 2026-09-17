<template>
  <view class="page" :style="navSafeStyle">
    <view class="content">
      <HomePanel
        v-if="shellTab === 'home'"
        :page-show-count="pageShowCount"
        @navigate="onNavigate"
        @open-announcements="openAnnouncements"
      />
      <TeachersPanel v-else-if="shellTab === 'teachers'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <StudentsPanel v-else-if="shellTab === 'students'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <CoursesPanel v-else-if="shellTab === 'courses'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <NoticesPanel v-else-if="shellTab === 'notice'" :page-show-count="pageShowCount" @navigate="onNavigate" />

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
          <ReportOverlay v-if="innerKey === 'report'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <ConfigOverlay v-else-if="innerKey === 'config'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <EventsOverlay v-else-if="innerKey === 'events'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <BindingsOverlay v-else-if="innerKey === 'bindings'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <LeavesOverlay v-else-if="innerKey === 'leaves'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <MealsOverlay v-else-if="innerKey === 'meals'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <DailyOverlay v-else-if="innerKey === 'daily'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <HomeworkOverlay v-else-if="innerKey === 'homework'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <AttendanceOverlay v-else-if="innerKey === 'attendance'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <LessonAttendOverlay v-else-if="innerKey === 'lesson-attend'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <LessonConsumeSummaryOverlay v-else-if="innerKey === 'lesson-consume'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <EnrollmentsOverlay v-else-if="innerKey === 'enrollments'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <TrialOverlay v-else-if="innerKey === 'trial'" :page-show-count="pageShowCount" @navigate="onNavigate" />
          <PlatformAnnouncementPopup
            v-else-if="innerKey === 'announcements'"
            ref="announcementListRef"
            embedded
            @close="activeTab = lastMainTab"
          />
        </view>
      </page-container>

      <!-- 仅启动弹窗；列表走上方 page-container -->
      <PlatformAnnouncementPopup popup-only />
    </view>

    <view v-if="isMainTab" class="bottom-nav">
      <view v-for="tab in navTabs" :key="tab.id" class="nav-item" @click="activeTab = tab.id">
        <text class="nav-icon" :style="{ color: activeTab === tab.id ? '#AB47BC' : '#8D6E63' }">{{ tab.emoji }}</text>
        <text class="nav-label" :style="{ color: activeTab === tab.id ? '#AB47BC' : '#8D6E63', fontWeight: activeTab === tab.id ? '700' : '500' }">{{ tab.label }}</text>
        <view v-if="activeTab === tab.id" class="nav-dot" style="background:#AB47BC;" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navSafeCssVars } from './utils/safeArea.js'
import { MP_PAGE_CONTAINER_PROPS, createPageContainerBridge } from './utils/mpPageContainer.js'

import HomePanel from '../components/institution/HomePanel.vue'
import TeachersPanel from '../components/institution/TeachersPanel.vue'
import StudentsPanel from '../components/institution/StudentsPanel.vue'
import CoursesPanel from '../components/institution/CoursesPanel.vue'
import NoticesPanel from '../components/institution/NoticesPanel.vue'
import ReportOverlay from '../components/institution/ReportOverlay.vue'
import ConfigOverlay from '../components/institution/ConfigOverlay.vue'
import EventsOverlay from '../components/institution/EventsOverlay.vue'
import BindingsOverlay from '../components/institution/BindingsOverlay.vue'
import LeavesOverlay from '../components/institution/LeavesOverlay.vue'
import MealsOverlay from '../components/institution/MealsOverlay.vue'
import DailyOverlay from '../components/institution/DailyOverlay.vue'
import HomeworkOverlay from '../components/institution/HomeworkOverlay.vue'
import AttendanceOverlay from '../components/institution/AttendanceOverlay.vue'
import LessonAttendOverlay from '../components/institution/LessonAttendOverlay.vue'
import LessonConsumeSummaryOverlay from '../components/institution/LessonConsumeSummaryOverlay.vue'
import EnrollmentsOverlay from '../components/institution/EnrollmentsOverlay.vue'
import TrialOverlay from '../components/institution/TrialOverlay.vue'
import PlatformAnnouncementPopup from '../components/institution/PlatformAnnouncementPopup.vue'

const navSafeStyle = navSafeCssVars()
const activeTab = ref('home')
const MAIN_TABS = ['home', 'teachers', 'students', 'courses', 'notice']
const isMainTab = computed(() => MAIN_TABS.includes(activeTab.value))
const lastMainTab = ref('home')
const innerKey = ref('')
const shellTab = computed(() => (isMainTab.value ? activeTab.value : lastMainTab.value))
const pageShowCount = ref(0)
const announcementListRef = ref(null)
const pcProps = MP_PAGE_CONTAINER_PROPS

const navTabs = [
  { id: 'home',     label: '总览',  emoji: '🏠' },
  { id: 'teachers', label: '师资',  emoji: '👩‍🏫' },
  { id: 'students', label: '学生',  emoji: '🎓' },
  { id: 'courses',  label: '课程',  emoji: '📚' },
  { id: 'notice',   label: '通知',  emoji: '📢' },
]

watch(activeTab, (tab) => {
  if (MAIN_TABS.includes(tab)) {
    lastMainTab.value = tab
  } else {
    innerKey.value = tab
  }
})

function popInnerOnce() {
  if (MAIN_TABS.includes(activeTab.value)) return false
  if (activeTab.value === 'announcements') {
    const handled = announcementListRef.value?.onSwipeBack?.()
    if (handled) return true
  }
  activeTab.value = lastMainTab.value || 'home'
  return false
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

function onNavigate(tab) {
  if (tab) activeTab.value = tab
}

function openAnnouncements() {
  activeTab.value = 'announcements'
}

onShow(() => {
  pageShowCount.value += 1
})
</script>

<style lang="scss" scoped>
@import '../styles/mp-institution.scss';

.mp-inner-wrap {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background: #faf5ff;
}
</style>
