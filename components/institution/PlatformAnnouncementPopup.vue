<template>
  <view>
    <!-- 全屏列表：embedded 时由页面 page-container 承载；否则自管叠层 -->
    <view
      v-if="!popupOnly && (embedded || showAnnouncementList)"
      class="overlay-page"
      :style="embedded ? 'position:relative;z-index:0;background:#FAF5FF;' : 'z-index:60;background:#FAF5FF;'"
    >
      <view class="safe-nav-header" style="background:white;flex-shrink:0;border-bottom:1rpx solid #E1BEE7;">
        <view style="display:flex;align-items:center;gap:20rpx;padding:0 40rpx 24rpx;">
          <view
            style="width:64rpx;height:64rpx;border-radius:24rpx;background:#FAF5FF;display:flex;align-items:center;justify-content:center;"
            @click="closeList"
          >
            <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
          </view>
          <text style="font-size:32rpx;font-weight:800;color:#2D1F18;flex:1;text-align:center;">平台公告</text>
          <view style="width:64rpx;" />
        </view>
      </view>

      <scroll-view v-if="announcementDetail !== null" scroll-y style="flex:1;height:0;">
        <view style="padding:32rpx 40rpx;">
          <view v-for="ann in platformAnnouncements" :key="ann.id">
            <view v-if="ann.id === announcementDetail">
              <view class="pill" style="margin-bottom:20rpx;" :style="{ backgroundColor: ann.tagColor + '18', color: ann.tagColor }"><text style="font-size:22rpx;font-weight:700;">{{ ann.tag }}</text></view>
              <text style="font-size:34rpx;font-weight:800;color:#2D1F18;display:block;line-height:1.4;margin-bottom:12rpx;">{{ ann.title }}</text>
              <text style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:32rpx;">发布时间：{{ ann.date }}</text>
              <text style="font-size:28rpx;color:#2D1F18;line-height:2;display:block;">{{ ann.content }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <scroll-view v-else scroll-y style="flex:1;height:0;">
        <view style="padding:20rpx 40rpx;">
          <LoadingSkeleton v-if="announcementsLoading" variant="list" :count="3" padding="8rpx 0" />
          <view v-else-if="!platformAnnouncements.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无平台公告</text></view>
          <view v-for="ann in platformAnnouncements" :key="ann.id" class="card" style="padding:24rpx;margin-bottom:16rpx;" @click="announcementDetail = ann.id">
            <view style="display:flex;align-items:flex-start;gap:20rpx;">
              <view style="width:80rpx;height:80rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;font-size:36rpx;flex-shrink:0;" :style="{ backgroundColor: ann.tagColor + '15' }"><text>📢</text></view>
              <view style="flex:1;min-width:0;">
                <view style="display:flex;align-items:center;gap:12rpx;margin-bottom:8rpx;flex-wrap:wrap;">
                  <view class="pill" :style="{ backgroundColor: ann.tagColor + '15', color: ann.tagColor }"><text style="font-size:20rpx;font-weight:700;">{{ ann.tag }}</text></view>
                  <text style="font-size:20rpx;color:#8D6E63;">{{ ann.date }}</text>
                </view>
                <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;margin-bottom:8rpx;line-height:1.4;">{{ ann.title }}</text>
                <text style="font-size:22rpx;color:#8D6E63;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ ann.content }}</text>
              </view>
              <text style="font-size:28rpx;color:#BDBDBD;flex-shrink:0;">›</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view
      v-if="!embedded && showAnnouncement && popupAnnouncements.length"
      style="position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:40rpx;z-index:80;"
    >
      <view style="width:100%;background:white;border-radius:48rpx;overflow:hidden;max-height:80vh;display:flex;flex-direction:column;">
        <view style="padding:40rpx;flex-shrink:0;background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8rpx;">
            <view class="pill" style="background:rgba(255,255,255,0.25);"><text style="font-size:20rpx;color:white;font-weight:700;">{{ popupAnnouncements[announcementStep]?.tag }}</text></view>
            <text style="color:rgba(255,255,255,0.7);font-size:22rpx;">{{ announcementStep + 1 }} / {{ popupAnnouncements.length }}</text>
          </view>
          <text style="font-size:30rpx;font-weight:800;color:white;display:block;line-height:1.4;margin-top:16rpx;">{{ popupAnnouncements[announcementStep]?.title }}</text>
          <text style="font-size:22rpx;color:rgba(255,255,255,0.7);display:block;margin-top:8rpx;">{{ popupAnnouncements[announcementStep]?.date }}</text>
        </view>
        <view style="display:flex;justify-content:center;gap:12rpx;padding:24rpx 0 0;flex-shrink:0;">
          <view v-for="(_, i) in popupAnnouncements" :key="i" style="height:12rpx;border-radius:6rpx;transition:width 0.2s;" :style="{ width: i === announcementStep ? '40rpx' : '12rpx', backgroundColor: i <= announcementStep ? '#AB47BC' : '#E0E0E0' }" />
        </view>
        <scroll-view scroll-y style="flex:1;height:0;min-height:200rpx;">
          <view style="padding:24rpx 40rpx;">
            <text style="font-size:26rpx;color:#2D1F18;line-height:2;">{{ popupAnnouncements[announcementStep]?.content }}</text>
          </view>
        </scroll-view>
        <view style="display:flex;gap:20rpx;padding:24rpx 40rpx 48rpx;flex-shrink:0;">
          <view v-if="announcementStep > 0" style="flex:1;padding:28rpx;border-radius:24rpx;background:#F5F0EC;display:flex;align-items:center;justify-content:center;" @click="announcementStep--">
            <text style="font-size:26rpx;font-weight:700;color:#8D6E63;">上一条</text>
          </view>
          <view v-if="announcementStep < popupAnnouncements.length - 1" style="flex:2;padding:28rpx;border-radius:24rpx;background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);display:flex;align-items:center;justify-content:center;" @click="announcementStep++">
            <text style="font-size:26rpx;font-weight:700;color:white;">下一条 →</text>
          </view>
          <view v-else style="flex:2;padding:28rpx;border-radius:24rpx;background:linear-gradient(135deg,#66BB6A 0%,#81C784 100%);display:flex;align-items:center;justify-content:center;" @click="dismissAnnouncementPopup">
            <text style="font-size:26rpx;font-weight:700;color:white;">✓ 已阅，关闭</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, onMounted, watch } from 'vue'
