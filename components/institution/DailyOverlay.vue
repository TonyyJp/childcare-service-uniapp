<template>
      <view class="overlay-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF8A65 100%);">
          <view style="padding:0 40rpx 24rpx;">
            <view style="display:flex;align-items:center;margin-bottom:16rpx;">
              <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
              <view style="flex:1;margin-left:20rpx;">
                <text style="font-size:40rpx;font-weight:800;color:white;display:block;">日常代发</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.85);">今日已发布 {{ publishedCount }} 条</text>
              </view>
            </view>
            <scroll-view scroll-x style="white-space:nowrap;">
              <view
                class="pill"
                style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
                :style="{ backgroundColor: !filterClassId ? 'white' : 'rgba(255,255,255,0.2)', color: !filterClassId ? '#E65100' : 'white' }"
                @click="filterClassId = null; loadDailyPosts()"
              >
                <text style="font-size:22rpx;font-weight:700;">全部</text>
              </view>
              <view
                v-for="c in classes"
                :key="c.id"
                class="pill"
                style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
                :style="{ backgroundColor: filterClassId === c.id ? 'white' : 'rgba(255,255,255,0.2)', color: filterClassId === c.id ? '#E65100' : 'white' }"
                @click="filterClassId = c.id; loadDailyPosts()"
              >
                <text style="font-size:22rpx;font-weight:700;">{{ c.name }}</text>
              </view>
            </scroll-view>
          </view>
        </view>

        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view class="primary-btn" style="margin-bottom:24rpx;" @click="openCompose">
              <text style="color:white;font-size:30rpx;font-weight:800;">发动态</text>
            </view>
        <LoadingSkeleton v-if="dailyLoading" variant="feed" :count="3" padding="8rpx 0" />
            <view v-else-if="!dailyRecords.length" style="padding:48rpx 0;text-align:center;">
              <text style="font-size:26rpx;color:#8D6E63;">暂无动态，点击上方发动态</text>
            </view>
            <view v-for="rec in dailyRecords" :key="rec.id" class="card" style="margin-bottom:24rpx;">
              <view style="display:flex;align-items:flex-start;padding:24rpx 24rpx 16rpx;">
                <view style="width:100rpx;height:100rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;font-size:52rpx;flex-shrink:0;margin-right:20rpx;overflow:hidden;background:#FF704322;">
                  <image v-if="rec.photos[0]" :src="rec.photos[0]" mode="aspectFill" style="width:100%;height:100%;" @click="previewPhotos(rec.photos, 0)" />
                  <text v-else>{{ rec.photoEmoji }}</text>
                </view>
                <view style="flex:1;min-width:0;">
                  <view style="display:flex;align-items:center;flex-wrap:wrap;margin-bottom:8rpx;">
                    <view class="pill" style="background:#FF704318;color:#FF7043;margin-right:12rpx;margin-bottom:4rpx;"><text style="font-size:22rpx;">{{ rec.course }}</text></view>
                    <view class="pill" style="margin-bottom:4rpx;" :style="{ backgroundColor: statusStyle2(rec.status).bg, color: statusStyle2(rec.status).fg }"><text style="font-size:22rpx;">{{ rec.status }}</text></view>
                  </view>
                  <text v-if="rec.className" style="font-size:22rpx;color:#8D6E63;">{{ rec.className }}</text>
                </view>
                <text style="font-size:22rpx;color:#BDBDBD;flex-shrink:0;">{{ rec.time }}</text>
              </view>

              <view v-if="rec.photos.length" style="padding:0 24rpx 16rpx;display:flex;flex-wrap:wrap;">
                <image
                  v-for="(p, pi) in rec.photos"
                  :key="pi"
                  :src="p"
                  mode="aspectFill"
                  style="width:200rpx;height:200rpx;border-radius:16rpx;background:#F5F0EC;margin-right:12rpx;margin-bottom:12rpx;"
                  @click="previewPhotos(rec.photos, pi)"
                />
              </view>

              <view style="padding:0 24rpx 24rpx;">
                <view v-if="isEditable(rec)">
                  <text style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:8rpx;">家长反馈文案</text>
                  <textarea
                    class="form-input"
                    style="height:160rpx;width:100%;box-sizing:border-box;line-height:1.6;"
                    :value="rec.draftText"
                    maxlength="2000"
                    placeholder="可手动填写，或点下方自动生成"
                    placeholder-style="color:#BCAAA4;font-size:26rpx;"
                    :show-confirm-bar="false"
                    @input="e => onDraftInput(rec, e)"
                  />
                  <view style="display:flex;flex-wrap:wrap;margin-top:16rpx;">
                    <view
                      style="flex:1;min-width:200rpx;padding:18rpx;border-radius:20rpx;text-align:center;margin-right:12rpx;margin-bottom:12rpx;"
                      :style="{
                        background: rec.streaming ? '#EDE7E3' : '#F5F0EC',
                        opacity: rec.streaming ? 0.72 : 1
                      }"
                      @click="triggerGenerate(rec)"
                    >
                      <text
                        style="font-size:26rpx;font-weight:700;"
                        :style="{ color: rec.streaming ? '#BCAAA4' : '#8D6E63' }"
                      >{{ rec.streaming ? '生成中…' : (rec.draftText.trim() ? '再次生成' : '自动生成文案') }}</text>
                    </view>
                    <view style="flex:1;min-width:200rpx;padding:18rpx;border-radius:20rpx;background:#FFF3E0;text-align:center;margin-bottom:12rpx;" @click="saveContent(rec)">
                      <text style="font-size:26rpx;font-weight:700;color:#E65100;">保存文案</text>
                    </view>
                  </view>
                  <view v-if="rec.statusCode === 'pending'" style="display:flex;margin-top:4rpx;">
                    <view style="flex:1;padding:20rpx;border-radius:20rpx;background:#F5F0EC;text-align:center;margin-right:16rpx;" @click="retract(rec.id)">
                      <text style="font-size:26rpx;font-weight:700;color:#8D6E63;">撤回</text>
                    </view>
                    <view class="primary-btn" style="flex:2;" @click="publish(rec.id)">
                      <text style="color:white;font-size:26rpx;font-weight:800;">发布给家长</text>
                    </view>
                  </view>
                  <view v-else-if="rec.draftText.trim()" style="margin-top:4rpx;">
                    <view class="primary-btn" style="padding:20rpx;" @click="setPending(rec)">
                      <text style="color:white;font-size:26rpx;font-weight:800;">提交发布</text>
                    </view>
                  </view>
                </view>
                <view v-else-if="rec.statusCode === 'published'" style="border-radius:20rpx;padding:20rpx;background:#F1F8E9;">
                  <text style="font-size:24rpx;color:#2E7D32;font-weight:700;display:block;margin-bottom:8rpx;">✓ 已发布给家长 · {{ rec.publishedAt }}</text>
                  <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;display:block;margin-bottom:16rpx;">{{ rec.editedText }}</text>
                  <view style="padding:16rpx;border-radius:16rpx;background:#FFEBEE;text-align:center;" @click="retract(rec.id)">
                    <text style="font-size:24rpx;font-weight:700;color:#C62828;">撤回发布</text>
                  </view>
                </view>
                <view v-else-if="rec.statusCode === 'withdrawn'" style="padding:20rpx;background:#EEEEEE;border-radius:20rpx;">
                  <text style="font-size:26rpx;color:#757575;">已撤回，家长不可见</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <view v-if="showCompose" class="overlay" @click="showCompose = false">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">代发日常动态</text>
            <view style="display:flex;flex-direction:column;gap:24rpx;">
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">照片（最多 9 张）</text>
                <view style="display:flex;flex-wrap:wrap;">
                  <view v-for="(p, i) in newPost.photoPreviews" :key="i" style="width:88rpx;height:88rpx;border-radius:20rpx;margin-right:12rpx;margin-bottom:12rpx;overflow:hidden;position:relative;">
                    <image :src="p" mode="aspectFill" style="width:100%;height:100%;" />
                    <view style="position:absolute;top:0;right:0;padding:4rpx 8rpx;background:rgba(0,0,0,0.45);" @click="removeDailyPhoto(i)">
                      <text style="color:white;font-size:18rpx;">×</text>
                    </view>
                  </view>
                  <view v-if="(newPost.photoPreviews || []).length < 9" style="width:88rpx;height:88rpx;border-radius:20rpx;background:#FFF8F5;display:flex;align-items:center;justify-content:center;border:2rpx dashed #FFAB91;margin-bottom:12rpx;" @click="pickDailyPhotos">
                    <text style="font-size:40rpx;color:#FF7043;">+</text>
                  </view>
                </view>
                <text style="font-size:22rpx;color:#8D6E63;">也可选封面 emoji 作占位</text>
                <view style="display:flex;flex-wrap:wrap;margin-top:12rpx;">
                  <view v-for="e in photoEmojis" :key="e" style="width:64rpx;height:64rpx;border-radius:16rpx;background:#FFF8F5;display:flex;align-items:center;justify-content:center;font-size:32rpx;margin-right:8rpx;margin-bottom:8rpx;" :style="{ border: newPost.emoji === e ? '3rpx solid #FF7043' : '3rpx solid transparent' }" @click="newPost.emoji = e">
                    <text>{{ e }}</text>
                  </view>
                </view>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">班级</text>
                <view style="display:flex;gap:12rpx;flex-wrap:wrap;margin-bottom:8rpx;">
                  <view v-for="c in classes" :key="c.id" class="pill"
                    :style="{ backgroundColor: newPost.classId === c.id ? '#FF704318' : '#F5F0EC', color: newPost.classId === c.id ? '#FF7043' : '#8D6E63' }"
                    @click="newPost.classId = c.id"><text style="font-size:24rpx;">{{ c.name }}</text></view>
                </view>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">主题 / 场景</text>
                <input class="form-input" :value="newPost.course" @input="e => newPost.course = e.detail.value" maxlength="50" placeholder="如：晚托阅读、户外活动" />
                <view style="display:flex;flex-wrap:wrap;margin-top:12rpx;">
                  <view v-for="c in dailyTopicHints" :key="c" class="pill" style="margin-right:12rpx;margin-bottom:8rpx;" :style="{ backgroundColor: newPost.course === c ? '#FF704318' : '#F5F0EC', color: newPost.course === c ? '#FF7043' : '#8D6E63' }" @click="newPost.course = c">
                    <text style="font-size:22rpx;">{{ c }}</text>
                  </view>
                </view>
              </view>
              <view class="primary-btn" @click="submitPost">
                <text style="color:white;font-size:30rpx;font-weight:800;">提交草稿</text>
              </view>
            </view>
          </view>
        </view>
      </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, computed, watch } from 'vue'
