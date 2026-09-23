<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background: linear-gradient(135deg, #ff7043 0%, #ff9068 100%);">
      <view class="safe-nav-bar" style="padding-bottom: 32rpx;">
        <view style="display: flex; align-items: center;">
          <view class="back-btn" @click="$emit('back')"><text class="back-icon">‹</text></view>
          <view style="flex: 1; margin-left: 20rpx; min-width: 0;">
            <text style="font-size: 40rpx; font-weight: 800; color: white; display: block;">托管辅导</text>
            <text style="font-size: 24rpx; color: rgba(255, 255, 255, 0.85);">{{ todayLabel }}</text>
          </view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex: 1; height: 0;">
      <view class="list-pad">
        <LoadingSkeleton v-if="loading" variant="list" :count="3" padding="8rpx 0" />
        <view v-else-if="!list.length" style="padding: 64rpx 0; text-align: center;">
          <text style="font-size: 26rpx; color: #8d6e63;">暂无托管班级</text>
        </view>
        <view
          v-for="item in list"
          :key="item.id"
          class="card hosting-card tap-feedback"
          hover-class="mp-tap-soft"
          :hover-stay-time="80"
          @click="$emit('open', item)"
        >
          <view class="hosting-card__top">
            <view class="hosting-card__badge">
              <MpIcon name="school" :size="36" color="#E64A19" />
            </view>
            <text class="hosting-card__name">{{ item.name }}</text>
            <view
              :id="'hosting-more-' + item.id"
              class="hosting-more tap-feedback"
              hover-class="mp-tap"
              :hover-stay-time="80"
              @click.stop="openMore(item)"
            >
              <text class="hosting-more__dots">···</text>
            </view>
          </view>
          <text class="hosting-card__teacher">{{ item.teacherLabel }}</text>
          <view class="hosting-card__people">
            <view
              v-for="(s, i) in item.preview"
              :key="s.id"
              class="hosting-avatar"
              :style="{ background: avatarColor(i), marginLeft: i ? '-16rpx' : '0', zIndex: 10 - i }"
            >
              <text>{{ (s.name || '?').slice(0, 1) }}</text>
            </view>
            <text class="hosting-card__count">共 {{ item.studentsCount }} 人</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <PopoverMenu
      :visible="menuVisible"
      :items="moreItems"
      :anchor="menuAnchor"
      @close="closeMore"
      @select="onMoreSelect"
    />
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, ref } from 'vue'
import LoadingSkeleton from '../LoadingSkeleton.vue'
import MpIcon from '../MpIcon.vue'
import PopoverMenu from '../PopoverMenu.vue'
import { fetchDashboard, fetchProfile } from '../../api/teacher.js'

defineEmits(['back', 'open'])

const WEEK = ['日', '一', '二', '三', '四', '五', '六']
const AVATAR_COLORS = ['#FF7043', '#AB47BC', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']

const moreItems = [
  { key: 'attendance', label: '查询考勤记录' },
  { key: 'wrongbook', label: '录错题' },
  { key: 'remove', label: '移出', danger: true },
  { key: 'report', label: '学情报告' },
]

const loading = ref(false)
const list = ref([])
const teacherSelf = ref('')
const dashDate = ref('')
const menuVisible = ref(false)
const menuAnchor = ref(null)
const menuItem = ref(null)
const instance = getCurrentInstance()

const todayLabel = computed(() => {
  const raw = dashDate.value || ''
  const d = raw ? new Date(raw.replace(/-/g, '/')) : new Date()
  if (Number.isNaN(d.getTime())) return raw || ''
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${WEEK[d.getDay()]}`
})

function avatarColor(i) {
  return AVATAR_COLORS[i % AVATAR_COLORS.length]
}

function closeMore() {
  menuVisible.value = false
  menuItem.value = null
}

function openMore(item) {
  menuItem.value = item
  nextTick(() => {
    const q = uni.createSelectorQuery()
    // #ifndef H5
    if (instance?.proxy) q.in(instance.proxy)
    // #endif
    q.select(`#hosting-more-${item.id}`)
      .boundingClientRect((rect) => {
        menuAnchor.value = rect || null
        menuVisible.value = true
      })
      .exec()
  })
}

function onMoreSelect(opt) {
  const label = opt?.label || '该功能'
  uni.showToast({ title: `${label}即将开放`, icon: 'none' })
}

onMounted(async () => {
  loading.value = true
  try {
    const [profile, dash] = await Promise.all([fetchProfile(), fetchDashboard()])
    teacherSelf.value = profile?.name || ''
    dashDate.value = dash?.date || ''
    list.value = (dash?.classes || [])
      .filter((c) => c.biz_type === 'care' || c.attendance_type_id)
      .map((c) => {
        const names = c.teacher_names || []
        return {
          id: c.id,
          name: c.name,
          typeName: c.attendance_type_name || '托管',
          teacherLabel: names.length ? names.join('、') : teacherSelf.value || '—',
          studentsCount: c.students_count || 0,
          preview: c.student_preview || [],
          periods: c.periods || [],
          canCheckin: !!c.can_period_checkin,
        }
      })
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.list-pad {
  padding: 24rpx 24rpx 40rpx;
}
.hosting-card {
  padding: 36rpx 28rpx 32rpx;
  margin-bottom: 20rpx;
  min-height: 220rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.hosting-card__top {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.hosting-card__badge {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: rgba(255, 112, 67, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hosting-card__name {
  flex: 1;
  font-size: 34rpx;
  font-weight: 800;
  color: #2d1f18;
  min-width: 0;
}
.hosting-more {
  width: 64rpx;
  height: 64rpx;
  margin: -12rpx -8rpx -12rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  flex-shrink: 0;
}
.hosting-more__dots {
  font-size: 40rpx;
  font-weight: 800;
  color: #8d6e63;
  letter-spacing: 2rpx;
  line-height: 1;
  transform: translateY(-4rpx);
}
.hosting-card__teacher {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #8d6e63;
  font-weight: 600;
}
.hosting-card__people {
  display: flex;
  align-items: center;
  margin-top: 28rpx;
}
.hosting-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: 3rpx solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
}
.hosting-card__count {
  margin-left: 16rpx;
  font-size: 24rpx;
  color: #8d6e63;
  font-weight: 600;
}
</style>
