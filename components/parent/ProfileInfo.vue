<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;padding:0 40rpx;">
            <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;margin-right:20rpx;" @click="goProfilePage('main')">
              <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
            </view>
            <text style="font-size:32rpx;font-weight:800;color:#2D1F18;">个人资料</text>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view class="card" style="padding:32rpx;margin-bottom:24rpx;display:flex;align-items:center;">
              <view style="width:112rpx;height:112rpx;border-radius:36rpx;background:#E3F2FD;display:flex;align-items:center;justify-content:center;margin-right:24rpx;flex-shrink:0;">
                <text style="font-size:48rpx;font-weight:800;color:#3B9EEB;">{{ parentAvatar }}</text>
              </view>
              <view style="flex:1;min-width:0;">
                <text style="font-size:32rpx;font-weight:800;color:#2D1F18;display:block;">{{ parentName }}</text>
                <text style="font-size:24rpx;color:#8D6E63;display:block;margin-top:8rpx;">{{ parentPhoneMasked || '未绑定手机' }}</text>
              </view>
            </view>
            <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">显示名称</text>
              <input class="form-input" :value="editProfileName" @input="e => editProfileName = e.detail.value" maxlength="20" placeholder="请输入称呼" />
              <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:12rpx;">将用于请假、反馈等场景的署名</text>
            </view>
            <view class="card" style="overflow:hidden;margin-bottom:24rpx;">
              <view style="display:flex;justify-content:space-between;padding:24rpx;border-bottom:1rpx solid #F5F0EC;">
                <text style="font-size:26rpx;color:#8D6E63;">手机号</text>
                <text style="font-size:26rpx;font-weight:700;color:#2D1F18;">{{ parentPhoneMasked || '—' }}</text>
              </view>
              <view style="display:flex;justify-content:space-between;padding:24rpx;">
                <text style="font-size:26rpx;color:#8D6E63;">已绑定宝贝</text>
                <text style="font-size:26rpx;font-weight:700;color:#2D1F18;">{{ childOptions.length }} 名</text>
              </view>
            </view>
            <view class="primary-btn" :style="{ opacity: profileBusy ? 0.6 : 1 }" @click="saveProfileName">
              <text style="color:white;font-size:30rpx;font-weight:800;">保存</text>
            </view>
          </view>
        </scroll-view>
      </view>

</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { updateProfile } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const { parentName, parentPhoneMasked, parentAvatar, childOptions, goProfilePage } = ctx
const editProfileName = ref('')
const profileBusy = ref(false)

function prepareProfileInfo() {
  editProfileName.value = parentName.value || ''
}

async function saveProfileName() {
  const name = (editProfileName.value || '').trim()
  if (!name) { uni.showToast({ title: '请填写名称', icon: 'none' }); return }
  if (profileBusy.value) return
  profileBusy.value = true
  try {
    await updateProfile({ name })
    parentName.value = name
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    profileBusy.value = false
  }
}

watch(() => props.active, (v) => { if (v) prepareProfileInfo() }, { immediate: true })

onShow(() => { if (props.active) prepareProfileInfo() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
