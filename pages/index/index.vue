<template>
  <view class="container">
    <view v-if="booting" class="boot">
      <text class="boot-text">加载中…</text>
    </view>

    <template v-else>
      <view class="header">
        <view class="logo-wrap">
          <view class="logo">🌱</view>
        </view>
        <text class="title">智优托教</text>
        <text class="subtitle">专业的托育机构管理平台</text>
      </view>

      <view v-if="!pendingRole" class="card-list">
        <text class="section-label">请选择您的身份</text>
        <view
          v-for="role in roles"
          :key="role.id"
          class="role-card"
          :style="{ borderColor: role.border, backgroundColor: role.bg }"
          @click="selectRole(role.id)"
        >
          <view class="role-icon-wrap" :style="{ boxShadow: `0 8rpx 24rpx ${role.accent}40` }">
            <text class="role-icon">{{ role.emoji }}</text>
          </view>
          <view class="role-info">
            <text class="role-label">{{ role.label }}</text>
            <text class="role-desc">{{ role.desc }}</text>
          </view>
          <view class="role-arrow" :style="{ backgroundColor: role.accent }">
            <text class="arrow-text">›</text>
          </view>
        </view>
      </view>

      <view v-else class="phone-panel">
        <view class="phone-back" @click="pendingRole = null">
          <text class="phone-back-text">‹ 重选身份</text>
        </view>
        <text class="phone-title">微信手机号登录</text>
        <text class="phone-sub">以 {{ roleLabel }} 身份进入，将使用微信授权的手机号</text>

        <button
          class="wx-phone-btn"
          :loading="loading"
          :disabled="loading"
          open-type="getPhoneNumber"
          @getphonenumber="onGetPhoneNumber"
        >
          {{ loading ? '登录中…' : '微信一键获取手机号' }}
        </button>

        <text class="hint">
          需在微信公众平台开通「手机号快速验证」；教师请使用机构登记的手机号对应微信。
        </text>
      </view>

      <view v-if="!pendingRole" class="footer">
        <text class="footer-text">{{ footerText }}</text>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getToken, clearSession } from '../../utils/auth.js'
import { ensureWechatRuntime } from '../../utils/wechatRuntime.js'
import {
  enterAsRole,
  fetchMe,
  hasOrgAffiliation,
  loginWithWxPhone,
  resolveBoundRole,
} from '../../api/mp.js'

const booting = ref(true)
const loading = ref(false)
const loggedIn = ref(false)
const pendingRole = ref(null)
const meSnapshot = ref(null)

const roles = [
  {
    id: 'teacher',
    label: '教师端',
    desc: '管理课程、考勤、作业及评语',
    emoji: '👩‍🏫',
    bg: '#FFF3E0',
    accent: '#FF7043',
    border: '#FFCCBC'
  },
  {
    id: 'parent',
    label: '家长端',
    desc: '查看宝贝的成长与日常记录',
    emoji: '👨‍👩‍👧',
    bg: '#E3F2FD',
    accent: '#42A5F5',
    border: '#BBDEFB'
  },
  {
    id: 'institution',
    label: '机构端',
    desc: '统筹管理师资、课程与运营',
    emoji: '🏫',
    bg: '#F3E5F5',
    accent: '#AB47BC',
    border: '#E1BEE7'
  }
]

const PAGE_MAP = {
  teacher: '/pages-teacher/index',
  parent: '/pages-parent/index',
  institution: '/pages-institution/index'
}

const roleLabel = computed(() => roles.find(r => r.id === pendingRole.value)?.label || '')
const footerText = computed(() => {
  if (!loggedIn.value) return '未登录：选择身份后使用微信手机号登录'
  if (!hasOrgAffiliation(meSnapshot.value)) return '已登录：选择身份进入（无需重新验证）'
  return '请选择要进入的身份'
})

function goHome(role) {
  const url = PAGE_MAP[role]
  if (!url) return
  uni.reLaunch({ url })
}

async function bootstrap() {
  booting.value = true
  pendingRole.value = null
  try {
    if (!getToken()) {
      loggedIn.value = false
      meSnapshot.value = null
      return
    }

    const me = await fetchMe()
    loggedIn.value = true
    meSnapshot.value = me

    const bound = resolveBoundRole(me)
    if (bound) {
      // 已登录且已绑定机构/学生：直达对应身份首页，必要时静默切角色
      try {
        await enterAsRole(bound)
      } catch (_) {
        /* 切角色失败仍尝试进入已存角色页 */
      }
      goHome(bound)
      return
    }
    // 已登录但未绑定机构：停留本页选身份，保留登录态
  } catch (e) {
    if (e?.code === 40100) {
      clearSession()
    }
    loggedIn.value = false
    meSnapshot.value = null
  } finally {
    booting.value = false
  }
}

