<template>
  <view class="tab-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF8A65 100%);">
      <view class="safe-nav-bar" style="display:flex;align-items:center;justify-content:space-between;padding-bottom:32rpx;">
        <view>
          <text style="font-size:44rpx;font-weight:800;color:white;display:block;">日常动态</text>
          <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">今日已发布 {{ publishedCount }} 条</text>
        </view>
        <view style="background:rgba(255,255,255,0.25);border-radius:20rpx;padding:16rpx 28rpx;" @click="openCompose">
          <text style="color:white;font-size:26rpx;font-weight:700;">+ 发动态</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="dailyLoading" style="padding:48rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#8D6E63;">加载中…</text>
        </view>
        <view v-else-if="!dailyRecords.length" style="padding:48rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#8D6E63;">暂无动态，点右上角发布</text>
        </view>
        <view v-for="rec in dailyRecords" :key="rec.id" class="card" style="margin-bottom:24rpx;overflow:hidden;">
          <view style="display:flex;align-items:flex-start;gap:20rpx;padding:24rpx 24rpx 16rpx;">
            <view style="width:100rpx;height:100rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;font-size:52rpx;flex-shrink:0;" :style="{ backgroundColor: rec.photoBg + '22' }">
              <text>{{ rec.photoEmoji }}</text>
            </view>
            <view style="flex:1;min-width:0;">
              <view style="display:flex;align-items:center;gap:12rpx;flex-wrap:wrap;margin-bottom:8rpx;">
                <view class="pill" :style="{ backgroundColor: '#FF704318', color: '#FF7043' }"><text style="font-size:22rpx;">{{ rec.course }}</text></view>
                <view class="pill" :style="{ backgroundColor: statusStyle2(rec.status).bg, color: statusStyle2(rec.status).fg }"><text style="font-size:22rpx;">{{ rec.status }}</text></view>
              </view>
              <view style="display:flex;gap:8rpx;flex-wrap:wrap;">
                <view v-for="s in rec.taggedStudents" :key="s" class="pill" style="background:#F5F0EC;color:#8D6E63;"><text style="font-size:20rpx;">@{{ s }}</text></view>
              </view>
            </view>
            <text style="font-size:22rpx;color:#BDBDBD;flex-shrink:0;">{{ rec.time }}</text>
          </view>

          <view style="padding:0 24rpx 24rpx;">
            <view v-if="rec.status === '草稿'" style="padding:20rpx;background:#F5F0EC;border-radius:20rpx;display:flex;align-items:center;justify-content:center;gap:12rpx;" @click="triggerAI(rec.id)">
              <text style="font-size:26rpx;font-weight:700;color:#8D6E63;">✦ AI 生成家长反馈文案</text>
            </view>
            <view v-else-if="rec.status === 'AI已生成' || rec.status === '待发布'">
              <view style="display:flex;align-items:center;gap:12rpx;margin-bottom:12rpx;">
                <view style="padding:4rpx 16rpx;border-radius:8rpx;background:linear-gradient(90deg,#667eea,#764ba2);">
                  <text style="color:white;font-size:20rpx;font-weight:800;">AI</text>
                </view>
                <text style="font-size:22rpx;color:#8D6E63;">老师审核发布</text>
              </view>
              <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;">{{ rec.editedText }}</text>
              <view v-if="rec.status === '待发布'" style="display:flex;gap:16rpx;margin-top:20rpx;">
                <view style="flex:1;padding:20rpx;border-radius:20rpx;background:#F5F0EC;text-align:center;" @click="retract(rec.id)">
                  <text style="font-size:26rpx;font-weight:700;color:#8D6E63;">撤回</text>
                </view>
                <view class="primary-btn" style="flex:2;" @click="publish(rec.id)">
                  <text style="color:white;font-size:26rpx;font-weight:800;">发布给家长</text>
                </view>
              </view>
              <view v-else style="margin-top:20rpx;">
                <view class="primary-btn" style="padding:20rpx;" @click="setPending(rec.id)">
                  <text style="color:white;font-size:26rpx;font-weight:800;">提交发布</text>
                </view>
              </view>
            </view>
            <view v-else-if="rec.status === '已发布'" style="border-radius:20rpx;padding:20rpx;background:#F1F8E9;">
              <text style="font-size:24rpx;color:#2E7D32;font-weight:700;display:block;margin-bottom:8rpx;">✓ 已发布给家长 · {{ rec.publishedAt }}</text>
              <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;">{{ rec.editedText }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="showCompose" class="overlay" @click="showCompose = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">发日常动态</text>
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
            <text style="color:white;font-size:30rpx;font-weight:800;">提交 · AI生成文案</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import {
  aiGenerateDailyPost,
  createDailyPost,
  fetchDailyPosts,
  fetchDashboard,
  publishDailyPost,
  updateDailyPost,
  withdrawDailyPost,
} from '../../api/teacher.js'
import { uploadFile } from '../../utils/request.js'

