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
      <CoursesPanel
        v-else-if="shellTab === 'courses'"
        :page-show-count="pageShowCount"
        @navigate="onNavigate"
        @open-course="openCourse"
      />
      <NoticesPanel v-else-if="shellTab === 'notice'" :page-show-count="pageShowCount" @navigate="onNavigate" />

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
          <InstitutionInnerPages
            ref="innerPagesRef"
            :inner-key="innerKey"
            :page-show-count="pageShowCount"
            :course="selectedCourse"
            @navigate="onNavigate"
            @close-announcements="activeTab = lastMainTab"
          />
        </view>
      </page-container>
      <!-- #endif -->

      <!-- #ifdef H5 -->
      <view v-if="innerShow" class="h5-inner-overlay">
        <view class="mp-inner-wrap">
          <InstitutionInnerPages
            ref="innerPagesRef"
            :inner-key="innerKey"
            :page-show-count="pageShowCount"
            :course="selectedCourse"
            @navigate="onNavigate"
            @close-announcements="activeTab = lastMainTab"
          />
        </view>
      </view>
      <!-- #endif -->

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
import { ref, computed, provide, watch } from 'vue'
import { onShow, onBackPress } from '@dcloudio/uni-app'
import { navSafeCssVars } from './utils/safeArea.js'
import { MP_PAGE_CONTAINER_PROPS, createPageContainerBridge } from './utils/mpPageContainer.js'
import { loadApps, hasApp, MP_APPS_KEY } from '../utils/apps.js'

import HomePanel from '../components/institution/HomePanel.vue'
import TeachersPanel from '../components/institution/TeachersPanel.vue'
import StudentsPanel from '../components/institution/StudentsPanel.vue'
import CoursesPanel from '../components/institution/CoursesPanel.vue'
import NoticesPanel from '../components/institution/NoticesPanel.vue'
import InstitutionInnerPages from '../components/institution/InstitutionInnerPages.vue'
import PlatformAnnouncementPopup from '../components/institution/PlatformAnnouncementPopup.vue'

const navSafeStyle = navSafeCssVars()
const activeTab = ref('home')
const MAIN_TABS = ['home', 'teachers', 'students', 'courses', 'notice']
const isMainTab = computed(() => MAIN_TABS.includes(activeTab.value))
const lastMainTab = ref('home')
const innerKey = ref('')
const selectedCourse = ref(null)
const shellTab = computed(() => (isMainTab.value ? activeTab.value : lastMainTab.value))
const pageShowCount = ref(0)
const innerPagesRef = ref(null)
const pcProps = MP_PAGE_CONTAINER_PROPS
const mpApps = ref([])
provide(MP_APPS_KEY, mpApps)

const APP_GATED_TABS = {
  leaves: ['ATTENDANCE'],
  meals: ['NUTRITION'],
  homework: ['HOMEWORK'],
  attendance: ['HOSTING', 'ATTENDANCE'],
  daily: ['HOSTING'],
  'lesson-attend': ['HOSTING'],
  'lesson-consume': ['HOSTING'],
  report: ['HOSTING'],
}

const navTabs = [
  { id: 'home',     label: '总览',  emoji: '🏠' },
  { id: 'teachers', label: '师资',  emoji: '👩‍🏫' },
  { id: 'students', label: '学生',  emoji: '🎓' },
  { id: 'courses',  label: '课程',  emoji: '📚' },
  { id: 'notice',   label: '通知',  emoji: '📢' },
]

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
  if (activeTab.value === 'announcements') {
    const handled = innerPagesRef.value?.onSwipeBack?.()
    if (handled) return true
  }
  activeTab.value = lastMainTab.value || 'home'
  return false
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
  if (!alive) {
    innerKey.value = ''
    selectedCourse.value = null
  }
})

onBackPress(() => {
  if (!isInnerOpen()) return false
  popInnerOnce()
  return true
})

function onNavigate(tab) {
  if (!tab) return
  const need = APP_GATED_TABS[tab]
  if (need && !need.some((code) => hasApp(code, mpApps.value))) {
    uni.showToast({ title: '请联系平台开通', icon: 'none' })
    return
  }
  activeTab.value = tab
}

function openCourse(course) {
  selectedCourse.value = course || null
  activeTab.value = 'course-detail'
}

function openAnnouncements() {
  activeTab.value = 'announcements'
}

async function refreshApps() {
  try {
    mpApps.value = await loadApps({ force: true })
  } catch {
    // keep cache
  }
}

onShow(() => {
  pageShowCount.value += 1
  refreshApps()
})
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

<style lang="scss" scoped>
@import '../styles/mp-institution.scss';

.mp-inner-wrap {
  background: #faf5ff;
}
</style>
