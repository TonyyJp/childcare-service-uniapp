<template>
  <view class="feed-page">
    <view class="safe-nav-header feed-nav">
      <text class="feed-nav__title">动态</text>
      <view class="feed-nav__row">
        <view class="feed-nav__side" />
        <view class="feed-nav__bell" @click="openBell">
          <MpIcon name="message-circle" :size="36" color="#3B9EEB" />
          <view v-if="feedCommentUnread > 0" class="feed-nav__badge">
            <text class="feed-nav__badge-text">{{ feedCommentUnread > 99 ? '99+' : feedCommentUnread }}</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="feed-scroll"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onPullRefresh"
      @scrolltolower="loadMore"
      lower-threshold="120"
    >
      <view class="feed-pad">
        <view v-if="!activeChildId" class="feed-empty">
          <text class="feed-empty__text">请先绑定宝贝后再查看动态</text>
        </view>
        <view v-else-if="loading && !posts.length" class="feed-empty">
          <text class="feed-empty__text">加载中…</text>
        </view>
        <view v-else-if="!posts.length" class="feed-empty feed-empty--card">
          <view class="feed-empty__icon">
            <MpIcon name="camera" :size="48" color="#3B9EEB" />
          </view>
          <text class="feed-empty__title">暂无班级动态</text>
          <text class="feed-empty__hint">老师发布后会出现在这里</text>
        </view>

        <view
          v-for="post in posts"
          :key="post.id"
          class="moment-card"
        >
          <view class="moment-card__main" @click="openDetail(post.id)">
            <view class="moment-card__head">
              <view class="moment-card__avatar">
                <text v-if="post.cover_emoji" class="moment-card__emoji">{{ post.cover_emoji }}</text>
                <MpIcon v-else name="camera" :size="36" color="#7B1FA2" />
              </view>
              <view class="moment-card__who">
                <text class="moment-card__name">{{ post.publisher || '老师' }}</text>
                <text class="moment-card__time">{{ post.published_at || '' }}{{ post.topic ? ` · ${post.topic}` : '' }}</text>
              </view>
            </view>

            <view class="moment-card__body">
              <text class="moment-card__content">{{ contentPreview(post.content) }}</text>
              <text
                v-if="needMore(post.content)"
                class="moment-card__more"
                @click.stop="openDetail(post.id)"
              >更多</text>
            </view>

            <view
              v-if="post.photos?.length"
              class="photo-grid"
              :class="photoGridClass(post.photos.length)"
              @click.stop
            >
              <image
                v-for="(p, pi) in post.photos.slice(0, 9)"
                :key="pi"
                :src="p"
                mode="aspectFill"
                class="photo-cell"
                :class="{ 'photo-cell--single': post.photos.length === 1 }"
                @click.stop="previewPhotos(post.photos, pi)"
              />
            </view>
          </view>

          <view class="moment-card__actions" @click.stop>
            <view class="moment-action" @click="toggleLike(post)">
              <MpIcon
                name="heart"
                :size="28"
                :color="post.liked ? '#E53935' : '#8D6E63'"
              />
              <text class="moment-action__text" :class="{ 'is-liked': post.liked }">
                {{ post.like_count > 0 ? post.like_count : '赞' }}
              </text>
            </view>
            <view class="moment-action" @click="openListComment(post)">
              <MpIcon name="message-circle" :size="28" color="#8D6E63" />
              <text class="moment-action__text">
                {{ post.comment_count > 0 ? post.comment_count : '评论' }}
              </text>
            </view>
          </view>

          <view v-if="post.latest_comments?.length" class="moment-card__preview" @click="openDetail(post.id)">
            <view v-for="c in post.latest_comments" :key="c.id" class="moment-card__preview-row">
              <text class="moment-card__preview-text">
                <text class="moment-card__preview-author">{{ c.author }}</text>
                <text>：{{ c.content }}</text>
              </text>
            </view>
          </view>

          <view v-if="listCommentPostId === post.id" class="list-comment" @click.stop>
            <input
              v-model="listCommentText"
              class="list-comment__input"
              focus
              placeholder="写评论…"
              confirm-type="send"
              maxlength="500"
              @confirm="submitListComment"
            />
            <view
              class="list-comment__send"
              :style="{ opacity: listSubmitting || !listCommentText.trim() ? 0.5 : 1 }"
              @click="submitListComment"
            >
              <text class="list-comment__send-text">发送</text>
            </view>
          </view>
        </view>

        <view v-if="loadingMore" class="feed-more">
          <text class="feed-more__text">加载更多…</text>
        </view>
        <view v-else-if="posts.length && !hasMore" class="feed-more">
          <text class="feed-more__text">没有更多了</text>
        </view>
      </view>
    </scroll-view>

    <!-- 帖详情 + 评论 -->
    <view v-if="detailVisible" class="overlay-page" style="z-index:70;">
      <view class="feed-page">
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
          <view v-if="detailLoading" class="feed-empty">
            <text class="feed-empty__text">加载中…</text>
          </view>
          <view v-else-if="detail" class="feed-pad">
            <view class="moment-card">
              <view class="moment-card__head">
                <view class="moment-card__avatar">
                  <text v-if="detail.cover_emoji" class="moment-card__emoji">{{ detail.cover_emoji }}</text>
                  <MpIcon v-else name="camera" :size="32" color="#7B1FA2" />
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
                <view class="moment-action" @click="toggleLike(detail, true)">
                  <MpIcon
                    name="heart"
                    :size="28"
                    :color="detail.liked ? '#E53935' : '#8D6E63'"
                  />
                  <text class="moment-action__text" :class="{ 'is-liked': detail.liked }">
                    {{ detail.like_count > 0 ? detail.like_count : '赞' }}
                  </text>
                </view>
                <view class="moment-action">
                  <MpIcon name="message-circle" :size="28" color="#8D6E63" />
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
      </view>
    </view>

    <!-- 与我有关 -->
    <view v-if="bellVisible" class="overlay-page" style="z-index:80;">
      <view class="feed-page">
        <view class="safe-nav-header feed-nav">
          <text class="feed-nav__title">与我有关</text>
          <view class="feed-nav__row">
            <view class="feed-nav__back" @click="bellVisible = false">
              <text class="feed-nav__back-icon">‹</text>
            </view>
            <view class="feed-nav__side" />
          </view>
        </view>
        <scroll-view scroll-y class="feed-scroll">
          <view class="feed-pad">
            <view v-if="bellLoading" class="feed-empty">
              <text class="feed-empty__text">加载中…</text>
            </view>
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
      </view>
    </view>
  </view>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  createDailyComment,
  fetchDailyInteractions,
  fetchDailyPost,
  fetchDailyPosts,
  readMessages,
  toggleDailyLike,
} from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'

