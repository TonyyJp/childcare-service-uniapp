<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;justify-content:space-between;padding:0 40rpx;">
            <view style="display:flex;align-items:center;">
              <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;margin-right:20rpx;" @click="goProfilePage('main')">
                <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
              </view>
              <text style="font-size:32rpx;font-weight:800;color:#2D1F18;">帮助与反馈</text>
            </view>
            <view style="padding:12rpx 24rpx;border-radius:16rpx;background:#E3F2FD;" @click="openTicketCompose">
              <text style="font-size:24rpx;font-weight:700;color:#3B9EEB;">+ 反馈</text>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;padding-left:8rpx;">常见问题</text>
            <view class="card" style="overflow:hidden;margin-bottom:24rpx;">
              <view v-for="(faq, i) in helpFaqs" :key="faq.q" style="padding:24rpx;"
                :style="{ borderBottom: i < helpFaqs.length - 1 ? '1rpx solid #F5F0EC' : 'none' }"
                @click="toggleFaq(i)">
                <view style="display:flex;align-items:center;justify-content:space-between;">
                  <text style="font-size:28rpx;font-weight:700;color:#2D1F18;flex:1;margin-right:16rpx;">{{ faq.q }}</text>
                  <text style="font-size:24rpx;color:#BDBDBD;">{{ expandedFaq === i ? '▴' : '▾' }}</text>
                </view>
                <text v-if="expandedFaq === i" style="font-size:24rpx;color:#8D6E63;line-height:1.7;display:block;margin-top:12rpx;">{{ faq.a }}</text>
              </view>
            </view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;padding-left:8rpx;">我的反馈</text>
            <view v-if="ticketsLoading" style="padding:32rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
            <view v-else-if="!tickets.length" class="card" style="padding:32rpx;text-align:center;margin-bottom:24rpx;">
              <text style="font-size:26rpx;color:#8D6E63;">暂无反馈记录</text>
            </view>
            <view v-for="t in tickets" :key="t.id" class="card" style="padding:24rpx;margin-bottom:16rpx;">
              <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8rpx;">
                <text style="font-size:28rpx;font-weight:800;color:#2D1F18;flex:1;margin-right:12rpx;">{{ t.title }}</text>
                <view class="pill" :style="ticketStatusStyle(t.status)"><text style="font-size:20rpx;font-weight:700;">{{ ticketStatusLabel(t.status) }}</text></view>
              </view>
              <text style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:8rpx;">{{ ticketCategoryLabel(t.category) }} · {{ t.created_at || '' }}</text>
              <text style="font-size:26rpx;color:#2D1F18;line-height:1.6;display:block;">{{ t.content }}</text>
              <text v-if="t.platform_note" style="font-size:24rpx;color:#1565C0;line-height:1.6;display:block;margin-top:12rpx;padding:16rpx;background:#E3F2FD;border-radius:16rpx;">平台回复：{{ t.platform_note }}</text>
            </view>
          </view>
        </scroll-view>

        <view v-if="showTicketCompose" class="overlay" style="z-index:80;" @click="showTicketCompose = false">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">意见反馈</text>
            <view style="display:flex;flex-direction:column;">
              <view style="margin-bottom:20rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">类型</text>
                <view style="display:flex;">
                  <view v-for="(c, idx) in ticketCategories" :key="c.id" class="pill" style="padding:12rpx 20rpx;"
                    :style="{ backgroundColor: newTicket.category === c.id ? '#3B9EEB18' : '#F5F0EC', color: newTicket.category === c.id ? '#3B9EEB' : '#8D6E63', marginRight: idx === 0 ? '12rpx' : '0' }"
                    @click="newTicket.category = c.id">
                    <text style="font-size:22rpx;">{{ c.label }}</text>
                  </view>
                </view>
              </view>
              <view style="margin-bottom:20rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">标题</text>
                <input class="form-input" :value="newTicket.title" @input="e => newTicket.title = e.detail.value" placeholder="一句话概括问题" maxlength="50" />
              </view>
              <view style="margin-bottom:20rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">详情</text>
                <textarea class="form-input" style="height:160rpx;" :value="newTicket.content" @input="e => newTicket.content = e.detail.value" placeholder="请描述遇到的问题或建议…" />
              </view>
              <view class="primary-btn" :style="{ opacity: ticketBusy ? 0.6 : 1 }" @click="submitTicket">
                <text style="color:white;font-size:30rpx;font-weight:800;">提交</text>
              </view>
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
</style>
