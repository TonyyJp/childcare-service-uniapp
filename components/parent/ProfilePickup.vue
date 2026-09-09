<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;padding:0 40rpx;">
            <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;margin-right:20rpx;" @click="goProfilePage('main')">
              <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
            </view>
            <view style="flex:1;">
              <text style="font-size:32rpx;font-weight:800;color:#2D1F18;display:block;">接送人</text>
              <text style="font-size:22rpx;color:#8D6E63;">{{ activeChild.name || '请先绑定宝贝' }}</text>
            </view>
            <view v-if="activeChildId" style="background:#E3F2FD;border-radius:16rpx;padding:12rpx 20rpx;" @click="showPickupCompose = true">
              <text style="font-size:22rpx;font-weight:700;color:#3B9EEB;">+ 添加</text>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view v-if="!activeChildId" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">请先绑定宝贝</text></view>
            <view v-else-if="pickupLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
            <view v-else-if="!pickupPersons.length" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无接送人</text></view>
            <view v-for="p in pickupPersons" :key="p.id" class="card" style="padding:24rpx;margin-bottom:16rpx;display:flex;align-items:center;">
              <view style="flex:1;min-width:0;">
                <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;">{{ p.name }} · {{ p.relation }}</text>
                <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:6rpx;">{{ p.phone }}</text>
              </view>
              <view style="padding:12rpx 20rpx;border-radius:16rpx;background:#FFEBEE;" @click="removePickupPerson(p)">
                <text style="font-size:22rpx;font-weight:700;color:#E53935;">删除</text>
              </view>
            </view>
          </view>
        </scroll-view>
        <view v-if="showPickupCompose" class="overlay" style="z-index:80;" @click="showPickupCompose = false">
          <view class="sheet" @click.stop>
            <view class="sheet-handle" />
            <text class="sheet-title">添加接送人</text>
            <view style="margin-bottom:16rpx;">
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">姓名</text>
              <input class="form-input" v-model="pickupForm.name" placeholder="接送人姓名" maxlength="20" />
            </view>
            <view style="margin-bottom:16rpx;">
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">关系</text>
              <input class="form-input" v-model="pickupForm.relation" placeholder="如：爷爷 / 阿姨" maxlength="20" />
            </view>
            <view style="margin-bottom:24rpx;">
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">手机</text>
              <input class="form-input" v-model="pickupForm.phone" type="number" placeholder="手机号" maxlength="20" />
            </view>
            <view class="primary-btn" @click="submitPickupPerson">
              <text style="color:white;font-size:30rpx;font-weight:800;">保存</text>
            </view>
          </view>
        </view>
      </view>

</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { createPickupPerson, deletePickupPerson, fetchPickupPersons } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const { activeChild, activeChildId, goProfilePage } = ctx

const pickupPersons = ref([])
const pickupLoading = ref(false)
const pickupBusy = ref(false)
const showPickupCompose = ref(false)
const pickupForm = ref({ name: '', relation: '', phone: '' })

async function loadPickupPersons() {
  if (!activeChildId.value) { pickupPersons.value = []; return }
  pickupLoading.value = true
  try {
    const data = await fetchPickupPersons(activeChildId.value)
    pickupPersons.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '接送人加载失败', icon: 'none' })
  } finally {
    pickupLoading.value = false
  }
}

async function submitPickupPerson() {
  if (!activeChildId.value || pickupBusy.value) return
  const name = (pickupForm.value.name || '').trim()
  const relation = (pickupForm.value.relation || '').trim()
  const phone = (pickupForm.value.phone || '').trim()
  if (!name || !relation || !phone) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  pickupBusy.value = true
  try {
    await createPickupPerson({ student_id: activeChildId.value, name, relation, phone })
    showPickupCompose.value = false
    pickupForm.value = { name: '', relation: '', phone: '' }
    uni.showToast({ title: '已添加', icon: 'success' })
    await loadPickupPersons()
  } catch (e) {
    uni.showToast({ title: e.message || '添加失败', icon: 'none' })
  } finally {
    pickupBusy.value = false
  }
}

async function removePickupPerson(p) {
  if (!p?.id || pickupBusy.value) return
  uni.showModal({
    title: '删除接送人',
    content: `确定删除「${p.name}」？`,
    success: async (res) => {
      if (!res.confirm) return
      pickupBusy.value = true
      try {
        await deletePickupPerson(p.id)
        uni.showToast({ title: '已删除', icon: 'success' })
        await loadPickupPersons()
      } catch (e) {
        uni.showToast({ title: e.message || '删除失败', icon: 'none' })
      } finally {
        pickupBusy.value = false
      }
    },
  })
}

watch(() => props.active, (v) => { if (v) loadPickupPersons() }, { immediate: true })
watch(activeChildId, () => { if (props.active) loadPickupPersons() })

onShow(() => { if (props.active) loadPickupPersons() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
