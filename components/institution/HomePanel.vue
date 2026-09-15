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
              <view style="background:rgba(255,255,255,0.2);border-radius:16rpx;padding:10rpx 20rpx;flex-shrink:0;margin-left:12rpx;" @click="emit('open-announcements')">
                <text style="color:white;font-size:22rpx;font-weight:700;">📢 平台公告</text>
              </view>
              <view class="avatar-btn" style="flex-shrink:0;margin-left:12rpx;"><text class="avatar-text">管</text></view>
            </view>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.8);display:block;margin-top:8rpx;">今日实时概览</text>
            <view style="display:flex;margin-top:24rpx;">
              <view v-for="(s, idx) in summary" :key="s.label" style="flex:1;background:rgba(255,255,255,0.2);border-radius:20rpx;padding:20rpx;text-align:center;box-sizing:border-box;"
                :style="{ marginRight: idx < summary.length - 1 ? '12rpx' : '0' }">
                <text style="font-size:44rpx;font-weight:800;display:block;" :style="{ color: s.warn ? '#FFE082' : 'white' }">{{ s.val }}</text>
                <text style="font-size:20rpx;color:rgba(255,255,255,0.75);display:block;">{{ s.label }}</text>
              </view>
            </view>
          </view>
        </view>

        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <!-- 今日提醒 -->
            <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
              <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">🔔 今日提醒</text>
              <view v-if="!alerts.length" style="padding:16rpx 0;text-align:center;">
                <text style="font-size:24rpx;color:#8D6E63;">暂无紧急待办</text>
              </view>
              <view v-for="(a, i) in alerts" :key="i" style="display:flex;align-items:flex-start;padding:20rpx;border-radius:16rpx;margin-bottom:12rpx;" :style="{ backgroundColor: a.type === 'warn' ? '#FFF8E1' : a.type === 'info' ? '#F3E5F5' : '#F1F8E9' }" @click="onAlertClick(a)">
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
              <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">⚡ 快捷管理</text>
              <view style="display:flex;margin-bottom:16rpx;">
                <view v-for="(sc, idx) in shortcuts.slice(0, 2)" :key="sc.tab"
                  style="flex:1;padding:24rpx;border-radius:20rpx;display:flex;align-items:center;box-sizing:border-box;"
                  :style="{ backgroundColor: sc.color + '12', marginRight: idx === 0 ? '16rpx' : '0' }"
                  @click="navigate(sc.tab)">
                  <text style="font-size:40rpx;flex-shrink:0;margin-right:16rpx;">{{ sc.icon }}</text>
                  <view style="flex:1;min-width:0;">
                    <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">{{ sc.label }}</text>
                    <text style="font-size:20rpx;color:#8D6E63;">{{ sc.sub }}</text>
                  </view>
                </view>
              </view>
              <view style="display:flex;">
                <view v-for="(sc, idx) in shortcuts.slice(2, 4)" :key="sc.tab"
                  style="flex:1;padding:24rpx;border-radius:20rpx;display:flex;align-items:center;box-sizing:border-box;"
                  :style="{ backgroundColor: sc.color + '12', marginRight: idx === 0 ? '16rpx' : '0' }"
                  @click="navigate(sc.tab)">
                  <text style="font-size:40rpx;flex-shrink:0;margin-right:16rpx;">{{ sc.icon }}</text>
                  <view style="flex:1;min-width:0;">
                    <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">{{ sc.label }}</text>
                    <text style="font-size:20rpx;color:#8D6E63;">{{ sc.sub }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 班级出勤 -->
            <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
              <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">📊 班级出勤</text>
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
              <view style="display:flex;margin-bottom:16rpx;">
                <view class="card" style="flex:1;padding:24rpx;text-align:center;margin-right:16rpx;" @click="navigate('report')">
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">📈</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">运营报表</text>
                  <text style="font-size:20rpx;color:#8D6E63;">数据分析</text>
                </view>
                <view class="card" style="flex:1;padding:24rpx;text-align:center;" @click="navigate('bindings')">
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">🔗</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">绑定审核</text>
                  <text style="font-size:20rpx;color:#8D6E63;">家长申请</text>
                </view>
              </view>
              <view style="display:flex;margin-bottom:16rpx;">
                <view class="card" style="flex:1;padding:24rpx;text-align:center;margin-right:16rpx;" @click="navigate('events')">
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">🎉</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">活动日历</text>
                  <text style="font-size:20rpx;color:#8D6E63;">发布园所活动</text>
                </view>
                <view class="card" style="flex:1;padding:24rpx;text-align:center;" @click="navigate('enrollments')">
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">🎟️</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">课程报名</text>
                  <text style="font-size:20rpx;color:#8D6E63;">录入与消课</text>
                </view>
              </view>
              <view style="display:flex;margin-bottom:16rpx;">
                <view class="card" style="flex:1;padding:24rpx;text-align:center;margin-right:16rpx;" @click="navigate('leaves')">
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">📝</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">请假审批</text>
                  <text style="font-size:20rpx;color:#8D6E63;">代教师审核</text>
                </view>
                <view class="card" style="flex:1;padding:24rpx;text-align:center;" @click="navigate('meals')">
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">🍱</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">营养餐</text>
                  <text style="font-size:20rpx;color:#8D6E63;">代打卡上传</text>
                </view>
              </view>
              <view style="display:flex;margin-bottom:16rpx;">
                <view class="card" style="flex:1;padding:24rpx;text-align:center;margin-right:16rpx;" @click="navigate('homework')">
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">📋</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">作业批改</text>
                  <text style="font-size:20rpx;color:#8D6E63;">待批提交</text>
                </view>
                <view class="card" style="flex:1;padding:24rpx;text-align:center;" @click="navigate('attendance')">
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">✅</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">考勤签到</text>
                  <text style="font-size:20rpx;color:#8D6E63;">全园点名</text>
                </view>
              </view>
              <view style="display:flex;margin-bottom:16rpx;">
                <view class="card" style="flex:1;padding:24rpx;text-align:center;margin-right:16rpx;" @click="navigate('daily')">
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">📷</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">日常代发</text>
                  <text style="font-size:20rpx;color:#8D6E63;">草稿·发布</text>
                </view>
                <view class="card" style="flex:1;padding:24rpx;text-align:center;" @click="navigate('config')">
                  <text style="font-size:48rpx;display:block;margin-bottom:8rpx;">⚙️</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">系统配置</text>
                  <text style="font-size:20rpx;color:#8D6E63;">功能设置</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { fetchDashboard } from '../../api/institution.js'
import { DEBUG_MODE } from '../../config.js'
import { clearRoleSelection } from '../../utils/auth.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate","open-announcements"])
const debugMode = DEBUG_MODE

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
const alerts = ref([{ type: 'ok', title: '加载中', desc: '正在拉取今日概览…' }])
const shortcuts = ref([
  { tab: 'teachers', icon: '👩‍🏫', label: '师资', sub: '—', color: '#AB47BC' },
  { tab: 'students', icon: '🎓', label: '学生', sub: '—', color: '#3B9EEB' },
  { tab: 'courses', icon: '📚', label: '课程', sub: '管理上架', color: '#FF7043' },
  { tab: 'notice', icon: '📢', label: '通知', sub: '发通知', color: '#66BB6A' },
])
const classOverview = ref([])

function onAlertClick(a) {
  if (a?.tab) navigate(a.tab)
}

async function loadDashboard() {
  try {
    const data = await fetchDashboard()
    tenantName.value = data?.tenant_name || '机构'
    summary.value = data?.summary || summary.value
    alerts.value = Array.isArray(data?.alerts) ? data.alerts : []
    shortcuts.value = data?.shortcuts || shortcuts.value
    classOverview.value = (data?.class_overview || []).map(c => ({
      ...c,
      total: Number(c.total) || 0,
    }))
  } catch (e) {
    uni.showToast({ title: e.message || '总览加载失败', icon: 'none' })
  }
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
