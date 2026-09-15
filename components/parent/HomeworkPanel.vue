<template>
  <view class="tab-page" style="background:white;">
    <view class="safe-nav-header" style="background:white;flex-shrink:0;border-bottom:1rpx solid #BBDEFB;">
      <view style="display:flex;align-items:center;gap:20rpx;padding:0 40rpx 20rpx;">
        <view class="back-btn" style="background:#F0F7FF;" @click="activeTab = 'home'">
          <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
        </view>
        <text style="font-size:36rpx;font-weight:800;color:#2D1F18;flex:1;">作业查看</text>
        <text style="font-size:22rpx;color:#8D6E63;">{{ activeChild.name }}</text>
      </view>
      <view style="display:flex;gap:0;padding:0 40rpx;">
        <view v-for="w in hwStatusTabs" :key="w.val" style="padding:16rpx 28rpx 16rpx 0;font-size:26rpx;font-weight:700;"
          :style="{ color: hwStatusFilter === w.val ? '#3B9EEB' : '#8D6E63', borderBottom: hwStatusFilter === w.val ? '3rpx solid #3B9EEB' : '3rpx solid transparent' }"
          @click="setHwStatus(w.val)"><text>{{ w.label }}</text></view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="hwLoading" style="padding:48rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#8D6E63;">加载中…</text>
        </view>
        <view v-else-if="!hwRecords.length" style="padding:48rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#8D6E63;">暂无作业</text>
        </view>
        <view v-for="rec in hwRecords" :key="rec.id" class="card" style="margin-bottom:24rpx;overflow:hidden;" @click="openHwDetail(rec)">
          <view style="height:8rpx;" :style="{ background: `linear-gradient(90deg, ${rec.color} 0%, ${rec.color}80 100%)` }" />
          <view style="padding:24rpx;">
            <view style="display:flex;align-items:flex-start;gap:20rpx;margin-bottom:12rpx;">
              <view style="width:80rpx;height:80rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0;" :style="{ backgroundColor: rec.color + '18' }">
                <MpIcon name="clipboard-list" :size="40" :color="rec.color || '#3B9EEB'" />
              </view>
              <view style="flex:1;">
                <view style="display:flex;align-items:center;gap:12rpx;flex-wrap:wrap;margin-bottom:8rpx;">
                  <view class="pill" :style="{ backgroundColor: rec.statusBg, color: rec.statusColor }"><text style="font-size:22rpx;font-weight:700;">{{ rec.statusLabel }}</text></view>
                  <view v-if="rec.gradeText" class="pill" :style="{ backgroundColor: rec.color + '18', color: rec.color }"><text style="font-size:22rpx;">{{ rec.gradeText }}</text></view>
                </view>
                <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">{{ rec.title }}</text>
                <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:4rpx;">截止 {{ rec.deadline }}</text>
              </view>
            </view>
            <text style="font-size:22rpx;color:#BDBDBD;">点按查看详情{{ rec.myStatus === 'pending' ? '并提交' : '' }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="showHwDetail" class="overlay" @click="showHwDetail = false">
      <view class="sheet" style="max-height:85vh;" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">{{ hwDetail?.title || '作业详情' }}</text>
        <scroll-view scroll-y style="max-height:60vh;">
          <view style="display:flex;flex-direction:column;gap:20rpx;padding-bottom:24rpx;">
            <view class="pill" style="align-self:flex-start;" :style="{ backgroundColor: hwDetail?.statusBg, color: hwDetail?.statusColor }">
              <text style="font-size:22rpx;font-weight:700;">{{ hwDetail?.statusLabel }}</text>
            </view>
            <text style="font-size:22rpx;color:#8D6E63;">截止 {{ hwDetail?.deadline }}</text>
            <view style="background:#F0F7FF;border-radius:16rpx;padding:20rpx;">
              <text style="font-size:22rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">作业要求</text>
              <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;">{{ hwDetail?.content || '—' }}</text>
            </view>
            <view v-if="hwDetail?.review" style="background:#F1F8E9;border-radius:16rpx;padding:20rpx;">
              <text style="font-size:22rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">老师评语 · {{ hwDetail.review.grade_text || '' }}</text>
              <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;">{{ hwDetail.review.text_feedback || '已批改' }}</text>
              <text v-if="hwDetail.review.reviewed_at" style="font-size:20rpx;color:#BDBDBD;display:block;margin-top:8rpx;">{{ hwDetail.review.reviewer || '' }} · {{ hwDetail.review.reviewed_at }}</text>
            </view>
            <view v-if="hwDetail?.myStatus === 'pending' || hwDetail?.myStatus === 'submitted'">
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">{{ hwDetail?.myStatus === 'submitted' ? '重新提交照片' : '拍照提交' }}</text>
              <view style="display:flex;gap:16rpx;align-items:center;">
                <view v-if="hwSubmitPreview" style="width:160rpx;height:160rpx;border-radius:16rpx;overflow:hidden;background:#F5F0EC;">
                  <image :src="hwSubmitPreview" mode="aspectFill" style="width:100%;height:100%;" />
                </view>
                <view class="pill" style="padding:20rpx 28rpx;background:#E3F2FD;color:#1565C0;" @click="pickHwPhoto">
                  <text style="font-size:26rpx;font-weight:700;">{{ hwSubmitPreview ? '重选照片' : '选择照片' }}</text>
                </view>
              </view>
            </view>
            <view v-if="hwDetail?.myStatus === 'pending' || hwDetail?.myStatus === 'submitted'"
              class="primary-btn" style="background:#3B9EEB;" :style="{ opacity: hwSubmitting ? 0.6 : 1 }" @click="doSubmitHomework">
              <text style="color:white;font-size:30rpx;font-weight:800;">{{ hwSubmitting ? '提交中…' : '提交作业' }}</text>
            </view>
            <view v-else-if="hwDetail?.myStatus === 'overdue'" style="padding:16rpx;text-align:center;">
              <text style="font-size:26rpx;color:#C62828;">已过截止时间，无法提交</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchHomework, fetchHomeworks, submitHomework } from '../../api/parent.js'
