<template>
  <view class="tab-page">
    <view class="gradient-header" :style="{ background: `linear-gradient(150deg, ${accentColor} 0%, ${accentColor}99 100%)` }">
      <view class="header-row">
        <view class="header-side" />
        <text class="header-title">{{ homeDateLabel }}</text>
        <view class="header-side" />
      </view>

      <view style="display:flex;align-items:flex-start;padding:0 40rpx 16rpx;">
        <view style="width:120rpx;height:120rpx;border-radius:36rpx;background:white;display:flex;align-items:center;justify-content:center;font-size:60rpx;flex-shrink:0;box-shadow:0 8rpx 24rpx rgba(0,0,0,0.12);margin-right:24rpx;">
          <text>{{ activeChild.emoji }}</text>
        </view>
        <view style="flex:1;padding-top:4rpx;min-width:0;">
          <view style="display:flex;align-items:center;">
            <text style="font-size:48rpx;font-weight:800;color:white;flex:1;min-width:0;">{{ activeChild.name }}</text>
            <view class="avatar-btn" style="flex-shrink:0;margin-left:16rpx;" @click="openProfile"><text class="avatar-text">{{ parentAvatar }}</text></view>
          </view>
          <text style="font-size:24rpx;color:rgba(255,255,255,0.8);display:block;margin-top:4rpx;">{{ activeChild.class }} · {{ activeChild.tenant }}</text>
          <view style="display:flex;margin-top:16rpx;flex-wrap:wrap;">
            <view class="pill" style="background:rgba(255,255,255,0.25);color:white;margin-right:16rpx;">
              <text style="font-size:22rpx;">{{ activeChild.checkinLabel }}</text>
            </view>
            <view v-if="activeChild.inGarden" class="pill" style="background:rgba(255,255,255,0.18);color:white;">
              <text style="font-size:22rpx;">在园中</text>
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

    <scroll-view scroll-y style="flex:1;height:0;background:#F0F7FF;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="homeLoading" style="padding:40rpx 0;text-align:center;">
          <text style="color:#8D6E63;font-size:26rpx;">加载今日动态…</text>
        </view>

        <view v-else-if="!currentItems.length" style="padding:48rpx 24rpx;text-align:center;background:white;border-radius:20rpx;margin-bottom:20rpx;">
          <text style="font-size:28rpx;color:#8D6E63;">暂无{{ dayTab === 'today' ? '今日' : '昨日' }}动态</text>
          <text style="font-size:22rpx;color:#BDBDBD;display:block;margin-top:12rpx;">教师点名后，考勤会出现在这里</text>
        </view>

        <view v-for="item in visibleItems" :key="item.id">
          <view style="display:flex;gap:20rpx;margin-bottom:16rpx;">
            <view style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:88rpx;">
              <text style="font-size:20rpx;color:#BDBDBD;line-height:40rpx;">{{ item.time }}</text>
              <view style="width:48rpx;height:48rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;margin-top:4rpx;" :style="{ backgroundColor: typeConfig[item.type].bg }">
                <text style="font-size:22rpx;">{{ typeConfig[item.type].icon }}</text>
              </view>
            </view>

            <view style="flex:1;margin-bottom:8rpx;">
              <view v-if="item.type === 'checkin' || item.type === 'checkout'" style="border-radius:20rpx;padding:20rpx 24rpx;display:flex;align-items:center;gap:16rpx;flex-wrap:wrap;" :style="{ backgroundColor: typeConfig[item.type].bg }">
                <text style="font-size:26rpx;font-weight:700;" :style="{ color: typeConfig[item.type].color }">{{ item.title }}</text>
                <view v-if="item.checkinMethod" class="pill" :style="{ backgroundColor: 'rgba(255,255,255,0.7)', color: typeConfig[item.type].color }"><text style="font-size:20rpx;">{{ item.checkinMethod }}</text></view>
              </view>

              <view v-else-if="item.type === 'homework'" class="card" style="padding:20rpx 24rpx;">
                <view style="display:flex;align-items:center;gap:16rpx;margin-bottom:12rpx;">
                  <view class="pill" :style="{ backgroundColor: item.subjectColor + '18', color: item.subjectColor }"><text style="font-size:22rpx;font-weight:700;">{{ item.subject }}</text></view>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;flex:1;">{{ item.hwTitle }}</text>
                </view>
                <text style="font-size:24rpx;color:#8D6E63;line-height:1.6;">{{ item.hwComment }}</text>
              </view>

              <view v-else-if="item.type === 'meal'" class="card" style="padding:20rpx 24rpx;">
                <view style="display:flex;align-items:center;gap:20rpx;margin-bottom:12rpx;">
                  <view style="width:72rpx;height:72rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center;font-size:36rpx;background:#F1F8E9;flex-shrink:0;"><text>{{ item.mealEmoji }}</text></view>
                  <view style="flex:1;">
                    <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;margin-bottom:8rpx;">{{ item.mealName }}</text>
                    <text style="font-size:22rpx;color:#8D6E63;">{{ item.mealItems }}</text>
                  </view>
                </view>
                <scroll-view v-if="item.photos?.length" scroll-x style="white-space:nowrap;">
                  <image v-for="(p, pi) in item.photos" :key="pi" :src="p" mode="aspectFill"
                    style="width:160rpx;height:160rpx;border-radius:12rpx;margin-right:12rpx;background:#F5F0EC;display:inline-block;"
                    @click="previewTimelinePhotos(item.photos, pi)" />
                </scroll-view>
              </view>

              <view v-else-if="item.type === 'notice'" class="card" style="padding:20rpx 24rpx;border-left:6rpx solid #3B9EEB;" @click="item.id === 'menu' && openMenu()">
                <view class="pill" style="background:#E3F2FD;color:#3B9EEB;margin-bottom:12rpx;"><text style="font-size:20rpx;">{{ item.noticeSender }}</text></view>
                <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;margin-bottom:8rpx;">{{ item.noticeTitle }}</text>
                <text style="font-size:24rpx;color:#8D6E63;line-height:1.6;">{{ item.noticeBody }}</text>
                <text v-if="item.id === 'menu'" style="font-size:22rpx;color:#3B9EEB;display:block;margin-top:8rpx;">点击查看完整食谱 ›</text>
              </view>

              <view v-else-if="item.type === 'daily'" class="card" style="padding:20rpx 24rpx;">
                <view style="display:flex;align-items:center;gap:12rpx;margin-bottom:12rpx;">
                  <text style="font-size:36rpx;">{{ item.coverEmoji || '📷' }}</text>
                  <view class="pill" style="background:#F3E5F5;color:#7B1FA2;"><text style="font-size:20rpx;">{{ item.topic || '日常' }}</text></view>
                </view>
                <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;">{{ item.aiText }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="currentItems.length > 2" style="display:flex;align-items:center;justify-content:center;gap:12rpx;padding:20rpx;background:white;border-radius:20rpx;margin-bottom:20rpx;" @click="timelineExpanded = !timelineExpanded">
          <text style="font-size:24rpx;font-weight:700;" :style="{ color: accentColor }">{{ timelineExpanded ? '收起' : `展开全部 ${currentItems.length} 条动态` }}</text>
          <text style="font-size:20rpx;" :style="{ color: accentColor }">{{ timelineExpanded ? '▲' : '▼' }}</text>
        </view>

        <view style="margin-bottom:24rpx;">
          <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16rpx;">
            <text style="font-size:26rpx;font-weight:800;color:#2D1F18;">🏫 机构课程</text>
            <text style="font-size:22rpx;" :style="{ color: accentColor }">智优托教 · {{ courses.length }}门在招</text>
          </view>
          <scroll-view scroll-x style="margin:0 -40rpx;padding:0 40rpx;">
            <view style="display:flex;gap:24rpx;">
              <view v-for="c in courses" :key="c.id" style="width:280rpx;flex-shrink:0;border-radius:28rpx;overflow:hidden;background:white;box-shadow:0 2rpx 16rpx rgba(0,0,0,0.08);" @click="openCourseDetail(c)">
                <view style="height:140rpx;display:flex;align-items:center;justify-content:center;" :style="{ background: `linear-gradient(135deg, ${c.color}22 0%, ${c.color}10 100%)` }">
                  <text style="font-size:72rpx;">{{ c.icon }}</text>
                </view>
                <view style="padding:20rpx;">
                  <view style="display:flex;align-items:center;gap:8rpx;margin-bottom:8rpx;">
                    <view class="pill" :style="{ backgroundColor: c.color + '18', color: c.color }"><text style="font-size:20rpx;">{{ c.tag }}</text></view>
                  </view>
                  <text style="font-size:26rpx;font-weight:800;color:#2D1F18;display:block;">{{ c.title }}</text>
                  <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:4rpx;">{{ c.teacher }} · {{ c.age }}</text>
                  <text style="font-size:28rpx;font-weight:800;display:block;margin-top:8rpx;" :style="{ color: c.color }">{{ c.price }}</text>
                </view>
              </view>
              <view v-if="!courses.length" style="padding:32rpx 16rpx;">
                <text style="font-size:24rpx;color:#8D6E63;">暂无在招课程</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="card" style="padding:24rpx;display:flex;align-items:center;gap:20rpx;margin-bottom:32rpx;" @click="activeTab = 'homework'">
          <view style="width:88rpx;height:88rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;font-size:44rpx;background:#E3F2FD;flex-shrink:0;"><text>📋</text></view>
          <view style="flex:1;">
            <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">作业查看</text>
            <text style="font-size:22rpx;color:#8D6E63;margin-top:4rpx;display:block;">{{ homeworkEntryHint }}</text>
          </view>
          <text style="font-size:32rpx;color:#BDBDBD;">›</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchCourse } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)

