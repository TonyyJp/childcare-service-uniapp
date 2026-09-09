<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;padding:0 40rpx;">
            <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;margin-right:20rpx;" @click="goProfilePage('main')">
              <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
            </view>
            <text style="font-size:32rpx;font-weight:800;color:#2D1F18;flex:1;">我的宝贝</text>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view v-if="childOptions.length" style="margin-bottom:8rpx;">
              <text style="font-size:22rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;padding-left:8rpx;">已绑定</text>
              <view v-for="c in childOptions" :key="c.id" class="card" style="padding:24rpx;margin-bottom:16rpx;" @click="pickChild(c.id)">
                <view style="display:flex;align-items:center;">
                  <view style="width:100rpx;height:100rpx;border-radius:32rpx;background:#E3F2FD;display:flex;align-items:center;justify-content:center;font-size:52rpx;flex-shrink:0;margin-right:20rpx;"><text>{{ c.emoji }}</text></view>
                  <view style="flex:1;min-width:0;">
                    <text style="font-size:32rpx;font-weight:800;color:#2D1F18;display:block;">{{ c.name }}</text>
                    <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:8rpx;">{{ c.tenant }}</text>
                    <view v-if="activeChildId === c.id" class="pill" style="background:#C8E6C9;color:#2E7D32;margin-top:12rpx;"><text style="font-size:20rpx;font-weight:700;">当前查看</text></view>
                  </view>
                </view>
              </view>
            </view>
            <view v-if="pendingBindings.length" style="margin-bottom:8rpx;margin-top:16rpx;">
              <text style="font-size:22rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;padding-left:8rpx;">待审核 / 其他</text>
              <view v-for="b in pendingBindings" :key="b.id" class="card" style="padding:24rpx;margin-bottom:16rpx;">
                <view style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8rpx;">
                  <text style="font-size:30rpx;font-weight:800;color:#2D1F18;">{{ b.student?.name || '学员' }}</text>
                  <view class="pill" :style="bindingStatusStyle(b.status)"><text style="font-size:20rpx;font-weight:700;">{{ bindingStatusLabel(b.status) }}</text></view>
                </view>
                <text style="font-size:22rpx;color:#8D6E63;display:block;">{{ b.tenant?.name || '' }} · {{ bindingRelationLabel(b.relation) }} · {{ b.applied_at || '' }}</text>
                <text v-if="b.reject_reason" style="font-size:22rpx;color:#E53935;display:block;margin-top:8rpx;">驳回：{{ b.reject_reason }}</text>
              </view>
            </view>
            <view style="padding:24rpx;border-radius:24rpx;border:3rpx dashed #BBDEFB;display:flex;align-items:center;justify-content:center;margin-top:8rpx;" @click="openBindingCompose">
              <text style="font-size:28rpx;color:#3B9EEB;">+ 添加宝贝</text>
            </view>
            <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:16rpx;text-align:center;">请向园所索取班级邀请码完成绑定</text>
          </view>
        </scroll-view>

        <view v-if="showBindingCompose" class="overlay" style="z-index:80;" @click="closeBindingCompose">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">添加宝贝</text>
            <view style="display:flex;flex-direction:column;">
              <view style="margin-bottom:20rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">班级邀请码</text>
                <view style="display:flex;align-items:center;">
                  <input class="form-input" style="flex:1;margin-right:12rpx;" :value="bindingForm.inviteCode" @input="e => bindingForm.inviteCode = (e.detail.value || '').toUpperCase()" maxlength="6" placeholder="6 位邀请码" />
                  <view style="padding:20rpx 24rpx;border-radius:20rpx;background:#E3F2FD;flex-shrink:0;" @click="previewBindingClass">
                    <text style="font-size:24rpx;font-weight:700;color:#3B9EEB;">查询</text>
                  </view>
                </view>
              </view>
              <view v-if="bindingClassInfo" class="card" style="padding:20rpx;margin-bottom:20rpx;background:#F0F7FF;">
                <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;">{{ bindingClassInfo.tenant?.name }}</text>
                <text style="font-size:24rpx;color:#8D6E63;display:block;margin-top:6rpx;">{{ bindingClassInfo.class?.name }} · {{ bindingClassInfo.term?.name || '' }}</text>
              </view>
              <view style="margin-bottom:20rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">与孩子关系</text>
                <view style="display:flex;flex-wrap:wrap;">
                  <view v-for="(r, ri) in bindingRelations" :key="r.id" class="pill" style="padding:12rpx 20rpx;margin-right:12rpx;margin-bottom:8rpx;"
                    :style="{ backgroundColor: bindingForm.relation === r.id ? '#3B9EEB18' : '#F5F0EC', color: bindingForm.relation === r.id ? '#3B9EEB' : '#8D6E63' }"
                    @click="bindingForm.relation = r.id">
                    <text style="font-size:22rpx;">{{ r.label }}</text>
                  </view>
                </view>
              </view>
              <view style="margin-bottom:20rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">孩子姓名（须与园所档案一致）</text>
                <input class="form-input" :value="bindingForm.childName" @input="e => bindingForm.childName = e.detail.value" placeholder="孩子姓名（与园所档案一致）" maxlength="20" />
              </view>
              <view style="margin-bottom:20rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">学校（选填）</text>
                <input class="form-input" :value="bindingForm.school" @input="e => bindingForm.school = e.detail.value" placeholder="用于辅助匹配" maxlength="50" />
              </view>
              <view class="primary-btn" :style="{ opacity: bindingBusy ? 0.6 : 1 }" @click="submitBinding">
                <text style="color:white;font-size:30rpx;font-weight:800;">提交绑定申请</text>
              </view>
            </view>
          </view>
        </view>
      </view>

