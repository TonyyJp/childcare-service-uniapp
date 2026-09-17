<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">试课预约</text>
      <view class="subpage-nav__row">
        <view class="subpage-nav__back" @click="goProfilePage('main')">
          <text class="subpage-nav__back-icon">‹</text>
        </view>
        <view class="subpage-nav__side" />
      </view>
    </view>
    <view class="subpage-body">
      <scroll-view scroll-y class="subpage-scroll">
        <view class="subpage-pad">
          <text class="subpage-hint">{{ activeChild.name || '请先绑定宝贝' }} · 申请后由机构确认课次</text>

          <view v-if="!activeChildId" class="empty-block empty-block--card">
            <text class="empty-block__title">请先绑定宝贝</text>
            <text class="empty-block__hint">绑定后可为孩子申请兴趣课试课</text>
          </view>
          <view v-else-if="loading" class="empty-block">
            <text class="empty-block__text">加载中…</text>
          </view>
          <view v-else-if="errorMsg" class="empty-block empty-block--card">
            <text class="empty-block__title">暂时无法加载</text>
            <text class="empty-block__hint">{{ errorMsg }}</text>
            <view class="list-card__action list-card__action--primary" style="margin-top:20rpx;text-align:center;" @click="loadBookings">
              <text class="list-card__action-text" style="color:#3B9EEB;">重试</text>
            </view>
          </view>
          <view v-else-if="!bookings.length" class="empty-block empty-block--card">
            <text class="empty-block__title">暂无试课预约</text>
            <text class="empty-block__hint">可从课程详情申请，或点击下方发起</text>
          </view>

          <view v-for="item in bookings" :key="item.id" class="list-card">
            <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12rpx;">
              <text class="list-card__title">{{ item.class_name || '兴趣课' }}</text>
              <view class="pill" :style="statusStyle(item.status)">
                <text style="font-size:20rpx;font-weight:700;">{{ statusLabel(item.status) }}</text>
              </view>
            </view>
            <text class="list-card__sub" style="margin-bottom:8rpx;">{{ item.student_name || activeChild.name }}</text>
            <text v-if="lessonLine(item)" style="font-size:26rpx;color:#1F2937;line-height:1.6;display:block;">{{ lessonLine(item) }}</text>
            <text v-if="item.lesson_content" style="font-size:22rpx;color:#6B7280;display:block;margin-top:6rpx;">{{ item.lesson_content }}</text>
            <text v-if="item.remark" style="font-size:22rpx;color:#6B7280;display:block;margin-top:6rpx;">备注：{{ item.remark }}</text>
            <text v-if="item.cancel_reason" style="font-size:22rpx;color:#E53935;display:block;margin-top:8rpx;">取消原因：{{ item.cancel_reason }}</text>
            <text v-if="item.status === 'converted'" style="font-size:22rpx;color:#2E7D32;display:block;margin-top:8rpx;">
              已转正 {{ item.converted_class_name || item.class_name }}{{ item.converted_at ? ` · ${item.converted_at}` : '' }}
            </text>
            <view v-if="item.can_cancel" class="list-card__action list-card__action--danger" style="margin:16rpx 0 0;text-align:center;display:block;margin-left:0;" @click="doCancel(item)">
              <text class="list-card__action-text">取消预约</text>
            </view>
            <view v-if="item.status === 'attended'" class="list-card__action list-card__action--primary" style="margin:16rpx 0 0;text-align:center;display:block;margin-left:0;" @click="consultEnroll(item)">
              <text class="list-card__action-text" style="color:#E65100;">去报名咨询</text>
            </view>
          </view>

          <view v-if="activeChildId" class="add-dashed" @click="openApply">
            <text class="add-dashed__text">+ 申请试课</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="showApply" class="overlay" style="z-index:80;" @click="showApply = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">申请试课</text>
        <view class="form-section">
          <view class="form-field">
            <text class="form-label">试课宝贝</text>
            <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
              <view
                v-for="c in childOptions"
                :key="c.id"
                class="pill"
                style="padding:12rpx 20rpx;"
                :style="{ backgroundColor: applyForm.studentId === c.id ? '#3B9EEB18' : '#F5F7FA', color: applyForm.studentId === c.id ? '#3B9EEB' : '#6B7280' }"
                @click="onPickChild(c.id)"
              >
                <text style="font-size:22rpx;">{{ c.name }}</text>
              </view>
            </view>
          </view>
          <view class="form-field">
            <text class="form-label">意向课班</text>
            <view v-if="classesLoading" style="padding:8rpx 0;">
              <text style="font-size:22rpx;color:#6B7280;">加载课班…</text>
            </view>
            <view v-else-if="!trialClasses.length">
              <text style="font-size:22rpx;color:#E53935;">暂无可申请的试课课班</text>
            </view>
            <view v-else style="display:flex;gap:12rpx;flex-wrap:wrap;">
              <view
                v-for="cls in trialClasses"
                :key="cls.id"
                class="pill"
                style="padding:12rpx 20rpx;"
                :style="{ backgroundColor: applyForm.classId === cls.id ? '#3B9EEB18' : '#F5F7FA', color: applyForm.classId === cls.id ? '#3B9EEB' : '#6B7280' }"
                @click="applyForm.classId = cls.id"
              >
                <text style="font-size:22rpx;">{{ cls.name }}</text>
              </view>
            </view>
          </view>
          <view class="form-field">
            <text class="form-label">备注（可选）</text>
            <textarea class="form-input" style="height:140rpx;" :value="applyForm.remark" placeholder="过敏、方便时段等" @input="e => applyForm.remark = e.detail.value" />
          </view>
        </view>
        <view class="primary-btn" style="background:linear-gradient(135deg,#3B9EEB 0%,#2F8FD8 100%);" :style="{ opacity: busy ? 0.6 : 1 }" @click="submitApply">
          <text style="color:white;font-size:30rpx;font-weight:800;">{{ busy ? '提交中…' : '提交申请' }}</text>
        </view>
      </view>
    </view>

    <view v-if="showCancel" class="overlay" style="z-index:80;" @click="showCancel = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">取消试课</text>
        <text style="font-size:24rpx;color:#6B7280;display:block;margin-bottom:16rpx;">
          {{ cancelTarget?.class_name || '试课' }} · {{ cancelTarget?.student_name || activeChild.name }}
        </text>
        <textarea class="form-input" style="height:140rpx;" :value="cancelReason" placeholder="取消原因（可选）" @input="e => cancelReason = e.detail.value" />
        <view class="primary-btn" style="margin-top:24rpx;background:linear-gradient(135deg,#E53935,#EF5350);" :style="{ opacity: busy ? 0.6 : 1 }" @click="confirmCancel">
          <text style="color:white;font-size:30rpx;font-weight:800;">确认取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  cancelTrialBooking,
  createTicket,
  createTrialBooking,
  fetchTrialBookings,
  fetchTrialClasses,
} from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const { activeChild, activeChildId, childOptions, goProfilePage, parentName, parentPhone } = ctx