import {
  aiGenerateDailyPost,
  createDailyPost,
  fetchDailyPosts,
  publishDailyPost,
  streamAiGenerateDailyPost,
  updateDailyPost,
  withdrawDailyPost,
} from '../../api/institution.js'
import { supportsChunkedStream } from '../../utils/streamRequest.js'
import { mediaUrl } from '../../config.js'
import { uploadFile } from '../../utils/request.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(['navigate'])

function navigate(tab) {
  emit('navigate', tab)
}

const showCompose = ref(false)
const dailyBusy = ref(false)
const dailyLoading = ref(false)
const filterClassId = ref(null)
const photoEmojis = ['🎨', '💬', '🏃', '🎵', '🔬', '📖']
const dailyTopicHints = ['阅读', '户外', '作业辅导', '手工', '其他']
const newPost = ref({ emoji: '', course: '', classId: null, photoPreviews: [], photoPaths: [] })
const dailyRecords = ref([])
const classes = ref([])

const publishedCount = computed(() => dailyRecords.value.filter(r => r.statusCode === 'published').length)

function displayStatus(code, label) {
  if (code === 'ai_ready' || label === 'AI已生成') return '已生成'
  return label || code
}

function mapDailyRow(p) {
  const code = p.status || ''
  return {
    id: p.id,
    photoEmoji: p.cover_emoji || '📷',
    photos: (p.photos || []).map(mediaUrl).filter(Boolean),
    course: p.topic || p.class_name || '日常',
    className: p.class_name || '',
    time: p.created_at || p.published_at || '',
    statusCode: code,
    status: displayStatus(code, p.status_label),
    editedText: p.content || '',
    draftText: p.content || '',
    publishedAt: p.published_at || '',
    streaming: false,
  }
}

