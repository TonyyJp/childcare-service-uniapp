<template>
  <view class="page" :style="navSafeStyle">
    <view class="content">
      <HomePanel v-if="shellTab === 'home'" :active="shellTab === 'home'" />
      <SchedulePanel v-else-if="shellTab === 'schedule'" :active="true" />
      <FeedPanel v-else-if="shellTab === 'feed'" :active="true" />
      <ProfileHub v-else-if="shellTab === 'me'" />

      <!-- 全页唯一 page-container：承接所有内页右滑 / 系统返回 -->
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
        <view class="profile-sub-wrap" :style="innerWrapStyle">
          <ProfileChild v-if="innerKey === 'profile:child'" :active="innerShow" />
          <ProfilePickup v-else-if="innerKey === 'profile:pickup'" :active="innerShow" />
          <ProfileFace v-else-if="innerKey === 'profile:face'" />
          <ProfileLeave v-else-if="innerKey === 'profile:leave'" :active="innerShow" />
          <ProfileLessonPackage v-else-if="innerKey === 'profile:lesson-package'" :active="innerShow" />
          <ProfileTrial v-else-if="innerKey === 'profile:trial'" :active="innerShow" />
          <ProfileInfo v-else-if="innerKey === 'profile:info'" :active="innerShow" />
          <ProfileNotify v-else-if="innerKey === 'profile:notify'" :active="innerShow" />
          <ProfilePrivacy v-else-if="innerKey === 'profile:privacy'" />
          <ProfileHelp v-else-if="innerKey === 'profile:help'" :active="innerShow" />
          <ProfileSatisfaction v-else-if="innerKey === 'profile:satisfaction'" :active="innerShow" />
          <ProfileAbout v-else-if="innerKey === 'profile:about'" />
          <MessagesPanel v-else-if="innerKey === 'profile:messages'" :active="innerShow" :show-back="true" />

          <HomeworkPanel v-else-if="innerKey === 'tab:homework'" :active="true" />
          <CourseListPanel v-else-if="innerKey === 'tab:courses'" :active="true" />
          <GrowthAlbumPanel v-else-if="innerKey === 'tab:growth-album'" :active="true" />
          <GrowthPanel v-else-if="innerKey === 'tab:growth'" :active="true" />

          <CourseDetailOverlay
            v-else-if="innerKey === 'course-detail'"
            :course="selectedCourse || courseSnap"
            @close="selectedCourse = null"
          />
          <MenuOverlay v-else-if="innerKey === 'menu'" @close="menuVisible = false" />

          <FeedSubPages
            v-else-if="innerKey === 'feed-bell'"
            mode="bell"
            @close="onFeedSubClose"
            @opened-detail="onFeedOpenedDetail"
          />
          <FeedSubPages
            v-else-if="innerKey === 'feed-detail'"
            mode="detail"
            :post-id="feedDetailPostId || feedPostSnap"
            @close="onFeedSubClose"
          />
        </view>
      </page-container>
    </view>

    <view v-if="showBottomNav" class="bottom-nav">
      <view v-for="tab in navTabs" :key="tab.id" class="nav-item" @click="activeTab = tab.id">
        <view style="position:relative;display:inline-flex;">
          <MpIcon
            class="nav-icon"
            :name="tab.icon"
            :size="44"
            :color="activeTab === tab.id ? accentColor : '#9CA3AF'"
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
        <text class="nav-label" :style="{ color: activeTab === tab.id ? accentColor : '#9CA3AF', fontWeight: activeTab === tab.id ? '700' : '500' }">{{ tab.label }}</text>
        <view v-if="activeTab === tab.id" class="nav-dot" :style="{ backgroundColor: accentColor }" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, provide, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navSafeCssVars } from './utils/safeArea.js'
