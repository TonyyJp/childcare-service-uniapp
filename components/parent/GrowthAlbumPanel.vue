<template>
  <view class="tab-page" style="background:#F0F7FF;">
    <view class="safe-nav-header" style="background:white;flex-shrink:0;border-bottom:1rpx solid #BBDEFB;padding-bottom:16rpx;">
      <view style="display:flex;align-items:center;gap:20rpx;padding:0 40rpx 16rpx;">
        <view class="back-btn" style="background:#F0F7FF;" @click="activeTab = 'home'">
          <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
        </view>
        <view style="flex:1;min-width:0;">
          <text style="font-size:36rpx;font-weight:800;color:#2D1F18;display:block;">成长影集</text>
          <text style="font-size:22rpx;color:#8D6E63;margin-top:4rpx;">日常动态照片合集 · 共 {{ total }} 张</text>
        </view>
      </view>

      <!-- 孩子筛选 -->
      <scroll-view v-if="childOptions.length" scroll-x style="white-space:nowrap;padding:0 40rpx 12rpx;">
        <view
          v-for="c in childOptions"
          :key="c.id"
          style="display:inline-flex;padding:10rpx 24rpx;border-radius:24rpx;margin-right:12rpx;font-size:24rpx;font-weight:700;"
          :style="{ background: filterStudentId === c.id ? '#3B9EEB' : '#F0F7FF', color: filterStudentId === c.id ? 'white' : '#8D6E63' }"
          @click="onSelectChild(c.id)"
        >
          <text>{{ c.name }}</text>
        </view>
      </scroll-view>

      <!-- 课班筛选 -->
      <scroll-view scroll-x style="white-space:nowrap;padding:0 40rpx 8rpx;">
        <view
          style="display:inline-flex;padding:10rpx 24rpx;border-radius:24rpx;margin-right:12rpx;font-size:22rpx;font-weight:700;"
          :style="{ background: !filterClassId ? '#3B9EEB' : '#F0F7FF', color: !filterClassId ? 'white' : '#8D6E63' }"
          @click="onSelectClass(null)"
        >
          <text>全部课班</text>
        </view>
        <view
          v-for="cls in classes"
          :key="cls.id"
          style="display:inline-flex;padding:10rpx 24rpx;border-radius:24rpx;margin-right:12rpx;font-size:22rpx;font-weight:700;"
          :style="{ background: filterClassId === cls.id ? '#3B9EEB' : '#F0F7FF', color: filterClassId === cls.id ? 'white' : '#8D6E63' }"
          @click="onSelectClass(cls.id)"
        >
          <text>{{ cls.name }}{{ cls.ended_at ? '·已离' : '' }}</text>
        </view>
      </scroll-view>
    </view>

    <scroll-view scroll-y style="flex:1;height:0;" @scrolltolower="loadMore">
      <view style="padding:20rpx 24rpx 40rpx;">
        <view
          v-if="faceHint"
          style="margin-bottom:16rpx;padding:16rpx 20rpx;border-radius:16rpx;background:#FFF8E1;"
        >
          <text style="font-size:22rpx;color:#F57F17;line-height:1.5;">{{ faceHint }}</text>
        </view>

        <LoadingSkeleton v-if="loading && !photos.length" variant="grid" :count="9" padding="8rpx 0" />
        <view v-else-if="!photos.length" style="padding:64rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#8D6E63;">暂无动态照片</text>
          <text style="font-size:22rpx;color:#BDBDBD;display:block;margin-top:12rpx;">老师发布带图日常后会出现在这里</text>
        </view>

        <view v-else class="album-grid">
          <view
            v-for="(p, idx) in photos"
            :key="p.attachment_id"
            class="album-cell"
            @click="previewAt(idx)"
          >
            <image :src="p.url" mode="aspectFill" class="album-img" />
          </view>
        </view>

        <view v-if="loadingMore" style="padding:24rpx 0;text-align:center;">
          <text style="font-size:22rpx;color:#BDBDBD;">加载更多…</text>
        </view>
        <view v-else-if="photos.length && !hasMore" style="padding:16rpx 0;text-align:center;">
          <text style="font-size:22rpx;color:#BDBDBD;">没有更多了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchGrowthAlbum } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const activeTab = ctx.activeTab
const childOptions = ctx.childOptions
const activeChildId = ctx.activeChildId

const filterStudentId = ref(null)
const filterClassId = ref(null)
const classes = ref([])
const photos = ref([])
const total = ref(0)
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const faceHint = ref('')

async function load(reset = true) {
  const sid = filterStudentId.value || activeChildId.value
  if (!sid) {
    photos.value = []
    classes.value = []
    total.value = 0
    return
  }
  if (reset) {
    page.value = 1
    loading.value = true
  } else {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
  }
  try {
    const data = await fetchGrowthAlbum(sid, {
      classId: filterClassId.value || undefined,
      page: page.value,
    })
    const list = data?.list || []
    photos.value = reset ? list : photos.value.concat(list)
    hasMore.value = !!data?.has_more
    total.value = data?.total || 0
    classes.value = data?.classes || []
    faceHint.value = data?.face_filter?.hint || ''
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  page.value += 1
  load(false)
}

function onSelectChild(id) {
  if (filterStudentId.value === id) return
  filterStudentId.value = id
  filterClassId.value = null
  if (typeof ctx.selectChild === 'function') ctx.selectChild(id)
  load(true)
}

function onSelectClass(id) {
  filterClassId.value = id
  load(true)
}

function previewAt(index) {
  const urls = photos.value.map(p => p.url).filter(Boolean)
  if (!urls.length) return
  uni.previewImage({ urls, current: urls[index] })
}

function onEnter() {
  if (!filterStudentId.value) {
    filterStudentId.value = activeChildId.value || childOptions.value[0]?.id || null
  }
  load(true)
}

watch(() => props.active, (v) => { if (v) onEnter() }, { immediate: true })
watch(activeChildId, (id) => {
  if (!props.active || !id) return
  if (filterStudentId.value !== id) {
    filterStudentId.value = id
    filterClassId.value = null
    load(true)
  }
})
onShow(() => { if (props.active) onEnter() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';

.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
}
.album-cell {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12rpx;
  overflow: hidden;
  background: #E3F2FD;
}
.album-img {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
