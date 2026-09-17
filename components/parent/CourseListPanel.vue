<template>
  <view class="tab-page" style="background:#F5F7FA;">
    <view class="safe-nav-header" style="background:white;flex-shrink:0;border-bottom:1rpx solid #EFF1F4;padding-bottom:20rpx;">
      <view style="display:flex;align-items:center;gap:20rpx;padding:0 40rpx;">
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
      <view style="padding:24rpx 40rpx;">
        <LoadingSkeleton v-if="loading" variant="list" :count="4" cover padding="0" />
        <view v-else-if="!courses.length" style="padding:64rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#6B7280;">暂无在招课程</text>
        </view>
        <view
          v-for="c in courses"
          :key="c.id"
          class="card"
          style="margin-bottom:20rpx;overflow:hidden;"
          @click="openCourseDetail(c)"
        >
          <view style="height:320rpx;overflow:hidden;background:linear-gradient(135deg,#3B9EEB22 0%,#3B9EEB10 100%);">
            <image v-if="c.coverUrl" :src="c.coverUrl" mode="aspectFill" style="width:100%;height:100%;" />
          </view>
          <view style="padding:24rpx;">
            <view style="display:flex;align-items:center;gap:12rpx;margin-bottom:12rpx;flex-wrap:wrap;">
              <view class="pill" style="background:#3B9EEB18;color:#3B9EEB;">
                <text style="font-size:20rpx;">{{ c.tag || '课程' }}</text>
              </view>
              <text v-if="c.sessions != null && c.sessions !== ''" style="font-size:22rpx;color:#6B7280;">{{ c.sessions }}课时</text>
            </view>
            <text style="font-size:30rpx;font-weight:800;color:#1F2937;display:block;">{{ c.title }}</text>
            <text v-if="c.age" style="font-size:24rpx;color:#6B7280;display:block;margin-top:8rpx;">{{ c.age }}</text>
            <view style="display:flex;align-items:center;justify-content:space-between;margin-top:16rpx;">
              <text style="font-size:32rpx;font-weight:800;color:#3B9EEB;">{{ c.price }}</text>
              <text style="font-size:22rpx;color:#3B9EEB;">查看详情 ›</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
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
