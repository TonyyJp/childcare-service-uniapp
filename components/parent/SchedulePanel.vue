<template>
  <view class="tab-page">
    <view class="safe-nav-header" style="background:white;flex-shrink:0;border-bottom:1rpx solid #EFF1F4;">
      <view style="padding:0 40rpx 16rpx;">
        <text style="font-size:40rpx;font-weight:800;color:#1F2937;display:block;">课程表</text>
        <text style="font-size:22rpx;color:#6B7280;margin-top:4rpx;">{{ scheduleHeaderSub }}</text>
      </view>
      <view style="display:flex;padding:0 40rpx;border-bottom:1rpx solid #EFF1F4;">
        <view v-for="t in scheduleTabs" :key="t.val" style="padding:20rpx 32rpx 20rpx 0;font-size:24rpx;font-weight:700;"
          :style="{ color: scheduleViewTab === t.val ? '#3B9EEB' : '#6B7280', borderBottom: scheduleViewTab === t.val ? '3rpx solid #3B9EEB' : '3rpx solid transparent' }"
          @click="scheduleViewTab = t.val"><text>{{ t.label }}</text></view>
      </view>
      <view v-if="scheduleViewTab === 'timetable'" style="display:flex;gap:12rpx;padding:16rpx 40rpx;">
        <view v-for="(d, i) in weekDays" :key="d" style="flex:1;padding:16rpx 0;border-radius:20rpx;text-align:center;font-size:24rpx;font-weight:700;"
          :style="{ backgroundColor: schedDay === i ? '#3B9EEB' : '#F5F7FA', color: schedDay === i ? 'white' : '#6B7280' }"
          @click="setSchedDay(i)"><text>{{ d }}</text></view>
      </view>
    </view>

    <scroll-view scroll-y style="flex:1;height:0;background:#F5F7FA;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="scheduleViewTab === 'timetable'">
          <LoadingSkeleton v-if="scheduleLoading" variant="timeline" :count="4" padding="8rpx 0" />
          <view v-else-if="!dayLessons.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#6B7280;">{{ activeChild?.needsBind ? '绑定宝贝后可查看课程表' : '当日暂无课程' }}</text></view>
          <view v-for="(lesson, li) in dayLessons" :key="lesson.id" style="display:flex;gap:16rpx;">
            <view style="width:92rpx;flex-shrink:0;padding-top:24rpx;">
              <text style="font-size:26rpx;font-weight:800;color:#1F2937;display:block;text-align:right;">{{ lesson.time }}</text>
              <text v-if="lesson.end_time" style="font-size:20rpx;color:#9CA3AF;display:block;text-align:right;margin-top:4rpx;">{{ lesson.end_time }}</text>
            </view>
            <view style="width:24rpx;flex-shrink:0;display:flex;flex-direction:column;align-items:center;">
              <view style="width:20rpx;height:20rpx;border-radius:50%;margin-top:28rpx;border:4rpx solid #fff;" :style="{ backgroundColor: lesson.color || '#3B9EEB', boxShadow: '0 0 0 2rpx ' + (lesson.color || '#3B9EEB') }" />
              <view v-if="li < dayLessons.length - 1" style="flex:1;width:2rpx;background:#E5E7EB;margin-top:6rpx;" />
            </view>
            <view class="card" style="flex:1;min-width:0;padding:20rpx 24rpx;margin-bottom:20rpx;display:flex;align-items:center;gap:16rpx;border-left:6rpx solid;" :style="{ borderLeftColor: lesson.color || '#3B9EEB' }">
              <view style="width:64rpx;height:64rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0;" :style="{ backgroundColor: (lesson.color || '#3B9EEB') + '18' }">
                <MpIcon name="calendar" :size="30" :color="lesson.color || '#3B9EEB'" />
              </view>
              <view style="flex:1;min-width:0;">
                <text style="font-size:26rpx;font-weight:700;color:#1F2937;display:block;">{{ lesson.class_name || lesson.subject }}</text>
                <text style="font-size:22rpx;color:#6B7280;">
                  {{ [lesson.period?.name, lesson.teacher && lesson.teacher !== '—' ? lesson.teacher : '', lesson.duration].filter(Boolean).join(' · ') }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="scheduleViewTab === 'courses'">
          <LoadingSkeleton v-if="enrollmentsLoading" variant="list" :count="3" thumb padding="8rpx 0" />
          <view v-else-if="!enrolledCourses.length" style="padding:32rpx 0;text-align:center;margin-bottom:24rpx;">
            <text style="font-size:26rpx;color:#6B7280;">{{ activeChild?.needsBind ? '暂无报名进度，可先浏览机构课程' : '暂无报名进度数据' }}</text>
          </view>
          <view v-for="c in enrolledCourses" :key="c.id || c.title" class="card" style="margin-bottom:24rpx;overflow:hidden;">
            <view style="height:8rpx;background:linear-gradient(90deg,#3B9EEB 0%,#3B9EEB80 100%);" />
            <view style="padding:24rpx;">
              <view style="display:flex;align-items:flex-start;gap:20rpx;margin-bottom:20rpx;">
                <view style="width:88rpx;height:88rpx;border-radius:24rpx;overflow:hidden;flex-shrink:0;background:#3B9EEB18;">
                  <image v-if="c.coverUrl" :src="c.coverUrl" mode="aspectFill" style="width:100%;height:100%;" />
                </view>
                <view style="flex:1;">
                  <text style="font-size:28rpx;font-weight:800;color:#1F2937;display:block;">{{ c.title }}</text>
                  <text style="font-size:22rpx;color:#6B7280;display:block;margin-top:4rpx;">{{ c.teacher }} · {{ c.schedule }}</text>
                </view>
              </view>
              <view style="display:flex;justify-content:space-between;margin-bottom:8rpx;">
                <text style="font-size:22rpx;color:#6B7280;">课程进度</text>
                <text style="font-size:22rpx;font-weight:700;color:#3B9EEB;">{{ (c.total || 0) - (c.sessionsLeft || 0) }}/{{ c.total || 0 }} 节</text>
              </view>
              <view style="height:12rpx;border-radius:12rpx;background:#E3F2FD;overflow:hidden;margin-bottom:16rpx;">
                <view style="height:100%;border-radius:12rpx;background:#3B9EEB;" :style="{ width: (c.total ? (((c.total - c.sessionsLeft) / c.total) * 100) : 0) + '%' }" />
              </view>
              <view style="display:flex;align-items:center;justify-content:space-between;">
                <text style="font-size:22rpx;color:#6B7280;">下次：{{ c.nextClass }}</text>
                <view class="pill" style="background:#3B9EEB15;color:#3B9EEB;"><text style="font-size:22rpx;font-weight:700;">剩余 {{ c.sessionsLeft }} 节</text></view>
              </view>
            </view>
          </view>
          <view class="card" style="padding:24rpx;display:flex;align-items:center;gap:20rpx;border:3rpx dashed #3B9EEB40;" @click="activeTab = 'home'">
            <view style="width:88rpx;height:88rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;background:#E3F2FD;flex-shrink:0;">
              <MpIcon name="building-2" :size="44" color="#3B9EEB" />
            </view>
            <view style="flex:1;">
              <text style="font-size:28rpx;font-weight:700;color:#1F2937;display:block;">探索更多课程</text>
              <text style="font-size:22rpx;color:#6B7280;margin-top:4rpx;display:block;">机构还有 {{ Math.max(0, publishedCourseCount - enrolledCourses.length) }} 门课程可浏览</text>
            </view>
            <text style="font-size:32rpx;color:#3B9EEB;">›</text>
          </view>
        </view>

        <view v-if="scheduleViewTab === 'events'">
          <LoadingSkeleton v-if="eventsLoading" variant="list" :count="4" thumb padding="8rpx 0" />
          <view v-else-if="!events.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#6B7280;">近期暂无活动</text></view>
          <view v-for="ev in events" :key="ev.id || ev.title" class="card" style="padding:20rpx 24rpx;margin-bottom:16rpx;display:flex;align-items:center;gap:20rpx;">
            <view style="width:80rpx;height:80rpx;border-radius:24rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;" :style="{ backgroundColor: (typeStyleMap[ev.type] || typeStyleMap.activity).bg }">
              <text style="font-size:22rpx;font-weight:800;" :style="{ color: (typeStyleMap[ev.type] || typeStyleMap.activity).text }">{{ ev.month }}</text>
              <text style="font-size:36rpx;font-weight:800;" :style="{ color: (typeStyleMap[ev.type] || typeStyleMap.activity).text }">{{ ev.date }}</text>
            </view>
            <view style="flex:1;">
              <view style="display:flex;align-items:center;gap:12rpx;margin-bottom:8rpx;">
                <MpIcon :name="eventIcon(ev.type)" :size="26" :color="(typeStyleMap[ev.type] || typeStyleMap.activity).text" />
                <text style="font-size:26rpx;font-weight:700;color:#1F2937;">{{ ev.title }}</text>
              </view>
              <view style="display:flex;align-items:center;gap:12rpx;flex-wrap:wrap;">
                <view class="pill" :style="{ backgroundColor: (typeStyleMap[ev.type] || typeStyleMap.activity).bg, color: (typeStyleMap[ev.type] || typeStyleMap.activity).text }"><text style="font-size:20rpx;">{{ (typeStyleMap[ev.type] || typeStyleMap.activity).label }}</text></view>
                <text v-if="ev.location" style="font-size:22rpx;color:#6B7280;">{{ ev.location }}</text>
              </view>
            </view>
            <text style="font-size:22rpx;color:#6B7280;">{{ ev.weekday }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { computed, inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchCourses, fetchEnrollments, fetchEvents, fetchSchedules } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const activeTab = ctx.activeTab
const activeChild = ctx.activeChild
const activeChildId = ctx.activeChildId
const membershipTenantId = ctx.membershipTenantId
const courses = ctx.courses

const scheduleTabs = [{ val: 'timetable', label: '课程表' }, { val: 'courses', label: '已报名' }, { val: 'events', label: '活动日历' }]
const scheduleViewTab = ref('timetable')
const weekDays = ['周一', '周二', '周三', '周四', '周五']
const schedDay = ref(Math.min((new Date().getDay() + 6) % 7, 4))
const scheduleLoading = ref(false)
const dayLessons = ref([])
const scheduleClassName = ref('')
const enrolledCourses = ref([])
const enrollmentsLoading = ref(false)
const publishedCourseCount = ref(0)
const events = ref([])
const eventsLoading = ref(false)

const typeStyleMap = {
  activity: { bg: '#FFF3E0', text: '#E65100', label: '活动' },
  holiday: { bg: '#F1F8E9', text: '#2E7D32', label: '假期' },
  parents: { bg: '#E3F2FD', text: '#1565C0', label: '家长会' },
  exam: { bg: '#F3E5F5', text: '#7B1FA2', label: '学情评估' },
}

const eventIconMap = {
  activity: 'star',
  holiday: 'calendar',
  parents: 'users',
  exam: 'notebook-pen',
}

function eventIcon(type) {
  return eventIconMap[type] || 'calendar'
}

const scheduleHeaderSub = computed(() => {
  const now = new Date()
  const parts = [activeChild.value?.name, `${now.getFullYear()}年${now.getMonth() + 1}月`]
  return parts.filter(Boolean).join(' · ')
})

async function loadParentSchedules() {
  if (!activeChildId.value) {
    dayLessons.value = []
    scheduleClassName.value = ''
    return
  }
  scheduleLoading.value = true
  try {
    const data = await fetchSchedules(activeChildId.value, schedDay.value + 1)
    dayLessons.value = data?.list || []
    scheduleClassName.value = data?.class_name || ''
  } catch (e) {
    uni.showToast({ title: e.message || '课表加载失败', icon: 'none' })
  } finally {
    scheduleLoading.value = false
  }
}

function setSchedDay(i) {
  schedDay.value = i
  loadParentSchedules()
}

async function loadParentEnrollments() {
  if (!activeChildId.value) {
    enrolledCourses.value = []
    enrollmentsLoading.value = true
    try {
      if (membershipTenantId.value) {
        const data = await fetchCourses(undefined, membershipTenantId.value)
        publishedCourseCount.value = (data?.list || []).length
        if (!courses.value?.length) {
          courses.value = (data?.list || []).map(c => ({ ...c }))
        }
      } else {
        publishedCourseCount.value = courses.value?.length || 0
      }
    } catch {
      publishedCourseCount.value = courses.value?.length || 0
    } finally {
      enrollmentsLoading.value = false
    }
    return
  }
  enrollmentsLoading.value = true
  try {
    const data = await fetchEnrollments(activeChildId.value)
    enrolledCourses.value = (data?.list || []).map(c => ({
      ...c,
      sessionsLeft: c.sessionsLeft ?? c.sessions_left ?? 0,
      nextClass: c.nextClass || c.next_class || '待安排',
    }))
    publishedCourseCount.value = data?.published_count || 0
  } catch (e) {
    uni.showToast({ title: e.message || '报名进度加载失败', icon: 'none' })
  } finally {
    enrollmentsLoading.value = false
  }
}

async function loadParentEvents() {
  const studentId = activeChildId.value
  const tenantId = membershipTenantId.value
  if (!studentId && !tenantId) {
    events.value = []
    return
  }
  eventsLoading.value = true
  try {
    const data = await fetchEvents(studentId || undefined, studentId ? undefined : tenantId)
    events.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '活动加载失败', icon: 'none' })
  } finally {
    eventsLoading.value = false
  }
}

function refreshForTab() {
  if (scheduleViewTab.value === 'timetable') loadParentSchedules()
  if (scheduleViewTab.value === 'events') loadParentEvents()
  if (scheduleViewTab.value === 'courses') loadParentEnrollments()
}

watch(() => props.active, (v) => { if (v) refreshForTab() }, { immediate: true })
watch(scheduleViewTab, () => { if (props.active) refreshForTab() })
watch(activeChildId, () => { if (props.active) refreshForTab() })

onShow(() => { if (props.active) refreshForTab() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
