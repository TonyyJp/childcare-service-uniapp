<template>
  <view class="tab-page wb">
    <view class="gradient-header wb-hero">
      <view class="safe-nav-bar" style="padding-bottom: 40rpx;">
        <text class="wb-org">{{ tenantName || '工作台' }}</text>
        <view class="wb-seg">
          <view
            class="wb-seg-item"
            :class="{ 'is-on': scope === 'school' }"
            @click="scope = 'school'"
          >
            <text>学校数据</text>
          </view>
          <view
            class="wb-seg-item"
            :class="{ 'is-on': scope === 'mine' }"
            @click="scope = 'mine'"
          >
            <text>我的数据</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="wb-scroll">
      <view class="wb-body">
        <view class="wb-stats card">
          <LoadingSkeleton v-if="loading" variant="list" :count="1" padding="8rpx 0" />
          <view v-else class="wb-stats-grid">
            <view v-for="s in stats" :key="s.label" class="wb-stat">
              <text class="wb-stat-val" :style="{ color: s.color }">{{ s.val }}</text>
              <text class="wb-stat-label">{{ s.label }}</text>
            </view>
          </view>
        </view>

        <view class="section-head wb-section">
          <view class="section-bar" />
          <text class="section-title">快捷入口</text>
        </view>
        <view class="wb-entries">
          <view
            v-for="e in entries"
            :key="e.key"
            class="wb-entry card tap-feedback"
            hover-class="mp-tap-soft"
            :hover-stay-time="80"
            @click="onEntry(e)"
          >
            <view class="wb-entry-icon" :style="{ background: e.bg }">
              <MpIcon :name="e.icon" :size="52" :color="e.color" />
            </view>
            <view class="wb-entry-meta">
              <text class="wb-entry-label">{{ e.label }}</text>
              <text class="wb-entry-desc">{{ e.desc }}</text>
            </view>
            <text class="wb-entry-arrow">›</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import LoadingSkeleton from '../LoadingSkeleton.vue'
import MpIcon from '../MpIcon.vue'
import { fetchDashboard, fetchProfile } from '../../api/teacher.js'
import { ensureWechatRuntime, getMpDisplayName } from '../../utils/wechatRuntime.js'

const emit = defineEmits(['navigate'])

const loading = ref(false)
const scope = ref('school')
const tenantName = ref('')
const mineStats = ref([])
const schoolStats = ref([])

const entries = [
  {
    key: 'hosting',
    label: '托管辅导',
    desc: '签到 · 消息 · 作业',
    icon: 'school',
    bg: 'rgba(255, 112, 67, 0.14)',
    color: '#E64A19',
    nav: { tab: 'hosting-list' },
  },
  {
    key: 'course',
    label: '课程',
    desc: '兴趣课与课次',
    icon: 'graduation-cap',
    bg: 'rgba(171, 71, 188, 0.14)',
    color: '#8E24AA',
    nav: { tab: 'schedule' },
  },
  {
    key: 'schedule',
    label: '课表',
    desc: '今日与本周安排',
    icon: 'calendar',
    bg: 'rgba(59, 158, 235, 0.14)',
    color: '#1976D2',
    nav: { tab: 'schedule' },
  },
  {
    key: 'enroll',
    label: '招生意向',
    desc: '线索跟进',
    icon: 'clipboard-list',
    bg: 'rgba(102, 187, 106, 0.14)',
    color: '#2E7D32',
    nav: { toast: '招生意向即将开放' },
  },
]

const stats = computed(() => (scope.value === 'school' ? schoolStats.value : mineStats.value))

function onEntry(e) {
  if (e.nav?.toast) {
    uni.showToast({ title: e.nav.toast, icon: 'none' })
    return
  }
  emit('navigate', e.nav)
}

function buildStats(cards, todos) {
  const care = cards.filter((c) => c.biz_type === 'care' || c.can_period_checkin)
  const expected = care.reduce(
    (s, c) => s + (c.periods || []).reduce((a, p) => a + (p.expected || 0), 0),
    0,
  )
  const arrived = care.reduce(
    (s, c) => s + (c.periods || []).reduce((a, p) => a + (p.arrived || 0), 0),
    0,
  )
  const unfinished = (todos?.unfinished_checkins || []).length
  const leaves = todos?.pending_leaves || 0
  return [
    { label: '应到', val: String(expected), color: '#1565C0' },
    { label: '已到', val: String(arrived), color: '#2E7D32' },
    { label: '未完成', val: String(unfinished), color: unfinished ? '#E65100' : '#8D6E63' },
    { label: '待审批', val: String(leaves), color: leaves ? '#AB47BC' : '#8D6E63' },
  ]
}

async function load() {
  loading.value = true
  try {
    const [profile, dash] = await Promise.all([fetchProfile(), fetchDashboard()])
    await ensureWechatRuntime(false).catch(() => {})
    tenantName.value = profile?.tenant_name || getMpDisplayName()
    const cards = dash?.classes || []
    const todos = dash?.todos || {}
    mineStats.value = buildStats(cards, todos)
    schoolStats.value = buildStats(cards, todos)
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onMounted(load)
onShow(load)
</script>

<style scoped lang="scss">
.wb-hero {
  background: linear-gradient(135deg, #ff7043 0%, #ff9068 100%);
}
.wb-org {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1.3;
  padding-right: 8rpx;
}
.wb-seg {
  margin-top: 32rpx;
  display: flex;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 20rpx;
  padding: 8rpx;
}
.wb-seg-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
}
.wb-seg-item.is-on {
  background: #fff;
  color: #ff7043;
}
.wb-scroll {
  flex: 1;
  height: 0;
}
.wb-body {
  padding: 32rpx 32rpx 48rpx;
}
.wb-stats {
  padding: 36rpx 20rpx 28rpx;
}
.wb-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}
.wb-stat {
  text-align: center;
  padding: 8rpx 0;
}
.wb-stat-val {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1.15;
}
.wb-stat-label {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #8d6e63;
  font-weight: 600;
}
.wb-section {
  margin-top: 40rpx;
  margin-bottom: 20rpx;
}
.wb-entries {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}
.wb-entry {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 24rpx;
  margin: 0;
  box-sizing: border-box;
  min-height: 148rpx;
}
.wb-entry-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wb-entry-meta {
  flex: 1;
  min-width: 0;
}
.wb-entry-label {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: #2d1f18;
  line-height: 1.25;
}
.wb-entry-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8d6e63;
  line-height: 1.3;
}
.wb-entry-arrow {
  font-size: 36rpx;
  color: #d7ccc8;
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1;
}
</style>
