<template>
  <view class="overlay-page">
    <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #F0E6DC;flex-shrink:0;">
      <view class="safe-nav-bar" style="display:flex;align-items:center;padding-bottom:16rpx;">
        <view class="back-btn" style="background:#FFF8F5;margin-right:20rpx;" @click="$emit('back')">
          <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
        </view>
        <view style="flex:1;min-width:0;">
          <text style="font-size:36rpx;font-weight:800;color:#2D1F18;display:block;">课程排布</text>
          <text style="font-size:22rpx;color:#8D6E63;">{{ scheduleSubtitle }}</text>
        </view>
      </view>
      <view style="display:flex;flex-direction:row;justify-content:space-between;width:750rpx;box-sizing:border-box;padding:0 24rpx;">
        <view
          v-for="(d, i) in weekDays"
          :key="d"
          style="width:90rpx;box-sizing:border-box;"
          @click="setScheduleDay(i)"
        >
          <view
            style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10rpx 0 14rpx;border-radius:16rpx;"
            :style="dayCellStyle(i)"
          >
            <view style="height:14rpx;margin-bottom:4rpx;display:flex;align-items:center;justify-content:center;">
              <view
                v-if="daysWithSchedule[i]"
                style="width:10rpx;height:10rpx;border-radius:50%;"
                :style="{ backgroundColor: dayDotColor(i) }"
              />
            </view>
            <text
              style="font-size:26rpx;font-weight:700;line-height:1.2;text-align:center;"
              :style="{ color: dayTextColor(i) }"
            >{{ d }}</text>
            <text
              v-if="i === todayIndex"
              style="font-size:18rpx;font-weight:700;line-height:1;margin-top:4rpx;"
              :style="{ color: scheduleDay === i ? 'rgba(255,255,255,0.9)' : '#1565C0' }"
            >今</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="scheduleLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
        <view v-else-if="!dayScheduleItems.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">当日暂无排课</text></view>
        <view
          v-for="c in dayScheduleItems"
          :key="c.id"
          class="card"
          style="display:flex;overflow:hidden;margin-bottom:16rpx;"
          :style="lessonCardStyle(c)"
          @click="openCourseDetail(c)"
        >
          <view style="width:12rpx;" :style="{ backgroundColor: lessonAccent(c) }" />
          <view style="flex:1;padding:20rpx 24rpx;display:flex;align-items:center;gap:20rpx;">
            <view style="min-width:120rpx;">
              <text style="font-size:28rpx;font-weight:800;display:block;" :style="{ color: lessonAccent(c) }">{{ c.time }}</text>
              <text v-if="c.end_time" style="font-size:20rpx;" :style="{ color: isLessonPast(c) ? '#BDBDBD' : '#8D6E63' }">至 {{ c.end_time }}</text>
            </view>
            <view style="flex:1;min-width:0;">
              <view style="display:flex;align-items:center;gap:12rpx;flex-wrap:wrap;">
                <text style="font-size:28rpx;font-weight:700;display:block;" :style="{ color: isLessonPast(c) ? '#9E9E9E' : '#2D1F18' }">{{ c.class_name || c.room }}</text>
                <view
                  v-if="isInterestLesson(c)"
                  style="padding:4rpx 12rpx;border-radius:999rpx;background:#FFF3E0;"
                >
                  <text style="font-size:18rpx;font-weight:700;color:#E65100;">兴趣课</text>
                </view>
                <view
                  v-if="isLessonPast(c)"
                  style="padding:4rpx 12rpx;border-radius:999rpx;background:#EEEEEE;"
                >
                  <text style="font-size:18rpx;font-weight:700;color:#9E9E9E;">已结束</text>
                </view>
              </view>
              <text style="font-size:22rpx;" :style="{ color: isLessonPast(c) ? '#BDBDBD' : '#8D6E63' }">👩‍🏫 {{ c.teacher }}</text>
              <view
                v-if="isInterestLesson(c)"
                style="margin-top:12rpx;display:inline-flex;padding:8rpx 20rpx;border-radius:12rpx;background:#FF7043;"
                @click.stop="openLessonAttend(c)"
              >
                <text style="font-size:22rpx;font-weight:700;color:white;">课次点名</text>
              </view>
            </view>
            <text style="font-size:30rpx;" :style="{ color: isLessonPast(c) ? '#E0E0E0' : '#BDBDBD' }">›</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchDashboard, fetchSchedules } from '../../api/teacher.js'
