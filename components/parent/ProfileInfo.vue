<template>
      <view style="flex:1;display:flex;flex-direction:column;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;padding:0 40rpx;">
            <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;margin-right:20rpx;" @click="goProfilePage('main')">
              <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
            </view>
            <text style="font-size:32rpx;font-weight:800;color:#2D1F18;">个人资料</text>
          </view>
        </view>
        <view style="flex:1;overflow:hidden;"><scroll-view scroll-y style="height:100%;">
          <view style="padding:24rpx 40rpx;">
            <view class="card" style="padding:32rpx;margin-bottom:24rpx;display:flex;align-items:center;">
              <button
                class="profile-avatar"
                hover-class="none"
                open-type="chooseAvatar"
                :disabled="profileBusy"
                @chooseavatar="onChooseWxAvatar"
              >
                <image v-if="previewAvatar" class="profile-avatar__img" :src="previewAvatar" mode="aspectFill" />
                <text v-else class="profile-avatar__letter">{{ parentAvatar }}</text>
                <view class="profile-avatar__badge"><text style="font-size:22rpx;color:white;">✎</text></view>
              </button>
              <view style="flex:1;min-width:0;margin-left:24rpx;">
                <text style="font-size:32rpx;font-weight:800;color:#2D1F18;display:block;">{{ parentName }}</text>
                <text style="font-size:24rpx;color:#8D6E63;display:block;margin-top:8rpx;">{{ parentPhoneMasked || '未绑定手机' }}</text>
              </view>
            </view>
            <view class="card" style="padding:24rpx;margin-bottom:24rpx;">
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">昵称</text>
              <input
                class="form-input"
                type="nickname"
                :value="editNickname"
                :disabled="profileBusy"
                @input="e => editNickname = e.detail.value"
                @blur="onWxNickname"
                maxlength="20"
                placeholder="请输入昵称"
              />
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
            <view class="primary-btn" :style="{ opacity: profileBusy ? 0.6 : 1 }" @click="saveNickname">
              <text style="color:white;font-size:30rpx;font-weight:800;">保存</text>
            </view>
          </view>
        </scroll-view></view>
      </view>

</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { updateProfile } from '../../api/parent.js'
import { uploadFile } from '../../utils/request.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const {
  parentName,
  parentPhoneMasked,
  parentAvatar,
  parentAvatarUrl,
  childOptions,
  goProfilePage,
  applyGuardianProfile,
} = ctx
const editNickname = ref('')
const localAvatar = ref('')
const profileBusy = ref(false)

const previewAvatar = computed(() => localAvatar.value || parentAvatarUrl.value || '')

function prepareProfileInfo() {
  editNickname.value = parentName.value || ''
  localAvatar.value = ''
}

async function applyAvatarFile(filePath) {
  if (!filePath || profileBusy.value) return
  profileBusy.value = true
  try {
    const up = await uploadFile(filePath, 'avatar')
    const profile = await updateProfile({ avatar_attachment_id: up.attachment_id })
    applyGuardianProfile(profile)
    localAvatar.value = ''
    uni.showToast({ title: '头像已更新', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '头像更新失败', icon: 'none' })
  } finally {
    profileBusy.value = false
  }
}

function onChooseWxAvatar(e) {
  const url = e?.detail?.avatarUrl
  if (url) applyAvatarFile(url)
}

function onWxNickname(e) {
  const v = (e?.detail?.value || '').trim()
  if (v) editNickname.value = v
}

async function saveNickname() {
  const nickname = (editNickname.value || '').trim()
  if (!nickname) { uni.showToast({ title: '请填写昵称', icon: 'none' }); return }
  if (profileBusy.value) return
  profileBusy.value = true
  try {
    const profile = await updateProfile({ nickname })
    applyGuardianProfile(profile)
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

.profile-avatar {
  position: relative;
  width: 112rpx;
  height: 112rpx;
  padding: 0;
  margin: 0;
  border-radius: 36rpx;
  background: #E3F2FD;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  line-height: normal;
}

.profile-avatar::after {
  border: none;
}

.profile-avatar__img {
  width: 112rpx;
  height: 112rpx;
}

.profile-avatar__letter {
  font-size: 48rpx;
  font-weight: 800;
  color: #3B9EEB;
}

.profile-avatar__badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx 0 0 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