const accentColor = ctx.accentColor
const activeTab = ctx.activeTab
const homeLoading = ctx.homeLoading
const homeDateLabel = ctx.homeDateLabel
const activeChild = ctx.activeChild
const activeChildId = ctx.activeChildId
const childOptions = ctx.childOptions
const parentAvatar = ctx.parentAvatar
const todayItems = ctx.todayItems
const yesterdayItems = ctx.yesterdayItems
const homeworkEntryHint = ctx.homeworkEntryHint
const courses = ctx.courses
const selectedCourse = ctx.selectedCourse
const menuVisible = ctx.menuVisible
const openProfile = ctx.openProfile

function openMenu() {
  menuVisible.value = true
}
const selectChild = ctx.selectChild
const loadParentHome = ctx.loadParentHome

const dayTabs = [{ val: 'today', label: '今天' }, { val: 'yesterday', label: '昨天' }]
const dayTab = ref('today')
const timelineExpanded = ref(false)

const typeConfig = {
  checkin:  { icon: '✅', label: '签到',  color: '#2E7D32', bg: '#C8E6C9' },
  checkout: { icon: '🏠', label: '离园',  color: '#1565C0', bg: '#BBDEFB' },
  daily:    { icon: '📷', label: '日常',  color: '#7B1FA2', bg: '#F3E5F5' },
  homework: { icon: '📋', label: '作业',  color: '#E65100', bg: '#FFF3E0' },
  meal:     { icon: '🍱', label: '餐食',  color: '#2E7D32', bg: '#F1F8E9' },
  notice:   { icon: '📢', label: '通知',  color: '#1565C0', bg: '#E3F2FD' },
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
  if (!activeChildId.value) return
  try {
    const detail = await fetchCourse(c.id, activeChildId.value)
    selectedCourse.value = {
      ...c,
      ...detail,
      highlights: detail.highlights || c.highlights || [],
    }
  } catch {
    selectedCourse.value = { ...c, highlights: c.highlights || [] }
  }
}

watch(() => props.active, (v) => {
  if (v) {
    timelineExpanded.value = false
    loadParentHome()
  }
}, { immediate: true })

watch(todayItems, () => { timelineExpanded.value = false })

onShow(() => {
  if (props.active) loadParentHome()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
