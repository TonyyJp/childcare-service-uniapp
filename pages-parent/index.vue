<template>
  <view class="page" :style="navSafeStyle">
    <view class="content">
      <HomePanel v-if="activeTab === 'home'" :active="activeTab === 'home'" />
      <HomeworkPanel v-else-if="activeTab === 'homework'" :active="true" />
      <CourseListPanel v-else-if="activeTab === 'courses'" :active="true" />
      <GrowthAlbumPanel v-else-if="activeTab === 'growth-album'" :active="true" />
      <SchedulePanel v-else-if="activeTab === 'schedule'" :active="true" />
      <GrowthPanel v-else-if="activeTab === 'growth'" :active="true" />
      <FeedPanel v-else-if="activeTab === 'feed'" :active="true" />
      <template v-else-if="activeTab === 'me'">
        <!-- 子页叠在 Hub 上；page-container 接管右滑/系统返回，避免直接退出小程序 -->
        <ProfileHub />
        <page-container
          :show="profileSubShow"
          position="right"
          :overlay="true"
          :round="false"
          :close-on-slide-down="false"
          custom-style="width:100%;height:100%;"
          @beforeleave="onProfileSubBeforeLeave"
          @afterleave="onProfileSubAfterLeave"
        >
          <view class="profile-sub-wrap">
            <ProfileChild v-if="profileSubKey === 'child'" :active="profileSubShow" />
            <ProfilePickup v-else-if="profileSubKey === 'pickup'" :active="profileSubShow" />
            <ProfileFace v-else-if="profileSubKey === 'face'" />
            <ProfileLeave v-else-if="profileSubKey === 'leave'" :active="profileSubShow" />
            <ProfileInfo v-else-if="profileSubKey === 'info'" :active="profileSubShow" />
            <ProfileNotify v-else-if="profileSubKey === 'notify'" :active="profileSubShow" />
            <ProfilePrivacy v-else-if="profileSubKey === 'privacy'" />
            <ProfileHelp v-else-if="profileSubKey === 'help'" :active="profileSubShow" />
            <ProfileSatisfaction v-else-if="profileSubKey === 'satisfaction'" :active="profileSubShow" />
            <ProfileAbout v-else-if="profileSubKey === 'about'" />
            <MessagesPanel v-else-if="profileSubKey === 'messages'" :active="profileSubShow" :show-back="true" />
          </view>
        </page-container>
      </template>

      <CourseDetailOverlay
        v-if="selectedCourse"
        :course="selectedCourse"
        @close="selectedCourse = null"
      />

      <MenuOverlay v-if="menuVisible" @close="menuVisible = false" />
    </view>

    <view v-if="showBottomNav" class="bottom-nav">
      <view v-for="tab in navTabs" :key="tab.id" class="nav-item" @click="activeTab = tab.id">
        <view style="position:relative;display:inline-flex;">
          <MpIcon
            class="nav-icon"
            :name="tab.icon"
            :size="44"
            :color="activeTab === tab.id ? accentColor : '#8D6E63'"
          />
          <view
            v-if="tab.id === 'feed' && feedCommentUnread > 0"
            style="position:absolute;top:-6rpx;right:-10rpx;min-width:28rpx;height:28rpx;padding:0 6rpx;border-radius:14rpx;background:#E53935;display:flex;align-items:center;justify-content:center;"
          >
            <text style="font-size:18rpx;color:white;font-weight:700;">{{ feedCommentUnread > 99 ? '99+' : feedCommentUnread }}</text>
          </view>
          <view
            v-else-if="tab.id === 'feed' && feedDailyUnread > 0"
            style="position:absolute;top:-4rpx;right:-4rpx;width:16rpx;height:16rpx;border-radius:8rpx;background:#E53935;"
          />
        </view>
        <text class="nav-label" :style="{ color: activeTab === tab.id ? accentColor : '#8D6E63', fontWeight: activeTab === tab.id ? '700' : '500' }">{{ tab.label }}</text>
        <view v-if="activeTab === tab.id" class="nav-dot" :style="{ backgroundColor: accentColor }" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, provide, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navSafeCssVars } from '../utils/safeArea.js'
import { createParentContext, PARENT_CTX_KEY } from '../components/parent/parentContext.js'
import HomePanel from '../components/parent/HomePanel.vue'
import HomeworkPanel from '../components/parent/HomeworkPanel.vue'
import CourseListPanel from '../components/parent/CourseListPanel.vue'
import GrowthAlbumPanel from '../components/parent/GrowthAlbumPanel.vue'
import SchedulePanel from '../components/parent/SchedulePanel.vue'
import GrowthPanel from '../components/parent/GrowthPanel.vue'
import FeedPanel from '../components/parent/FeedPanel.vue'
import MessagesPanel from '../components/parent/MessagesPanel.vue'
import CourseDetailOverlay from '../components/parent/CourseDetailOverlay.vue'
import MenuOverlay from '../components/parent/MenuOverlay.vue'
import ProfileHub from '../components/parent/ProfileHub.vue'
import ProfileChild from '../components/parent/ProfileChild.vue'
import ProfilePickup from '../components/parent/ProfilePickup.vue'
import ProfileFace from '../components/parent/ProfileFace.vue'
import ProfileLeave from '../components/parent/ProfileLeave.vue'
import ProfileInfo from '../components/parent/ProfileInfo.vue'
import ProfileNotify from '../components/parent/ProfileNotify.vue'
import ProfilePrivacy from '../components/parent/ProfilePrivacy.vue'
import ProfileHelp from '../components/parent/ProfileHelp.vue'
import ProfileSatisfaction from '../components/parent/ProfileSatisfaction.vue'
import ProfileAbout from '../components/parent/ProfileAbout.vue'
import MpIcon from '../components/MpIcon.vue'

const navSafeStyle = navSafeCssVars()
const ctx = createParentContext()
provide(PARENT_CTX_KEY, ctx)

const {
  accentColor,
  activeTab,
  profilePage,
  selectedCourse,
  menuVisible,
  feedDailyUnread,
  feedCommentUnread,
  refreshUnreadCount,
} = ctx

const navTabs = [
  { id: 'home', label: '首页', icon: 'home' },
  { id: 'schedule', label: '课表', icon: 'calendar' },
  { id: 'feed', label: '动态', icon: 'camera' },
  { id: 'me', label: '我的', icon: 'user' },
]

const mainTabs = new Set(['home', 'schedule', 'feed', 'me'])
const showBottomNav = computed(() => {
  if (selectedCourse.value || menuVisible.value) return false
  if (!mainTabs.has(activeTab.value)) return false
  if (activeTab.value === 'me' && profilePage.value !== 'main') return false
  return true
})

/** 子页内容 key：关闭动画期间仍保留，避免内容瞬间消失 */
const profileSubKey = ref('main')
const profileSubShow = computed(() => profilePage.value !== 'main')

watch(profilePage, (page) => {
  if (page && page !== 'main') profileSubKey.value = page
})

function onProfileSubBeforeLeave() {
  // 右滑 / 安卓返回键：同步状态，由 page-container 收起而非退出小程序
  if (profilePage.value !== 'main') profilePage.value = 'main'
}

function onProfileSubAfterLeave() {
  profileSubKey.value = 'main'
}

watch(activeTab, (tab) => {
  if (tab === 'me' && !profilePage.value) profilePage.value = 'main'
  if (tab !== 'me' && profilePage.value !== 'main') profilePage.value = 'main'
})

onShow(() => {
  refreshUnreadCount()
})
</script>

<style lang="scss">
@import '../styles/mp-common.scss';

.profile-sub-wrap {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background: #f0f7ff;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}
</style>
