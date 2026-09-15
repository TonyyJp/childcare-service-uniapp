<template>
  <view class="tab-page" style="background:#F0F7FF;">
    <view class="safe-nav-header" style="background:white;flex-shrink:0;border-bottom:1rpx solid #BBDEFB;padding-bottom:24rpx;">
      <view style="display:flex;align-items:center;gap:20rpx;padding:0 40rpx;">
        <view class="back-btn" style="background:#F0F7FF;" @click="activeTab = 'home'">
          <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
        </view>
        <view style="flex:1;min-width:0;">
          <text style="font-size:36rpx;font-weight:800;color:#2D1F18;display:block;">成长档案</text>
          <text style="font-size:22rpx;color:#8D6E63;margin-top:4rpx;">{{ activeChild.name }} · {{ activeChild.class }}</text>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="growthLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
        <template v-else>
          <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
            <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">能力发展概览</text>
            <view style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16rpx;">
              <view v-for="a in abilities" :key="a.label" style="text-align:center;padding:20rpx 0;">
                <view style="width:80rpx;height:80rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center;margin:0 auto 12rpx;" :style="{ backgroundColor: a.color + '18' }">
                  <MpIcon :name="domainIcon(a.label)" :size="36" :color="a.color" />
                </view>
                <text style="font-size:28rpx;font-weight:800;display:block;" :style="{ color: a.color }">{{ a.score }}</text>
                <text style="font-size:20rpx;color:#8D6E63;display:block;">{{ a.label }}</text>
              </view>
            </view>
            <text style="font-size:20rpx;color:#BDBDBD;display:block;margin-top:8rpx;">评分由近期里程碑数量简化估算</text>
          </view>

          <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
            <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">近期里程碑</text>
            <view v-if="!milestones.length" style="padding:24rpx 0;text-align:center;"><text style="font-size:24rpx;color:#8D6E63;">暂无里程碑记录</text></view>
            <view v-for="m in milestones" :key="m.id || m.desc" style="display:flex;align-items:flex-start;gap:20rpx;padding-bottom:20rpx;border-bottom:1rpx solid #F5F0EC;margin-bottom:20rpx;">
              <view style="width:48rpx;height:48rpx;border-radius:16rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0;" :style="{ backgroundColor: m.color + '20' }">
                <MpIcon :name="domainIcon(m.type)" :size="22" :color="m.color" />
              </view>
              <view style="flex:1;">
                <view style="display:flex;align-items:center;gap:12rpx;margin-bottom:8rpx;">
                  <view class="pill" :style="{ backgroundColor: m.color + '18', color: m.color }"><text style="font-size:20rpx;">{{ m.type }}</text></view>
                  <text style="font-size:22rpx;color:#8D6E63;">{{ m.date }}</text>
                </view>
                <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;">{{ m.desc }}</text>
              </view>
            </view>
          </view>

          <view class="card" style="padding:24rpx;">
            <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:20rpx;">体格发育</text>
            <view v-if="!physique" style="padding:24rpx 0;text-align:center;"><text style="font-size:24rpx;color:#8D6E63;">暂无体格数据</text></view>
            <view v-else style="display:flex;gap:20rpx;">
              <view style="flex:1;text-align:center;padding:24rpx;background:#E3F2FD;border-radius:20rpx;">
                <text style="font-size:48rpx;font-weight:800;color:#3B9EEB;display:block;">{{ physique.height_cm }}</text>
                <text style="font-size:22rpx;color:#8D6E63;display:block;">身高(cm)</text>
                <text style="font-size:20rpx;color:#3B9EEB;display:block;margin-top:4rpx;">{{ physique.measured_on || '' }}</text>
              </view>
              <view style="flex:1;text-align:center;padding:24rpx;background:#F3E5F5;border-radius:20rpx;">
                <text style="font-size:48rpx;font-weight:800;color:#AB47BC;display:block;">{{ physique.weight_kg }}</text>
                <text style="font-size:22rpx;color:#8D6E63;display:block;">体重(kg)</text>
                <text style="font-size:20rpx;color:#AB47BC;display:block;margin-top:4rpx;">最近测量</text>
              </view>
            </view>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchGrowth } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const activeTab = ctx.activeTab
const activeChild = ctx.activeChild
const activeChildId = ctx.activeChildId

const DOMAIN_ICONS = {
  语言: 'message-circle',
  运动: 'star',
  认知: 'clipboard-list',
  社交: 'users',
  艺术: 'images',
  生活: 'sprout',
}

function domainIcon(label) {
  return DOMAIN_ICONS[label] || 'sprout'
}

const growthLoading = ref(false)
const abilities = ref([])
const milestones = ref([])
const physique = ref(null)

async function loadGrowth() {
  if (!activeChildId.value) {
    abilities.value = []
    milestones.value = []
    physique.value = null
    return
  }
  growthLoading.value = true
  try {
    const data = await fetchGrowth(activeChildId.value)
    abilities.value = data?.abilities || []
    milestones.value = data?.milestones || []
    physique.value = data?.physique || null
  } catch (e) {
    uni.showToast({ title: e.message || '成长档案加载失败', icon: 'none' })
  } finally {
    growthLoading.value = false
  }
}

watch(() => props.active, (v) => { if (v) loadGrowth() }, { immediate: true })
watch(activeChildId, () => { if (props.active) loadGrowth() })

onShow(() => { if (props.active) loadGrowth() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