import { fetchPlatformNotices } from '../../api/institution.js'

const props = defineProps({
  /** 由页面 page-container 承载列表时为 true */
  embedded: { type: Boolean, default: false },
  /** 仅负责启动弹窗，不渲染列表 */
  popupOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const platformAnnouncements = ref([])
const popupAnnouncements = ref([])
const announcementsLoading = ref(false)
const showAnnouncement = ref(false)
const announcementStep = ref(0)
const showAnnouncementList = ref(false)
const announcementDetail = ref(null)

function announcementMeta(title, popup) {
  if (/政策|法规/.test(title || '')) return { tag: '政策法规', tagColor: '#E53935' }
  if (/安全|检查/.test(title || '')) return { tag: '安全检查', tagColor: '#FF7043' }
  if (popup) return { tag: '重��', tagColor: '#AB47BC' }
  return { tag: '平台公告', tagColor: '#AB47BC' }
}

function mapAnnouncement(n) {
  const meta = announcementMeta(n.title, n.popup)
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    popup: !!n.popup,
    date: n.date || (n.created_at || '').slice(0, 10),
    tag: meta.tag,
    tagColor: meta.tagColor,
  }
}

function popupDismissKey() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `inst_platform_ann_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function dismissAnnouncementPopup() {
  showAnnouncement.value = false
  try {
    uni.setStorageSync(popupDismissKey(), '1')
  } catch (_) { /* ignore */ }
}

async function loadPlatformAnnouncements({ openPopup = false } = {}) {
  announcementsLoading.value = true
  try {
    const data = await fetchPlatformNotices(false)
    const list = (data?.list || []).map(mapAnnouncement)
    platformAnnouncements.value = list
    popupAnnouncements.value = list.filter(a => a.popup)
    if (openPopup && popupAnnouncements.value.length) {
      let dismissed = false
      try {
        dismissed = !!uni.getStorageSync(popupDismissKey())
      } catch (_) { /* ignore */ }
      if (!dismissed) {
        announcementStep.value = 0
        showAnnouncement.value = true
      }
    }
  } catch (e) {
    if (!openPopup) {
      uni.showToast({ title: e.message || '公告加载失败', icon: 'none' })
    }
  } finally {
    announcementsLoading.value = false
  }
}

function closeList() {
  announcementDetail.value = null
  showAnnouncementList.value = false
  if (props.embedded) emit('close')
}

/** @returns {boolean} true=仍留在公告内页（如从详情回到列表） */
function onSwipeBack() {
  if (announcementDetail.value !== null) {
    announcementDetail.value = null
    return true
  }
  closeList()
  return false
}

function openAnnouncementList() {
  announcementDetail.value = null
  showAnnouncementList.value = true
  loadPlatformAnnouncements()
}

watch(
  () => props.embedded,
  (v) => {
    if (v) {
      announcementDetail.value = null
      showAnnouncementList.value = true
      loadPlatformAnnouncements()
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (props.popupOnly || !props.embedded) {
    loadPlatformAnnouncements({ openPopup: true })
  }
})

defineExpose({ openAnnouncementList, onSwipeBack })
</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
