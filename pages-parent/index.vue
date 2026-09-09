<template>
  <view class="page" :style="navSafeStyle">
    <view class="content">
      <HomePanel v-if="activeTab === 'home'" :active="activeTab === 'home'" />
      <HomeworkPanel v-else-if="activeTab === 'homework'" :active="true" />
      <SchedulePanel v-else-if="activeTab === 'schedule'" :active="true" />
      <GrowthPanel v-else-if="activeTab === 'growth'" :active="true" />
      <MessagesPanel v-else-if="activeTab === 'message'" :active="true" />

      <view v-if="showProfile" class="overlay-page" style="z-index:60;">
        <ProfileHub v-if="profilePage === 'main'" />
        <ProfileChild v-else-if="profilePage === 'child'" :active="true" />
        <ProfileHealth v-else-if="profilePage === 'health'" />
        <ProfilePickup v-else-if="profilePage === 'pickup'" :active="true" />
        <ProfileLeave v-else-if="profilePage === 'leave'" :active="true" />
        <ProfileInfo v-else-if="profilePage === 'info'" :active="true" />
        <ProfileNotify v-else-if="profilePage === 'notify'" />
        <ProfilePrivacy v-else-if="profilePage === 'privacy'" />
        <ProfileHelp v-else-if="profilePage === 'help'" :active="true" />
        <ProfileSatisfaction v-else-if="profilePage === 'satisfaction'" :active="true" />
        <ProfileAbout v-else-if="profilePage === 'about'" />
      </view>

      <CourseDetailOverlay
        v-if="selectedCourse"
        :course="selectedCourse"
        @close="selectedCourse = null"
      />
    </view>

    <view v-if="!selectedCourse && !showProfile && activeTab !== 'homework'" class="bottom-nav">
      <view v-for="tab in navTabs" :key="tab.id" class="nav-item" @click="activeTab = tab.id">
        <view style="position:relative;display:inline-flex;">
          <text class="nav-icon" :style="{ color: activeTab === tab.id ? accentColor : '#8D6E63' }">{{ tab.emoji }}</text>
          <view v-if="tab.id === 'message' && unreadCount > 0" style="position:absolute;top:-6rpx;right:-6rpx;min-width:24rpx;height:24rpx;border-radius:12rpx;background:#E53935;display:flex;align-items:center;justify-content:center;">
            <text style="font-size:18rpx;color:white;font-weight:700;">{{ unreadCount }}</text>
          </view>
        </view>
        <text class="nav-label" :style="{ color: activeTab === tab.id ? accentColor : '#8D6E63', fontWeight: activeTab === tab.id ? '700' : '500' }">{{ tab.label }}</text>
        <view v-if="activeTab === tab.id" class="nav-dot" :style="{ backgroundColor: accentColor }" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { provide } from 'vue'
import { navSafeCssVars } from '../utils/safeArea.js'
import { createParentContext, PARENT_CTX_KEY } from '../components/parent/parentContext.js'
import HomePanel from '../components/parent/HomePanel.vue'
import HomeworkPanel from '../components/parent/HomeworkPanel.vue'
import SchedulePanel from '../components/parent/SchedulePanel.vue'
import GrowthPanel from '../components/parent/GrowthPanel.vue'
import MessagesPanel from '../components/parent/MessagesPanel.vue'
import CourseDetailOverlay from '../components/parent/CourseDetailOverlay.vue'
import ProfileHub from '../components/parent/ProfileHub.vue'
import ProfileChild from '../components/parent/ProfileChild.vue'
import ProfileHealth from '../components/parent/ProfileHealth.vue'
import ProfilePickup from '../components/parent/ProfilePickup.vue'
import ProfileLeave from '../components/parent/ProfileLeave.vue'
import ProfileInfo from '../components/parent/ProfileInfo.vue'
import ProfileNotify from '../components/parent/ProfileNotify.vue'
import ProfilePrivacy from '../components/parent/ProfilePrivacy.vue'
import ProfileHelp from '../components/parent/ProfileHelp.vue'
import ProfileSatisfaction from '../components/parent/ProfileSatisfaction.vue'
import ProfileAbout from '../components/parent/ProfileAbout.vue'

const navSafeStyle = navSafeCssVars()
const ctx = createParentContext()
provide(PARENT_CTX_KEY, ctx)

const {
  accentColor,
  activeTab,
  showProfile,
  profilePage,
  selectedCourse,
  unreadCount,
} = ctx

const navTabs = [
  { id: 'home', label: '宝贝', emoji: '👶' },
  { id: 'growth', label: '成长', emoji: '🌱' },
  { id: 'schedule', label: '课表', emoji: '📅' },
  { id: 'message', label: '消息', emoji: '💬' },
]
</script>

<style lang="scss">
@import '../styles/mp-common.scss';
</style>
