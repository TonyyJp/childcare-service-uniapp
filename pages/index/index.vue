<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <view class="logo-wrap">
        <view class="logo">🌱</view>
      </view>
      <text class="title">苗苗托育</text>
      <text class="subtitle">专业的托育机构管理平台</text>
    </view>

    <!-- Role Cards -->
    <view class="card-list">
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

    <!-- Footer -->
    <view class="footer">
      <text class="footer-text">{{ loading ? '登录中…' : (useWxLogin ? '将使用微信登录' : '本地联调登录') }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { DEMO_LOGIN_CODES, USE_WX_LOGIN } from '../../config.js'
import { loginAs } from '../../api/mp.js'

const loading = ref(false)
const useWxLogin = USE_WX_LOGIN

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

function resolveLoginCode(roleId) {
  return new Promise((resolve, reject) => {
    if (!USE_WX_LOGIN) {
      resolve(DEMO_LOGIN_CODES[roleId])
      return
    }
    uni.login({
      provider: 'weixin',
      success: (res) => {
        if (res.code) resolve(res.code)
        else reject(new Error('微信登录未返回 code'))
      },
      fail: (err) => reject(new Error(err?.errMsg || '微信登录失败')),
    })
  })
}

async function selectRole(id) {
  if (loading.value) return

  loading.value = true
  uni.showLoading({ title: '登录中', mask: true })
  try {
    const code = await resolveLoginCode(id)
    await loginAs(code, id)
    uni.navigateTo({ url: PAGE_MAP[id] })
  } catch (e) {
    const msg = e?.code === 'NEED_PHONE'
      ? '请先绑定手机号（真登录新用户）'
      : (e.message || '登录失败')
    uni.showToast({ title: msg, icon: 'none', duration: 2500 })
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

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx 80rpx;
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

.logo {
  font-size: 72rpx;
}

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
  text-transform: uppercase;
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

.role-icon {
  font-size: 52rpx;
}

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

.footer {
  padding: 60rpx 0 80rpx;
  display: flex;
  justify-content: center;
}

.footer-text {
  font-size: 24rpx;
  color: #8D6E63;
}
</style>
