# RN Mall 移动商城设计

## 目标

在当前 React Native 项目中实现与 Nuxt Pilot 商城一致的用户流程：精选首页、可搜索的商品流、商品详情、邮箱密码登录，以及受保护的账户资料页。当前仓库的 `backend/` 目录将提供 App 专属的移动 API，公网地址为 `https://api.rn-mall.com/mobile/v1`。

首个版本是可独立运行的演示环境：使用与 Nuxt 项目相同的六件演示商品和一个演示用户；不接入真实身份系统、数据库、订单、购物车或支付服务。

## 不在本次范围内

- 不改动 Nuxt 应用、其 Koa 后端、Web BFF 或 Cookie 会话机制。
- 不向移动端泄露 Nuxt BFF 的服务凭证或 HMAC 签名密钥。
- 不实现持久购物车、收藏、结算、支付、注册、找回密码或商品后台管理。
- 不增加第三方运行时或测试依赖。

## 目标架构

```text
React Native App
  | HTTPS + Bearer access token
  v
https://api.rn-mall.com/mobile/v1
  | 反向代理终止 TLS，并在内网转发
  v
当前仓库 backend/ 下的 Node HTTP 服务
  | 内存演示会话与演示商品目录
  v
JSON 响应：{ data, traceId }

Nuxt Web -> Nuxt /api BFF -> Nuxt Koa backend
```

移动 API 与 Nuxt Web BFF 必须保持独立。Web 端采用 httpOnly Cookie、CSRF 防护和服务间 HMAC 鉴权；App 采用短期 Bearer access token 与安全保存的 refresh token。两套信任模型不可混用。

## 域名与部署边界

生产环境的移动端基础地址固定为 `https://api.rn-mall.com/mobile/v1`。

Node 服务只监听内网接口和端口，默认是 `127.0.0.1:4000`。反向代理或托管负载均衡器负责 `api.rn-mall.com` 的 DNS、TLS 证书、HTTPS 强制跳转，并仅把允许的路径转发给该服务；同时传递 `X-Forwarded-For` 和 `X-Forwarded-Proto`。

开发时服务可本机运行。真机不能通过自身的 `127.0.0.1` 访问开发机，因此须使用 HTTPS 隧道或局域网可达的开发地址。将 React Native 配置改为该移动 API 地址属于后续前端接入阶段；本次后端阶段不改动现有真实环境文件。

## 移动 API 契约

所有成功响应均为 `200`，格式如下：

```json
{ "data": {}, "traceId": "request-id" }
```

所有可预期失败均使用匹配的 HTTP 状态码，格式如下：

```json
{ "code": "UNAUTHORIZED", "message": "...", "traceId": "request-id" }
```

错误码限定为：`BAD_REQUEST`、`UNAUTHORIZED`、`FORBIDDEN`、`NOT_FOUND`、`VALIDATION_ERROR`、`RATE_LIMITED` 与 `INTERNAL_ERROR`。生产环境绝不返回内部错误详情。

### 健康检查

`GET /health` 返回 `{ data: { ok: true, service: "rn-mall-mobile-api" }, traceId }`。它只供基础设施探活，不暴露配置或用户数据。

### 认证

`POST /mobile/v1/auth/login`

请求：

```json
{ "email": "demo@example.com", "password": "nuxt-demo" }
```

成功时，`data` 包含 `accessToken`、`refreshToken` 和公开用户资料。无论邮箱是否存在，错误凭证均返回相同的 `401 UNAUTHORIZED`，避免泄露用户是否存在。

`POST /mobile/v1/auth/refresh`

请求：

```json
{ "refreshToken": "opaque-token" }
```

成功时返回新的 access token、替换后的 refresh token 和用户资料。refresh token 在刷新时轮换，旧 token 在返回响应前即失效。

`GET /mobile/v1/auth/me` 要求携带 `Authorization: Bearer <accessToken>`，返回公开用户资料。

`POST /mobile/v1/auth/logout` 也要求 Bearer token，返回 `{ ok: true }`，并立即注销对应的服务端会话及其 refresh token。此后该会话签发的 access token 也不能再使用。

### 商品

`GET /mobile/v1/products?q=&category=&featured=` 为公开接口。`q` 对商品名、系列、分类和摘要做不区分大小写的检索；`category` 精确筛选分类；`featured=true` 仅返回精选商品。非法的 `featured` 值返回 `422 VALIDATION_ERROR`。

`GET /mobile/v1/products/:slug` 为公开接口，返回商品详情；商品不存在时返回 `404 NOT_FOUND`。

