<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">消息通知</text>
      <view class="subpage-nav__row">
        <view class="subpage-nav__back" @click="goProfilePage('main')">
          <text class="subpage-nav__back-icon">‹</text>
        </view>
        <view class="subpage-nav__side" />
      </view>
    </view>
    <view class="subpage-body">
      <scroll-view scroll-y class="subpage-scroll">
        <view class="subpage-pad">
          <view class="list-card" style="padding:0;overflow:hidden;">
            <view
              v-for="(n, i) in notifyPrefs"
              :key="n.key"
              class="pref-row"
              :style="{
                borderBottom: i < notifyPrefs.length - 1 ? '1rpx solid #E3F2FD' : 'none',
                opacity: n.busy ? 0.55 : 1,
              }"
            >
              <view class="pref-row__meta">
                <text class="list-card__title">{{ n.label }}</text>
                <text class="list-card__sub">{{ n.desc }}</text>
                <text
                  class="pref-row__tpl"
                  :style="{ color: templateReady[n.key] ? '#66BB6A' : '#FFA726' }"
                >
                  {{ templateReady[n.key] ? '模板已配置，开启将唤起微信授权' : '平台尚未配置该类模板' }}
                </text>
              </view>
              <view
                class="pref-switch"
                :style="{ backgroundColor: n.on ? '#3B9EEB' : '#E0E0E0' }"
                @click="toggleNotifyPref(n.key)"
              >
                <view class="pref-switch__knob" :style="{ left: n.on ? '44rpx' : '4rpx' }" />
              </view>
            </view>
          </view>

          <view class="list-card">
            <text class="list-card__title" style="margin-bottom:8rpx;">说明</text>
            <text class="list-card__sub" style="line-height:1.7;">
              开启开关会弹出微信订阅授权；同意后机构可通过微信模板消息通知你。站内消息仍可在「站内消息」页查看。微信每次授权通常仅增加 1 次推送额度，重要场景可再次打开开关续订。
            </text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed, inject, reactive, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { ensureWechatRuntime, getSubscribeTemplates } from '../../utils/wechatRuntime.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const { notifyPrefs, toggleNotifyPref, goProfilePage } = ctx
const templates = reactive({ homework: '', attendance: '', notice: '', daily: '' })

const templateReady = computed(() => ({
  homework: !!templates.homework,
  attendance: !!templates.attendance,
  notice: !!templates.notice,
  daily: !!templates.daily,
}))

async function refreshTemplates() {
  try {
    await ensureWechatRuntime(true)
  } catch (_) {}
  const t = getSubscribeTemplates() || {}
  templates.homework = t.homework || ''
  templates.attendance = t.attendance || ''
  templates.notice = t.notice || ''
  templates.daily = t.daily || ''
}

watch(() => props.active, (v) => { if (v) refreshTemplates() }, { immediate: true })
onShow(() => { if (props.active) refreshTemplates() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
@import '../../styles/profile-subpage.scss';

.pref-row {
  display: flex;
  align-items: center;
  padding: 28rpx;
}

.pref-row__meta {
  flex: 1;
  min-width: 0;
  margin-right: 20rpx;
}

.pref-row__tpl {
  font-size: 20rpx;
  display: block;
  margin-top: 8rpx;
}

.pref-switch {
  width: 88rpx;
  height: 48rpx;
  border-radius: 24rpx;
  position: relative;
  flex-shrink: 0;
}

.pref-switch__knob {
  position: absolute;
  top: 4rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
  background: white;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}
</style>