import { uploadFile } from '../../utils/request.js'
import { PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const activeTab = ctx.activeTab
const activeChild = ctx.activeChild
const activeChildId = ctx.activeChildId
const loadParentHome = ctx.loadParentHome

const HW_COLORS = ['#3B9EEB', '#66BB6A', '#AB47BC', '#FF7043', '#FFA726']
const HW_STATUS_META = {
  pending: { label: '待提交', bg: '#FFF3E0', color: '#E65100' },
  submitted: { label: '已提交', bg: '#E3F2FD', color: '#1565C0' },
  graded: { label: '已批改', bg: '#C8E6C9', color: '#2E7D32' },
  overdue: { label: '已逾期', bg: '#FFEBEE', color: '#C62828' },
}
const hwStatusTabs = [
  { val: '', label: '全部' },
  { val: 'pending', label: '待提交' },
  { val: 'submitted', label: '已提交' },
  { val: 'graded', label: '已批改' },
  { val: 'overdue', label: '已逾期' },
]
const hwStatusFilter = ref('')
const hwLoading = ref(false)
const hwRecords = ref([])
const showHwDetail = ref(false)
const hwDetail = ref(null)
const hwSubmitPreview = ref('')
const hwSubmitPath = ref('')
const hwSubmitting = ref(false)

function mapParentHw(row, index) {
  const meta = HW_STATUS_META[row.my_status] || HW_STATUS_META.pending
  return {
    id: row.id,
    title: row.title,
    deadline: row.deadline,
    myStatus: row.my_status,
    statusLabel: meta.label,
    statusBg: meta.bg,
    statusColor: meta.color,
    gradeText: row.grade_text || '',
    color: HW_COLORS[index % HW_COLORS.length],
  }
}

async function loadParentHomeworks() {
  if (!activeChildId.value) {
    hwRecords.value = []
    return
  }
  hwLoading.value = true
  try {
    const data = await fetchHomeworks(activeChildId.value, hwStatusFilter.value || undefined)
    hwRecords.value = (data?.list || []).map(mapParentHw)
  } catch (e) {
    uni.showToast({ title: e.message || '作业加载失败', icon: 'none' })
  } finally {
    hwLoading.value = false
  }
}

function setHwStatus(val) {
  hwStatusFilter.value = val
  loadParentHomeworks()
}

async function openHwDetail(rec) {
  if (!activeChildId.value) return
  try {
    const detail = await fetchHomework(rec.id, activeChildId.value)
    const meta = HW_STATUS_META[detail.my_status] || HW_STATUS_META.pending
    hwDetail.value = {
      id: detail.id,
      title: detail.title,
      deadline: detail.deadline,
      content: detail.content,
      myStatus: detail.my_status,
      statusLabel: meta.label,
      statusBg: meta.bg,
      statusColor: meta.color,
      review: detail.my_submission?.review || null,
    }
    hwSubmitPreview.value = ''
    hwSubmitPath.value = ''
    showHwDetail.value = true
  } catch (e) {
    uni.showToast({ title: e.message || '详情加载失败', icon: 'none' })
  }
}

function pickHwPhoto() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success(res) {
      const path = res.tempFilePaths?.[0]
      if (!path) return
      hwSubmitPath.value = path
      hwSubmitPreview.value = path
    },
  })
}

async function doSubmitHomework() {
  if (hwSubmitting.value || !hwDetail.value?.id || !activeChildId.value) return
  if (!hwSubmitPath.value) {
    uni.showToast({ title: '请先选择照片', icon: 'none' })
    return
  }
  hwSubmitting.value = true
  try {
    const uploaded = await uploadFile(hwSubmitPath.value, 'submission')
    await submitHomework(hwDetail.value.id, {
      student_id: activeChildId.value,
      image_attachment_ids: [uploaded.attachment_id],
    })
    uni.showToast({ title: '提交成功', icon: 'success' })
    showHwDetail.value = false
    await loadParentHomeworks()
    loadParentHome()
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    hwSubmitting.value = false
  }
}

watch(() => props.active, (v) => { if (v) loadParentHomeworks() }, { immediate: true })
watch(activeChildId, () => { if (props.active) loadParentHomeworks() })

onShow(() => { if (props.active) loadParentHomeworks() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