</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { createBinding, fetchBindings, fetchClassInfo } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const { childOptions, activeChildId, goProfilePage, selectChild, closeProfile, loadParentHome } = ctx

const pendingBindings = ref([])
const showBindingCompose = ref(false)
const bindingBusy = ref(false)
const bindingPreviewBusy = ref(false)
const bindingClassInfo = ref(null)
const bindingRelations = [
  { id: 'father', label: '爸爸' },
  { id: 'mother', label: '妈妈' },
  { id: 'grandfather', label: '爷爷' },
  { id: 'grandmother', label: '奶奶' },
  { id: 'other', label: '其他' },
]
const bindingForm = ref({ inviteCode: '', relation: 'father', childName: '', school: '' })

function bindingStatusLabel(s) {
  return ({ pending: '待审核', approved: '已通过', unbound: '已解绑', rejected: '已驳回' })[s] || s
}
function bindingStatusStyle(s) {
  const map = {
    pending: { backgroundColor: '#FFF3E0', color: '#E65100' },
    approved: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
    unbound: { backgroundColor: '#F5F5F5', color: '#757575' },
    rejected: { backgroundColor: '#FFEBEE', color: '#C62828' },
  }
  return map[s] || map.pending
}
function bindingRelationLabel(r) {
  return ({ father: '爸爸', mother: '妈妈', grandfather: '爷爷', grandmother: '奶奶', other: '其他' })[r] || r || '家长'
}

async function loadBindings() {
  try {
    const data = await fetchBindings()
    pendingBindings.value = (data?.list || []).filter(b => b.status !== 'approved')
  } catch {
    pendingBindings.value = []
  }
}

function openBindingCompose() {
  bindingForm.value = { inviteCode: '', relation: 'father', childName: '', school: '' }
  bindingClassInfo.value = null
  showBindingCompose.value = true
}
function closeBindingCompose() {
  showBindingCompose.value = false
  bindingClassInfo.value = null
}

async function pickChild(id) {
  await selectChild(id)
  goProfilePage('main')
  closeProfile()
}

async function previewBindingClass() {
  const code = (bindingForm.value.inviteCode || '').trim()
  if (code.length !== 6) {
    uni.showToast({ title: '请输入 6 位邀请码', icon: 'none' })
    return
  }
  if (bindingPreviewBusy.value) return
  bindingPreviewBusy.value = true
  try {
    bindingClassInfo.value = await fetchClassInfo(code)
  } catch (e) {
    bindingClassInfo.value = null
    uni.showToast({ title: e.message || '邀请码无效', icon: 'none' })
  } finally {
    bindingPreviewBusy.value = false
  }
}

async function submitBinding() {
  const code = (bindingForm.value.inviteCode || '').trim()
  const name = (bindingForm.value.childName || '').trim()
  if (code.length !== 6) {
    uni.showToast({ title: '请输入 6 位邀请码', icon: 'none' })
    return
  }
  if (!name) {
    uni.showToast({ title: '请填写孩子姓名', icon: 'none' })
    return
  }
  if (bindingBusy.value) return
  bindingBusy.value = true
  try {
    if (!bindingClassInfo.value) bindingClassInfo.value = await fetchClassInfo(code)
    await createBinding({
      invite_code: code,
      relation: bindingForm.value.relation,
      child: { name, school: (bindingForm.value.school || '').trim() || undefined },
    })
    uni.showToast({ title: '已提交，待机构审核', icon: 'success' })
    closeBindingCompose()
    await loadBindings()
    await loadParentHome()
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    bindingBusy.value = false
  }
}

watch(() => props.active, (v) => { if (v) loadBindings() }, { immediate: true })

onShow(() => { if (props.active) loadBindings() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