const CONTENT_LIMIT = 90

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const activeChildId = ctx.activeChildId
const feedCommentUnread = ctx.feedCommentUnread
const refreshUnreadCount = ctx.refreshUnreadCount

const posts = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const refreshing = ref(false)
const page = ref(1)
const hasMore = ref(false)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
const detailPostId = ref(null)
const commentText = ref('')
const replyTo = ref(null)
const submitting = ref(false)

const listCommentPostId = ref(null)
const listCommentText = ref('')
const listSubmitting = ref(false)
const likingIds = ref(new Set())

const bellVisible = ref(false)
const bellLoading = ref(false)
const interactions = ref([])

function needMore(text) {
  return (text || '').length > CONTENT_LIMIT
}

function contentPreview(text) {
  const t = text || ''
  if (t.length <= CONTENT_LIMIT) return t
  return t.slice(0, CONTENT_LIMIT)
}

function photoGridClass(n) {
  if (n === 1) return 'cols-1'
  if (n === 2 || n === 4) return 'cols-2'
  return 'cols-3'
}

function previewPhotos(urls, index) {
  uni.previewImage({
    urls,
    current: urls[index],
  })
}

async function markDailyRead() {
  try {
    await readMessages({ type: 'daily' })
    await refreshUnreadCount()
  } catch {
    // ignore
  }
}

async function markCommentRead() {
  try {
    await readMessages({ type: 'daily_comment' })
    await refreshUnreadCount()
  } catch {
    // ignore
  }
}

async function loadPosts(reset = true) {
  if (!activeChildId.value) {
    posts.value = []
    hasMore.value = false
    return
  }
  if (reset) {
    page.value = 1
    if (!refreshing.value) loading.value = true
  } else {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
  }
  try {
    const data = await fetchDailyPosts(activeChildId.value, page.value)
    const list = data?.list || []
    posts.value = reset ? list : posts.value.concat(list)
    hasMore.value = !!data?.has_more
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    loadingMore.value = false
    refreshing.value = false
  }
}

async function onPullRefresh() {
  refreshing.value = true
  listCommentPostId.value = null
  await loadPosts(true)
  await markDailyRead()
  refreshUnreadCount()
}

function loadMore() {
  if (!hasMore.value || loadingMore.value || loading.value) return
  page.value += 1
  loadPosts(false)
}

function openListComment(post) {
  if (listCommentPostId.value === post.id) {
    listCommentPostId.value = null
    listCommentText.value = ''
    return
  }
  listCommentPostId.value = post.id
  listCommentText.value = ''
}

