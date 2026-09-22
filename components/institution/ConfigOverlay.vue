<template>
      <view class="overlay-page">
        <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
          <view style="padding:0 40rpx 32rpx;">
            <view style="display:flex;align-items:center;gap:20rpx;">
              <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
              <view>
                <text style="font-size:40rpx;font-weight:800;color:white;display:block;">系统配置</text>
                <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">功能开关 · 签到规则 · 家长权限</text>
              </view>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view v-for="section in configSections" :key="section.title" class="card" style="padding:24rpx;margin-bottom:24rpx;">
              <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">{{ section.icon }} {{ section.title }}</text>
              <LoadingSkeleton v-if="configLoading" variant="list" :count="2" padding="8rpx 0" />
              <view v-for="item in section.items" :key="item.key" style="display:flex;align-items:center;padding:20rpx 0;border-bottom:1rpx solid #F5F0EC;">
                <view style="flex:1;">
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">{{ item.label }}</text>
                  <text style="font-size:22rpx;color:#8D6E63;">{{ item.desc }}</text>
                </view>
                <view v-if="item.type === 'toggle'"
                  style="width:88rpx;height:44rpx;border-radius:22rpx;position:relative;"
                  :style="{ backgroundColor: item.enabled ? '#AB47BC' : '#E0E0E0', opacity: (configBusy || item.locked) ? 0.6 : 1 }"
                  @click="toggleConfig(item)">
                  <view style="position:absolute;top:4rpx;width:36rpx;height:36rpx;border-radius:18rpx;background:white;box-shadow:0 2rpx 8rpx rgba(0,0,0,0.15);" :style="{ left: item.enabled ? '48rpx' : '4rpx' }" />
                </view>
                <picker v-else mode="time" :value="item.value" @change="e => onConfigTimeChange(item, e.detail.value)">
                  <text style="font-size:26rpx;color:#AB47BC;font-weight:700;">{{ item.value }}</text>
                </picker>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, watch } from 'vue'
import { fetchSettings, updateSettings } from '../../api/institution.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(["navigate"])

function navigate(tab) {
  emit('navigate', tab)
}



const configLoading = ref(false)
const configBusy = ref(false)
const configSections = ref([
  {
    icon: '⚙️', title: '基本功能',
    items: [
      { key: 'feature.face_checkin', label: '刷脸签到', desc: '启用人脸识别签到功能', type: 'toggle', enabled: true },
      { key: 'feature.parent_growth', label: '家长查看成长档案', desc: '允许家长在家长端查看', type: 'toggle', enabled: true },
    ],
  },
  {
    icon: '🔔', title: '通知设置',
    items: [
      { key: 'notify.checkin_push', label: '签到推送', desc: '孩子签到时推送给家长', type: 'toggle', enabled: true },
      { key: 'notify.checkout_push', label: '离园推送', desc: '孩子离园时推送给家长', type: 'toggle', enabled: false },
      { key: 'notify.homework_push', label: '作业推送', desc: '新作业发布时推送', type: 'toggle', enabled: true },
    ],
  },
  {
    icon: '⏰', title: '签到规则',
    items: [
      { key: 'attendance.late_line', label: '迟到时间线', desc: '超过该时间视为迟到', type: 'value', value: '09:00' },
      { key: 'attendance.early_leave_line', label: '早退时间线', desc: '早于该时间离园视为早退', type: 'value', value: '17:00' },
    ],
  },
])

function applySettings(settings, gates) {
  if (!settings) return
  const faceGate = gates?.face_checkin
  configSections.value.forEach(section => {
    section.items.forEach(item => {
      if (item.key in settings) {
        if (item.type === 'toggle') item.enabled = !!settings[item.key]
        else item.value = settings[item.key] || item.value
      }
      if (item.key === 'feature.face_checkin' && faceGate) {
        item.locked = !faceGate.platform_enabled
        if (faceGate.hint) item.desc = faceGate.hint
      }
    })
  })
}

async function loadSettings() {
  configLoading.value = true
  try {
    const data = await fetchSettings()
    applySettings(data?.settings, data?.gates)
  } catch (e) {
    uni.showToast({ title: e.message || '配置加载失败', icon: 'none' })
  } finally {
    configLoading.value = false
  }
}

async function saveSettingsPatch(patch) {
  if (configBusy.value) return
  configBusy.value = true
  try {
    const data = await updateSettings(patch)
    applySettings(data?.settings, data?.gates)
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
    await loadSettings()
  } finally {
    configBusy.value = false
  }
}

async function toggleConfig(item) {
  if (configBusy.value || item.type !== 'toggle') return
  if (item.locked && !item.enabled) {
    uni.showToast({ title: item.desc || '暂不可开启', icon: 'none' })
    return
  }
  const next = !item.enabled
  item.enabled = next
  await saveSettingsPatch({ [item.key]: next })
}

async function onConfigTimeChange(item, value) {
  if (!value || item.value === value) return
  const prev = item.value
  item.value = value
  try {
    await saveSettingsPatch({ [item.key]: value })
  } catch {
    item.value = prev
  }
}
watch(() => props.pageShowCount, () => { loadSettings() }, { immediate: true })
</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
