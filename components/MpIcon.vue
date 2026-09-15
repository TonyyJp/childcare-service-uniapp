<template>
  <image
    class="mp-icon"
    :src="src"
    :style="boxStyle"
    mode="aspectFit"
  />
</template>

<script setup>
import { computed } from 'vue'
import { buildIconDataUri } from '../utils/icons.js'

const props = defineProps({
  name: { type: String, required: true },
  /** 展示边长（rpx） */
  size: { type: [Number, String], default: 40 },
  color: { type: String, default: '#5D4037' },
})

const px = computed(() => {
  const n = Number(props.size)
  return Number.isFinite(n) && n > 0 ? n : 40
})

const src = computed(() => buildIconDataUri(props.name, props.color, 24))

const boxStyle = computed(() => ({
  width: `${px.value}rpx`,
  height: `${px.value}rpx`,
  display: 'block',
  flexShrink: '0',
}))
</script>

<style scoped>
.mp-icon {
  vertical-align: middle;
}
</style>
