<template>
      <view class="tab-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view class="safe-nav-bar" style="padding-bottom:20rpx;">
            <text style="font-size:44rpx;font-weight:800;color:white;display:block;">通知管理</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">已发 {{ sentNotices.length }} 条</text>
          </view>
          <view style="display:flex;justify-content:flex-end;padding:0 40rpx 8rpx;">
            <view hover-class="tap-dim" style="background:rgba(255,255,255,0.25);border-radius:20rpx;padding:16rpx 28rpx;" @click="showCompose = true">
              <text style="color:white;font-size:26rpx;font-weight:700;">+ 发通知</text>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <LoadingSkeleton v-if="noticesLoading" variant="list" :count="3" padding="8rpx 0" />
            <view v-else-if="!notices.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无通知</text></view>
            <view v-for="n in notices" :key="n.id" class="card" style="margin-bottom:20rpx;overflow:hidden;">
              <view v-if="n.type === 'urgent'" style="height:6rpx;background:#E53935;" />
              <view style="padding:24rpx;">
                <view style="display:flex;align-items:flex-start;gap:16rpx;margin-bottom:16rpx;">
                  <view style="width:72rpx;height:72rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center;font-size:32rpx;flex-shrink:0;" :style="{ backgroundColor: (typeCfg[n.type] || typeCfg.notice).bg }">
                    <text>{{ (typeCfg[n.type] || typeCfg.notice).icon }}</text>
                  </view>
                  <view style="flex:1;min-width:0;">
                    <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:8rpx;">{{ n.title }}</text>
                    <view style="display:flex;gap:8rpx;flex-wrap:wrap;">
                      <view class="pill" :style="{ backgroundColor: (typeCfg[n.type] || typeCfg.notice).bg, color: (typeCfg[n.type] || typeCfg.notice).color }"><text style="font-size:20rpx;">{{ (typeCfg[n.type] || typeCfg.notice).label }}</text></view>
                      <view class="pill" style="background:#F5F0EC;"><text style="font-size:20rpx;color:#8D6E63;">→ {{ n.target }}</text></view>
                      <view class="pill" :style="{ backgroundColor: (statusCfg[n.status] || statusCfg.sent).bg, color: (statusCfg[n.status] || statusCfg.sent).color }"><text style="font-size:20rpx;">{{ (statusCfg[n.status] || statusCfg.sent).label }}</text></view>
                    </view>
                  </view>
                </view>
                <text style="font-size:24rpx;color:#8D6E63;line-height:1.7;display:block;margin-bottom:16rpx;">{{ n.body }}</text>
                <view style="display:flex;align-items:center;justify-content:space-between;">
                  <text style="font-size:22rpx;color:#BDBDBD;">{{ n.sentAt }}</text>
                  <view v-if="n.status === 'sent' && n.totalCount > 0" style="display:flex;align-items:center;gap:8rpx;">
                    <text style="font-size:22rpx;font-weight:700;color:#AB47BC;">{{ Math.round(n.readCount/n.totalCount*100) }}%</text>
                    <text style="font-size:20rpx;color:#8D6E63;">已读 ({{ n.readCount }}/{{ n.totalCount }})</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <!-- 发通知 sheet -->
        <view v-if="showCompose" class="overlay-mask" @click="showCompose = false">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">发送通知</text>
            <view style="display:flex;flex-direction:column;gap:24rpx;">
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">通知类型</text>
                <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
                  <view v-for="t in noticeTypes" :key="t.id" class="pill"
                    :style="{ backgroundColor: newNotice.type === t.id ? '#AB47BC18' : '#F5F0EC', color: newNotice.type === t.id ? '#AB47BC' : '#8D6E63', border: newNotice.type === t.id ? '2rpx solid #AB47BC' : '2rpx solid transparent', padding:'12rpx 20rpx' }"
                    @click="newNotice.type = t.id">
                    <text style="font-size:24rpx;">{{ t.icon }} {{ t.label }}</text>
                  </view>
                </view>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">发送对象</text>
                <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
                  <view v-for="tg in targets" :key="tg.name" class="pill"
                    :style="{ backgroundColor: newNotice.targetName === tg.name ? '#AB47BC18' : '#F5F0EC', color: newNotice.targetName === tg.name ? '#AB47BC' : '#8D6E63', padding:'12rpx 20rpx' }"
                    @click="newNotice.classId = tg.id; newNotice.targetName = tg.name">
                    <text style="font-size:22rpx;">{{ tg.name }}</text>
                  </view>
                </view>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">通知标题</text>
                <input class="form-input" placeholder="请输入通知标题" :value="newNotice.title" @input="e => newNotice.title = e.detail.value" />
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">通知内容</text>
                <textarea class="form-input" style="height:160rpx;" :value="newNotice.body" @input="e => newNotice.body = e.detail.value" placeholder="请输入通知内容..." />
              </view>
              <view class="primary-btn" @click="sendNotice">
                <text style="color:white;font-size:30rpx;font-weight:800;">立即发送</text>
              </view>
            </view>
          </view>
        </view>
      </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, computed, watch } from 'vue'
