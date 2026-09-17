<template>
  <view class="feed-page" style="height:100%;min-height:100vh;background:#f5f7fa;">
    <!-- 与我有关 -->
    <template v-if="mode === 'bell'">
      <view class="safe-nav-header feed-nav">
        <text class="feed-nav__title">与我有关</text>
        <view class="feed-nav__row">
          <view class="feed-nav__back" @click="closeBell">
            <text class="feed-nav__back-icon">‹</text>
          </view>
          <view class="feed-nav__side" />
        </view>
      </view>
      <scroll-view scroll-y class="feed-scroll">
        <view class="feed-pad">
          <LoadingSkeleton v-if="bellLoading" variant="list" :count="5" padding="8rpx 0" />
          <view v-else-if="!interactions.length" class="feed-empty feed-empty--card">
            <text class="feed-empty__title">暂无互动消息</text>
            <text class="feed-empty__hint">有人回复你时会出现在这里</text>
          </view>
          <view
            v-for="item in interactions"
            :key="item.id"
            class="moment-card"
            @click="openFromInteraction(item)"
          >
            <view class="moment-card__foot" style="margin-top:0;padding-top:0;border-top:none;">
              <text class="moment-card__name" style="font-size:26rpx;">{{ item.author }}{{ item.author_role === 'staff' ? '老师' : '' }} 回复了你</text>
              <text class="moment-card__time">{{ item.created_at }}</text>
            </view>
            <text class="moment-card__time" style="display:block;margin:8rpx 0;">来自：{{ item.topic }}</text>
            <text class="moment-card__content" style="margin-bottom:0;">{{ item.content }}</text>
          </view>
        </view>
      </scroll-view>
    </template>

    <!-- 动态详情 -->
    <template v-else>
      <view class="safe-nav-header feed-nav">
        <text class="feed-nav__title">动态详情</text>
        <view class="feed-nav__row">
          <view class="feed-nav__back" @click="closeDetail">
            <text class="feed-nav__back-icon">‹</text>
          </view>
          <view class="feed-nav__side" />
        </view>
      </view>
      <scroll-view scroll-y class="feed-scroll">
        <LoadingSkeleton v-if="detailLoading" variant="feed" :count="1" padding="24rpx 32rpx" />
        <view v-else-if="detail" class="feed-pad">
          <view class="moment-card">
            <view class="moment-card__head">
              <view class="moment-card__avatar">
                <text v-if="detail.cover_emoji" class="moment-card__emoji">{{ detail.cover_emoji }}</text>
                <MpIcon v-else name="camera" :size="32" color="#3B9EEB" />
              </view>
              <view class="moment-card__who">
                <text class="moment-card__name">{{ detail.publisher || '老师' }}</text>
                <text class="moment-card__time">{{ detail.published_at }}{{ detail.topic ? ` · ${detail.topic}` : '' }}</text>
              </view>
            </view>
            <text class="moment-card__content">{{ detail.content }}</text>
            <view
              v-if="detail.photos?.length"
              class="photo-grid"
              :class="photoGridClass(detail.photos.length)"
              style="margin-top:16rpx;"
            >
              <image
                v-for="(p, pi) in detail.photos.slice(0, 9)"
                :key="pi"
                :src="p"
                mode="aspectFill"
                class="photo-cell"
                :class="{ 'photo-cell--single': detail.photos.length === 1 }"
                @click="previewPhotos(detail.photos, pi)"
              />
            </view>
            <view class="moment-card__actions" style="border-top:none;margin-top:8rpx;padding-top:8rpx;">
              <view class="moment-action" @click="toggleLike">
                <MpIcon
                  name="heart"
                  :size="28"
                  :color="detail.liked ? '#E53935' : '#9CA3AF'"
                />
                <text class="moment-action__text" :class="{ 'is-liked': detail.liked }">
                  {{ detail.like_count > 0 ? detail.like_count : '赞' }}
                </text>
              </view>
              <view class="moment-action">
                <MpIcon name="message-circle" :size="28" color="#9CA3AF" />
                <text class="moment-action__text">{{ detail.comments?.length || 0 }}</text>
              </view>
            </view>
          </view>

          <text class="feed-section-title">评论 {{ detail.comments?.length || 0 }}</text>
          <view v-if="!detail.comments?.length" class="feed-empty feed-empty--card" style="padding:40rpx 24rpx;">
            <text class="feed-empty__hint">还没有评论，来抢沙发吧</text>
          </view>
          <view v-for="c in detail.comments || []" :key="c.id" class="comment-card">
            <view class="comment-card__main">
              <view class="comment-card__body">
                <text class="comment-card__author">{{ c.author }}</text>
                <text v-if="c.author_role === 'staff'" class="comment-card__role">老师</text>
                <text class="comment-card__content">{{ c.content }}</text>
                <text class="comment-card__time">{{ c.created_at }}</text>
              </view>
              <text class="comment-card__reply" @click="startReply(c)">回复</text>
            </view>
            <view v-if="c.replies?.length" class="comment-card__replies">
              <view v-for="r in c.replies" :key="r.id" class="comment-card__reply-item">
                <text class="comment-card__author">{{ r.author }}</text>
                <text v-if="r.author_role === 'staff'" class="comment-card__role">老师</text>
                <text class="comment-card__content">{{ r.content }}</text>
                <text class="comment-card__time">{{ r.created_at }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
      <view class="comment-bar">
        <view v-if="replyTo" class="comment-bar__hint">
          <text class="comment-bar__hint-text">回复 {{ replyTo.author }}</text>
          <text class="comment-bar__cancel" @click="replyTo = null">取消</text>
        </view>
        <view class="comment-bar__row">
          <input
            v-model="commentText"
            class="comment-input"
            :placeholder="replyTo ? `回复 ${replyTo.author}` : '写评论…'"
            confirm-type="send"
            maxlength="500"
            @confirm="submitComment"
          />
          <view
            class="comment-send"
            :style="{ opacity: submitting || !commentText.trim() ? 0.5 : 1 }"
            @click="submitComment"
          >
            <text class="comment-send__text">发送</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { inject, ref, watch } from 'vue'
import {
  createDailyComment,
  fetchDailyInteractions,
  fetchDailyPost,
  readMessages,
  toggleDailyLike,
} from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'

const props = defineProps({
  mode: { type: String, default: 'detail' }, // detail | bell
  postId: { type: [Number, String], default: null },
})

const emit = defineEmits(['close', 'opened-detail'])

const ctx = inject(PARENT_CTX_KEY)
const activeChildId = ctx.activeChildId
const refreshUnreadCount = ctx.refreshUnreadCount

const detailLoading = ref(false)
const detail = ref(null)
const commentText = ref('')
const replyTo = ref(null)
const submitting = ref(false)
const liking = ref(false)

const bellLoading = ref(false)
const interactions = ref([])

function photoGridClass(n) {
  if (n === 1) return 'cols-1'
  if (n === 2 || n === 4) return 'cols-2'
  return 'cols-3'
}

function previewPhotos(urls, index) {
  uni.previewImage({ urls, current: urls[index] })
}

function closeDetail() {
  emit('close', 'detail')
}

function closeBell() {
  emit('close', 'bell')
}

async function loadDetail(id) {
  if (!id) return
  detailLoading.value = true
  detail.value = null
  replyTo.value = null
  commentText.value = ''
  try {
    detail.value = await fetchDailyPost(id, activeChildId.value)
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
    closeDetail()
  } finally {
    detailLoading.value = false
  }
}

async function loadBell() {
  bellLoading.value = true
  try {
    const data = await fetchDailyInteractions()
    interactions.value = data?.list || []
    try {
      await readMessages({ type: 'daily_comment' })
      await refreshUnreadCount()
    } catch {
      // ignore
    }
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    bellLoading.value = false
  }
}

async function openFromInteraction(item) {
  emit('opened-detail', item.daily_post_id)
}

function startReply(c) {
  replyTo.value = c
}

async function submitComment() {
  const text = commentText.value.trim()
  const id = props.postId || detail.value?.id
  if (!text || submitting.value || !id || !activeChildId.value) return
  submitting.value = true
  try {
    await createDailyComment(id, {
      student_id: activeChildId.value,
      content: text,
      parent_id: replyTo.value?.id || undefined,
    })
    commentText.value = ''
    replyTo.value = null
    await loadDetail(id)
  } catch (e) {
    uni.showToast({ title: e.message || '发送失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function toggleLike() {
  const post = detail.value
  if (!post?.id || !activeChildId.value || liking.value) return
  liking.value = true
  const prevLiked = !!post.liked
  const prevCount = Number(post.like_count || 0)
  post.liked = !prevLiked
  post.like_count = Math.max(0, prevCount + (prevLiked ? -1 : 1))
  try {
    const data = await toggleDailyLike(post.id, activeChildId.value)
    post.liked = !!data?.liked
    post.like_count = Number(data?.like_count || 0)
  } catch (e) {
    post.liked = prevLiked
    post.like_count = prevCount
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    liking.value = false
  }
}

watch(
  () => [props.mode, props.postId],
  ([mode, id]) => {
    if (mode === 'bell') loadBell()
    else if (id) loadDetail(id)
  },
  { immediate: true },
)
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';

$accent: #3b9eeb;
$accent-soft: #e3f2fd;
$page-bg: #f5f7fa;
$ink: #1f2937;
$muted: #6b7280;
$line: #eff1f4;

.feed-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: $page-bg;
}

.feed-nav {
  position: relative;
  flex-shrink: 0;
  background: #fff;
  padding-bottom: 20rpx;
  padding-left: 40rpx !important;
  padding-right: 40rpx !important;
  border-bottom: 1rpx solid $line;
}

.feed-nav__title {
  position: absolute;
  left: 0;
  right: 0;
  top: var(--nav-pad-top, 88rpx);
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 800;
  color: $ink;
  pointer-events: none;
  z-index: 0;
}

.feed-nav__row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.feed-nav__side {
  width: 64rpx;
  height: 64rpx;
  flex-shrink: 0;
}

.feed-nav__back {
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  background: $accent-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed-nav__back-icon {
  font-size: 40rpx;
  color: $accent;
  line-height: 1;
  font-weight: 700;
}

.feed-scroll {
  flex: 1;
  height: 0;
  background: $page-bg;
}

.feed-pad {
  padding: 24rpx 32rpx calc(32rpx + env(safe-area-inset-bottom, 0px));
}

.feed-empty {
  padding: 64rpx 24rpx;
  text-align: center;
}

.feed-empty--card {
  background: #fff;
  border-radius: 28rpx;
  box-shadow: 0 2rpx 16rpx rgba(31, 41, 55, 0.06);
  margin-bottom: 20rpx;
}

.feed-empty__title {
  font-size: 30rpx;
  font-weight: 800;
  color: $ink;
  display: block;
}

.feed-empty__text,
.feed-empty__hint {
  font-size: 24rpx;
  color: $muted;
  display: block;
  margin-top: 10rpx;
}

.feed-section-title {
  font-size: 26rpx;
  font-weight: 800;
  color: $ink;
  display: block;
  margin: 8rpx 0 16rpx;
}

.moment-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(31, 41, 55, 0.06);
}

.moment-card__head {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.moment-card__avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 24rpx;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.moment-card__emoji {
  font-size: 36rpx;
}

.moment-card__who {
  flex: 1;
  min-width: 0;
}

.moment-card__name {
  font-size: 28rpx;
  font-weight: 700;
  color: $ink;
  display: block;
}

.moment-card__time {
  font-size: 22rpx;
  color: $muted;
  display: block;
  margin-top: 4rpx;
}

.moment-card__content {
  font-size: 28rpx;
  color: $ink;
  line-height: 1.6;
  display: block;
  margin-top: 16rpx;
}

.moment-card__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.moment-card__actions {
  display: flex;
  gap: 32rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid $line;
}

.moment-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.moment-action__text {
  font-size: 24rpx;
  color: $muted;
}

.moment-action__text.is-liked {
  color: #e53935;
}

.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.photo-grid.cols-1 .photo-cell {
  width: 100%;
  height: 360rpx;
}

.photo-grid.cols-2 .photo-cell {
  width: calc(50% - 4rpx);
  height: 240rpx;
}

.photo-grid.cols-3 .photo-cell {
  width: calc(33.33% - 6rpx);
  height: 200rpx;
}

.photo-cell {
  border-radius: 12rpx;
  background: #eef1f5;
}

.photo-cell--single {
  border-radius: 16rpx;
}

.comment-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 12rpx;
}

.comment-card__main {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.comment-card__body {
  flex: 1;
  min-width: 0;
}

.comment-card__author {
  font-size: 24rpx;
  font-weight: 700;
  color: $ink;
  margin-right: 8rpx;
}

.comment-card__role {
  font-size: 20rpx;
  color: $accent;
  margin-right: 8rpx;
}

.comment-card__content {
  font-size: 26rpx;
  color: $ink;
  line-height: 1.5;
  display: block;
  margin-top: 6rpx;
}

.comment-card__time {
  font-size: 20rpx;
  color: $muted;
  display: block;
  margin-top: 6rpx;
}

.comment-card__reply {
  font-size: 22rpx;
  color: $accent;
  flex-shrink: 0;
  padding-top: 4rpx;
}

.comment-card__replies {
  margin-top: 12rpx;
  margin-left: 16rpx;
  padding: 12rpx 16rpx;
  background: $page-bg;
  border-radius: 12rpx;
}

.comment-card__reply-item {
  margin-bottom: 8rpx;
}

.comment-bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1rpx solid $line;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom, 0px));
}

.comment-bar__hint {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.comment-bar__hint-text {
  font-size: 22rpx;
  color: $muted;
}

.comment-bar__cancel {
  font-size: 22rpx;
  color: $accent;
}

.comment-bar__row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.comment-input {
  flex: 1;
  height: 72rpx;
  padding: 0 24rpx;
  background: $page-bg;
  border-radius: 36rpx;
  font-size: 26rpx;
}

.comment-send {
  padding: 0 28rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: $accent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-send__text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 700;
}
</style>
