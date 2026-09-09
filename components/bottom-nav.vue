<template>
  <view class="tab-bar" :style="{ borderTopColor: borderColor }">
    <view
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-item"
      :style="{ backgroundColor: active === tab.id ? accent + '18' : 'transparent' }"
      @click="$emit('change', tab.id)"
    >
      <text class="tab-icon">{{ tab.icon || tab.emoji }}</text>
      <text class="tab-label" :style="{ color: active === tab.id ? accent : '#BDBDBD' }">{{ tab.label }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  tabs: Array,
  active: String,
  accent: { type: String, default: '#FF7043' },
  borderColor: { type: String, default: '#F0E6DC' }
})
defineEmits(['change'])
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: white;
  border-top-width: 1rpx;
  border-top-style: solid;
  padding: 12rpx 0;
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom, 0px));
  flex-shrink: 0;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  transition: all 0.2s;
}

.tab-icon {
  font-size: 44rpx;
}

.tab-label {
  font-size: 22rpx;
  font-weight: 700;
}
</style>