const bookings = ref([])
const loading = ref(false)
const errorMsg = ref('')
const busy = ref(false)
const showApply = ref(false)
const showCancel = ref(false)
const cancelTarget = ref(null)
const cancelReason = ref('')
const trialClasses = ref([])
const classesLoading = ref(false)
const applyForm = ref({ studentId: null, classId: null, remark: '' })

function statusLabel(s) {
  return ({
    pending: '待确认',
    scheduled: '已排课',
    attended: '已到课',
    absent: '未到课',
    cancelled: '已取消',
    converted: '已转正',
    expired: '已过期',
  })[s] || s || '—'
}

function statusStyle(s) {
  const map = {
    pending: { background: '#FFF3E0', color: '#E65100' },
    scheduled: { background: '#E3F2FD', color: '#1565C0' },
    attended: { background: '#E8F5E9', color: '#2E7D32' },
    absent: { background: '#FFEBEE', color: '#C62828' },
    cancelled: { background: '#F5F5F5', color: '#757575' },
    converted: { background: '#F3E5F5', color: '#7B1FA2' },
    expired: { background: '#EEEEEE', color: '#757575' },
  }
  return map[s] || map.cancelled
}

function lessonLine(item) {
  const bits = []
  if (item.lesson_sort) bits.push(`第${item.lesson_sort}节`)
  if (item.lesson_date) bits.push(item.lesson_date)
  if (item.start_time || item.end_time) {
    bits.push([item.start_time, item.end_time].filter(Boolean).join('-'))
  }
  return bits.join(' · ')
}

