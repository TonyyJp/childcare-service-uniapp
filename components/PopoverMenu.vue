<template>
  <view v-if="visible" class="popover-root" @touchmove.stop.prevent>
    <view class="popover-mask" @click="$emit('close')" />
    <view class="popover-panel" :style="panelStyle">
      <view
        v-for="(item, idx) in items"
        :key="item.key || item.label || idx"
        class="popover-item"
        :class="{
          'is-danger': item.danger,
          'is-last': idx === items.length - 1,
        }"
        hover-class="popover-item--hover"
        :hover-stay-time="80"
        @click.stop="onPick(item)"
      >
        <text class="popover-item__text">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  /** { label, key?, danger? }[] */
  items: { type: Array, default: () => [] },
  /** { top, left, right, bottom, width, height } 相对窗口 */
  anchor: { type: Object, default: null },
  /** 面板预估宽度 rpx→用 px 近似，默认 148px */
  widthPx: { type: Number, default: 148 },
})

const emit = defineEmits(['close', 'select'])

const panelStyle = computed(() => {
  const a = props.anchor
  const w = props.widthPx
  let top = 88
  let left = 24
  try {
    const sys = uni.getSystemInfoSync()
    const winW = Number(sys.windowWidth) || 375
    const winH = Number(sys.windowHeight) || 667
    if (a && typeof a.bottom === 'number') {
      top = Math.min(a.bottom + 4, winH - 8)
      // 右对齐触发点
      const preferLeft = (a.right != null ? a.right : a.left + a.width) - w
      left = Math.max(8, Math.min(preferLeft, winW - w - 8))
    }
  } catch (_) {
    /* keep defaults */
  }
  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${w}px`,
  }
})

function onPick(item) {
  emit('select', item)
  emit('close')
}
</script>

<style scoped>
.popover-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
}
.popover-mask {
  position: absolute;
  inset: 0;
  background: transparent;
}
.popover-panel {
  position: absolute;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 12rpx 40rpx rgba(45, 31, 24, 0.16), 0 2rpx 8rpx rgba(45, 31, 24, 0.06);
  overflow: hidden;
  padding: 8rpx 0;
}
.popover-item {
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid #f3eee9;
}
.popover-item.is-last {
  border-bottom: none;
}
.popover-item--hover {
  background: #faf7f4;
}
.popover-item__text {
  font-size: 28rpx;
  font-weight: 600;
  color: #2d1f18;
  line-height: 1.3;
}
.popover-item.is-danger .popover-item__text {
  color: #e53935;
}
</style>
