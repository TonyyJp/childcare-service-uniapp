<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">{{ view === 'logs' ? '消课流水' : '课时余额' }}</text>
      <view class="subpage-nav__row">
        <view class="subpage-nav__back" @click="onBack">
          <text class="subpage-nav__back-icon">‹</text>
        </view>
        <view class="subpage-nav__side" />
      </view>
    </view>
    <view class="subpage-body">
      <scroll-view scroll-y class="subpage-scroll">
        <view class="subpage-pad">
          <text class="subpage-hint">{{ activeChild.name || '请先绑定宝贝' }} · 兴趣课课时包</text>

          <template v-if="view === 'list'">
            <view v-if="!activeChildId" class="empty-block empty-block--card">
              <text class="empty-block__title">请先绑定宝贝</text>
              <text class="empty-block__hint">绑定后可查看课时余额</text>
            </view>
            <view v-else-if="loading" class="empty-block">
              <text class="empty-block__text">加载中…</text>
            </view>
            <view v-else-if="errorMsg" class="empty-block empty-block--card">
              <text class="empty-block__title">暂时无法加载</text>
              <text class="empty-block__hint">{{ errorMsg }}</text>
              <view class="list-card__action list-card__action--primary" style="margin-top:20rpx;text-align:center;" @click="loadPackages">
                <text class="list-card__action-text" style="color:#3B9EEB;">重试</text>
              </view>
            </view>
            <view v-else-if="!packages.length" class="empty-block empty-block--card">
              <text class="empty-block__title">暂无课时包</text>
              <text class="empty-block__hint">请联系机构续费或发放课时</text>
            </view>
            <view
              v-for="pkg in packages"
              :key="pkg.id || `${pkg.class_id}-${pkg.valid_to}`"
              class="list-card"
              @click="openLogs(pkg)"
            >
              <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12rpx;">
                <text class="list-card__title">{{ pkg.class_name || pkg.class?.name || '兴趣课班' }}</text>
                <view class="pill" :style="statusStyle(pkg)">
                  <text style="font-size:20rpx;font-weight:700;">{{ statusLabel(pkg) }}</text>
                </view>
              </view>
              <text class="list-card__sub" style="margin-bottom:8rpx;">
                剩余 {{ remainOf(pkg) }} / 总计 {{ totalOf(pkg) }} 课时
              </text>
              <text style="font-size:22rpx;color:#6B7280;">
                有效期 {{ formatRange(pkg) }}
              </text>
              <text style="font-size:22rpx;color:#3B9EEB;display:block;margin-top:12rpx;font-weight:700;">查看消课流水 ›</text>
            </view>

            <view v-if="activeChildId && !loading" class="card" style="padding:24rpx;margin-top:8rpx;">
              <text style="font-size:26rpx;font-weight:700;color:#1F2937;display:block;margin-bottom:8rpx;">续费说明</text>
              <text style="font-size:24rpx;color:#6B7280;line-height:1.6;">请联系机构续费。在线购买上线后可在此缴费。</text>
            </view>
          </template>

          <template v-else>
            <view v-if="logsLoading" class="empty-block">
              <text class="empty-block__text">加载流水…</text>
            </view>
            <view v-else-if="logsError" class="empty-block empty-block--card">
              <text class="empty-block__title">流水加载失败</text>
              <text class="empty-block__hint">{{ logsError }}</text>
            </view>
            <view v-else-if="!logs.length" class="empty-block empty-block--card">
              <text class="empty-block__title">暂无消课记录</text>
              <text class="empty-block__hint">到课消课后将显示在这里</text>
            </view>
            <view v-for="log in logs" :key="log.id" class="list-card">
              <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8rpx;">
                <text class="list-card__title">{{ logTitle(log) }}</text>
                <text style="font-size:28rpx;font-weight:800;" :style="{ color: deltaColor(log) }">{{ deltaText(log) }}</text>
              </view>
              <text class="list-card__sub">{{ logTime(log) }} · {{ logOperator(log) }}</text>
            </view>
          </template>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchLessonConsumeLogs, fetchLessonPackages } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const { activeChild, activeChildId, goProfilePage } = ctx