function previewPhotos(urls, index = 0) {
  if (!urls?.length) return
  uni.previewImage({ urls, current: urls[index] || urls[0] })
}

function isEditable(rec) {
  return ['draft', 'ai_ready', 'pending'].includes(rec.statusCode)
}

function onDraftInput(rec, e) {
  rec.draftText = e.detail?.value ?? ''
}

function statusStyle2(s) {
  const map = {
    '草稿': { bg: '#F5F0EC', fg: '#8D6E63' },
    '已生成': { bg: '#E3F2FD', fg: '#1565C0' },
    'AI已生成': { bg: '#E3F2FD', fg: '#1565C0' },
    '待发布': { bg: '#FFF3E0', fg: '#E65100' },
    '已发布': { bg: '#C8E6C9', fg: '#2E7D32' },
    '已撤回': { bg: '#EEEEEE', fg: '#757575' },
  }
  return map[s] || { bg: '#F5F0EC', fg: '#8D6E63' }
}

async function loadDailyPosts() {
  dailyLoading.value = true
  try {
    const data = await fetchDailyPosts({ classId: filterClassId.value || undefined })
    classes.value = (data?.classes || []).map(c => ({ id: c.id, name: c.name }))
    dailyRecords.value = (data?.list || []).map(mapDailyRow)
  } catch (e) {
    uni.showToast({ title: e.message || '动态加载失败', icon: 'none' })
  } finally {
    dailyLoading.value = false
  }
}

/** 平滑打字机：网络增量先入队，按固定节奏渲染（约 30ms 一拍，积压越多步长越大）。
 *  分块到达常为���发（实测每 ~130ms 一批），直接渲染视觉上像整段填充。 */
