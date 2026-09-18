<template>
  <view class="tab-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF8A65 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <text style="font-size:44rpx;font-weight:800;color:white;display:block;">学情中心</text>
        <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">{{ statsHeaderSub }}</text>
        <scroll-view v-if="classes.length > 1" scroll-x style="white-space:nowrap;margin-top:20rpx;">
          <view class="pill" style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
            :style="{ backgroundColor: statsClassId == null ? 'white' : 'rgba(255,255,255,0.2)', color: statsClassId == null ? '#FF7043' : 'white' }"
            @click="selectStatsClass(null)"><text style="font-size:24rpx;font-weight:700;">全部班级</text></view>
          <view v-for="c in classes" :key="c.id" class="pill" style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
            :style="{ backgroundColor: statsClassId === c.id ? 'white' : 'rgba(255,255,255,0.2)', color: statsClassId === c.id ? '#FF7043' : 'white' }"
            @click="selectStatsClass(c.id)"><text style="font-size:24rpx;font-weight:700;">{{ c.name }}</text></view>
        </scroll-view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <LoadingSkeleton v-if="statsLoading" variant="list" :count="3" padding="8rpx 0" />
        <template v-else>
          <view style="display:grid;grid-template-columns:1fr 1fr;gap:20rpx;margin-bottom:24rpx;">
            <view v-for="k in kpis" :key="k.key || k.label" class="card" style="padding:24rpx;">
              <text style="font-size:40rpx;margin-bottom:8rpx;display:block;">{{ k.icon }}</text>
              <text style="font-size:52rpx;font-weight:800;display:block;" :style="{ color: k.color }">{{ k.val }}</text>
              <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">{{ k.label }}</text>
              <text style="font-size:22rpx;color:#8D6E63;">{{ k.sub }}</text>
            </view>
          </view>

          <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
            <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">📊 本月到勤统计</text>
            <view style="display:flex;align-items:flex-end;gap:8rpx;height:140rpx;">
              <view v-for="(v, i) in attData" :key="i" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8rpx;">
                <text style="font-size:20rpx;color:#8D6E63;">{{ v }}</text>
                <view style="width:100%;border-radius:8rpx 8rpx 0 0;min-height:4rpx;"
                  :style="{ height: Math.max(4, Math.round((v / attMax) * 100)) + 'rpx', backgroundColor: i === attHighlight ? '#FF7043' : '#FFCCBC' }" />
              </view>
            </view>
            <view style="display:flex;gap:8rpx;margin-top:8rpx;">
              <view v-for="d in weekDays" :key="d" style="flex:1;text-align:center;">
                <text style="font-size:20rpx;color:#8D6E63;">{{ d }}</text>
              </view>
            </view>
          </view>

          <view class="card" style="padding:24rpx;">
            <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">📋 {{ hwBarsTitle }}</text>
            <view v-if="!hwStats.length" style="padding:24rpx 0;text-align:center;"><text style="font-size:24rpx;color:#8D6E63;">暂无作业数据</text></view>
            <view v-for="hw in hwStats" :key="hw.subject || hw.label" style="margin-bottom:20rpx;">
              <view style="display:flex;justify-content:space-between;margin-bottom:8rpx;">
                <text style="font-size:26rpx;color:#2D1F18;">{{ hw.subject || hw.label }}</text>
                <text style="font-size:26rpx;font-weight:700;" :style="{ color: hw.color }">{{ hw.pct }}%</text>
              </view>
              <view style="height:12rpx;border-radius:12rpx;background:#F5F0EC;overflow:hidden;">
                <view style="height:100%;border-radius:12rpx;" :style="{ width: Math.min(100, hw.pct) + '%', backgroundColor: hw.color }" />
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
import { ref, computed, onMounted } from 'vue'
import { fetchAnalytics, fetchDashboard } from '../../api/teacher.js'

const statsLoading = ref(false)
const statsClassId = ref(null)
const statsLabel = ref('')
const statsClassName = ref('')
const kpis = ref([])
const attData = ref([0, 0, 0, 0, 0, 0, 0])
const attMax = ref(1)
const attHighlight = ref(0)
const weekDays = ['一', '二', '三', '四', '五', '六', '日']
const hwStats = ref([])
const hwBarsTitle = ref('作业完成率')
const classes = ref([])
const primaryClassName = ref('—')

const statsHeaderSub = computed(() => {
  const name = statsClassName.value || primaryClassName.value || '所带班级'
  const label = statsLabel.value || ''
  return label ? `${name} · ${label}` : name
})

async function loadClasses() {
  try {
    const dash = await fetchDashboard()
    classes.value = (dash?.classes || []).map(c => ({
      id: c.id,
      name: c.biz_type === 'care'
        ? `${c.name}·${c.attendance_type_name || '托管'}`
        : `${c.name}·兴趣`,
    }))
    primaryClassName.value = classes.value[0]?.name || '—'
  } catch (_) { /* ignore */ }
}

async function loadTeacherAnalytics() {
  statsLoading.value = true
  try {
    const data = await fetchAnalytics(statsClassId.value || undefined)
    statsLabel.value = data?.label || ''
    statsClassName.value = data?.class_name || ''
    kpis.value = data?.kpis || []
    const week = data?.attendance_week || {}
    attData.value = week.counts || [0, 0, 0, 0, 0, 0, 0]
    attMax.value = Math.max(1, week.max || 1)
    attHighlight.value = week.highlight_index ?? 0
    const bars = data?.homework_bars
    const items = Array.isArray(bars?.items) ? bars.items : (Array.isArray(bars) ? bars : [])
    hwStats.value = items.map(it => ({
      label: it.label || it.subject,
      subject: it.label || it.subject,
      pct: Number(it.pct) || 0,
      color: it.color || '#FF7043',
    }))
    hwBarsTitle.value = data?.homework_bars_title || (bars?.mode === 'grade' ? '作业评级分布' : '作业完成率')
  } catch (e) {
    uni.showToast({ title: e.message || '学情加载失败', icon: 'none' })
  } finally {
    statsLoading.value = false
  }
}

function selectStatsClass(id) {
  statsClassId.value = id
  loadTeacherAnalytics()
}

onMounted(async () => {
  await loadClasses()
  await loadTeacherAnalytics()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
