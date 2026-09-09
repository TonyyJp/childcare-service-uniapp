<script>
export default {
  onLaunch() {},
  onShow() {},
  onHide() {}
}
</script>

<style>
page {
  font-family: -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif;
  background-color: #FFF8F2;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 16rpx rgba(45,31,24,0.06);
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
</style>