商品摘要和详情字段必须与 Nuxt 契约完全一致。移动服务第一版保存一份带版本的 Nuxt 演示商品快照；仅当演示数据需要修改时，才需要将两个项目迁移至共享包或真实商品服务。

## 令牌与会话设计

access token 是使用 HMAC-SHA-256 签名的紧凑令牌，包含 `sub`、`sid`、`kind: "access"` 与过期时间，有效期为 15 分钟。签名密钥来自 `MOBILE_API_TOKEN_SECRET`；生产环境若没有足够长度的密钥，服务拒绝启动。

refresh token 是 32 字节的随机不透明值，有效期 30 天。服务端只保存其 SHA-256 摘要，以及关联的会话 ID、用户 ID 和过期时间。首个演示版本的会话存于内存，服务重启会清空会话并使用户重新登录；正式支持真实用户前，必须替换为持久化会话存储。

React Native App 的 access token 仅保留在 Zustand 内存中，refresh token 继续使用现有 SecureStore 封装保存。请求只发送 access token；App 绝不保存密码、服务端凭证或令牌签名密钥。

## 服务端安全措施

- 仅接受 JSON 请求体，解析后的最大请求体为 16 KiB。
- 若请求未提供合法的请求 ID，则生成 UUID；在响应头与响应体中返回 `traceId`。
- 设置基础安全响应头：`X-Content-Type-Options`、`Referrer-Policy`、认证响应的 `Cache-Control: no-store`，以及严格的权限策略。
- 以内存方式按来源 IP 限制登录：每 15 分钟最多 5 次。只有明确配置 `TRUST_PROXY=true` 时，才信任反向代理传入的地址头。
- 日志不得记录 Authorization、refresh token、密码，或包含令牌的响应体。
- 仅解析本文档列出的路径与方法。未知路径返回 `404 NOT_FOUND`；已知路径使用了不允许的方法时返回 `405` 和 `Allow`。
- 原生 App 不需要 CORS。浏览器来源默认拒绝；若未来显式支持 Expo Web，再以配置白名单开放，绝不使用 `*`。

## React Native App 设计

现有 Expo Router 项目继续保持 feature-oriented 的组织方式。

- `auth` 从当前无关的手机号/OAuth 协议改为移动 API 的邮箱密码协议，保留 access token 仅在内存、refresh token 使用 SecureStore 的既有生命周期。
- `products` 负责商品 API、类型、筛选查询状态、商品卡片、商品流页面与详情页。
- `home` 将 Nuxt 的精选商品首页内容适配为原生布局，并展示精选列表。
- `profile` 使用 Nuxt 同样的账户资料字段，并提供退出登录操作，受现有受保护路由约束。
- Expo Router 提供受保护应用区，包含首页、商品流、商品详情和资料页。原生导航替代 Nuxt 的页头、页脚及 SSR 路由机制。
- 所有商品数据都在客户端请求。Nuxt 的 SSR、SEO Meta 与服务端路由缓存没有 React Native 对应能力，不做迁移。

首版原生界面复刻 Nuxt 的信息架构和交互，不追求 Web CSS 像素级一致。商品仍使用 Unsplash 远程图片地址，并在原生侧处理加载和失败状态。

## 文件职责

后端代码全部位于 `backend/`，按 HTTP 路由、响应写入、请求校验、令牌/会话、限流、演示数据和测试拆分为单一职责模块。`package.json` 只增加运行与测试该 Node 原生服务的脚本，不增加依赖。

前端使用 `src/features/auth`、`src/features/products`、`src/features/home`、`src/features/profile` 和 `app/` 下轻量的 Expo Router 路由组合。共享 API 传输层仅在已授权的认证迁移范围内改动；现有 SecureStore key 与存储介质不变。

## 验收与验证

后端以 Node 内置测试运行器覆盖：成功/失败登录、登录限流、refresh token 轮换、退出后会话失效、认证资料读取、商品筛选、商品详情及不存在商品、错误响应契约，以及日志不泄露令牌。

React Native 阶段验证：冷启动恢复会话、access token 过期后的刷新与重试、退出登录、受保护路由重定向、精选商品加载、筛选、详情导航和失败重试状态；同时运行类型检查、Lint、格式检查及相关后端测试。真机验证使用有效 HTTPS 的 `api.rn-mall.com` 部署或隧道。

## 交付顺序

1. 建立并验证独立移动 API，补充 `api.rn-mall.com` 的部署配置说明。
2. 替换 App 当前无关的认证请求契约，同时保留 SecureStore 的 refresh token 处理方式。
3. 基于移动 API 实现商品流、详情、首页和资料 feature。
4. 验证原生导航、会话生命周期、API 错误处理及已部署的 HTTPS 地址。
