<template>
  <view class="tab-page">
    <view class="gradient-header" :style="{ background: `linear-gradient(150deg, ${accentColor} 0%, ${accentColor}99 100%)` }">
      <view class="header-row">
        <!-- TEMP_IDENTITY_RESELECT_BACK（DEBUG_MODE） -->
        <view
          v-if="debugMode"
          class="back-btn"
          @click="goIdentitySelect"
        ><text class="back-icon">‹</text></view>
        <view v-else class="header-side" />
        <view class="header-title-wrap">
          <text class="header-title">{{ homeTitle }}</text>
          <text v-if="homeDateLabel" class="header-date">{{ homeDateLabel }}</text>
        </view>
        <view class="header-side" />
      </view>

      <view style="display:flex;align-items:flex-start;padding:0 40rpx 16rpx;">
        <view style="width:120rpx;height:120rpx;border-radius:36rpx;background:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 8rpx 24rpx rgba(0,0,0,0.12);margin-right:24rpx;overflow:hidden;">
          <image v-if="activeChild.avatarUrl" :src="activeChild.avatarUrl" mode="aspectFill" style="width:120rpx;height:120rpx;" />
          <MpIcon v-else :name="activeChild.emoji || 'circle-user-round'" :size="64" :color="activeChild.avatarColor || accentColor" />
        </view>
        <view style="flex:1;padding-top:4rpx;min-width:0;">
          <view style="display:flex;align-items:center;">
            <text style="font-size:48rpx;font-weight:800;color:white;flex:1;min-width:0;">{{ activeChild.name }}</text>
            <view class="avatar-btn" style="flex-shrink:0;margin-left:16rpx;overflow:hidden;" @click="openProfile">
              <image v-if="parentAvatarUrl" :src="parentAvatarUrl" mode="aspectFill" style="width:64rpx;height:64rpx;" />
              <text v-else class="avatar-text">{{ parentAvatar }}</text>
            </view>
          </view>
          <text v-if="childHeaderSub" style="font-size:24rpx;color:rgba(255,255,255,0.8);display:block;margin-top:4rpx;">{{ childHeaderSub }}</text>
          <view style="display:flex;margin-top:16rpx;flex-wrap:wrap;">
            <view
              class="pill"
              style="background:rgba(255,255,255,0.25);color:white;margin-right:16rpx;"
              :style="activeChild.needsBind ? { background: 'rgba(255,255,255,0.95)', color: accentColor } : {}"
              @click="onCheckinPillClick"
            >
              <text style="font-size:22rpx;font-weight:700;">{{ activeChild.checkinLabel }}</text>
            </view>
            <view v-if="activeChild.inGarden" class="pill" style="background:rgba(255,255,255,0.18);color:white;">
              <text style="font-size:22rpx;">在托中</text>
            </view>
          </view>
        </view>
      </view>

      <scroll-view v-if="childOptions.length > 1" scroll-x style="padding:0 40rpx 12rpx;white-space:nowrap;">
        <view
          v-for="c in childOptions"
          :key="c.id"
          @click="selectChild(c.id)"
          style="display:inline-flex;padding:10rpx 24rpx;border-radius:24rpx;margin-right:12rpx;font-size:24rpx;font-weight:700;"
          :style="{ background: activeChildId === c.id ? 'white' : 'rgba(255,255,255,0.2)', color: activeChildId === c.id ? accentColor : 'white' }"
        >
          <text>{{ c.name }}</text>
        </view>
      </scroll-view>

      <view style="display:flex;padding:0 40rpx;border-top:1rpx solid rgba(255,255,255,0.2);margin-top:8rpx;">
        <view v-for="d in dayTabs" :key="d.val" style="padding:20rpx 32rpx 20rpx 0;font-size:26rpx;font-weight:700;"
          :style="{ color: dayTab === d.val ? 'white' : 'rgba(255,255,255,0.5)', borderBottom: dayTab === d.val ? '3rpx solid white' : '3rpx solid transparent' }"
          @click="switchDayTab(d.val)"><text>{{ d.label }}</text></view>
      </view>
    </view>

    <scroll-view scroll-y style="flex:1;height:0;background:#F5F7FA;">
      <view style="padding:24rpx 40rpx;">
        <view class="tl-head">
          <view class="tl-accent" :style="{ background: accentColor }" />
          <text class="tl-head-text">{{ dayTab === 'today' ? '今日动态' : '昨日动态' }}</text>
          <text v-if="!homeLoading && currentItems.length" class="tl-count">{{ currentItems.length }} 条</text>
        </view>

        <LoadingSkeleton v-if="homeLoading" variant="list" :count="3" padding="8rpx 0" />

        <view v-else-if="!currentItems.length" class="tl-empty">
          <MpIcon name="calendar-clock" :size="52" color="#C4CBD6" />
          <text class="tl-empty-title">暂无{{ dayTab === 'today' ? '今日' : '昨日' }}记录</text>
          <text class="tl-empty-sub">老师签到后，考勤记录会显示在这里</text>
        </view>

        <template v-else>
          <view v-for="(item, idx) in visibleItems" :key="item.id" class="tl-row">
            <view class="tl-rail">
              <view class="tl-node" :style="{ backgroundColor: typeConfig[item.type].bg }">
                <MpIcon :name="typeConfig[item.type].icon" :size="28" :color="typeConfig[item.type].color" />
              </view>
              <view v-if="idx !== visibleItems.length - 1" class="tl-line" />
            </view>

            <view class="tl-body">
              <view
                v-if="item.type === 'checkin' || item.type === 'checkout'"
                class="tl-card"
                :style="{ backgroundColor: typeConfig[item.type].bg }"
              >
                <view class="tl-card-top">
                  <text class="tl-title" :style="{ color: typeConfig[item.type].color }">{{ item.title }}</text>
                  <text class="tl-time">{{ item.time }}</text>
                </view>
                <view v-if="item.checkinMethod" style="margin-top:12rpx;">
                  <view class="pill" :style="{ backgroundColor: 'rgba(255,255,255,0.7)', color: typeConfig[item.type].color }"><text style="font-size:20rpx;">{{ item.checkinMethod }}</text></view>
                </view>
              </view>

              <view v-else-if="item.type === 'homework'" class="tl-card tl-card-white">
                <view class="tl-card-top">
                  <view class="pill" :style="{ backgroundColor: item.subjectColor + '18', color: item.subjectColor }"><text style="font-size:22rpx;font-weight:700;">{{ item.subject }}</text></view>
                  <text class="tl-time">{{ item.time }}</text>
                </view>
                <text class="tl-sub-title">{{ item.hwTitle }}</text>
                <text class="tl-desc">{{ item.hwComment }}</text>
              </view>

              <view v-else-if="item.type === 'meal'" class="tl-card tl-card-white">
                <view class="tl-card-top">
                  <view style="display:flex;align-items:center;gap:16rpx;flex:1;min-width:0;">
                    <view class="tl-meal-ico"><MpIcon :name="item.mealIcon || 'soup'" :size="34" color="#2E7D32" /></view>
                    <view style="flex:1;min-width:0;">
                      <text class="tl-meal-name">{{ item.mealName }}</text>
                      <text class="tl-meal-items">{{ item.mealItems }}</text>
                    </view>
                  </view>
                  <text class="tl-time">{{ item.time }}</text>
                </view>
                <text v-if="item.mealContent" class="tl-desc" style="margin-top:12rpx;">{{ item.mealContent }}</text>
                <scroll-view v-if="item.photos?.length" scroll-x style="white-space:nowrap;margin-top:12rpx;">
                  <image v-for="(p, pi) in item.photos" :key="pi" :src="p" mode="aspectFill" class="tl-photo" @click="previewTimelinePhotos(item.photos, pi)" />
                </scroll-view>
              </view>

              <view
                v-else-if="item.type === 'notice'"
                class="tl-card tl-card-white"
                style="border-left:6rpx solid #3B9EEB;"
                hover-class="tap-dim"
                @click="item.id === 'menu' && openMenu()"
              >
                <view class="tl-card-top">
                  <view class="pill" style="background:#E3F2FD;color:#3B9EEB;"><text style="font-size:20rpx;">{{ item.noticeSender }}</text></view>
                  <text class="tl-time">{{ item.time }}</text>
                </view>
                <text class="tl-sub-title">{{ item.noticeTitle }}</text>
                <text class="tl-desc">{{ item.noticeBody }}</text>
                <text v-if="item.id === 'menu'" style="font-size:22rpx;color:#3B9EEB;display:block;margin-top:8rpx;">点击查看完整食谱 ›</text>
              </view>
            </view>
          </view>

          <view v-if="currentItems.length > 2" class="tl-expand" hover-class="tap-dim" @click="timelineExpanded = !timelineExpanded">
            <text class="tl-expand-text" :style="{ color: accentColor }">{{ timelineExpanded ? '收起' : `展开全部 ${currentItems.length} 条` }}</text>
            <text style="font-size:20rpx;" :style="{ color: accentColor }">{{ timelineExpanded ? '▲' : '▼' }}</text>
          </view>
        </template>

        <view style="margin-bottom:28rpx;">
          <text style="font-size:26rpx;font-weight:800;color:#1F2937;display:block;margin-bottom:16rpx;">快捷功能</text>
          <view style="display:grid;grid-template-columns:repeat(4,1fr);gap:16rpx;">
            <view
              v-for="f in features"
              :key="f.label"
              class="feature-item"
              :style="{ backgroundColor: f.color + '18' }"
              @click="openFeature(f.nav)"
            >
              <view class="feature-icon-wrap" :style="{ backgroundColor: f.color + '28' }">
                <MpIcon :name="f.icon" :size="36" :color="f.color" />
              </view>
              <text class="feature-label">{{ f.label }}</text>
            </view>
          </view>
        </view>

        <view style="margin-bottom:24rpx;">
          <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16rpx;">
            <view style="display:flex;align-items:center;gap:10rpx;">
              <MpIcon name="building-2" :size="32" color="#1F2937" />
              <text style="font-size:26rpx;font-weight:800;color:#1F2937;">机构课程</text>
            </view>
            <text
              style="font-size:22rpx;"
              :style="{ color: accentColor }"
              @click="activeTab = 'courses'"
            >{{ courses.length }}门在招 ›</text>
          </view>
          <scroll-view scroll-x style="margin:0 -40rpx;padding:0 40rpx;">
            <view style="display:flex;gap:24rpx;">
              <view v-for="c in courses" :key="c.id" style="width:280rpx;flex-shrink:0;border-radius:28rpx;overflow:hidden;background:white;box-shadow:0 2rpx 16rpx rgba(0,0,0,0.08);" @click="openCourseDetail(c)">
                <view style="height:140rpx;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(135deg,#3B9EEB22 0%,#3B9EEB10 100%);">
                  <image v-if="c.coverUrl" :src="c.coverUrl" mode="aspectFill" style="width:100%;height:100%;" />
                </view>
                <view style="padding:20rpx;">
                  <view style="display:flex;align-items:center;gap:8rpx;margin-bottom:8rpx;flex-wrap:wrap;">
                    <view class="pill" style="background:#3B9EEB18;color:#3B9EEB;"><text style="font-size:20rpx;">{{ c.tag || '课程' }}</text></view>
                    <text v-if="c.sessions != null && c.sessions !== ''" style="font-size:20rpx;color:#6B7280;">{{ c.sessions }}课时</text>
                  </view>
                  <text style="font-size:26rpx;font-weight:800;color:#1F2937;display:block;">{{ c.title }}</text>
                  <text v-if="c.age" style="font-size:22rpx;color:#6B7280;display:block;margin-top:4rpx;">{{ c.age }}</text>
                  <text style="font-size:28rpx;font-weight:800;display:block;margin-top:8rpx;color:#3B9EEB;">{{ c.price }}</text>
                </view>
              </view>
              <view v-if="!courses.length" style="padding:32rpx 16rpx;">
                <text style="font-size:24rpx;color:#6B7280;">暂无在招课程</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { computed, inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchCourse } from '../../api/parent.js'