async function loadBookings() {
  if (!activeChildId.value) {
    bookings.value = []
    errorMsg.value = ''
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchTrialBookings(activeChildId.value)
    bookings.value = data?.list || data?.bookings || []
  } catch (e) {
    bookings.value = []
    errorMsg.value = e.message || '试课列表加载失败'
    uni.showToast({ title: errorMsg.value, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadTrialClasses(studentId) {
  classesLoading.value = true
  try {
    const data = await fetchTrialClasses(studentId)
    const list = data?.list || []
    trialClasses.value = list.filter(c => c.trial_apply_enabled !== false)
  } catch (e) {
    trialClasses.value = []
    uni.showToast({ title: e.message || '课班加载失败', icon: 'none' })
  } finally {
    classesLoading.value = false
  }
}

function onPickChild(id) {
  applyForm.value.studentId = id
  applyForm.value.classId = null
  loadTrialClasses(id)
}

async function openApply() {
  if (!activeChildId.value) {
    uni.showToast({ title: '请先绑定宝贝', icon: 'none' })
    return
  }
  applyForm.value = {
    studentId: activeChildId.value,
    classId: null,
    remark: '',
  }
  showApply.value = true
  await loadTrialClasses(activeChildId.value)
}

async function submitApply() {
  if (busy.value) return
  const { studentId, classId, remark } = applyForm.value
  if (!studentId) {
    uni.showToast({ title: '请选择宝贝', icon: 'none' })
    return
  }
  if (!classId) {
    uni.showToast({ title: '请选择课班', icon: 'none' })
    return
  }
  busy.value = true
  try {
    await createTrialBooking({
      student_id: studentId,
      class_id: classId,
      remark: (remark || '').trim() || undefined,
      contact_name: parentName.value || undefined,
      contact_phone: parentPhone.value || undefined,
    })
    uni.showToast({ title: '已提交试课申请', icon: 'success' })
    showApply.value = false
    await loadBookings()
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}

function doCancel(item) {
  if (busy.value) return
  cancelTarget.value = item
  cancelReason.value = ''
  showCancel.value = true
}

async function confirmCancel() {
  if (!cancelTarget.value?.id || busy.value) return
  busy.value = true
  try {
    await cancelTrialBooking(cancelTarget.value.id, (cancelReason.value || '').trim() || undefined)
    uni.showToast({ title: '已取消', icon: 'success' })
    showCancel.value = false
    cancelTarget.value = null
    await loadBookings()
  } catch (e) {
    uni.showToast({ title: e.message || '取消失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}

async function consultEnroll(item) {
  if (busy.value) return
  busy.value = true
  try {
    await createTicket({
      category: 'consult',
      title: `试课后报名：${item.class_name || '兴趣课'}`,
      content: `孩子「${item.student_name || activeChild.value.name || ''}」已试课「${item.class_name || ''}」，希望咨询正式报名。请机构老师联系。`,
      contact: parentPhone.value || undefined,
    })
    goProfilePage('main')
    uni.showToast({ title: '已提交咨询', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}

watch(() => props.active, (v) => { if (v) loadBookings() }, { immediate: true })
watch(activeChildId, () => { if (props.active) loadBookings() })
onShow(() => { if (props.active) loadBookings() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
@import '../../styles/profile-subpage.scss';
</style>
