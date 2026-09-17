<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">人脸授权</text>
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
          <view v-if="denyReason" class="tip-card tip-card--warn">
            <text class="tip-card__text">{{ denyReason }}，暂不能采集</text>
          </view>
          <view v-else class="tip-card tip-card--ok">
            <text class="tip-card__text">授权后，教师端刷脸设备可识别宝贝完成签到。人脸信息存储于腾讯云人脸库，照片仅用于签到识别；可随时撤回，撤回后云端人脸与本机照片立即删除。</text>
          </view>

          <LoadingSkeleton v-if="faceLoading" variant="list" :count="2" padding="8rpx 0" />
          <view v-else-if="!faceList.length" class="empty-block empty-block--card">
            <text class="empty-block__title">请先绑定宝贝</text>
            <text class="empty-block__hint">绑定后可为宝贝采集人脸授权</text>
          </view>

          <view v-for="row in faceList" :key="row.student_id" class="list-card">
            <view class="list-card__row">
              <view class="list-card__body">
                <text class="list-card__title">{{ row.student_name }}</text>
                <text class="list-card__sub">
                  {{ row.authorized ? `已授权 · ${row.consented_at || ''}` : '未授权' }}
                </text>
              </view>
              <view
                v-if="!row.authorized && !denyReason"
                class="list-card__action list-card__action--primary"
                @click="startAuthorize(row)"
              >
                <text class="list-card__action-text">采集授权</text>
              </view>
              <view
                v-else-if="row.authorized"
                class="list-card__action list-card__action--danger"
                @click="confirmRevoke(row)"
              >
                <text class="list-card__action-text">撤回</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="activeRow" class="overlay" style="z-index:80;" @click="closeAuthorize">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">人脸信息处理须知</text>
        <scroll-view scroll-y style="max-height:320rpx;margin-bottom:20rpx;">
          <text style="font-size:22rpx;color:#6D4C41;line-height:1.7;">
            1. 目的：仅用于宝贝在托刷脸签到识别；\n2. 方式：照片经加密传输至腾讯云人脸识别服务生成特征比对，原始照片存储于平台；\n3. 保存：授权期间持续保留，撤回后云端人脸特征与本机照片即时删除；\n4. 依据《个人信息保护法》，人脸信息属敏感个人信息，本次采集需您单独同意，授权完全自愿。
          </text>
        </scroll-view>
        <view v-if="!consented" style="display:flex;align-items:center;gap:12rpx;margin-bottom:20rpx;" @click="consented = true">
          <view style="width:36rpx;height:36rpx;border-radius:18rpx;border:3rpx solid #3B9EEB;display:flex;align-items:center;justify-content:center;">
            <text v-if="consented" style="font-size:24rpx;color:#3B9EEB;">✓</text>
          </view>
          <text style="font-size:22rpx;color:#1F2937;">我已阅读并同意上述须知</text>
        </view>
        <view v-else style="padding:0 0 20rpx;">
          <camera v-if="cameraOn" device-position="back" flash="off" style="width:100%;height:480rpx;border-radius:20rpx;" @error="onCameraError" />
          <view v-else style="height:120rpx;display:flex;align-items:center;justify-content:center;" @click="cameraOn = true">
            <text style="font-size:24rpx;color:#3B9EEB;">开启摄像头，拍摄宝贝正脸</text>
          </view>
        </view>
        <view class="primary-btn" :style="{ background: canSubmit ? 'linear-gradient(135deg,#3B9EEB 0%,#2F8FD8 100%)' : '#E5E7EB' }" @click="submitAuthorize">
          <text :style="{ color: canSubmit ? 'white' : '#6B7280', fontSize: '30rpx', fontWeight: 800 }">
            {{ submitting ? '采集中…' : (consented ? '拍摄并授权' : '请先勾选同意') }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { computed, inject, ref, watch } from 'vue'
import { PARENT_CTX_KEY } from './parentContext.js'
import { fetchFaceStatus, authorizeFace, revokeFace } from '../../api/parent.js'
import { uploadFile } from '../../utils/request.js'

const ctx = inject(PARENT_CTX_KEY)
const { goProfilePage } = ctx

const faceLoading = ref(true)
const faceList = ref([])
const denyReason = ref('')

const activeRow = ref(null)
const consented = ref(false)
const cameraOn = ref(false)
const submitting = ref(false)
let cameraCtx = null

const canSubmit = computed(() => !!activeRow.value && consented.value && cameraOn.value && !submitting.value)

async function loadStatus() {
  faceLoading.value = true
  try {
    const data = await fetchFaceStatus()
    faceList.value = data?.list || []
    denyReason.value = data?.deny_reason || ''
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    faceLoading.value = false
  }
}

function startAuthorize(row) {
  activeRow.value = row
  consented.value = false
  cameraOn.value = false
}

function closeAuthorize() {
  if (submitting.value) return
  activeRow.value = null
  cameraOn.value = false
}

function onCameraError() {
  cameraOn.value = false
  uni.showToast({ title: '摄像头开启失败，请检查授权设置', icon: 'none' })
}

async function submitAuthorize() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    if (!cameraCtx) cameraCtx = uni.createCameraContext()
    const photo = await new Promise((resolve, reject) => {
      cameraCtx.takePhoto({
        quality: 'high',
        success: res => resolve(res.tempImagePath),
        fail: reject
      })
    })
    const up = await uploadFile(photo, 'face')
    await authorizeFace({
      student_id: activeRow.value.student_id,
      attachment_id: up.attachment_id,
      consent: true
    })
    uni.showToast({ title: '授权成功', icon: 'success' })
    activeRow.value = null
    cameraOn.value = false
    await loadStatus()
  } catch (e) {
    uni.showToast({ title: e.message || '采集失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function confirmRevoke(row) {
  uni.showModal({
    title: '撤回人脸授权',
    content: `撤回后「${row.student_name}」将无法刷脸签到，云端人脸特征与本机照片将立即删除。`,
    confirmText: '撤回',
    confirmColor: '#E53935',
    success: async res => {
      if (!res.confirm) return
      try {
        await revokeFace(row.student_id)
        uni.showToast({ title: '已撤回', icon: 'success' })
        await loadStatus()
      } catch (e) {
        uni.showToast({ title: e.message || '撤回失败', icon: 'none' })
      }
    }
  })
}

watch(cameraOn, on => {
  if (on) setTimeout(() => { cameraCtx = uni.createCameraContext() }, 400)
})

loadStatus()
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
@import '../../styles/profile-subpage.scss';
</style>