async function submitListComment() {
  const text = listCommentText.value.trim()
  const postId = listCommentPostId.value
  if (!text || listSubmitting.value || !postId || !activeChildId.value) return
  listSubmitting.value = true
  try {
    await createDailyComment(postId, {
      student_id: activeChildId.value,
      content: text,
    })
    listCommentText.value = ''
    listCommentPostId.value = null
    // 自己可见，刷新列表与详情计数
    const idx = posts.value.findIndex((p) => p.id === postId)
    if (idx >= 0) {
      const data = await fetchDailyPosts(activeChildId.value, 1)
      const fresh = (data?.list || []).find((p) => p.id === postId)
      if (fresh) posts.value[idx] = fresh
      else {
        posts.value[idx] = {
          ...posts.value[idx],
          comment_count: (posts.value[idx].comment_count || 0) + 1,
        }
      }
    }
    uni.showToast({ title: '已发送', icon: 'none' })
  } catch (e) {
    uni.showToast({ title: e.message || '发送失败', icon: 'none' })
  } finally {
    listSubmitting.value = false
  }
}

async function toggleLike(post, isDetail = false) {
  if (!post?.id || !activeChildId.value || likingIds.value.has(post.id)) return
  const next = new Set(likingIds.value)
  next.add(post.id)
  likingIds.value = next
  const prevLiked = !!post.liked
  const prevCount = Number(post.like_count || 0)
  // 乐观更新
  post.liked = !prevLiked
  post.like_count = Math.max(0, prevCount + (prevLiked ? -1 : 1))
  syncLikeToList(post.id, post.liked, post.like_count)
  try {
    const data = await toggleDailyLike(post.id, activeChildId.value)
    post.liked = !!data?.liked
    post.like_count = Number(data?.like_count || 0)
    syncLikeToList(post.id, post.liked, post.like_count)
    if (isDetail && detail.value?.id === post.id) {
      detail.value.liked = post.liked
      detail.value.like_count = post.like_count
    }
  } catch (e) {
    post.liked = prevLiked
    post.like_count = prevCount
    syncLikeToList(post.id, prevLiked, prevCount)
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    const done = new Set(likingIds.value)
    done.delete(post.id)
    likingIds.value = done
  }
}

function syncLikeToList(id, liked, likeCount) {
  const row = posts.value.find((p) => p.id === id)
  if (row) {
    row.liked = liked
    row.like_count = likeCount
  }
}