import { DEBUG_MODE } from '../../config.js'
import { clearRoleSelection } from '../../utils/auth.js'
import { PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const debugMode = DEBUG_MODE

const accentColor = ctx.accentColor
const activeTab = ctx.activeTab
const homeLoading = ctx.homeLoading
const homeTitle = ctx.homeTitle
const homeDateLabel = ctx.homeDateLabel
const childHeaderSub = ctx.childHeaderSub
const activeChild = ctx.activeChild
const activeChildId = ctx.activeChildId
const childOptions = ctx.childOptions
const parentAvatar = ctx.parentAvatar
const parentAvatarUrl = ctx.parentAvatarUrl
const todayItems = ctx.todayItems
const yesterdayItems = ctx.yesterdayItems
const courses = ctx.courses
const selectedCourse = ctx.selectedCourse
const menuVisible = ctx.menuVisible
const openProfile = ctx.openProfile
const goBindChild = ctx.goBindChild
const openFeature = ctx.openFeature
const refreshUnreadCount = ctx.refreshUnreadCount

const features = [
  { icon: 'clipboard-list', label: '作业', color: '#3B9EEB', nav: { tab: 'homework' } },
  { icon: 'sprout', label: '成长', color: '#66BB6A', nav: { tab: 'growth' } },
  { icon: 'images', label: '成长影集', color: '#AB47BC', nav: { tab: 'growth-album' } },
  { icon: 'utensils', label: '周食谱', color: '#00897B', nav: { menu: true } },
]

function onCheckinPillClick() {
  if (activeChild.value?.needsBind) {
    goBindChild()
  }
}

function openMenu() {
  menuVisible.value = true
}

function goIdentitySelect() {
  // TEMP_IDENTITY_RESELECT_BACK（DEBUG_MODE）
  if (!DEBUG_MODE) return
  clearRoleSelection()
  uni.reLaunch({ url: '/pages/index/index' })
}
const selectChild = ctx.selectChild
const loadParentHome = ctx.loadParentHome

const dayTabs = [{ val: 'today', label: '今天' }, { val: 'yesterday', label: '昨天' }]
const dayTab = ref('today')
const timelineExpanded = ref(false)

const typeConfig = {
  checkin:  { icon: 'circle-check', label: '签到',  color: '#2E7D32', bg: '#C8E6C9' },
  checkout: { icon: 'door-open', label: '签退',  color: '#1565C0', bg: '#BBDEFB' },
  homework: { icon: 'clipboard-list', label: '作业',  color: '#E65100', bg: '#FFF3E0' },
  meal:     { icon: 'soup', label: '餐食',  color: '#2E7D32', bg: '#F1F8E9' },
  notice:   { icon: 'megaphone', label: '通知',  color: '#1565C0', bg: '#E3F2FD' },
}

const currentItems = computed(() => dayTab.value === 'today' ? todayItems.value : yesterdayItems.value)
const visibleItems = computed(() => timelineExpanded.value ? currentItems.value : currentItems.value.slice(0, 2))

function switchDayTab(val) {
  dayTab.value = val
  timelineExpanded.value = false
}
function previewTimelinePhotos(urls, index) {
  uni.previewImage({ urls, current: urls[index] })
}

async function openCourseDetail(c) {
  const studentId = activeChildId.value
  const tenantId = ctx.membershipTenantId.value
  if (!studentId && !tenantId) return
  try {
    const detail = await fetchCourse(c.id, studentId || undefined, studentId ? undefined : tenantId)
    selectedCourse.value = {
      ...c,
      ...detail,
      outlines: detail.outlines || c.outlines || [],
    }
  } catch {
    selectedCourse.value = { ...c, outlines: c.outlines || [] }
  }
}

watch(() => props.active, (v) => {
  if (v) {
    timelineExpanded.value = false
    loadParentHome()
    refreshUnreadCount()
  }
}, { immediate: true })

watch(todayItems, () => { timelineExpanded.value = false })

onShow(() => {
  if (props.active) {
    loadParentHome()
    refreshUnreadCount()
  }
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 8rpx;
  border-radius: 20rpx;
}
.feature-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.feature-label { font-size: 22rpx; color: #6B7280; font-weight: 600; }

/* 动态时间线 */
.tl-head { display: flex; align-items: center; margin-bottom: 20rpx; }
.tl-accent { width: 8rpx; height: 30rpx; border-radius: 4rpx; margin-right: 14rpx; }
.tl-head-text { font-size: 30rpx; font-weight: 800; color: #1F2937; }
.tl-count { margin-left: 12rpx; font-size: 22rpx; color: #9CA3AF; font-weight: 600; }

.tl-empty { padding: 56rpx 24rpx; display: flex; flex-direction: column; align-items: center; background: white; border-radius: 24rpx; margin-bottom: 20rpx; }
.tl-empty-title { font-size: 28rpx; color: #4B5563; font-weight: 700; margin-top: 16rpx; }
.tl-empty-sub { font-size: 22rpx; color: #9CA3AF; margin-top: 8rpx; }

.tl-row { display: flex; }
.tl-rail { position: relative; width: 56rpx; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
.tl-node { width: 56rpx; height: 56rpx; border-radius: 28rpx; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 6rpx #F5F7FA; z-index: 2; margin-top: 2rpx; }
.tl-line { position: absolute; top: 56rpx; bottom: -6rpx; width: 2rpx; background: #E5E7EB; z-index: 1; }
.tl-body { flex: 1; min-width: 0; padding-left: 20rpx; padding-bottom: 24rpx; }

.tl-card { border-radius: 20rpx; padding: 20rpx 24rpx; }
.tl-card-white { background: white; box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05); }
.tl-card-top { display: flex; align-items: center; gap: 12rpx; }
.tl-title { font-size: 28rpx; font-weight: 700; flex: 1; min-width: 0; }
.tl-time { font-size: 20rpx; color: #9CA3AF; flex-shrink: 0; margin-left: auto; }
.tl-sub-title { font-size: 27rpx; font-weight: 700; color: #1F2937; display: block; margin-top: 12rpx; }
.tl-desc { font-size: 24rpx; color: #6B7280; line-height: 1.6; display: block; margin-top: 6rpx; }
.tl-meal-ico { width: 72rpx; height: 72rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; background: #F1F8E9; flex-shrink: 0; }
.tl-meal-name { font-size: 27rpx; font-weight: 700; color: #1F2937; display: block; }
.tl-meal-items { font-size: 22rpx; color: #6B7280; display: block; margin-top: 4rpx; }
.tl-photo { width: 160rpx; height: 160rpx; border-radius: 14rpx; margin-right: 12rpx; background: #F5F0EC; display: inline-block; }

.tl-expand { display: flex; align-items: center; justify-content: center; gap: 12rpx; padding: 20rpx; background: white; border-radius: 20rpx; margin-bottom: 20rpx; }
.tl-expand-text { font-size: 24rpx; font-weight: 700; }

.tap-dim { opacity: 0.6; }
</style>