const checkinClassId = inject('teacherCheckinClassId', null)

const showCompose = ref(false)
const dailyBusy = ref(false)
const dailyLoading = ref(false)
const photoEmojis = ['🎨', '💬', '🏃', '🎵', '🔬', '📖']
const dailyTopicHints = ['阅读', '户外', '作业辅导', '手工', '其他']
const newPost = ref({ emoji: '', course: '', classId: null, photoPreviews: [], photoPaths: [] })
const dailyRecords = ref([])
const classes = ref([])

const publishedCount = computed(() => dailyRecords.value.filter(r => r.status === '已发布').length)

function mapDailyRow(p) {
  return {
    id: p.id,
    photoEmoji: p.cover_emoji || '',
    photoBg: '#FF7043',
    course: p.topic || p.class_name || '日常',
    time: p.created_at || p.published_at || '',
    taggedStudents: p.tagged_students || [],
    status: p.status_label || p.status,
    editedText: p.content || '',
    publishedAt: p.published_at || ''
  }
}

async function loadClasses() {
  try {
    const dash = await fetchDashboard()
    classes.value = (dash?.classes || []).map(c => ({
      id: c.id,
      name: c.name,
      expected: (c.periods || []).reduce((s, p) => s + (p.expected || 0), 0),
    }))
  } catch (_) { /* ignore */ }
}

async function loadDailyPosts() {
  dailyLoading.value = true
  try {
    const data = await fetchDailyPosts()
    dailyRecords.value = (data?.list || []).map(mapDailyRow)
  } catch (e) {
    uni.showToast({ title: e.message || '动态加载失败', icon: 'none' })
  } finally {
    dailyLoading.value = false
  }
}

function statusStyle2(s) {
  const map = {
    '草稿': { bg: '#F5F0EC', fg: '#8D6E63' },
    'AI已生成': { bg: '#E3F2FD', fg: '#1565C0' },
    '待发布': { bg: '#FFF3E0', fg: '#E65100' },
    '已发布': { bg: '#C8E6C9', fg: '#2E7D32' },
    '已撤回': { bg: '#EEEEEE', fg: '#757575' },
  }
  return map[s] || { bg: '#F5F0EC', fg: '#8D6E63' }
}

async function triggerAI(id) {
  if (dailyBusy.value) return
  dailyBusy.value = true
  try {
    await aiGenerateDailyPost(id)
    await loadDailyPosts()
  } catch (e) {
    uni.showToast({ title: e.message || 'AI 生成失败', icon: 'none' })
  } finally {
    dailyBusy.value = false
  }
}

async function setPending(id) {
  if (dailyBusy.value) return
  dailyBusy.value = true
  try {
    await updateDailyPost(id, { status: 'pending' })
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
    classId: checkinClassId?.value || classes.value.find(c => c.expected > 0)?.id || classes.value[0]?.id || null,
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

onMounted(async () => {
  await loadClasses()
  await loadDailyPosts()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