async function openDetail(id) {
  listCommentPostId.value = null
  detailPostId.value = id
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  replyTo.value = null
  commentText.value = ''
  try {
    detail.value = await fetchDailyPost(id, activeChildId.value)
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  detailVisible.value = false
  detail.value = null
  detailPostId.value = null
  replyTo.value = null
  commentText.value = ''
}

function startReply(c) {
  replyTo.value = c
}

async function submitComment() {
  const text = commentText.value.trim()
  if (!text || submitting.value || !detailPostId.value || !activeChildId.value) return
  submitting.value = true
  try {
    await createDailyComment(detailPostId.value, {
      student_id: activeChildId.value,
      content: text,
      parent_id: replyTo.value?.id || undefined,
    })
    commentText.value = ''
    replyTo.value = null
    await openDetail(detailPostId.value)
    // 局部刷新列表项
    const idx = posts.value.findIndex((p) => p.id === detailPostId.value)
    if (idx >= 0 && detail.value) {
      posts.value[idx] = {
        ...posts.value[idx],
        comment_count: detail.value.comment_count,
        latest_comments: (detail.value.comments || []).slice(-2).map((c) => ({
          id: c.id,
          author: c.author,
          content: c.content,
        })),
        liked: detail.value.liked,
        like_count: detail.value.like_count,
      }
    }
  } catch (e) {
    uni.showToast({ title: e.message || '发送失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function openBell() {
  bellVisible.value = true
  bellLoading.value = true
  try {
    const data = await fetchDailyInteractions()
    interactions.value = data?.list || []
    await markCommentRead()
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    bellLoading.value = false
  }
}

async function openFromInteraction(item) {
  bellVisible.value = false
  await openDetail(item.daily_post_id)
}

async function onEnter() {
  listCommentPostId.value = null
  await loadPosts(true)
  await markDailyRead()
  refreshUnreadCount()
}

watch(() => props.active, (v) => { if (v) onEnter() }, { immediate: true })
watch(activeChildId, () => { if (props.active) onEnter() })

onShow(() => {
  if (props.active) onEnter()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';

$accent: #3b9eeb;
$accent-soft: #e3f2fd;
$page-bg: #f0f7ff;
$ink: #2d1f18;
$muted: #8d6e63;
$line: #e3f2fd;

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
  box-shadow: 0 4rpx 24rpx rgba(59, 158, 235, 0.06);
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

.feed-nav__bell {
  position: relative;
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  background: $accent-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed-nav__badge {
  position: absolute;
  top: -6rpx;
  right: -8rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 6rpx;
  border-radius: 14rpx;
  background: #e53935;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feed-nav__badge-text {
  font-size: 18rpx;
  color: white;
  font-weight: 700;
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
  box-shadow: 0 2rpx 16rpx rgba(45, 31, 24, 0.06);
  margin-bottom: 20rpx;
}

.feed-empty__icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 32rpx;
  background: $accent-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20rpx;
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
  box-shadow: 0 2rpx 16rpx rgba(45, 31, 24, 0.06);
}

.moment-card__head {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.moment-card__avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  background: #f3e5f5;
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
  font-weight: 800;
  color: $ink;
  display: block;
}

.moment-card__time {
  font-size: 22rpx;
  color: $muted;
  display: block;
  margin-top: 4rpx;
}

.moment-card__body {
  margin-bottom: 16rpx;
}

.moment-card__content {
  font-size: 28rpx;
  color: $ink;
  line-height: 1.7;
}

.moment-card__more {
  font-size: 26rpx;
  color: $accent;
  font-weight: 700;
  margin-left: 8rpx;
}

.moment-card__actions {
  display: flex;
  align-items: center;
  gap: 40rpx;
  margin-top: 8rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid $line;
}

.moment-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 0;
}

.moment-action__text {
  font-size: 24rpx;
  color: $muted;
}

.moment-action__text.is-liked {
  color: #e53935;
}

.moment-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.moment-card__preview {
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: 16rpx;
  background: #f7fbff;
}

.moment-card__preview-row {
  margin-bottom: 8rpx;
}

.moment-card__preview-row:last-child {
  margin-bottom: 0;
}

.moment-card__preview-text {
  font-size: 24rpx;
  color: #5d4037;
  line-height: 1.5;
}

.moment-card__preview-author {
  font-weight: 700;
  color: $accent;
}

.list-comment {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid $line;
}

.list-comment__input {
  flex: 1;
  height: 68rpx;
  padding: 0 24rpx;
  border-radius: 34rpx;
  background: $page-bg;
  font-size: 26rpx;
  color: $ink;
}

.list-comment__send {
  padding: 14rpx 24rpx;
  border-radius: 18rpx;
  background: $accent;
  flex-shrink: 0;
}

.list-comment__send-text {
  font-size: 24rpx;
  font-weight: 700;
  color: white;
}

.feed-more {
  padding: 20rpx 0;
  text-align: center;
}

.feed-more__text {
  font-size: 22rpx;
  color: #bdbdbd;
}

.photo-grid {
  display: grid;
  gap: 8rpx;
  margin-bottom: 4rpx;
}
.photo-grid.cols-1 {
  grid-template-columns: 1fr;
  max-width: 70%;
}
.photo-grid.cols-2 { grid-template-columns: 1fr 1fr; }
.photo-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }

.photo-cell {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12rpx;
  background: #f5f0ec;
}

.photo-cell--single {
  aspect-ratio: 4 / 3;
  max-height: 420rpx;
}

.comment-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 16rpx rgba(45, 31, 24, 0.06);
}

.comment-card__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.comment-card__body {
  flex: 1;
  min-width: 0;
}

.comment-card__author {
  font-size: 26rpx;
  font-weight: 700;
  color: $accent;
}

.comment-card__role {
  font-size: 20rpx;
  color: $muted;
  margin-left: 8rpx;
}

.comment-card__content {
  font-size: 26rpx;
  color: $ink;
  line-height: 1.6;
  display: block;
  margin-top: 8rpx;
}

.comment-card__time {
  font-size: 20rpx;
  color: #bdbdbd;
  display: block;
  margin-top: 8rpx;
}

.comment-card__reply {
  font-size: 22rpx;
  color: $accent;
  flex-shrink: 0;
}

.comment-card__replies {
  margin-top: 16rpx;
  padding-left: 16rpx;
  border-left: 4rpx solid $line;
}

.comment-card__reply-item {
  margin-bottom: 12rpx;
}

.comment-bar {
  flex-shrink: 0;
  background: white;
  border-top: 1rpx solid $line;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}

.comment-bar__hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.comment-bar__hint-text {
  font-size: 22rpx;
  color: $muted;
}

.comment-bar__cancel {
  font-size: 22rpx;
  color: #e53935;
}

.comment-bar__row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.comment-input {
  flex: 1;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: 36rpx;
  background: $page-bg;
  font-size: 26rpx;
  color: $ink;
}

.comment-send {
  padding: 16rpx 28rpx;
  border-radius: 20rpx;
  background: $accent;
}

.comment-send__text {
  font-size: 26rpx;
  font-weight: 700;
  color: white;
}
</style>