const view = ref('list')
const loading = ref(false)
const errorMsg = ref('')
const packages = ref([])
const selectedPkg = ref(null)

const logsLoading = ref(false)
const logsError = ref('')
const logs = ref([])

function onBack() {
  if (view.value === 'logs') {
    view.value = 'list'
    selectedPkg.value = null
    logs.value = []
    return
  }
  goProfilePage('main')
}

function remainOf(pkg) {
  if (pkg.remain_lessons != null) return pkg.remain_lessons
  const total = Number(pkg.total_lessons || 0)
  const consumed = Number(pkg.consumed_lessons || 0)
  return Math.max(0, total - consumed)
}

function totalOf(pkg) {
  return pkg.total_lessons != null ? pkg.total_lessons : '—'
}

function formatRange(pkg) {
  const from = pkg.valid_from || pkg.validFrom || ''
  const to = pkg.valid_to || pkg.validTo || ''
  if (from && to) return `${from} ~ ${to}`
  if (to) return `至 ${to}`
  if (from) return `自 ${from}`
  return '不限'
}

function statusLabel(pkg) {
  const map = {
    active: '有效',
    exhausted: '已用完',
    expired: '已过期',
    void: '已作废',
  }
  if (pkg.status && map[pkg.status]) return map[pkg.status]
  if (remainOf(pkg) <= 0) return '已用完'
  return '有效'
}

function statusStyle(pkg) {
  const label = statusLabel(pkg)
  if (label === '有效') return { background: '#C8E6C9', color: '#2E7D32' }
  if (label === '已用完') return { background: '#FFE0B2', color: '#E65100' }
  if (label === '已过期' || label === '已作废') return { background: '#EEEEEE', color: '#757575' }
  return { background: '#E3F2FD', color: '#1565C0' }
}

function mapApiError(e) {
  if (e?.statusCode === 404) return '课时余额接口尚未开通，请稍后重试'
  return e?.message || '加载失败'
}

async function loadPackages() {
  if (!activeChildId.value) {
    packages.value = []
    errorMsg.value = ''
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchLessonPackages(activeChildId.value)
    packages.value = data?.list || data?.packages || []
  } catch (e) {
    packages.value = []
    errorMsg.value = mapApiError(e)
  } finally {
    loading.value = false
  }
}

async function openLogs(pkg) {
  selectedPkg.value = pkg
  view.value = 'logs'
  logsLoading.value = true
  logsError.value = ''
  logs.value = []
  try {
    const data = await fetchLessonConsumeLogs({
      studentId: activeChildId.value,
      classId: pkg.class_id || pkg.class?.id,
      packageId: pkg.id,
    })
    logs.value = data?.list || data?.logs || []
  } catch (e) {
    logsError.value = mapApiError(e)
  } finally {
    logsLoading.value = false
  }
}

function logTitle(log) {
  return log.lesson_content || log.content || log.class_name || (Number(log.delta) > 0 ? '冲正退回' : '到课消课')
}

function deltaText(log) {
  const d = Number(log.delta)
  if (Number.isNaN(d)) return '—'
  return d > 0 ? `+${d}` : `${d}`
}

function deltaColor(log) {
  const d = Number(log.delta)
  if (d > 0) return '#2E7D32'
  if (d < 0) return '#E65100'
  return '#6B7280'
}

function logTime(log) {
  return log.created_at || log.time || log.lesson_date || '—'
}

function logOperator(log) {
  return log.operator_name || log.teacher_name || log.operator || '系统'
}

watch(() => props.active, (v) => {
  if (v) {
    view.value = 'list'
    loadPackages()
  }
})

watch(activeChildId, () => {
  if (props.active) {
    view.value = 'list'
    loadPackages()
  }
})

onShow(() => {
  if (props.active) loadPackages()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
@import '../../styles/profile-subpage.scss';
</style>
