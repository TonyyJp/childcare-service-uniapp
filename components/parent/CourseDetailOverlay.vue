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
          <MpIcon v-else name="book-open" :size="48" color="rgba(255,255,255,0.9)" />
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
          <view v-if="descNodes" class="detail-sec">
            <view class="sec-head">
              <view class="sec-bar" />
              <text class="sec-text">课程介绍</text>
            </view>
            <view class="course-desc">
              <rich-text :nodes="descNodes" />
            </view>
          </view>

          <view v-if="course.need_materials" class="detail-sec">
            <view class="sec-head">
              <view class="sec-bar" />
              <text class="sec-text">教学材料</text>
            </view>
            <view style="padding:24rpx;border-radius:24rpx;background:#F5F7FA;">
              <text style="font-size:26rpx;color:#374151;white-space:pre-wrap;display:block;line-height:1.7;">{{ course.materials_list }}</text>
              <view style="display:flex;gap:16rpx;margin-top:20rpx;">
                <view style="flex:1;background:white;border-radius:16rpx;padding:16rpx 20rpx;">
                  <text style="font-size:20rpx;color:#9CA3AF;display:block;">材料费</text>
                  <text style="font-size:28rpx;font-weight:800;color:#3B9EEB;display:block;margin-top:4rpx;">¥{{ course.materials_price || 0 }}</text>
                </view>
                <view style="flex:1;background:white;border-radius:16rpx;padding:16rpx 20rpx;">
                  <text style="font-size:20rpx;color:#9CA3AF;display:block;">购买方式</text>
                  <text style="font-size:24rpx;font-weight:700;color:#1F2937;display:block;margin-top:4rpx;">{{ course.materials_purchase_label || '—' }}</text>
                </view>
              </view>
            </view>
          </view>

          <view v-if="(course.outlines || []).length" class="detail-sec">
            <view class="sec-head">
              <view class="sec-bar" />
              <text class="sec-text">课程大纲</text>
              <text class="sec-count">{{ course.outlines.length }}节</text>
            </view>
            <view
              v-for="(o, idx) in course.outlines"
              :key="o.id || idx"
              style="margin-bottom:16rpx;padding:20rpx 24rpx;border-radius:20rpx;background:#F5F7FA;display:flex;gap:20rpx;align-items:flex-start;"
            >
              <view class="num-badge">{{ idx + 1 }}</view>
              <text style="font-size:26rpx;color:#1F2937;line-height:1.7;white-space:pre-wrap;flex:1;padding-top:4rpx;">{{ o.content }}</text>
            </view>
          </view>

          <view v-if="showTrialApply" class="primary-btn" hover-class="btn-press" style="margin-top:32rpx;background:#EAF4FD;border:2rpx solid #3B9EEB;" :style="{ opacity: busy ? 0.6 : 1 }" @click="openTrialApply">
            <text style="color:#3B9EEB;font-size:30rpx;font-weight:800;">申请试课</text>
          </view>
          <view class="primary-btn" hover-class="btn-press" :style="{ marginTop: showTrialApply ? '20rpx' : '32rpx', background: 'linear-gradient(135deg,#3B9EEB 0%,#2F8FD8 100%)', opacity: busy ? 0.6 : 1 }" @click="consult">
            <text style="color:white;font-size:30rpx;font-weight:800;">立即咨询报名</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="showApplySheet" class="overlay" style="z-index:80;" @click="showApplySheet = false">
    <view class="sheet" @click.stop>
      <view class="sheet-handle" />
      <text class="sheet-title">申请试课</text>
      <text style="font-size:24rpx;color:#6B7280;display:block;margin-bottom:20rpx;">
        {{ course?.title || '兴趣课' }} · 课次由机构确认后通知
      </text>
      <view style="background:#F5F7FA;border-radius:24rpx;padding:24rpx 24rpx 8rpx;margin-bottom:20rpx;">
        <view style="margin-bottom:20rpx;">
          <text style="font-size:24rpx;font-weight:700;color:#6B7280;display:block;margin-bottom:8rpx;">试课宝贝</text>
          <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
            <view
              v-for="c in childOptions"
              :key="c.id"
              class="pill"
              style="padding:12rpx 20rpx;"
              :style="{ backgroundColor: applyForm.studentId === c.id ? '#3B9EEB18' : '#F5F7FA', color: applyForm.studentId === c.id ? '#3B9EEB' : '#6B7280' }"
              @click="applyForm.studentId = c.id"
            >
              <text style="font-size:22rpx;">{{ c.name }}</text>
            </view>
          </view>
          <text v-if="!childOptions.length" style="font-size:22rpx;color:#E53935;">请先绑定宝贝</text>
        </view>
        <view style="margin-bottom:20rpx;">
          <text style="font-size:24rpx;font-weight:700;color:#6B7280;display:block;margin-bottom:8rpx;">备注（可选）</text>
          <textarea
            class="form-input"
            style="height:140rpx;"
            :value="applyForm.remark"
            placeholder="过敏、方便时段等"
            @input="e => applyForm.remark = e.detail.value"
          />
        </view>
      </view>
      <view class="primary-btn" style="background:linear-gradient(135deg,#3B9EEB 0%,#2F8FD8 100%);" :style="{ opacity: busy ? 0.6 : 1 }" @click="submitTrialApply">
        <text style="color:white;font-size:30rpx;font-weight:800;">{{ busy ? '提交中…' : '提交申请' }}</text>
      </view>
    </view>
    </view>
  </view>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { createTicket, createTrialBooking } from '../../api/parent.js'
import { PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'

const props = defineProps({ course: Object })
const emit = defineEmits(['close'])
const ctx = inject(PARENT_CTX_KEY)
const busy = ref(false)
const showApplySheet = ref(false)
const applyForm = ref({ studentId: null, remark: '' })

const childOptions = computed(() => ctx.childOptions.value || [])
const showTrialApply = computed(() => {
  const c = props.course
  return !!(c && c.trial_apply_enabled && c.trial_class_id)
})

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

function openTrialApply() {
  if (!showTrialApply.value || busy.value) return
  if (!childOptions.value.length) {
    uni.showToast({ title: '请先绑定宝贝', icon: 'none' })
    return
  }
  applyForm.value = {
    studentId: ctx.activeChildId.value || childOptions.value[0]?.id || null,
    remark: '',
  }
  showApplySheet.value = true
}

async function submitTrialApply() {
  const c = props.course
  if (!c || busy.value) return
  const studentId = applyForm.value.studentId
  if (!studentId) {
    uni.showToast({ title: '请选择宝贝', icon: 'none' })
    return
  }
  busy.value = true
  try {
    await createTrialBooking({
      student_id: studentId,
      class_id: c.trial_class_id,
      remark: (applyForm.value.remark || '').trim() || undefined,
      contact_name: ctx.parentName.value || undefined,
      contact_phone: ctx.parentPhone.value || undefined,
    })
    showApplySheet.value = false
    uni.showToast({ title: '已提交试课申请', icon: 'success' })
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
  font-size: 26rpx;
  color: #1F2937;
  line-height: 1.7;
  box-sizing: border-box;
}

.detail-sec {
  margin-bottom: 32rpx;
}
.detail-sec:last-child {
  margin-bottom: 0;
}

.sec-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.sec-bar {
  width: 8rpx;
  height: 30rpx;
  border-radius: 6rpx;
  background: linear-gradient(180deg, #3B9EEB, #2F8FD8);
  flex-shrink: 0;
}
.sec-text {
  font-size: 28rpx;
  font-weight: 800;
  color: #1F2937;
}
.sec-count {
  font-size: 22rpx;
  color: #9CA3AF;
  font-weight: 700;
}

.num-badge {
  width: 44rpx;
  height: 44rpx;
  border-radius: 14rpx;
  background: #3B9EEB18;
  color: #3B9EEB;
  font-size: 24rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-press {
  opacity: 0.85 !important;
  transform: scale(0.98);
}
</style>