function createTypewriter(apply) {
  let queue = ''
  let timer = null
  const step = () => {
    if (!queue) {
      timer = null
      return
    }
    const n = Math.max(1, Math.ceil(queue.length / 30))
    apply(queue.slice(0, n))
    queue = queue.slice(n)
    timer = setTimeout(step, 30)
  }
  return {
    push(text) {
      queue += text
      if (timer === null) timer = setTimeout(step, 30)
    },
    flush() {
      return new Promise(resolve => {
        const check = () => (timer === null ? resolve() : setTimeout(check, 25))
        check()
      })
    }
  }
}

async function triggerGenerate(rec) {
  if (dailyBusy.value || rec.streaming) return
  dailyBusy.value = true
  rec.streaming = true
  try {
    if (!supportsChunkedStream()) {
      throw Object.assign(new Error('非微信小程序环境'), { unsupported: true })
    }
    rec.draftText = ''
    const typer = createTypewriter(text => { rec.draftText += text })
    let result
    try {
      result = await streamAiGenerateDailyPost(rec.id, { onDelta: typer.push })
    } catch (e) {
      if (!e || !e.unsupported) throw e
      // 基础库过低（< 2.20.1）：降级非流式
      await aiGenerateDailyPost(rec.id)
      await loadDailyPosts()
      uni.showToast({ title: '文案已生成', icon: 'success' })
      return
    }
    await typer.flush()
    Object.assign(rec, mapDailyRow(result.post))
    uni.showToast({ title: '文案已生成', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '自动生成失败', icon: 'none' })
  } finally {
    rec.streaming = false
    dailyBusy.value = false
  }
}

async function saveContent(rec) {
  if (dailyBusy.value) return
  const content = (rec.draftText || '').trim()
  if (!content) {
    uni.showToast({ title: '请先填写文案', icon: 'none' })
    return
  }
  dailyBusy.value = true
  try {
    const payload = { content }
    if (rec.statusCode === 'draft') payload.status = 'ai_ready'
    await updateDailyPost(rec.id, payload)
    await loadDailyPosts()
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    dailyBusy.value = false
  }
}

async function setPending(rec) {
  if (dailyBusy.value) return
  const content = (rec.draftText || '').trim()
  if (!content) {
    uni.showToast({ title: '请先填写或生成文案', icon: 'none' })
    return
  }
  dailyBusy.value = true
  try {
    await updateDailyPost(rec.id, { content, status: 'pending' })
    await loadDailyPosts()
  } catch (e) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    dailyBusy.value = false
  }
}

async function publish(id) {
  if (dailyBusy.value) return
  dailyBusy.value = true
  try {
    await publishDailyPost(id)
    await loadDailyPosts()
    uni.showToast({ title: '已发布', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '发布失败', icon: 'none' })
  } finally {
    dailyBusy.value = false
  }
}

async function retract(id) {
  if (dailyBusy.value) return
  dailyBusy.value = true
  try {
    await withdrawDailyPost(id)
    await loadDailyPosts()
  } catch (e) {
    uni.showToast({ title: e.message || '撤回失败', icon: 'none' })
  } finally {
    dailyBusy.value = false
  }
}

function openCompose() {
  newPost.value = {
    emoji: '',
    course: '',
    classId: filterClassId.value || classes.value[0]?.id || null,
    photoPreviews: [],
    photoPaths: [],
  }
  showCompose.value = true
}

function removeDailyPhoto(i) {
  newPost.value.photoPreviews.splice(i, 1)
  newPost.value.photoPaths.splice(i, 1)
}

function pickDailyPhotos() {
  const left = 9 - (newPost.value.photoPreviews?.length || 0)
  if (left <= 0) return
  uni.chooseImage({
    count: left,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const paths = res.tempFilePaths || []
      newPost.value.photoPreviews.push(...paths)
      newPost.value.photoPaths.push(...paths)
    },
  })
}

async function submitPost() {
  if (dailyBusy.value) return
  if (!newPost.value.classId) {
    uni.showToast({ title: '请选择班级', icon: 'none' })
    return
  }
  dailyBusy.value = true
  try {
    const attachmentIds = []
    for (const path of (newPost.value.photoPaths || [])) {
      const uploaded = await uploadFile(path, 'daily')
      if (uploaded?.attachment_id) attachmentIds.push(uploaded.attachment_id)
    }
    await createDailyPost({
      class_id: newPost.value.classId,
      topic: newPost.value.course,
      cover_emoji: newPost.value.emoji,
      target_type: 'all',
      attachment_ids: attachmentIds,
    })
    showCompose.value = false
    await loadDailyPosts()
    uni.showToast({ title: '已创建草稿', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '创建失败', icon: 'none' })
  } finally {
    dailyBusy.value = false
  }
}

watch(() => props.pageShowCount, () => { loadDailyPosts() }, { immediate: true })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
@import '../../styles/mp-institution.scss';
</style>
