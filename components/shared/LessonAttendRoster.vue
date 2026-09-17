<template>
  <view>
    <view v-if="loading" style="padding:48rpx 0;text-align:center;">
      <text style="font-size:26rpx;color:#8D6E63;">加载课次名单…</text>
    </view>
    <view v-else-if="errorMsg" style="padding:48rpx 24rpx;text-align:center;">
      <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;margin-bottom:12rpx;">暂时无法点名</text>
      <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:24rpx;">{{ errorMsg }}</text>
      <view class="action-btn" style="display:inline-flex;background:#FF7043;padding:16rpx 32rpx;" @click="$emit('retry')">
        <text style="color:white;font-size:26rpx;font-weight:700;">重试</text>
      </view>
    </view>
    <view v-else-if="!rows.length" style="padding:48rpx 0;text-align:center;">
      <text style="font-size:26rpx;color:#8D6E63;">{{ emptyText }}</text>
    </view>
    <view v-else>
      <view
        v-for="row in displayRows"
        :key="row.id"
        class="card"
        style="padding:20rpx 24rpx;margin-bottom:16rpx;display:flex;align-items:center;gap:16rpx;"
      >
        <view
          style="width:72rpx;height:72rpx;border-radius:36rpx;display:flex;align-items:center;justify-content:center;font-size:28rpx;font-weight:700;flex-shrink:0;"
          :style="{ backgroundColor: (row.color || '#FF7043') + '20', color: row.color || '#FF7043' }"
        >
          <text>{{ row.avatar || (row.student_name || row.name || '?').slice(0, 1) }}</text>
        </view>
        <view style="flex:1;min-width:0;">
          <view style="display:flex;align-items:center;gap:10rpx;flex-wrap:wrap;">
            <text style="font-size:28rpx;font-weight:700;color:#2D1F18;">{{ row.student_name || row.name }}</text>
            <view v-if="isTrial(row)" class="pill" style="background:#FF7043;">
              <text style="font-size:18rpx;font-weight:700;color:white;">试</text>
            </view>
            <view
              v-if="!isTrial(row)"
              class="pill"
              :style="remainStyle(row)"
            >
              <text style="font-size:18rpx;font-weight:700;">{{ remainLabel(row) }}</text>
            </view>
            <view v-if="row.is_settled && !isTrial(row)" class="pill" style="background:#E8F5E9;">
              <text style="font-size:18rpx;font-weight:700;color:#2E7D32;">已消课</text>
            </view>
          </view>
          <text v-if="row.remark" style="font-size:22rpx;color:#8D6E63;display:block;margin-top:4rpx;">{{ row.remark }}</text>
          <text v-if="row.staff_remark" style="font-size:20rpx;color:#A1887F;display:block;margin-top:2rpx;">内部：{{ row.staff_remark }}</text>
          <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:4rpx;">
            {{ statusLabel(row.status) }}{{ lessonMeta(row) }}
          </text>
        </view>
        <view style="display:flex;flex-direction:column;gap:8rpx;align-items:flex-end;flex-shrink:0;">
          <view
            class="action-btn"
            :style="presentBtnStyle(row)"
            @click="onStatus(row, 'present')"
          >
            <text :style="{ color: presentBtnTextColor(row), fontSize: '22rpx', fontWeight: 700 }">到课</text>
          </view>
          <view style="display:flex;gap:12rpx;">
            <text
              style="font-size:22rpx;font-weight:700;"
              :style="{ color: row.status === 'leave' ? '#7B1FA2' : '#8D6E63' }"
              @click="onStatus(row, 'leave')"
            >请假</text>
            <text
              style="font-size:22rpx;font-weight:700;"
              :style="{ color: row.status === 'absent' ? '#C62828' : '#8D6E63' }"
              @click="onStatus(row, 'absent')"
            >缺勤</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import {
  applyLessonStatus,
  canMarkPresent,
  formatRemainBadge,
  isTrialAttend,
  lessonStatusLabel,
  remainBadgeStyle,
  sortTrialFirst,
} from '../../utils/lessonAttend.js'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  errorMsg: { type: String, default: '' },
  emptyText: { type: String, default: '本课次暂无应到学员' },
  consumePolicy: { type: String, default: 'strict' },
  busy: { type: Boolean, default: false },
  /** (id, status) => Promise */
  updateFn: { type: Function, required: true },
})

const emit = defineEmits(['retry', 'updated'])

const displayRows = computed(() => sortTrialFirst(props.rows))

function isTrial(row) {
  return isTrialAttend(row)
}

function statusLabel(s) {
  return lessonStatusLabel(s)
}

function remainLabel(row) {
  return formatRemainBadge(row.remain_lessons)
}

function remainStyle(row) {
  return remainBadgeStyle(row.remain_lessons)
}

function lessonMeta(row) {
  const bits = []
  if (row.lesson_sort) bits.push(`第${row.lesson_sort}节`)
  if (row.lesson_date) bits.push(row.lesson_date)
  if (row.lesson_content) bits.push(row.lesson_content)
  return bits.length ? ` · ${bits.join(' · ')}` : ''
}

function presentBtnStyle(row) {
  if (!canMarkPresent(row, props.consumePolicy)) {
    return { background: '#F5F0EC', opacity: 0.85 }
  }
  if (row.status === 'present') {
    return { background: '#66BB6A' }
  }
  return { background: '#66BB6A' }
}

function presentBtnTextColor(row) {
  if (!canMarkPresent(row, props.consumePolicy) && row.status !== 'present') {
    return '#8D6E63'
  }
  return 'white'
}

async function onStatus(row, nextStatus) {
  if (props.busy) return
  if (row.status === nextStatus) return
  try {
    const data = await applyLessonStatus({
      row,
      nextStatus,
      consumePolicy: props.consumePolicy,
      updateFn: props.updateFn,
    })
    if (data !== null) emit('updated', { row, nextStatus, data })
  } catch (_) {
    // toast already shown in applyLessonStatus
  }
}
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