import { createNotice, fetchNotices } from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}

watch(() => props.pageShowCount, () => { loadNotices() }, { immediate: true })

const typeCfg = {
  notice:   { label: '通知', icon: '📢', color: '#1565C0', bg: '#E3F2FD' },
  activity: { label: '活动', icon: '🏅', color: '#E65100', bg: '#FFF3E0' },
  urgent:   { label: '紧急', icon: '⚠️', color: '#C62828', bg: '#FFEBEE' },
  holiday:  { label: '假期', icon: '🎉', color: '#2E7D32', bg: '#F1F8E9' },
}
const statusCfg = {
  sent:      { label: '已发送', color: '#2E7D32', bg: '#C8E6C9' },
  draft:     { label: '草稿',   color: '#F57F17', bg: '#FFF9C4' },
  scheduled: { label: '计划中', color: '#1565C0', bg: '#BBDEFB' },
}
const notices = ref([])
const noticesLoading = ref(false)
const noticeBusy = ref(false)
const sentNotices = computed(() => notices.value.filter(n => n.status === 'sent'))
const showCompose = ref(false)
const noticeTypes = [
  { id: 'notice',   label: '普通通知', icon: '📢' },
  { id: 'activity', label: '活动通知', icon: '🏅' },
  { id: 'urgent',   label: '紧急通知', icon: '⚠️' },
  { id: 'holiday',  label: '假期通知', icon: '🎉' },
]
const targets = ref([{ id: null, name: '全园' }])
const newNotice = ref({ type: 'notice', classId: null, targetName: '全园', title: '', body: '' })

function mapNotice(n) {
  return {
    id: n.id,
    title: n.title,
    type: n.type,
    target: n.target,
    body: n.body,
    status: n.status || 'sent',
    sentAt: n.sent_at || n.sentAt || '',
    readCount: n.read_count ?? n.readCount ?? 0,
    totalCount: n.total_count ?? n.totalCount ?? 0,
  }
}

async function loadNotices() {
  noticesLoading.value = true
  try {
    const data = await fetchNotices()
    notices.value = (data?.list || []).map(mapNotice)
    if (data?.targets?.length) targets.value = data.targets
  } catch (e) {
    uni.showToast({ title: e.message || '通知加载失败', icon: 'none' })
  } finally {
    noticesLoading.value = false
  }
}

async function sendNotice() {
  if (!newNotice.value.title.trim() || !newNotice.value.body.trim()) {
    uni.showToast({ title: '请填写标题和内容', icon: 'none' })
    return
  }
  if (noticeBusy.value) return
  noticeBusy.value = true
  try {
    const payload = {
      type: newNotice.value.type,
      title: newNotice.value.title.trim(),
      body: newNotice.value.body.trim(),
    }
    if (newNotice.value.classId) payload.class_id = newNotice.value.classId
    await createNotice(payload)
    newNotice.value = { type: 'notice', classId: null, targetName: '全园', title: '', body: '' }
    showCompose.value = false
    await loadNotices()
    uni.showToast({ title: '已发送', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '发送失败', icon: 'none' })
  } finally {
    noticeBusy.value = false
  }
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
