<template>
  <view class="subpage">
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">接送人</text>
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
          <text class="subpage-hint">{{ activeChild.name || '请先绑定宝贝' }} · 授权接送人员</text>

          <view v-if="!activeChildId" class="empty-block empty-block--card">
            <text class="empty-block__title">请先绑定宝贝</text>
            <text class="empty-block__hint">绑定后可为孩子添加接送人</text>
          </view>
          <view v-else-if="pickupLoading" class="empty-block">
            <text class="empty-block__text">加载中…</text>
          </view>
          <view v-else-if="!pickupPersons.length" class="empty-block empty-block--card">
            <text class="empty-block__title">暂无接送人</text>
            <text class="empty-block__hint">添加后可用于接送核对</text>
          </view>

          <view v-for="p in pickupPersons" :key="p.id" class="list-card">
            <view class="list-card__row">
              <view class="list-card__body">
                <text class="list-card__title">{{ p.name }} · {{ p.relation }}</text>
                <text class="list-card__sub">{{ p.phone }}</text>
              </view>
              <view class="list-card__action list-card__action--danger" @click="removePickupPerson(p)">
                <text class="list-card__action-text">删除</text>
              </view>
            </view>
          </view>

          <view v-if="activeChildId" class="add-dashed" @click="showPickupCompose = true">
            <text class="add-dashed__text">+ 添加接送人</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="showPickupCompose" class="overlay" style="z-index:80;" @click="showPickupCompose = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">添加接送人</text>
        <view class="form-section">
          <view class="form-field">
            <text class="form-label">姓名</text>
            <input class="form-input" v-model="pickupForm.name" placeholder="接送人姓名" maxlength="20" />
          </view>
          <view class="form-field">
            <text class="form-label">关系</text>
            <input class="form-input" v-model="pickupForm.relation" placeholder="如：爷爷 / 阿姨" maxlength="20" />
          </view>
          <view class="form-field">
            <text class="form-label">手机</text>
            <input class="form-input" v-model="pickupForm.phone" type="number" placeholder="手机号" maxlength="20" />
          </view>
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
@import '../../styles/profile-subpage.scss';
</style>
