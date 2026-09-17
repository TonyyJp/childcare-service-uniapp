<template>
  <view class="tab-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF8A65 100%);">
      <view class="header-row">
        <!-- TEMP_IDENTITY_RESELECT_BACK（DEBUG_MODE） -->
        <view
          v-if="debugMode"
          class="back-btn"
          @click="goIdentitySelect"
        ><text class="back-icon">‹</text></view>
        <view v-else class="header-side" />
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

      <view v-if="unfinishedCheckins.length" style="padding:32rpx 40rpx 0;">
        <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20rpx;">
          <text style="font-size:26rpx;font-weight:800;color:#2D1F18;">未完成点名</text>
          <text style="font-size:22rpx;color:#E65100;font-weight:700;" @click="goUnfinishedCheckin()">去处理 ›</text>
        </view>
        <view
          v-for="item in unfinishedCheckins"
          :key="`${item.class_id}-${item.period_id}`"
          class="card"
          style="padding:24rpx;margin-bottom:16rpx;display:flex;align-items:center;gap:16rpx;"
          @click="goUnfinishedCheckin(item)"
        >
          <view style="flex:1;min-width:0;">
            <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;">{{ item.class_name }}</text>
            <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:4rpx;">{{ item.period_name }}</text>
          </view>
          <view class="pill" style="background:#FFECB3;color:#E65100;">
            <text style="font-size:22rpx;font-weight:700;">缺 {{ item.remaining }} 人</text>
          </view>
        </view>
      </view>

      <view style="padding:32rpx 40rpx 24rpx;">
        <text style="font-size:26rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">我的班级</text>
        <view v-for="cls in classes" :key="cls.id" class="card" style="padding:24rpx;margin-bottom:20rpx;">
          <view style="display:flex;align-items:center;gap:16rpx;margin-bottom:16rpx;">
            <view style="width:16rpx;height:40rpx;border-radius:8rpx;" :style="{ backgroundColor: cls.color }" />
            <view style="flex:1;min-width:0;">
              <view style="display:flex;align-items:center;gap:10rpx;flex-wrap:wrap;">
                <text style="font-size:30rpx;font-weight:800;color:#2D1F18;">{{ cls.name }}</text>
                <view class="pill" :style="{ backgroundColor: cls.tagBg, color: cls.tagColor }">
                  <text style="font-size:20rpx;font-weight:700;">{{ cls.tag }}</text>
                </view>
              </view>
              <text v-if="cls.timeLabel" style="font-size:22rpx;color:#8D6E63;display:block;margin-top:4rpx;">{{ cls.timeLabel }}</text>
            </view>
            <view class="pill" style="background:#C8E6C9;color:#2E7D32;" v-if="cls.done"><text style="font-size:22rpx;">✓ 已点名</text></view>
            <view
              v-if="cls.canCheckin"
              class="action-btn"
              :style="{ backgroundColor: cls.color }"
              @click="goCheckinForClass(cls)"
            >
              <text style="color:white;font-size:24rpx;font-weight:700;">点名 ›</text>
            </view>
            <view
              v-else-if="cls.bizType === 'interest'"
              class="action-btn"
              style="background:#FF7043;"
              @click="$emit('navigate', { tab: 'schedule', interestAttend: true, classId: cls.id, className: cls.name })"
            >
              <text style="color:white;font-size:24rpx;font-weight:700;">课次点名 ›</text>
            </view>
            <view
              v-else
              class="action-btn"
              style="background:#FFB300;"
              @click="$emit('navigate', { tab: 'schedule' })"
            >
              <text style="color:white;font-size:24rpx;font-weight:700;">课表 ›</text>
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
import { fetchDashboard, fetchProfile, fetchUnreadCount } from '../../api/teacher.js'
import { ensureWechatRuntime, getMpDisplayName } from '../../utils/wechatRuntime.js'
import { DEBUG_MODE } from '../../config.js'
import { clearRoleSelection } from '../../utils/auth.js'

const emit = defineEmits(['navigate', 'go-checkin'])
const debugMode = DEBUG_MODE

function goIdentitySelect() {
  // TEMP_IDENTITY_RESELECT_BACK（DEBUG_MODE）
  if (!DEBUG_MODE) return
  clearRoleSelection()
  uni.reLaunch({ url: '/pages/index/index' })
}

