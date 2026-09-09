<template>
      <view class="overlay-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view style="padding:0 40rpx 32rpx;">
            <view style="display:flex;align-items:center;gap:20rpx;">
              <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
              <view style="flex:1;">
                <text style="font-size:40rpx;font-weight:800;color:white;display:block;">活动日历</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">全园 / 班级活动 · 家长可见</text>
              </view>
              <view style="background:rgba(255,255,255,0.25);border-radius:20rpx;padding:14rpx 24rpx;" @click="openEventCompose">
                <text style="color:white;font-size:24rpx;font-weight:700;">+ 新建</text>
              </view>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view v-if="eventsLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
            <view v-else-if="!orgEvents.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无活动，点右上角新建</text></view>
            <view v-for="ev in orgEvents" :key="ev.id" class="card" style="padding:24rpx;margin-bottom:16rpx;display:flex;gap:20rpx;align-items:flex-start;">
              <view style="width:88rpx;height:88rpx;border-radius:24rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;"
                :style="{ backgroundColor: (eventTypeMeta[ev.type] || eventTypeMeta.activity).bg }">
                <text style="font-size:20rpx;font-weight:800;" :style="{ color: (eventTypeMeta[ev.type] || eventTypeMeta.activity).color }">{{ ev.month }}</text>
                <text style="font-size:34rpx;font-weight:800;" :style="{ color: (eventTypeMeta[ev.type] || eventTypeMeta.activity).color }">{{ ev.date }}</text>
              </view>
              <view style="flex:1;min-width:0;">
                <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;">{{ ev.icon }} {{ ev.title }}</text>
                <view style="display:flex;flex-wrap:wrap;gap:8rpx;margin-top:10rpx;">
                  <view class="pill" :style="{ backgroundColor: (eventTypeMeta[ev.type] || eventTypeMeta.activity).bg, color: (eventTypeMeta[ev.type] || eventTypeMeta.activity).color }">
                    <text style="font-size:20rpx;">{{ (eventTypeMeta[ev.type] || eventTypeMeta.activity).label }}</text>
                  </view>
                  <view class="pill" style="background:#F5F0EC;"><text style="font-size:20rpx;color:#8D6E63;">{{ ev.class_name || '全园' }}</text></view>
                  <view class="pill" style="background:#F5F0EC;"><text style="font-size:20rpx;color:#8D6E63;">{{ ev.weekday }}</text></view>
                </view>
                <text v-if="ev.location" style="font-size:22rpx;color:#8D6E63;display:block;margin-top:10rpx;">📍 {{ ev.location }}</text>
                <text v-if="ev.description" style="font-size:22rpx;color:#8D6E63;display:block;margin-top:6rpx;line-height:1.5;">{{ ev.description }}</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view v-if="showEventCompose" class="overlay-mask" style="z-index:70;" @click="showEventCompose = false">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">新建活动</text>
            <view style="display:flex;flex-direction:column;gap:20rpx;">
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">类型</text>
                <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
                  <view v-for="t in eventTypes" :key="t.id" class="pill" style="padding:12rpx 20rpx;"
                    :style="{ backgroundColor: newEvent.type === t.id ? '#AB47BC18' : '#F5F0EC', color: newEvent.type === t.id ? '#AB47BC' : '#8D6E63' }"
                    @click="newEvent.type = t.id">
                    <text style="font-size:22rpx;">{{ t.icon }} {{ t.label }}</text>
                  </view>
                </view>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">范围</text>
                <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
                  <view class="pill" style="padding:12rpx 20rpx;"
                    :style="{ backgroundColor: newEvent.classId == null ? '#AB47BC18' : '#F5F0EC', color: newEvent.classId == null ? '#AB47BC' : '#8D6E63' }"
                    @click="newEvent.classId = null">
                    <text style="font-size:22rpx;">全园</text>
                  </view>
                  <view v-for="c in eventClasses" :key="c.id" class="pill" style="padding:12rpx 20rpx;"
                    :style="{ backgroundColor: newEvent.classId === c.id ? '#AB47BC18' : '#F5F0EC', color: newEvent.classId === c.id ? '#AB47BC' : '#8D6E63' }"
                    @click="newEvent.classId = c.id">
                    <text style="font-size:22rpx;">{{ c.name }}</text>
                  </view>
                </view>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">标题</text>
                <input class="form-input" :value="newEvent.title" @input="e => newEvent.title = e.detail.value" placeholder="如：亲子运动会" />
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">日期</text>
                <picker mode="date" :value="newEvent.eventDate" @change="e => newEvent.eventDate = e.detail.value">
                  <view class="form-input">{{ newEvent.eventDate || '选择日期' }}</view>
                </picker>
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">地点（可选）</text>
                <input class="form-input" :value="newEvent.location" @input="e => newEvent.location = e.detail.value" placeholder="如：操场" />
              </view>
              <view>
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">说明（可选）</text>
                <textarea class="form-input" style="height:120rpx;" :value="newEvent.description" @input="e => newEvent.description = e.detail.value" placeholder="活动须知…" />
              </view>
              <view class="primary-btn" :style="{ opacity: eventBusy ? 0.6 : 1 }" @click="submitEvent">
                <text style="color:white;font-size:30rpx;font-weight:800;">保存活动</text>
              </view>
            </view>
          </view>
        </view>
      </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { createEvent, fetchEvents } from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}

