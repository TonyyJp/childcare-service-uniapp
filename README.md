# 小程序（uniapp）

Vue3 + uni-app，教师 / 家长 / 机构三角色。功能盘点见 [`docs/mp-feature-inventory.md`](../docs/mp-feature-inventory.md)。

## 本地联调

1. 启动后端（`http://127.0.0.1:8001`，见 [`backend/README.md`](../backend/README.md)）
2. 平台后台「系统设置 → 微信小程序」配置 AppID/Secret 并**启用**
3. 用 HBuilderX 打开本目录，确认 `manifest.json` → `mp-weixin.appid` 与后台一致，运行到微信开发者工具
4. 开发者工具勾选：**不校验合法域名、web-view、TLS 版本以及 HTTPS 证书**
5. 入口逻辑：未登录 → 选身份后微信手机号登录；已登录未绑定机构/学生 → 仅选身份（保留登录态）；已登录且已绑定 → 直达对应首页

API 根地址在 [`config.js`](./config.js) 的 `API_BASE_URL`。

## 目录（联调相关）

```
config.js          # API_BASE_URL、MP_APPID、微信配置拉取
api/mp.js          # 登录 / me / 角色切换
utils/request.js   # 统一请求与信封解析
pages/index        # 角色入口 + 微信登录
api/teacher.js     # 教师业务 API
api/parent.js      # 家长业务 API
```