import { MP_PAGE_CONTAINER_PROPS, createPageContainerBridge } from './utils/mpPageContainer.js'
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
import FeedSubPages from '../components/parent/FeedSubPages.vue'
import ProfileHub from '../components/parent/ProfileHub.vue'
import ProfileChild from '../components/parent/ProfileChild.vue'
import ProfilePickup from '../components/parent/ProfilePickup.vue'
import ProfileFace from '../components/parent/ProfileFace.vue'
import ProfileLeave from '../components/parent/ProfileLeave.vue'
import ProfileLessonPackage from '../components/parent/ProfileLessonPackage.vue'
import ProfileTrial from '../components/parent/ProfileTrial.vue'
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
  feedDetailVisible,
  feedBellVisible,
  feedDetailPostId,
  closeFeedDetail,
  closeFeedBell,
  openFeedDetail,
  feedDailyUnread,
  feedCommentUnread,
  refreshUnreadCount,
} = ctx

const MAIN_TABS = ['home', 'schedule', 'feed', 'me']
const INNER_TABS = ['homework', 'courses', 'growth-album', 'growth']
const pcProps = MP_PAGE_CONTAINER_PROPS

const navTabs = [
  { id: 'home', label: '首页', icon: 'home' },
  { id: 'schedule', label: '课表', icon: 'calendar' },
  { id: 'feed', label: '动态', icon: 'camera' },
  { id: 'me', label: '我的', icon: 'user' },
]

const shellTab = computed(() => {
  if (MAIN_TABS.includes(activeTab.value)) return activeTab.value
  return 'home'
})

const showBottomNav = computed(() => {
  if (selectedCourse.value || menuVisible.value) return false
  if (feedDetailVisible.value || feedBellVisible.value) return false
  if (!MAIN_TABS.includes(activeTab.value)) return false
  if (activeTab.value === 'me' && profilePage.value !== 'main') return false
  return true
})

function resolveInnerKey() {
  if (feedBellVisible.value) return 'feed-bell'
  if (feedDetailVisible.value) return 'feed-detail'
  if (selectedCourse.value) return 'course-detail'
  if (menuVisible.value) return 'menu'
  if (activeTab.value === 'me' && profilePage.value && profilePage.value !== 'main') {
    return `profile:${profilePage.value}`
  }
  if (INNER_TABS.includes(activeTab.value)) return `tab:${activeTab.value}`
  return ''
}

function isInnerOpen() {
  return !!resolveInnerKey()
}

function popInnerOnce() {
  if (feedBellVisible.value) {
    closeFeedBell()
    return isInnerOpen()
  }
  if (feedDetailVisible.value) {
    closeFeedDetail()
    return isInnerOpen()
  }
  if (selectedCourse.value) {
    selectedCourse.value = null
    return isInnerOpen()
  }
  if (menuVisible.value) {
    menuVisible.value = false
    return false
  }
  if (activeTab.value === 'me' && profilePage.value !== 'main') {
    profilePage.value = 'main'
    return false
  }
  if (INNER_TABS.includes(activeTab.value)) {
    activeTab.value = 'home'
    return false
  }
  return false
}

function onFeedSubClose(which) {
  if (which === 'bell') closeFeedBell()
  else closeFeedDetail()
}

function onFeedOpenedDetail(postId) {
  closeFeedBell()
  openFeedDetail(postId)
}

const innerKey = ref('')
const courseSnap = ref(null)
const feedPostSnap = ref(null)
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

watch(
  [activeTab, profilePage, selectedCourse, menuVisible, feedDetailVisible, feedBellVisible],
  () => {
    const key = resolveInnerKey()
    if (key) innerKey.value = key
  },
  { immediate: true },
)

watch(selectedCourse, (c) => {
  if (c) courseSnap.value = c
})
watch(feedDetailPostId, (id) => {
  if (id) feedPostSnap.value = id
})

watch(contentAlive, (alive) => {
  if (!alive) {
    innerKey.value = ''
    courseSnap.value = null
    feedPostSnap.value = null
  }
})

const innerWrapStyle = computed(() => {
  if (String(innerKey.value).startsWith('feed-')) return { background: '#f5f7fa' }
  if (innerKey.value === 'menu' || String(innerKey.value).startsWith('profile:')) {
    return { background: '#f5f7fa' }
  }
  return { background: '#ffffff' }
})

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
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}
</style>
