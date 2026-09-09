<template>
      <view style="flex:1;display:flex;flex-direction:column;height:100%;background:#F0F7FF;">
        <view class="safe-nav-header" style="background:white;padding-bottom:24rpx;border-bottom:1rpx solid #E3F2FD;flex-shrink:0;">
          <view style="display:flex;align-items:center;padding:0 40rpx;">
            <view style="width:64rpx;height:64rpx;border-radius:24rpx;background:#F0F7FF;display:flex;align-items:center;justify-content:center;margin-right:20rpx;" @click="goProfilePage('main')">
              <text style="font-size:40rpx;color:#2D1F18;line-height:1;">‹</text>
            </view>
            <view style="flex:1;">
              <text style="font-size:32rpx;font-weight:800;color:#2D1F18;display:block;">健康档案</text>
              <text style="font-size:22rpx;color:#8D6E63;">{{ activeChild.name || '请先绑定宝贝' }}</text>
            </view>
          </view>
        </view>
        <scroll-view scroll-y style="flex:1;height:0;">
          <view style="padding:24rpx 40rpx;">
            <view v-if="!activeChildId" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">请先绑定宝贝</text></view>
            <template v-else>
              <view class="card" style="padding:28rpx;margin-bottom:20rpx;display:flex;align-items:center;">
                <view style="width:100rpx;height:100rpx;border-radius:32rpx;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:52rpx;flex-shrink:0;margin-right:20rpx;">
                  <text>{{ activeChild.emoji }}</text>
                </view>
                <view style="flex:1;min-width:0;">
                  <text style="font-size:32rpx;font-weight:800;color:#2D1F18;display:block;">{{ healthArchive.name }}</text>
                  <text style="font-size:24rpx;color:#8D6E63;display:block;margin-top:8rpx;">{{ healthArchive.genderLabel }} · {{ healthArchive.birth_date || '生日未填' }}</text>
                </view>
              </view>
              <view class="card" style="overflow:hidden;margin-bottom:20rpx;">
                <view style="display:flex;justify-content:space-between;padding:24rpx;border-bottom:1rpx solid #F5F0EC;">
                  <text style="font-size:26rpx;color:#8D6E63;">学校</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;">{{ healthArchive.school || '—' }}</text>
                </view>
                <view style="display:flex;justify-content:space-between;padding:24rpx;">
                  <text style="font-size:26rpx;color:#8D6E63;">年级</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;">{{ healthArchive.grade_level || '—' }}</text>
                </view>
              </view>
              <view class="card" style="padding:24rpx;margin-bottom:20rpx;">
                <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">健康备注</text>
                <text style="font-size:28rpx;color:#2D1F18;line-height:1.7;display:block;">{{ healthArchive.health_note || '园所暂未登记过敏或特殊关注事项' }}</text>
              </view>
              <view class="card" style="overflow:hidden;margin-bottom:20rpx;">
                <view style="display:flex;justify-content:space-between;padding:24rpx;border-bottom:1rpx solid #F5F0EC;">
                  <text style="font-size:26rpx;color:#8D6E63;">紧急联系人</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;">{{ healthArchive.emergency_contact || '—' }}</text>
                </view>
                <view style="display:flex;justify-content:space-between;padding:24rpx;">
                  <text style="font-size:26rpx;color:#8D6E63;">紧急电话</text>
                  <text style="font-size:26rpx;font-weight:700;color:#2D1F18;">{{ healthArchive.emergency_phone || '—' }}</text>
                </view>
              </view>
              <view class="card" style="padding:24rpx;">
                <text style="font-size:24rpx;color:#8D6E63;line-height:1.7;display:block;">档案由园所维护，家长端只读。如需更正请联系班主任或机构。</text>
              </view>
            </template>
          </view>
        </scroll-view>
      </view>

</template>

<script setup>
import { inject } from 'vue'
import { PARENT_CTX_KEY } from './parentContext.js'
const ctx = inject(PARENT_CTX_KEY)
const { activeChild, activeChildId, healthArchive, goProfilePage } = ctx
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
