<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">帮助与反馈</text>
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
          <text class="subpage-section-title">常见问题</text>
          <view class="list-card" style="padding:0;overflow:hidden;margin-bottom:24rpx;">
            <view
              v-for="(faq, i) in helpFaqs"
              :key="faq.q"
              class="faq-row"
              :style="{ borderBottom: i < helpFaqs.length - 1 ? '1rpx solid #E3F2FD' : 'none' }"
              @click="toggleFaq(i)"
            >
              <view style="display:flex;align-items:center;justify-content:space-between;">
                <text style="font-size:28rpx;font-weight:700;color:#1F2937;flex:1;margin-right:16rpx;">{{ faq.q }}</text>
                <text style="font-size:24rpx;color:#9CA3AF;">{{ expandedFaq === i ? '▴' : '▾' }}</text>
              </view>
              <text v-if="expandedFaq === i" class="list-card__sub" style="line-height:1.7;margin-top:12rpx;">{{ faq.a }}</text>
            </view>
          </view>

          <text class="subpage-section-title">我的反馈</text>
          <view v-if="ticketsLoading" class="empty-block">
            <text class="empty-block__text">加载中…</text>
          </view>
          <view v-else-if="!tickets.length" class="empty-block empty-block--card" style="margin-bottom:20rpx;">
            <text class="empty-block__title">暂无反馈记录</text>
            <text class="empty-block__hint">有问题可通过下方入口提交</text>
          </view>

          <view v-for="t in tickets" :key="t.id" class="list-card">
            <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8rpx;">
              <text class="list-card__title" style="flex:1;margin-right:12rpx;">{{ t.title }}</text>
              <view class="pill" :style="ticketStatusStyle(t.status)">
                <text style="font-size:20rpx;font-weight:700;">{{ ticketStatusLabel(t.status) }}</text>
              </view>
            </view>
            <text class="list-card__sub" style="margin-bottom:8rpx;">{{ ticketCategoryLabel(t.category) }} · {{ t.created_at || '' }}</text>
            <text style="font-size:26rpx;color:#1F2937;line-height:1.6;display:block;">{{ t.content }}</text>
            <text
              v-if="t.platform_note"
              style="font-size:24rpx;color:#1565C0;line-height:1.6;display:block;margin-top:12rpx;padding:16rpx;background:#E3F2FD;border-radius:16rpx;"
            >平台回复：{{ t.platform_note }}</text>
          </view>

          <view class="add-dashed" @click="openTicketCompose">
            <text class="add-dashed__text">+ 意见反馈</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="showTicketCompose" class="overlay" style="z-index:80;" @click="showTicketCompose = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">意见反馈</text>
        <view class="form-section">
          <view class="form-field">
            <text class="form-label">类型</text>
            <view style="display:flex;">
              <view
                v-for="(c, idx) in ticketCategories"
                :key="c.id"
                class="pill"
                style="padding:12rpx 20rpx;"
                :style="{
                  backgroundColor: newTicket.category === c.id ? '#3B9EEB18' : '#F5F7FA',
                  color: newTicket.category === c.id ? '#3B9EEB' : '#6B7280',
                  marginRight: idx === 0 ? '12rpx' : '0',
                }"
                @click="newTicket.category = c.id"
              >
                <text style="font-size:22rpx;">{{ c.label }}</text>
              </view>
            </view>
          </view>
          <view class="form-field">
            <text class="form-label">标题</text>
            <input class="form-input" :value="newTicket.title" @input="e => newTicket.title = e.detail.value" placeholder="一句话概括问题" maxlength="50" />
          </view>
          <view class="form-field">
            <text class="form-label">详情</text>
            <textarea class="form-input" style="height:160rpx;" :value="newTicket.content" @input="e => newTicket.content = e.detail.value" placeholder="请描述遇到的问题或建议…" />
          </view>
        </view>
        <view class="primary-btn" :style="{ opacity: ticketBusy ? 0.6 : 1 }" @click="submitTicket">
          <text style="color:white;font-size:30rpx;font-weight:800;">提交</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { createTicket, fetchTickets } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const { parentPhone, goProfilePage } = ctx

const helpFaqs = [
  { q: '如何切换查看的孩子？', a: '在首页顶部切换宝贝标签，或在「我的 → 我的宝贝」中选择。' },
  { q: '请假如何提交？', a: '进入「我的 → 请假申请」，选择类型与日期后提交；审批前可撤回。' },
  { q: '作业怎么交？', a: '在宝贝首页进入「作业查看」，按状态筛选后拍照或填写提交。' },
  { q: '收不到消息怎么办？', a: '先在「消息」页查看站内通知；微信订阅推送需授权，可在「消息通知」中确认偏好。' },
]
const expandedFaq = ref(null)
function toggleFaq(i) { expandedFaq.value = expandedFaq.value === i ? null : i }

const tickets = ref([])
const ticketsLoading = ref(false)
const ticketBusy = ref(false)
const showTicketCompose = ref(false)
const ticketCategories = [
  { id: 'consult', label: '咨询' },
  { id: 'complaint', label: '投诉建议' },
]
const newTicket = ref({ category: 'consult', title: '', content: '' })

function ticketStatusLabel(s) {
  return ({ pending: '待处理', processing: '处理中', closed: '已关闭' })[s] || s
}
function ticketStatusStyle(s) {
  const map = {
    pending: { backgroundColor: '#FFF3E0', color: '#E65100' },
    processing: { backgroundColor: '#E3F2FD', color: '#1565C0' },
    closed: { backgroundColor: '#F5F5F5', color: '#757575' },
  }
  return map[s] || map.pending
}
function ticketCategoryLabel(c) {
  return ({ consult: '咨询', complaint: '投诉建议' })[c] || c
}

async function loadTickets() {
  ticketsLoading.value = true
  try {
    const data = await fetchTickets()
    tickets.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '反馈加载失败', icon: 'none' })
  } finally {
    ticketsLoading.value = false
  }
}

function openTicketCompose() {
  newTicket.value = { category: 'consult', title: '', content: '' }
  showTicketCompose.value = true
}

async function submitTicket() {
  const title = (newTicket.value.title || '').trim()
  const content = (newTicket.value.content || '').trim()
  if (!title || !content) { uni.showToast({ title: '请填写标题和详情', icon: 'none' }); return }
  if (ticketBusy.value) return
  ticketBusy.value = true
  try {
    await createTicket({
      category: newTicket.value.category,
      title,
      content,
      contact: parentPhone.value || undefined,
    })
    uni.showToast({ title: '已提交', icon: 'success' })
    showTicketCompose.value = false
    await loadTickets()
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    ticketBusy.value = false
  }
}

watch(() => props.active, (v) => { if (v) loadTickets() }, { immediate: true })

onShow(() => { if (props.active) loadTickets() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
@import '../../styles/profile-subpage.scss';

.faq-row {
  padding: 28rpx;
}
</style>
