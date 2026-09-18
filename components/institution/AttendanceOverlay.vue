<template>
      <view class="overlay-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FFAB91 100%);">
          <view style="padding:0 40rpx 24rpx;">
            <view style="display:flex;align-items:center;margin-bottom:16rpx;">
              <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
              <view style="flex:1;margin-left:20rpx;">
                <text style="font-size:40rpx;font-weight:800;color:white;display:block;">考勤签到</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.85);">应到 {{ orgAttSummary.expected }} · 已到 {{ orgAttSummary.arrived }}</text>
              </view>
            </view>
            <scroll-view scroll-x style="white-space:nowrap;margin-bottom:12rpx;">
              <view v-for="c in orgAttClasses" :key="c.id" class="pill" style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
                :style="{ backgroundColor: orgAttClassId === c.id ? 'white' : 'rgba(255,255,255,0.2)', color: orgAttClassId === c.id ? '#E65100' : 'white' }"
                @click="orgAttClassId = c.id; loadOrgAttendance()">
                <text style="font-size:22rpx;font-weight:700;">{{ c.name }}</text>
              </view>
            </scroll-view>
            <scroll-view scroll-x style="white-space:nowrap;">
              <view v-for="p in orgAttPeriods" :key="p.id" class="pill" style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
                :style="{ backgroundColor: orgAttPeriodId === p.id ? 'white' : 'rgba(255,255,255,0.2)', color: orgAttPeriodId === p.id ? '#E65100' : 'white' }"
                @click="orgAttPeriodId = p.id; loadOrgAttendance()">
                <text style="font-size:22rpx;font-weight:700;">{{ p.name }}</text>
              </view>
            </scroll-view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <LoadingSkeleton v-if="orgAttLoading" variant="list" :count="5" thumb padding="8rpx 0" />
            <view v-for="row in orgAttList" :key="row.id" class="card" style="padding:20rpx;margin-bottom:12rpx;display:flex;align-items:center;">
              <view style="flex:1;">
                <text style="font-size:28rpx;font-weight:700;color:#2D1F18;">{{ row.student?.name || '学员' }}</text>
                <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:4rpx;">{{ row.status }}{{ row.arrive_time ? ' · ' + row.arrive_time : '' }}</text>
              </view>
              <view v-if="row.status === 'waiting'" style="padding:12rpx 24rpx;border-radius:16rpx;background:#C8E6C9;" @click="orgCheckin(row)">
                <text style="font-size:24rpx;font-weight:700;color:#2E7D32;">签到</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, watch } from 'vue'
import {
  checkinStudents,
  fetchAttendanceClasses,
  fetchAttendancePeriods,
  fetchAttendanceToday,
} from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}



const orgAttClasses = ref([])
const orgAttPeriods = ref([])
const orgAttClassId = ref(null)
const orgAttPeriodId = ref(null)
const orgAttList = ref([])
const orgAttSummary = ref({ expected: 0, arrived: 0 })
const orgAttLoading = ref(false)
const orgAttBusy = ref(false)

async function loadOrgAttendanceMeta() {
  const [classes, periods] = await Promise.all([fetchAttendanceClasses(), fetchAttendancePeriods()])
  orgAttClasses.value = classes?.list || []
  orgAttPeriods.value = periods?.list || []
  if (!orgAttClassId.value && orgAttClasses.value.length) orgAttClassId.value = orgAttClasses.value[0].id
  if (!orgAttPeriodId.value && orgAttPeriods.value.length) orgAttPeriodId.value = orgAttPeriods.value[0].id
}

async function loadOrgAttendance() {
  if (!orgAttClassId.value || !orgAttPeriodId.value) {
    try { await loadOrgAttendanceMeta() } catch (_) { return }
  }
  if (!orgAttClassId.value || !orgAttPeriodId.value) return
  orgAttLoading.value = true
  try {
    const data = await fetchAttendanceToday({
      classId: orgAttClassId.value,
      periodId: orgAttPeriodId.value,
    })
    orgAttSummary.value = data?.summary || { expected: 0, arrived: 0 }
    orgAttList.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '考勤加载失败', icon: 'none' })
  } finally {
    orgAttLoading.value = false
  }
}

async function orgCheckin(row) {
  const sid = row?.student?.id
  if (!sid || orgAttBusy.value) return
  orgAttBusy.value = true
  try {
    await checkinStudents({
      classId: orgAttClassId.value,
      periodId: orgAttPeriodId.value,
      studentIds: [sid],
    })
    uni.showToast({ title: '已签到', icon: 'success' })
    await loadOrgAttendance()
  } catch (e) {
    uni.showToast({ title: e.message || '签到失败', icon: 'none' })
  } finally {
    orgAttBusy.value = false
  }
}

watch(() => props.pageShowCount, () => { loadOrgAttendance() }, { immediate: true })
</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
