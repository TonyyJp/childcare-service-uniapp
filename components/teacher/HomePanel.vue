<template>
  <view class="tab-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF8A65 100%);">
      <view class="header-row">
        <view class="header-side" />
        <text class="header-title">{{ tenantName }}</text>
        <view class="header-side" />
      </view>
      <view style="padding:0 40rpx 40rpx;">
        <view style="display:flex;align-items:center;">
          <text style="font-size:48rpx;font-weight:800;color:white;flex:1;min-width:0;">{{ teacherName }}，您好 👋</text>
          <view class="avatar-btn" style="flex-shrink:0;margin-left:20rpx;"><text class="avatar-text">{{ teacherAvatar }}</text></view>
        </view>
        <text style="font-size:24rpx;color:rgba(255,255,255,0.8);display:block;margin-top:8rpx;">{{ todayLabel }} · {{ primaryClassName }}</text>
        <view style="display:flex;margin-top:24rpx;">
          <view v-for="(s, idx) in homeSummary" :key="s.label" style="flex:1;background:rgba(255,255,255,0.2);border-radius:20rpx;padding:20rpx;text-align:center;box-sizing:border-box;"
            :style="{ marginRight: idx < homeSummary.length - 1 ? '16rpx' : '0' }"
            @click="onHomeSummaryClick(s)">
            <text style="font-size:44rpx;font-weight:800;color:white;display:block;" :style="{ color: s.warn ? '#FFE082' : 'white' }">{{ s.val }}</text>
            <text style="font-size:22rpx;color:rgba(255,255,255,0.75);display:block;">{{ s.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:32rpx 40rpx 0;">
        <text style="font-size:26rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">快捷功能</text>
        <view style="display:grid;grid-template-columns:repeat(4,1fr);gap:20rpx;">
          <view v-for="f in features" :key="f.label" class="feature-item" :style="{ backgroundColor: f.color + '18' }" @click="$emit('navigate', f.nav)">
            <view class="feature-icon-wrap" :style="{ backgroundColor: f.color + '28' }">
              <text class="feature-icon">{{ f.icon }}</text>
            </view>
            <text class="feature-label">{{ f.label }}</text>
          </view>
        </view>
      </view>

      <view style="padding:32rpx 40rpx 24rpx;">
        <text style="font-size:26rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">我的班级</text>
        <view v-for="cls in classes" :key="cls.id" class="card" style="padding:24rpx;margin-bottom:20rpx;">
          <view style="display:flex;align-items:center;gap:16rpx;margin-bottom:16rpx;">
            <view style="width:16rpx;height:40rpx;border-radius:8rpx;" :style="{ backgroundColor: cls.color }" />
            <text style="font-size:30rpx;font-weight:800;color:#2D1F18;flex:1;">{{ cls.name }}</text>
            <view class="pill" style="background:#C8E6C9;color:#2E7D32;" v-if="cls.done"><text style="font-size:22rpx;">✓ 已点名</text></view>
            <view class="action-btn" :style="{ backgroundColor: cls.color }" @click="goCheckinForClass(cls)">
              <text style="color:white;font-size:24rpx;font-weight:700;">点名 ›</text>
            </view>
          </view>
          <view style="display:flex;gap:12rpx;">
            <view v-for="s in classStats(cls)" :key="s.label" style="flex:1;text-align:center;background:#FFF8F5;border-radius:12rpx;padding:12rpx 0;">
              <text style="font-size:28rpx;font-weight:800;display:block;" :style="{ color: s.color }">{{ s.val }}</text>
              <text style="font-size:20rpx;color:#8D6E63;">{{ s.label }}</text>
            </view>
          </view>
        </view>
        <view v-if="!classes.length && !homeLoading" style="padding:40rpx 0;text-align:center;">
          <text style="color:#8D6E63;font-size:26rpx;">暂无所带班级</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { fetchDashboard, fetchProfile } from '../../api/teacher.js'

const emit = defineEmits(['navigate', 'go-checkin'])

const AVATAR_COLORS = ['#FF7043', '#AB47BC', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']
const checkinClassId = inject('teacherCheckinClassId', null)

const homeLoading = ref(false)
const teacherName = ref('老师')
const tenantName = ref('智优托教')
const teacherAvatar = computed(() => (teacherName.value || '师').slice(0, 1))
const todayLabel = ref('')
const primaryClassName = ref('—')
const homeSummary = ref([
  { label: '应到', val: '—', warn: false },
  { label: '已到', val: '—', warn: false },
  { label: '未完成', val: '—', warn: true },
  { label: '待审批', val: '—', warn: false },
])
const classes = ref([])

const features = [
  { icon: '🍱', label: '营养餐', color: '#66BB6A', nav: { tab: 'meal' } },
  { icon: '📝', label: '考勤', color: '#EC407A', nav: { tab: 'attendance' } },
  { icon: '🌱', label: '成长记录', color: '#66BB6A', nav: { tab: 'life' } },
  { icon: '📅', label: '课程排布', color: '#FFB300', nav: { tab: 'schedule' } },
  { icon: '📋', label: '请假', color: '#AB47BC', nav: { tab: 'leave' } },
  { icon: '💬', label: '消息', color: '#3B9EEB', nav: { tab: 'messages' } },
  { icon: '📢', label: '通知', color: '#26C6DA', nav: { tab: 'notices' } },
  { icon: '🎉', label: '活动', color: '#EC407A', nav: { tab: 'events' } },
]

function onHomeSummaryClick(s) {
  if (s.label === '待审批') emit('navigate', { tab: 'leave' })
}

function classStats(cls) {
  return [
    { label: '应到', val: cls.expected, color: '#1565C0' },
    { label: '已到', val: cls.arrived, color: '#2E7D32' },
    { label: '剩余', val: Math.max(0, cls.expected - cls.arrived), color: '#E65100' },
    { label: '时段', val: cls.periodCount, color: '#7B1FA2' },
  ]
}

function formatToday(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(/-/g, '/'))
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week}`
}

async function loadTeacherHome() {
  homeLoading.value = true
  try {
    const [profile, dash] = await Promise.all([fetchProfile(), fetchDashboard()])
    teacherName.value = profile?.name || '老师'
    tenantName.value = profile?.tenant_name || '智优托教'
    todayLabel.value = formatToday(dash?.date)
    const cards = (dash?.classes || []).map((c, i) => {
      const expected = (c.periods || []).reduce((s, p) => s + (p.expected || 0), 0)
      const arrived = (c.periods || []).reduce((s, p) => s + (p.arrived || 0), 0)
      return {
        id: c.id,
        name: c.name,
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        expected,
        arrived,
        periodCount: (c.periods || []).length,
        periods: c.periods || [],
        done: expected > 0 && arrived >= expected
      }
    })
    classes.value = cards
    primaryClassName.value = cards[0]?.name || '暂无班级'

    const unfinished = dash?.todos?.unfinished_checkins?.length || 0
    const pendingLeaves = dash?.todos?.pending_leaves || 0
    const totalExpected = cards.reduce((s, c) => s + c.expected, 0)
    const totalArrived = cards.reduce((s, c) => s + c.arrived, 0)
    homeSummary.value = [
      { label: '应到', val: String(totalExpected), warn: false },
      { label: '已到', val: String(totalArrived), warn: false },
      { label: '未完成', val: String(unfinished), warn: unfinished > 0 },
      { label: '待审批', val: String(pendingLeaves), warn: pendingLeaves > 0 },
    ]

    const preferred = cards.find(c => c.periodCount > 0) || cards[0]
    if (preferred && checkinClassId && !checkinClassId.value) {
      checkinClassId.value = preferred.id
    }
  } catch (e) {
    uni.showToast({ title: e.message || '工作台加载失败', icon: 'none' })
  } finally {
    homeLoading.value = false
  }
}

function goCheckinForClass(cls) {
  if (checkinClassId) checkinClassId.value = cls.id
  emit('go-checkin', cls.id)
}

onMounted(loadTeacherHome)
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';

.feature-item { display: flex; flex-direction: column; align-items: center; gap: 12rpx; padding: 20rpx 12rpx; border-radius: 20rpx; }
.feature-icon-wrap { width: 80rpx; height: 80rpx; border-radius: 24rpx; display: flex; align-items: center; justify-content: center; }
.feature-icon { font-size: 36rpx; }
.feature-label { font-size: 22rpx; font-weight: 700; color: #2D1F18; text-align: center; }
</style>
