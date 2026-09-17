<script>
import { ensureWechatRuntime } from './utils/wechatRuntime.js'

export default {
  onLaunch() {
    ensureWechatRuntime().catch(() => {})
  },
  onShow() {},
  onHide() {}
}
</script>

<style>
page {
  font-family: -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif;
  background-color: #F5F7FA;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 16rpx rgba(31,41,55,0.06);
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
}

.scrollable {
  overflow-y: auto;
}

button {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  line-height: 1;
}

button::after {
  border: none;
}

/* 全局兜底：未使用 form-input 的原生框也避免 placeholder 被裁切 */
input {
  box-sizing: border-box;
  /* 微信小程序：上下 padding 易裁切 placeholder，统一改为左右内边距 */
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 72rpx;
  line-height: 1.4;
}

textarea {
  box-sizing: border-box;
  line-height: 1.5;
}
</style>