watch(() => props.pageShowCount, () => { loadOrgEvents() }, { immediate: true })

const eventTypeMeta = {
  activity: { label: '活动', icon: '🏅', bg: '#FFF3E0', color: '#E65100' },
  holiday: { label: '假期', icon: '🎉', bg: '#F1F8E9', color: '#2E7D32' },
  parents: { label: '家长会', icon: '👨‍👩‍👧', bg: '#E3F2FD', color: '#1565C0' },
  exam: { label: '评估', icon: '📝', bg: '#F3E5F5', color: '#7B1FA2' },
}
const eventTypes = [
  { id: 'activity', label: '活动', icon: '🏅' },
  { id: 'holiday', label: '假期', icon: '🎉' },
  { id: 'parents', label: '家长会', icon: '👨‍👩‍👧' },
  { id: 'exam', label: '评估', icon: '📝' },
]
const orgEvents = ref([])
const eventClasses = ref([])
const eventsLoading = ref(false)
const eventBusy = ref(false)
const showEventCompose = ref(false)
const newEvent = ref({
  type: 'activity',
  classId: null,
  title: '',
  eventDate: '',
  location: '',
  description: '',
})

function todayStr() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function loadOrgEvents() {
  eventsLoading.value = true
  try {
    const data = await fetchEvents()
    orgEvents.value = data?.list || []
    eventClasses.value = data?.classes || []
  } catch (e) {
    uni.showToast({ title: e.message || '活动加载失败', icon: 'none' })
  } finally {
    eventsLoading.value = false
  }
}

function openEventCompose() {
  newEvent.value = {
    type: 'activity',
    classId: null,
    title: '',
    eventDate: todayStr(),
    location: '',
    description: '',
  }
  showEventCompose.value = true
}

async function submitEvent() {
  if (eventBusy.value) return
  const form = newEvent.value
  if (!form.title.trim()) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  if (!form.eventDate) {
    uni.showToast({ title: '请选择日期', icon: 'none' })
    return
  }
  eventBusy.value = true
  try {
    await createEvent({
      title: form.title.trim(),
      type: form.type,
      event_date: form.eventDate,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      class_id: form.classId,
    })
    uni.showToast({ title: '已创建', icon: 'success' })
    showEventCompose.value = false
    await loadOrgEvents()
  } catch (e) {
    uni.showToast({ title: e.message || '创建失败', icon: 'none' })
  } finally {
    eventBusy.value = false
  }
}

</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
