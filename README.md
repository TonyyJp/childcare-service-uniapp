# 小程序（uniapp）

Vue3 + uni-app，教师 / 家长 / 机构三角色。功能盘点见 [`docs/mp-feature-inventory.md`](../docs/mp-feature-inventory.md)。

## 本地联调

1. 启动后端（`http://127.0.0.1:8001`，见 [`backend/README.md`](../backend/README.md)）
2. 用 HBuilderX 打开本目录，确认 `manifest.json` → `vueVersion: 3`，运行到微信开发者工具
3. 开发者工具勾选：**不校验合法域名、web-view、TLS 版本以及 HTTPS 证书**
4. 入口页点「教师端 / 家长端」会走 `POST /api/v1/mp/login`（假登录 code 见 `config.js`）

| 角色 | 假登录 code | 说明 |
|---|---|---|
| 教师 | `demo-teacher` | 种子 openid，默认教师身份 |
| 家长 | `demo-parent` | 种子 openid，家长身份 |
| 机构 | — | 暂无 MP 身份 API，仍进演示页 |

API 根地址在 [`config.js`](./config.js) 的 `API_BASE_URL`。

## 目录（联调相关）

```
config.js          # API_BASE_URL、演示 code
api/mp.js          # 登录 / me / 角色切换
utils/request.js   # 统一请求与信封解析
utils/auth.js      # token / role 本地存储
pages/index/       # 入口：登录后分流
```

## 下一刀（P0）

- ✅ 教师首页 / 签到：`dashboard` + `attendance/today` + `checkin`
- ✅ 家长首页时间线：`students` + `home` + `attendance/daily`
- 下一项：教师/家长作业联调，或家长消息列表
