<template>
      <view class="tab-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view class="header-row">
            <!-- TEMP_IDENTITY_RESELECT_BACK（DEBUG_MODE） -->
            <view
              v-if="debugMode"
              class="back-btn"
              @click="goIdentitySelect"
            ><text class="back-icon">‹</text></view>
            <view v-else class="header-side" />
            <text class="header-title">机构管理后台</text>
            <view class="header-side" />
          </view>
          <view style="padding:0 40rpx 32rpx;">
            <view style="display:flex;align-items:center;">
              <text style="font-size:48rpx;font-weight:800;color:white;flex:1;min-width:0;">{{ tenantName }}</text>
              <view class="tap-op" style="background:rgba(255,255,255,0.2);border-radius:16rpx;padding:10rpx 20rpx;flex-shrink:0;margin-left:12rpx;" hover-class="tap-op-hover" @click="emit('open-announcements')">
                <text style="color:white;font-size:22rpx;font-weight:700;">📢 平台公告</text>
              </view>
              <view class="avatar-btn" style="flex-shrink:0;margin-left:12rpx;"><text class="avatar-text">管</text></view>
            </view>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.8);display:block;margin-top:8rpx;">今日实时概览</text>
            <view style="margin-top:24rpx;background:rgba(255,255,255,0.16);border-radius:24rpx;padding:8rpx 0;">
              <view style="display:flex;">
                <view v-for="(s, idx) in summary" :key="s.label" style="flex:1;padding:20rpx 8rpx;text-align:center;box-sizing:border-box;position:relative;">
                  <text style="font-size:44rpx;font-weight:800;display:block;" :style="{ color: s.warn ? '#FFE082' : 'white' }">{{ s.val }}</text>
                  <text style="font-size:20rpx;color:rgba(255,255,255,0.8);display:block;margin-top:4rpx;">{{ s.label }}</text>
                  <view v-if="idx < summary.length - 1" style="position:absolute;right:0;top:24rpx;bottom:24rpx;width:1rpx;background:rgba(255,255,255,0.22);" />
                </view>
              </view>
              <view v-if="lessonKpis.length" style="height:1rpx;background:rgba(255,255,255,0.18);margin:0 20rpx;" />
              <view v-if="lessonKpis.length" style="display:flex;">
                <view
                  v-for="(s, idx) in lessonKpis"
                  :key="s.label"
                  class="tap-op"
                  style="flex:1;padding:18rpx 8rpx;text-align:center;box-sizing:border-box;position:relative;"
                  hover-class="tap-op-hover"
                  @click="onLessonKpiClick(s)"
                >
                  <text style="font-size:34rpx;font-weight:800;display:block;" :style="{ color: s.warn ? '#FFE082' : 'white' }">{{ s.val }}</text>
                  <text style="font-size:20rpx;color:rgba(255,255,255,0.8);display:block;margin-top:4rpx;">{{ s.label }}</text>
                  <view v-if="idx < lessonKpis.length - 1" style="position:absolute;right:0;top:20rpx;bottom:20rpx;width:1rpx;background:rgba(255,255,255,0.18);" />
                </view>
              </view>
            </view>
          </view>
        </view>

        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <!-- 今日提醒 -->
            <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
              <view class="sec-title"><view class="sec-bar" /><text class="sec-text">今日提醒</text></view>
              <view v-if="!alerts.length" style="padding:16rpx 0;text-align:center;">
                <text style="font-size:24rpx;color:#8D6E63;">暂无紧急待办</text>
              </view>
              <view v-for="(a, i) in alerts" :key="i" class="tap-op" style="display:flex;align-items:flex-start;padding:20rpx;border-radius:16rpx;margin-bottom:12rpx;" :style="{ backgroundColor: a.type === 'warn' ? '#FFF8E1' : a.type === 'info' ? '#F3E5F5' : '#F1F8E9' }" hover-class="tap-op-hover" @click="onAlertClick(a)">
                <text style="font-size:32rpx;flex-shrink:0;margin-right:16rpx;">{{ a.type === 'warn' ? '⚠️' : a.type === 'info' ? '📋' : '✅' }}</text>
                <view style="flex:1;min-width:0;">
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">{{ a.title }}</text>
                  <text style="font-size:22rpx;color:#8D6E63;margin-top:4rpx;display:block;">{{ a.desc }}</text>
                </view>
                <text v-if="a.tab" style="font-size:24rpx;color:#AB47BC;flex-shrink:0;">›</text>
              </view>
            </view>

            <!-- 快捷入口 -->
            <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
              <view class="sec-title"><view class="sec-bar" /><text class="sec-text">快捷管理</text></view>
              <view style="display:flex;margin-bottom:16rpx;">
                <view v-for="(sc, idx) in shortcuts.slice(0, 2)" :key="sc.tab"
                  class="tap-op"
                  style="flex:1;padding:22rpx;border-radius:20rpx;display:flex;align-items:center;box-sizing:border-box;background:#FAF7F5;border:1rpx solid #F0E9E5;"
                  :style="{ marginRight: idx === 0 ? '16rpx' : '0' }"
                  hover-class="tap-op-hover"
                  @click="navigate(sc.tab)">
                  <view class="ico-chip" :style="{ backgroundColor: sc.color + '1a' }"><text style="font-size:36rpx;">{{ sc.icon }}</text></view>
                  <view style="flex:1;min-width:0;">
                    <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">{{ sc.label }}</text>
                    <text style="font-size:20rpx;color:#8D6E63;">{{ sc.sub }}</text>
                  </view>
                </view>
              </view>
              <view style="display:flex;">
                <view v-for="(sc, idx) in shortcuts.slice(2, 4)" :key="sc.tab"
                  class="tap-op"
                  style="flex:1;padding:22rpx;border-radius:20rpx;display:flex;align-items:center;box-sizing:border-box;background:#FAF7F5;border:1rpx solid #F0E9E5;"
                  :style="{ marginRight: idx === 0 ? '16rpx' : '0' }"
                  hover-class="tap-op-hover"
                  @click="navigate(sc.tab)">
                  <view class="ico-chip" :style="{ backgroundColor: sc.color + '1a' }"><text style="font-size:36rpx;">{{ sc.icon }}</text></view>
                  <view style="flex:1;min-width:0;">
                    <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">{{ sc.label }}</text>
                    <text style="font-size:20rpx;color:#8D6E63;">{{ sc.sub }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 班级出勤 -->
            <view v-if="showClassOverview" class="card" style="padding:24rpx;margin-bottom:24rpx;">
              <view class="sec-title"><view class="sec-bar" /><text class="sec-text">班级出勤</text></view>
              <view v-for="cls in classOverview" :key="cls.id || cls.name" style="margin-bottom:16rpx;">
                <view style="display:flex;justify-content:space-between;margin-bottom:8rpx;">
                  <view style="display:flex;align-items:center;">
                    <view style="width:12rpx;height:28rpx;border-radius:4rpx;margin-right:12rpx;" :style="{ backgroundColor: cls.color }" />
                    <text style="font-size:26rpx;font-weight:700;color:#2D1F18;">{{ cls.name }}</text>
                  </view>
                  <text style="font-size:26rpx;font-weight:700;" :style="{ color: cls.color }">{{ cls.present }}/{{ cls.total }}</text>
                </view>
                <view style="height:12rpx;border-radius:12rpx;background:#F5F0EC;overflow:hidden;">
                  <view style="height:100%;border-radius:12rpx;" :style="{ width: (cls.total ? (cls.present / cls.total * 100) : 0) + '%', backgroundColor: cls.color }" />
                </view>
              </view>
            </view>

            <!-- 报表 / 配置 / 活动 / 报名 -->
            <view style="margin-bottom:32rpx;">
              <view style="display:flex;flex-wrap:wrap;">
                <view
                  v-for="tile in mgmtTiles"
                  :key="tile.tab"
                  class="card tap-op"
                  hover-class="tap-op-hover"
                  style="width:calc(50% - 8rpx);padding:24rpx;text-align:center;margin-bottom:16rpx;box-sizing:border-box;"
                  :style="{ marginRight: tile.odd ? '16rpx' : '0' }"
                  @click="navigate(tile.tab)"
                >
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">{{ tile.icon }}</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">{{ tile.label }}</text>
                  <text style="font-size:20rpx;color:#8D6E63;">{{ tile.sub }}</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { fetchDashboard } from '../../api/institution.js'
import { DEBUG_MODE } from '../../config.js'
import { clearRoleSelection } from '../../utils/auth.js'
import { hasApp, MP_APPS_KEY } from '../../utils/apps.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate","open-announcements"])
const debugMode = DEBUG_MODE
const mpApps = inject(MP_APPS_KEY, ref([]))

function navigate(tab) {
  emit('navigate', tab)
}

function goIdentitySelect() {
  // TEMP_IDENTITY_RESELECT_BACK（DEBUG_MODE）
  if (!DEBUG_MODE) return
  clearRoleSelection()
  uni.reLaunch({ url: '/pages/index/index' })
}

watch(() => props.pageShowCount, () => { loadDashboard() }, { immediate: true })

const tenantName = ref('机构')
const summary = ref([
  { label: '今日在园', val: '—', warn: false },
  { label: '在职教师', val: '—', warn: false },
  { label: '缺勤预警', val: '—', warn: false },
  { label: '待收费', val: '—', warn: false },
])
const lessonKpis = ref([])
const pendingTrialCount = ref(0)
const pendingTrialLabel = computed(() => {
  const n = Number(pendingTrialCount.value) || 0
  return n > 0 ? `${n} 条待确认` : '确认·代录·转正'
})
const alerts = ref([{ type: 'ok', title: '加载中', desc: '正在拉取今日概览…' }])
const shortcuts = ref([
  { tab: 'teachers', icon: '👩‍🏫', label: '师资', sub: '—', color: '#AB47BC' },
  { tab: 'students', icon: '🎓', label: '学生', sub: '—', color: '#3B9EEB' },
  { tab: 'courses', icon: '📚', label: '课程', sub: '管理上架', color: '#FF7043' },
  { tab: 'notice', icon: '📢', label: '通知', sub: '发通知', color: '#66BB6A' },
])
const classOverview = ref([])

const ALL_MGMT_TILES = [
  { tab: 'trial', icon: '🎧', label: '试课预约', subKey: 'trial', always: true },
  { tab: 'lesson-attend', icon: '🎯', label: '兴趣点名', sub: '代点名消课', apps: ['HOSTING'] },
  { tab: 'lesson-consume', icon: '📉', label: '近7日课消', sub: '只读汇总', apps: ['HOSTING'] },
  { tab: 'report', icon: '📈', label: '运营报表', sub: '数据分析', apps: ['HOSTING'] },
  { tab: 'bindings', icon: '🔗', label: '绑定审核', sub: '家长申请', always: true },
  { tab: 'events', icon: '🎉', label: '活动日历', sub: '发布园所活动', always: true },
  { tab: 'enrollments', icon: '🎟️', label: '课程报名', sub: '录入与消课', always: true },
  { tab: 'leaves', icon: '📝', label: '请假审批', sub: '代教师审核', apps: ['ATTENDANCE'] },
  { tab: 'meals', icon: '🍱', label: '营养餐', sub: '代打卡上传', apps: ['NUTRITION'] },
  { tab: 'homework', icon: '📋', label: '作业批改', sub: '待批提交', apps: ['HOMEWORK'] },
  { tab: 'attendance', icon: '✅', label: '考勤签到', sub: '全园点名', apps: ['HOSTING', 'ATTENDANCE'] },
  { tab: 'daily', icon: '📷', label: '日常代发', sub: '草稿·发布', apps: ['HOSTING'] },
  { tab: 'config', icon: '⚙️', label: '系统配置', sub: '功能设置', always: true },
]

const mgmtTiles = computed(() => {
  const list = ALL_MGMT_TILES.filter((t) => {
    if (t.always) return true
    return (t.apps || []).some((code) => hasApp(code, mpApps.value))
  }).map((t) => ({
    ...t,
    sub: t.subKey === 'trial' ? pendingTrialLabel.value : t.sub,
  }))
  return list.map((t, i) => ({ ...t, odd: i % 2 === 0 }))
})

const showClassOverview = computed(
  () => hasApp('HOSTING', mpApps.value) || hasApp('ATTENDANCE', mpApps.value),
)

function onAlertClick(a) {
  if (a?.tab) navigate(a.tab)
}

function onLessonKpiClick(s) {
  if (s.key === 'consume') navigate('lesson-consume')
  if (s.key === 'warning') navigate('students')
  if (s.key === 'trial') navigate('trial')
}

function pickNum(...vals) {
  for (const v of vals) {
    if (v === 0 || v === '0') return 0
    if (v != null && v !== '') return v
  }
  return null
}

function buildLessonKpis(data) {
  const consume = pickNum(
    data?.lesson_consume?.today_consume,
    data?.today_consume_count,
    data?.lesson_consume_today,
    data?.kpis?.today_consume_count,
  )
  const warn = pickNum(
    data?.lesson_consume?.low_balance_count,
    data?.balance_warning_count,
    data?.lesson_balance_warnings,
    data?.kpis?.balance_warning_count,
  )
  const items = []
  if (consume != null) {
    items.push({ key: 'consume', label: '今日消课', val: String(consume), warn: false })
  }
  if (warn != null) {
    items.push({ key: 'warning', label: '余额预警', val: String(warn), warn: Number(warn) > 0 })
  }
  const pendingTrial = pickNum(data?.pending_trial_count)
  if (pendingTrial != null) {
    items.push({ key: 'trial', label: '待确认试课', val: String(pendingTrial), warn: Number(pendingTrial) > 0 })
  }
  // 字段缺失时仍给一行占位，便于联调感知入口
  if (!items.length) {
    items.push(
      { key: 'consume', label: '今日消课', val: '—', warn: false },
      { key: 'warning', label: '余额预警', val: '—', warn: false },
    )
  }
  return items
}

async function loadDashboard() {
  try {
    const data = await fetchDashboard()
    tenantName.value = data?.tenant_name || '机构'
    summary.value = data?.summary || summary.value
    lessonKpis.value = buildLessonKpis(data || {})
    pendingTrialCount.value = Number(data?.pending_trial_count) || 0
    alerts.value = Array.isArray(data?.alerts) ? data.alerts : []
    shortcuts.value = data?.shortcuts || shortcuts.value
    classOverview.value = (data?.class_overview || []).map(c => ({
      ...c,
      total: Number(c.total) || 0,
    }))
  } catch (e) {
    lessonKpis.value = buildLessonKpis({})
    uni.showToast({ title: e.message || '总览加载失败', icon: 'none' })
  }
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';

.sec-title {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}
.sec-bar {
  width: 8rpx;
  height: 30rpx;
  border-radius: 6rpx;
  background: linear-gradient(180deg, #AB47BC 0%, #CE93D8 100%);
  margin-right: 14rpx;
}
.sec-text {
  font-size: 28rpx;
  font-weight: 800;
  color: #2D1F18;
}
.ico-chip {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 16rpx;
}
.tap-op-hover {
  opacity: 0.6;
}
</style>