onShow(() => {
  bootstrap()
})

async function selectRole(id) {
  if (loading.value) return

  // 已登录：直接切身份进入，不重新微信验证
  if (loggedIn.value && getToken()) {
    loading.value = true
    uni.showLoading({ title: '进入中', mask: true })
    try {
      await enterAsRole(id)
      goHome(id)
    } catch (err) {
      uni.showToast({ title: err.message || '进入失败', icon: 'none', duration: 2500 })
    } finally {
      uni.hideLoading()
      loading.value = false
    }
    return
  }

  pendingRole.value = id
}

async function onGetPhoneNumber(e) {
  if (loading.value) return

  const detail = e?.detail || {}
  if (detail.errMsg && detail.errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({
      title: detail.errno === 104 ? '请先在公众平台开通手机号权限' : '需要授权手机号才能登录',
      icon: 'none',
      duration: 2500,
    })
    return
  }

  const phoneCode = detail.code
  if (!phoneCode) {
    uni.showToast({
      title: '未拿到手机号凭证，请升级基础库或真机重试',
      icon: 'none',
      duration: 2500,
    })
    return
  }

  loading.value = true
  uni.showLoading({ title: '登录中', mask: true })
  try {
    const cfg = await ensureWechatRuntime(true)
    if (!cfg.configured) {
      throw new Error('请先在平台后台启用微信小程序配置')
    }
    await loginWithWxPhone(phoneCode, pendingRole.value)
    loggedIn.value = true
    goHome(pendingRole.value)
  } catch (err) {
    uni.showToast({ title: err.message || '登录失败', icon: 'none', duration: 2500 })
  } finally {
    uni.hideLoading()
    loading.value = false
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(160deg, #FFF8F2 0%, #FFF3E0 100%);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.boot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120rpx;
}

.boot-text {
  font-size: 28rpx;
  color: #8D6E63;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx 64rpx;
}

.logo-wrap {
  width: 160rpx;
  height: 160rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #FF7043 0%, #FF8A65 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(255,112,67,0.35);
}

.logo { font-size: 72rpx; }

.title {
  font-size: 56rpx;
  font-weight: 800;
  color: #2D1F18;
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #8D6E63;
}

.card-list {
  flex: 1;
  padding: 0 40rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.section-label {
  font-size: 22rpx;
  font-weight: 700;
  color: #8D6E63;
  letter-spacing: 4rpx;
  margin-bottom: 8rpx;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding: 40rpx;
  border-radius: 32rpx;
  border-width: 4rpx;
  border-style: solid;
  box-shadow: 0 4rpx 16rpx rgba(45,31,24,0.06);
}

.role-icon-wrap {
  width: 112rpx;
  height: 112rpx;
  border-radius: 32rpx;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.role-icon { font-size: 52rpx; }

.role-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.role-label {
  font-size: 36rpx;
  font-weight: 800;
  color: #2D1F18;
}

.role-desc {
  font-size: 24rpx;
  color: #8D6E63;
}

.role-arrow {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.arrow-text {
  color: white;
  font-size: 40rpx;
  font-weight: 700;
  margin-top: -4rpx;
}

.phone-panel {
  flex: 1;
  padding: 0 48rpx 40rpx;
}

.phone-back { margin-bottom: 24rpx; }

.phone-back-text {
  font-size: 28rpx;
  color: #8D6E63;
}

.phone-title {
  font-size: 44rpx;
  font-weight: 800;
  color: #2D1F18;
  display: block;
}

.phone-sub {
  font-size: 26rpx;
  color: #8D6E63;
  margin: 8rpx 0 48rpx;
  display: block;
  line-height: 1.5;
}

.wx-phone-btn {
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 800;
  border: none;
  box-shadow: 0 12rpx 32rpx rgba(7,193,96,0.35);
}

.wx-phone-btn::after {
  border: none;
}

.hint {
  display: block;
  margin-top: 28rpx;
  font-size: 22rpx;
  color: #A1887F;
  line-height: 1.6;
  text-align: center;
}

.footer {
  padding: 60rpx 0 80rpx;
  display: flex;
  justify-content: center;
}

.footer-text {
  font-size: 24rpx;
  color: #8D6E63;
  text-align: center;
  padding: 0 40rpx;
  line-height: 1.5;
}
</style>
