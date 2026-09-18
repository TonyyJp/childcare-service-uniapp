<template>
  <view class="tab-page" style="background:#F5F7FA;">
    <view class="safe-nav-header" style="background:white;flex-shrink:0;border-bottom:1rpx solid #EFF1F4;padding-bottom:20rpx;">
      <view style="display:flex;align-items:center;gap:20rpx;padding:0 40rpx;width:100%;box-sizing:border-box;">
        <view class="back-btn" style="background:#F5F7FA;" @click="activeTab = 'home'">
          <text style="font-size:40rpx;color:#1F2937;line-height:1;">‹</text>
        </view>
        <view style="flex:1;min-width:0;">
          <text style="font-size:36rpx;font-weight:800;color:#1F2937;display:block;">机构课程</text>
          <text style="font-size:22rpx;color:#6B7280;margin-top:4rpx;">
            {{ courses.length }}门在招
          </text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx 40rpx;">
        <LoadingSkeleton v-if="loading" variant="list" :count="4" cover padding="0" />
        <view v-else-if="!courses.length" style="padding:96rpx 0;display:flex;flex-direction:column;align-items:center;gap:16rpx;">
          <view style="width:120rpx;height:120rpx;border-radius:40rpx;background:#3B9EEB12;display:flex;align-items:center;justify-content:center;">
            <MpIcon name="book-open" :size="56" color="#3B9EEB" />
          </view>
          <text style="font-size:28rpx;font-weight:700;color:#1F2937;">暂无在招课程</text>
          <text style="font-size:23rpx;color:#9CA3AF;">机构上新后会在这里展示</text>
        </view>
        <template v-else>
          <view
            v-for="c in courses"
            :key="c.id"
            class="card tap-feedback"
            hover-class="tap-feedback-active"
            style="margin-bottom:24rpx;overflow:hidden;padding:0;"
            @click="openCourseDetail(c)"
          >
            <view style="position:relative;height:300rpx;overflow:hidden;background:linear-gradient(135deg,#3B9EEB22 0%,#3B9EEB08 100%);">
              <image v-if="c.coverUrl" :src="c.coverUrl" mode="aspectFill" style="width:100%;height:100%;" />
              <view v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
                <MpIcon name="book-open" :size="72" color="#3B9EEB55" />
              </view>
              <view style="position:absolute;left:20rpx;top:20rpx;padding:6rpx 18rpx;border-radius:999rpx;background:rgba(255,255,255,0.92);backdrop-filter:blur(4px);">
                <text style="font-size:21rpx;font-weight:700;color:#3B9EEB;">{{ c.tag || '课程' }}</text>
              </view>
            </view>
            <view style="padding:24rpx;">
              <text style="font-size:31rpx;font-weight:800;color:#1F2937;display:block;line-height:1.35;">{{ c.title }}</text>
              <view style="display:flex;align-items:center;gap:12rpx;margin-top:10rpx;">
                <text v-if="c.age" style="font-size:23rpx;color:#6B7280;">{{ c.age }}</text>
                <text v-if="c.age && c.sessions != null && c.sessions !== ''" style="font-size:20rpx;color:#D1D5DB;">·</text>
                <text v-if="c.sessions != null && c.sessions !== ''" style="font-size:23rpx;color:#6B7280;">{{ c.sessions }}课时</text>
              </view>
              <view style="display:flex;align-items:center;justify-content:space-between;margin-top:18rpx;padding-top:18rpx;border-top:1rpx solid #F1F3F6;">
                <text style="font-size:34rpx;font-weight:800;color:#3B9EEB;">{{ c.price }}</text>
                <view style="display:flex;align-items:center;gap:4rpx;padding:8rpx 18rpx;border-radius:999rpx;background:#3B9EEB14;">
                  <text style="font-size:23rpx;font-weight:700;color:#3B9EEB;">查看详情</text>
                  <text style="font-size:23rpx;color:#3B9EEB;">›</text>
                </view>
              </view>
            </view>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import MpIcon from '../MpIcon.vue'
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchCourse } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const activeTab = ctx.activeTab
const courses = ctx.courses
const selectedCourse = ctx.selectedCourse
const activeChildId = ctx.activeChildId
const loading = ref(false)

async function refresh() {
  loading.value = true
  try {
    if (typeof ctx.loadMarketingCourses === 'function') {
      await ctx.loadMarketingCourses()
    }
  } finally {
    loading.value = false
  }
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

watch(() => props.active, (v) => { if (v) refresh() }, { immediate: true })
onShow(() => { if (props.active) refresh() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