const AVATAR_COLORS = ['#FF7043', '#AB47BC', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']
const checkinClassId = inject('teacherCheckinClassId', null)

const homeLoading = ref(false)
const teacherName = ref('老师')
const tenantName = ref('')
const teacherAvatar = computed(() => (teacherName.value || '师').slice(0, 1))
const todayLabel = ref('')
const primaryClassName = ref('—')
const unreadCount = ref(0)
const homeSummary = ref([
  { label: '应到', val: '—', warn: false },
  { label: '已到', val: '—', warn: false },
  { label: '未完成', val: '—', warn: true },
  { label: '待审批', val: '—', warn: false },
])
const classes = ref([])
const unfinishedCheckins = ref([])

const features = computed(() => [
  { icon: '🍱', label: '营养餐', color: '#66BB6A', nav: { tab: 'meal' } },
  { icon: '📝', label: '考勤', color: '#EC407A', nav: { tab: 'attendance' } },
  { icon: '🌱', label: '成长记录', color: '#66BB6A', nav: { tab: 'life' } },
  { icon: '📅', label: '课程排布', color: '#FFB300', nav: { tab: 'schedule' } },
  { icon: '📋', label: '请假', color: '#AB47BC', nav: { tab: 'leave' } },
  { icon: '💬', label: unreadCount.value ? `消息(${unreadCount.value})` : '消息', color: '#3B9EEB', nav: { tab: 'messages' } },
  { icon: '📢', label: '通知', color: '#26C6DA', nav: { tab: 'notices' } },
])

function goUnfinishedCheckin(item) {
  const target = item || unfinishedCheckins.value[0]
  if (!target) {
    emit('go-checkin')
    return
  }
  emit('go-checkin', { classId: target.class_id, periodId: target.period_id })
}

function onHomeSummaryClick(s) {
  if (s.label === '待审批') emit('navigate', { tab: 'leave' })
  if (s.label === '未完成') goUnfinishedCheckin()
  if (s.label === '应到' || s.label === '已到') emit('go-checkin')
}

function classBizMeta(c) {
  if (c.biz_type === 'care') {
    const tag = c.attendance_type_name || '托管'
    return { tag, tagBg: '#E3F2FD', tagColor: '#1565C0' }
  }
  return { tag: '兴趣课', tagBg: '#FFF3E0', tagColor: '#E65100' }
}

function classStats(cls) {
  if (cls.canCheckin) {
    return [
      { label: '应到', val: cls.expected, color: '#1565C0' },
      { label: '已到', val: cls.arrived, color: '#2E7D32' },
      { label: '剩余', val: Math.max(0, cls.expected - cls.arrived), color: '#E65100' },
      { label: '时段', val: cls.periodCount, color: '#7B1FA2' },
    ]
  }
  return [
    { label: '在班', val: cls.studentsCount, color: '#1565C0' },
    { label: '适龄', val: cls.ageLabel || '—', color: '#2E7D32' },
    { label: '类型', val: '兴趣', color: '#E65100' },
    { label: '课表', val: '看', color: '#7B1FA2' },
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
    const [profile, dash, unread] = await Promise.all([
      fetchProfile(),
      fetchDashboard(),
      fetchUnreadCount().catch(() => ({ count: 0 })),
    ])
    teacherName.value = profile?.name || '老师'
    await ensureWechatRuntime(false).catch(() => {})
    tenantName.value = profile?.tenant_name || getMpDisplayName()
    todayLabel.value = formatToday(dash?.date)
    unreadCount.value = Number(unread?.total || unread?.count || unread?.unread || 0)

    const cards = (dash?.classes || []).map((c, i) => {
      const expected = (c.periods || []).reduce((s, p) => s + (p.expected || 0), 0)
      const arrived = (c.periods || []).reduce((s, p) => s + (p.arrived || 0), 0)
      const meta = classBizMeta(c)
      const timeLabel = c.start_time && c.end_time
        ? `${c.start_time}-${c.end_time}`
        : (c.age_label || '')
      return {
        id: c.id,
        name: c.name,
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        bizType: c.biz_type || 'interest',
        tag: meta.tag,
        tagBg: meta.tagBg,
        tagColor: meta.tagColor,
        timeLabel,
        ageLabel: c.age_label || '—',
        studentsCount: c.students_count || 0,
        expected,
        arrived,
        periodCount: (c.periods || []).length,
        periods: c.periods || [],
        canCheckin: !!c.can_period_checkin,
        hasScheduleToday: !!c.has_schedule_today,
        done: !!c.can_period_checkin && expected > 0 && arrived >= expected
      }
    })
    classes.value = cards
    primaryClassName.value = cards[0]?.name || '暂无班级'

    unfinishedCheckins.value = dash?.todos?.unfinished_checkins || []
    const unfinished = unfinishedCheckins.value.length
    const pendingLeaves = dash?.todos?.pending_leaves || 0
    const careCards = cards.filter(c => c.canCheckin && c.hasScheduleToday)
    const totalExpected = careCards.reduce((s, c) => s + c.expected, 0)
    const totalArrived = careCards.reduce((s, c) => s + c.arrived, 0)
    homeSummary.value = [
      { label: '应到', val: String(totalExpected), warn: false },
      { label: '已到', val: String(totalArrived), warn: false },
      { label: '未完成', val: String(unfinished), warn: unfinished > 0 },
      { label: '待审批', val: String(pendingLeaves), warn: pendingLeaves > 0 },
    ]

    const preferred = cards.find(c => c.canCheckin) || cards[0]
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
  emit('go-checkin', { classId: cls.id })
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
