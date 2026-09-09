<template>
  <view class="page" :style="navSafeStyle">
    <view class="content">
      <HomePanel
        v-if="activeTab === 'home'"
        @back="goBack"
        @navigate="navigate"
        @go-checkin="onGoCheckin"
      />
      <CheckinPanel v-else-if="activeTab === 'checkin'" />
      <HomeworkPanel v-else-if="activeTab === 'homework'" />
      <DailyPanel v-else-if="activeTab === 'daily'" />
      <StatsPanel v-else-if="activeTab === 'stats'" />

      <MealOverlay v-else-if="activeTab === 'meal'" @back="activeTab = 'home'" />
      <AttendanceOverlay
        v-else-if="activeTab === 'attendance'"
        @back="activeTab = 'home'"
        @go-checkin="activeTab = 'checkin'"
      />
      <LeaveOverlay v-else-if="activeTab === 'leave'" @back="activeTab = 'home'" />
      <NoticesOverlay v-else-if="activeTab === 'notices'" @back="activeTab = 'home'" />
      <EventsOverlay v-else-if="activeTab === 'events'" @back="activeTab = 'home'" />
      <MessagesOverlay v-else-if="activeTab === 'messages'" @back="activeTab = 'home'" />
      <ScheduleOverlay v-else-if="activeTab === 'schedule'" @back="activeTab = 'home'" />
      <GrowthOverlay v-else-if="activeTab === 'life'" @back="activeTab = 'home'" />
    </view>

    <view v-if="isMainTab">
      <BottomNav :tabs="navTabs" :active="activeTab" accent="#FF7043" @change="(id) => navigate({ tab: id })" />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
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
import EventsOverlay from '../components/teacher/EventsOverlay.vue'
import MessagesOverlay from '../components/teacher/MessagesOverlay.vue'
import ScheduleOverlay from '../components/teacher/ScheduleOverlay.vue'
import GrowthOverlay from '../components/teacher/GrowthOverlay.vue'
import { navSafeCssVars } from '../utils/safeArea.js'

const navSafeStyle = navSafeCssVars()
const activeTab = ref('home')
const checkinClassId = ref(null)

provide('teacherActiveTab', activeTab)
provide('teacherCheckinClassId', checkinClassId)

const MAIN_TABS = ['home', 'checkin', 'homework', 'daily', 'stats']
const isMainTab = computed(() => MAIN_TABS.includes(activeTab.value))

const navTabs = [
  { id: 'home', label: '首页', emoji: '🏠' },
  { id: 'checkin', label: '签到', emoji: '✅' },
  { id: 'homework', label: '作业', emoji: '📋' },
  { id: 'daily', label: '日常', emoji: '📷' },
  { id: 'stats', label: '学情', emoji: '📊' },
]

function goBack() {
  uni.navigateBack()
}

function navigate(nav) {
  if (!nav) return
  if (nav.toast) {
    uni.showToast({ title: nav.toast, icon: 'none' })
    return
  }
  if (nav.tab) activeTab.value = nav.tab
}

function onGoCheckin(classId) {
  if (classId != null) checkinClassId.value = classId
  activeTab.value = 'checkin'
}
</script>

<style lang="scss">
@import '../styles/mp-common.scss';
</style>
