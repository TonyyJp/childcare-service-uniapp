<template>
  <view v-if="course" class="overlay-page" style="background:linear-gradient(135deg,#3B9EEB 0%,#3B9EEBBB 100%);">
    <view class="safe-nav-header" style="padding-left:40rpx;padding-bottom:40rpx;flex-shrink:0;">
      <view class="safe-nav-bar" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32rpx;padding-left:0 !important;">
        <view class="back-btn" @click="$emit('close')"><text class="back-icon">‹</text></view>
        <text style="color:white;font-size:28rpx;font-weight:700;">课程详情</text>
        <view style="width:64rpx;" />
      </view>
      <view style="display:flex;align-items:flex-end;gap:24rpx;">
        <view style="width:120rpx;height:120rpx;border-radius:36rpx;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
          <image v-if="course.coverUrl" :src="course.coverUrl" mode="aspectFill" style="width:100%;height:100%;" />
        </view>
        <view style="flex:1;padding-bottom:8rpx;">
          <text style="font-size:36rpx;font-weight:800;color:white;display:block;line-height:1.3;">{{ course.title }}</text>
          <text style="font-size:22rpx;color:rgba(255,255,255,0.8);display:block;margin-top:8rpx;">{{ course.teacher }} · {{ course.age }}</text>
          <view style="display:flex;gap:12rpx;margin-top:16rpx;flex-wrap:wrap;">
            <view class="pill" style="background:rgba(255,255,255,0.28);color:white;"><text style="font-size:20rpx;">{{ course.tag }}</text></view>
            <view class="pill" style="background:rgba(255,255,255,0.2);color:white;"><text style="font-size:20rpx;">共{{ course.sessions }}节</text></view>
            <view class="pill" style="background:rgba(255,255,255,0.3);color:white;"><text style="font-size:20rpx;font-weight:800;">{{ course.price }}</text></view>
          </view>
        </view>
      </view>
    </view>
    <view style="flex:1;background:white;border-radius:40rpx 40rpx 0 0;overflow:hidden;">
      <scroll-view scroll-y style="height:100%;">
        <view style="padding:32rpx 40rpx;">
          <view class="course-desc">
            <rich-text v-if="descNodes" :nodes="descNodes" />
          </view>

          <view v-if="course.need_materials" style="margin-top:28rpx;padding:24rpx;border-radius:24rpx;background:#F0F7FF;">
            <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:12rpx;">教学材料</text>
            <text style="font-size:24rpx;color:#4A3F38;white-space:pre-wrap;display:block;line-height:1.7;">{{ course.materials_list }}</text>
            <text style="font-size:24rpx;color:#8A7A70;display:block;margin-top:12rpx;">材料费：¥{{ course.materials_price || 0 }}</text>
            <text style="font-size:24rpx;color:#8A7A70;display:block;margin-top:8rpx;">购买方式：{{ course.materials_purchase_label || '—' }}</text>
          </view>

          <view v-if="(course.outlines || []).length" style="margin-top:28rpx;">
            <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;margin-bottom:16rpx;">课程大纲</text>
            <view
              v-for="(o, idx) in course.outlines"
              :key="o.id || idx"
              style="margin-bottom:16rpx;padding:20rpx;border-radius:20rpx;background:#F0F7FF;display:flex;gap:16rpx;"
            >
              <text style="font-size:24rpx;font-weight:700;color:#8A7A70;flex-shrink:0;">{{ idx + 1 }}.</text>
              <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;white-space:pre-wrap;flex:1;">{{ o.content }}</text>
            </view>
          </view>
          <view class="primary-btn" style="margin-top:32rpx;background:linear-gradient(135deg,#3B9EEB 0%,#3B9EEBCC 100%);" :style="{ opacity: busy ? 0.6 : 1 }" @click="consult">
            <text style="color:white;font-size:30rpx;font-weight:800;">立即咨询报名</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { createTicket } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'

const props = defineProps({ course: Object })
const emit = defineEmits(['close'])
const ctx = inject(PARENT_CTX_KEY)
const busy = ref(false)

/**
 * rich-text 不继承外层 CSS，需给 img 写内联样式才能限宽。
 * 去掉固定 width/height，统一 max-width:100%;height:auto。
 */
function constrainRichHtmlImages(html) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<img\b([^>]*)>/gi, (_m, attrs) => {
    let a = String(attrs)
      .replace(/\s(width|height)\s*=\s*(['"]?)[^'"\s>]+\2/gi, '')
      .replace(/\sstyle\s*=\s*(['"])(.*?)\1/gi, (_s, q, style) => {
        const cleaned = String(style)
          .replace(/(?:^|;)\s*width\s*:[^;]*/gi, '')
          .replace(/(?:^|;)\s*height\s*:[^;]*/gi, '')
          .replace(/;;+/g, ';')
          .replace(/^;|;$/g, '')
          .trim()
        return cleaned ? ` style=${q}${cleaned}${q}` : ''
      })
    const extra = 'max-width:100%;height:auto;display:block;'
    if (/\sstyle\s*=/i.test(a)) {
      a = a.replace(/\sstyle\s*=\s*(['"])(.*?)\1/i, (_s, q, style) => {
        const base = String(style).trim().replace(/;?\s*$/, '')
        return ` style=${q}${base ? `${base};` : ''}${extra}${q}`
      })
    } else {
      a += ` style="${extra}"`
    }
    return `<img${a}>`
  })
}

const descNodes = computed(() => constrainRichHtmlImages(props.course?.desc || ''))

async function consult() {
  const c = props.course
  if (!c || busy.value) return
  busy.value = true
  try {
    await createTicket({
      category: 'consult',
      title: `课程咨询：${c.title || '未命名课程'}`,
      content: `希望咨询报名「${c.title || ''}」（${c.teacher || '教师待定'} · ${c.age || ''} · ${c.price || ''}）。请机构老师回电联系。`,
      contact: ctx.parentPhone.value || undefined,
    })
    emit('close')
    uni.showToast({ title: '已提交咨询', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';

.course-desc {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  color: #2D1F18;
  line-height: 1.7;
  box-sizing: border-box;
}
</style>
