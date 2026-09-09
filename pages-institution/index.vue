<template>
  <view class="page" :style="navSafeStyle">
    <view class="content">
      <HomePanel
        v-if="activeTab === 'home'"
        :page-show-count="pageShowCount"
        @navigate="onNavigate"
        @open-announcements="openAnnouncements"
      />
      <TeachersPanel v-if="activeTab === 'teachers'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <StudentsPanel v-if="activeTab === 'students'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <CoursesPanel v-if="activeTab === 'courses'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <NoticesPanel v-if="activeTab === 'notice'" :page-show-count="pageShowCount" @navigate="onNavigate" />

      <ReportOverlay v-if="activeTab === 'report'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <ConfigOverlay v-if="activeTab === 'config'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <EventsOverlay v-if="activeTab === 'events'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <BindingsOverlay v-if="activeTab === 'bindings'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <LeavesOverlay v-if="activeTab === 'leaves'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <MealsOverlay v-if="activeTab === 'meals'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <HomeworkOverlay v-if="activeTab === 'homework'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <AttendanceOverlay v-if="activeTab === 'attendance'" :page-show-count="pageShowCount" @navigate="onNavigate" />
      <EnrollmentsOverlay v-if="activeTab === 'enrollments'" :page-show-count="pageShowCount" @navigate="onNavigate" />

      <PlatformAnnouncementPopup ref="announcementRef" />
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
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navSafeCssVars } from '../utils/safeArea.js'

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
import HomeworkOverlay from '../components/institution/HomeworkOverlay.vue'
import AttendanceOverlay from '../components/institution/AttendanceOverlay.vue'
import EnrollmentsOverlay from '../components/institution/EnrollmentsOverlay.vue'
import PlatformAnnouncementPopup from '../components/institution/PlatformAnnouncementPopup.vue'

const navSafeStyle = navSafeCssVars()
const activeTab = ref('home')
const MAIN_TABS = ['home', 'teachers', 'students', 'courses', 'notice']
const isMainTab = computed(() => MAIN_TABS.includes(activeTab.value))
const pageShowCount = ref(0)
const announcementRef = ref(null)

const navTabs = [
  { id: 'home',     label: '总览',  emoji: '🏠' },
  { id: 'teachers', label: '师资',  emoji: '👩‍🏫' },
  { id: 'students', label: '学生',  emoji: '🎓' },
  { id: 'courses',  label: '课程',  emoji: '📚' },
  { id: 'notice',   label: '通知',  emoji: '📢' },
]

function onNavigate(tab) {
  if (tab) activeTab.value = tab
}

function openAnnouncements() {
  announcementRef.value?.openAnnouncementList?.()
}

onShow(() => {
  pageShowCount.value += 1
})
</script>

<style lang="scss" scoped>
@import '../styles/mp-institution.scss';
</style>