import { dateForWeekdayIndex } from '../../utils/lessonAttend.js'

const emit = defineEmits(['back', 'detail', 'lesson-attend'])

const weekDays = ['一', '二', '三', '四', '五', '六', '日']
const todayIndex = (new Date().getDay() + 6) % 7
const scheduleDay = ref(todayIndex)
const scheduleLoading = ref(false)
const allScheduleItems = ref([])
const scheduleClasses = ref([])
const scheduleClassNames = ref([])
const primaryClassName = ref('—')

const scheduleSubtitle = computed(() => {
  const names = scheduleClassNames.value.filter(Boolean).join(' · ') || primaryClassName.value || '所带班级'
  const now = new Date()
  return `${names} · ${now.getFullYear()}年${now.getMonth() + 1}月`
})

/** 下标 0=周一 … 6=周日，是否有课 */
const daysWithSchedule = computed(() => {
  const flags = [false, false, false, false, false, false, false]
  for (const row of allScheduleItems.value) {
    const dow = Number(row.day_of_week)
    if (dow >= 1 && dow <= 7) flags[dow - 1] = true
  }
  return flags
})

const dayScheduleItems = computed(() => {
  const dow = scheduleDay.value + 1
  return allScheduleItems.value.filter(row => Number(row.day_of_week) === dow)
})

/** HH:mm → 当日分钟数；非法返回 null */
function hmToMinutes(hm) {
  if (!hm || typeof hm !== 'string') return null
  const m = hm.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

/**
 * 本周语境：早于今天的星期视为已过；今天对比结束时间（无结束则用开始）；之后的星期未开始。
 */
function isLessonPast(item) {
  if (scheduleDay.value < todayIndex) return true
  if (scheduleDay.value > todayIndex) return false
  const endMin = hmToMinutes(item.end_time || item.time)
  if (endMin === null) return false
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes() >= endMin
}

function lessonAccent(item) {
  return isLessonPast(item) ? '#BDBDBD' : (item.color || '#FF7043')
}

function lessonCardStyle(item) {
  if (!isLessonPast(item)) return {}
  return { backgroundColor: '#F7F7F7', opacity: 0.92 }
}

function dayCellStyle(i) {
  if (scheduleDay.value === i) return { backgroundColor: '#FF7043' }
  if (i === todayIndex) return { backgroundColor: '#E3F2FD' }
  return { backgroundColor: '#F5F0EC' }
}

function dayTextColor(i) {
  if (scheduleDay.value === i) return '#ffffff'
  if (i === todayIndex) return '#1565C0'
  return '#8D6E63'
}

function dayDotColor(i) {
  if (scheduleDay.value === i) return 'rgba(255,255,255,0.95)'
  if (i === todayIndex) return '#1565C0'
  return '#FF7043'
}

async function loadTeacherSchedules() {
  scheduleLoading.value = true
  try {
    const data = await fetchSchedules()
    allScheduleItems.value = data?.list || []
    scheduleClasses.value = data?.classes || []
    scheduleClassNames.value = scheduleClasses.value.map(c => c.name)
  } catch (e) {
    uni.showToast({ title: e.message || '课表加载失败', icon: 'none' })
  } finally {
    scheduleLoading.value = false
  }
}

function setScheduleDay(i) {
  scheduleDay.value = i
}

function openCourseDetail(c) {
  const cls = scheduleClasses.value.find(x => x.id === c.class_id) || {
    id: c.class_id,
    name: c.class_name || c.room,
  }
  emit('detail', cls)
}

function isInterestLesson(c) {
  const cls = scheduleClasses.value.find(x => x.id === c.class_id)
  const biz = cls?.biz_type || c.biz_type || 'interest'
  return biz === 'interest'
}

function openLessonAttend(c) {
  if (!isInterestLesson(c)) {
    uni.showToast({ title: '托管班请使用时段签到', icon: 'none' })
    return
  }
  const cls = scheduleClasses.value.find(x => x.id === c.class_id)
  emit('lesson-attend', {
    classId: c.class_id,
    className: c.class_name || cls?.name || c.room,
    scheduleId: c.id,
    startTime: c.time || c.start_time || '',
    date: dateForWeekdayIndex(scheduleDay.value),
    weekdayIndex: scheduleDay.value,
  })
}

onMounted(async () => {
  try {
    const dash = await fetchDashboard()
    primaryClassName.value = dash?.classes?.[0]?.name || '—'
  } catch (_) { /* ignore */ }
  await loadTeacherSchedules()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
