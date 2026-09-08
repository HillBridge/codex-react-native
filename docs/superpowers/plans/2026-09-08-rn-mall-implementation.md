# RN Mall 实施计划

> **供自动化执行者使用：** 必须使用 `superpowers:executing-plans` 逐项执行。每一步使用复选框追踪，并先完成测试失败、再写最小实现、最后验证通过。

**目标：** 在当前 Expo 项目中完成与 Nuxt 演示商城等价的移动端体验，并在 `backend/` 建立其专属、安全、可部署到 `https://api.rn-mall.com/mobile/v1` 的 API 服务。

**架构：** 后端使用 Node 内置 HTTP、Crypto 和测试运行器，不新增依赖；它负责演示用户、商品目录、签名 access token、轮换 refresh token、统一 API 响应与登录限流。React Native 保留现有 Expo Router、Axios、Zustand 与 SecureStore 体系，认证协议改为新移动 API，新增商品与账户 feature，通过受保护路由组合完整商城流程。

**技术栈：** Node.js 22 内置 `node:http`、`node:crypto`、`node:test`；Expo SDK 57、React Native 0.86、Expo Router、Axios、Zustand、expo-secure-store、TypeScript。

**设计依据：** `docs/superpowers/plans/2026-09-08-rn-mall-mobile-design.md`

## 全局约束

- 后端仅位于 `backend/`，不修改 Nuxt 项目、不复用或暴露其 BFF 服务签名。
- 生产入口为 `https://api.rn-mall.com/mobile/v1`，Node 服务默认只监听 `127.0.0.1:4000`。
- 不新增第三方依赖；后端测试必须使用 Node 内置测试运行器。
- access token 有效期 15 分钟，仅保存在 App 内存；refresh token 有效期 30 天，只存 SecureStore 的既有 key `auth.refreshToken`。
- 生产环境需要 `MOBILE_API_TOKEN_SECRET`，且不得记录密码、Authorization 或 refresh token。
- 成功响应为 `{ data, traceId }`；失败响应为 `{ code, message, traceId }`。
- 不修改 `.env*`、SecureStore key/介质、构建配置文件；认证迁移可修改 `src/shared/api` 的 token 刷新逻辑。
- 所有 Expo 代码保持 SDK 57、React Native 0.86 和 React 19.2 的兼容性。

---

## 文件结构

```text
backend/
  app.mjs                         路由匹配、HTTP 安全策略和请求协调
  server.mjs                      读取运行配置并启动 Node HTTP 服务
  config.mjs                      环境变量验证与默认值
  data/demo-data.mjs              Nuxt 演示用户及六件商品的独立快照
  lib/api-response.mjs            traceId、成功和错误响应
  lib/body.mjs                    16 KiB JSON 请求体解析
  lib/auth.mjs                    Bearer 解析、access token 签名和验签
  lib/sessions.mjs                refresh token 哈希、轮换和注销
  lib/rate-limit.mjs              登录来源限流
  test/api.test.mjs               真实 HTTP API 集成测试
  test/helpers.mjs                临时服务启动和请求辅助函数
  DEPLOYMENT.md                   api.rn-mall.com 的反向代理和运行说明

src/features/
  auth/                           邮箱密码登录、恢复、刷新、登出
  products/                       商品类型、API、卡片、列表和详情
  home/                           精选商品首页
  profile/                        账户资料页
app/
  index.tsx                       未登录入口
  home.tsx                        已登录首页
  products/index.tsx              商品流
  products/[slug].tsx             商品详情
  profile.tsx                     账户资料
```

### Task 1: 建立可测试的移动 API 服务外壳

**文件：**

- 创建：`backend/config.mjs`、`backend/lib/api-response.mjs`、`backend/app.mjs`、`backend/server.mjs`
- 创建：`backend/test/helpers.mjs`、`backend/test/api.test.mjs`
- 修改：`package.json`

**接口：**

- 产出 `createApp(config)`，其返回可传给 `http.createServer()` 的 `(request, response) => Promise<void>`。
- 产出 `loadConfig(env)`，返回 `{ host, port, nodeEnv, tokenSecret, trustProxy }`。
- 产出 `GET /health`：`200 { data: { ok: true, service: 'rn-mall-mobile-api' }, traceId }`。

- [x] **Step 1：先写失败的健康检查测试**

```js
test('GET /health returns the public health envelope', async () => {
  await usingServer(async (baseUrl) => {
    const response = await requestJson(baseUrl, '/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, { ok: true, service: 'rn-mall-mobile-api' });
    assert.match(response.body.traceId, /^[0-9a-f-]{36}$/i);
  });
});
```

- [x] **Step 2：运行测试并确认它因缺少 `backend/app.mjs` 而失败**

运行：`node --test backend/test/api.test.mjs`

预期：失败信息指向无法导入 `../app.mjs`。

- [x] **Step 3：实现最小 HTTP 外壳**

```js
export function createApp() {
  return async function app(request, response) {
    if (request.method === 'GET' && request.url === '/health') {
      return writeOk(response, { ok: true, service: 'rn-mall-mobile-api' });
    }
    return writeError(response, 404, 'NOT_FOUND', '接口不存在');
  };
}
```

`api-response.mjs` 为每个请求生成 `randomUUID()`、写入 `x-request-id`，并将 JSON 响应设置为 UTF-8 与 `no-store`。`package.json` 添加 `backend` 与 `test:backend` 脚本，分别执行 `node backend/server.mjs` 和 `node --test backend/test/*.test.mjs`。

- [x] **Step 4：运行测试与质量检查**

运行：`pnpm test:backend && pnpm run typecheck && pnpm run lint && pnpm run format:check`

预期：后端测试通过，现有 App 类型检查、Lint 与格式检查通过。

- [x] **Step 5：提交**

```bash
git add package.json backend
git commit -m "feat: add mobile api service shell"
```

### Task 2: 实现演示数据、令牌和内存会话

**文件：**

- 创建：`backend/data/demo-data.mjs`、`backend/lib/auth.mjs`、`backend/lib/sessions.mjs`
- 修改：`backend/config.mjs`、`backend/test/api.test.mjs`

**接口：**

- `getDemoUserByEmail(email)` 与 `toUserProfile(user)` 返回 Nuxt 相同的 `id`、`name`、`email`、`tier`、`points`、`preference`。
- `createSession(user)` 返回 `{ accessToken, refreshToken, user }`。
- `refreshSession(refreshToken)` 轮换 refresh token；`getSessionForAccessToken(token)` 验证 access token 和有效会话；`revokeSession(sessionId)` 删除会话。

- [ ] **Step 1：先写失败的令牌轮换测试**

```js
test('a refresh token can be used exactly once', async () => {
  const login = await loginAsDemoUser();
  const refreshed = await refresh(login.body.data.refreshToken);
  const reused = await refresh(login.body.data.refreshToken);

  assert.equal(refreshed.status, 200);
  assert.notEqual(refreshed.body.data.refreshToken, login.body.data.refreshToken);
  assert.equal(reused.status, 401);
  assert.equal(reused.body.code, 'UNAUTHORIZED');
});
```

- [ ] **Step 2：运行测试并确认 `POST /mobile/v1/auth/refresh` 尚未实现**

运行：`node --test --test-name-pattern='refresh token' backend/test/api.test.mjs`

预期：失败，状态码为 `404` 而不是预期的 `200`。

- [ ] **Step 3：实现最小且安全的会话模块**

access token 使用 base64url JSON payload 与 HMAC-SHA-256 签名，payload 固定为 `{ sub, sid, kind: 'access', exp }`。refresh token 由 `randomBytes(32).toString('base64url')` 创建；会话 Map 只用 `sha256(refreshToken)` 作为键。刷新操作必须先删除旧摘要，再创建替换会话 token。`nodeEnv === 'production'` 时，`loadConfig` 必须拒绝缺失或不足 32 字符的 `MOBILE_API_TOKEN_SECRET`。

- [ ] **Step 4：补齐会话行为并验证**

新增并运行以下断言：伪造 access token 返回 `401`；会话被注销后 access token 返回 `401`；用户资料不包含 password。运行：`pnpm test:backend`。

- [ ] **Step 5：提交**

```bash
git add backend
git commit -m "feat: add mobile api sessions"
```

### Task 3: 实现认证路由、请求限制和错误契约

**文件：**

- 创建：`backend/lib/body.mjs`、`backend/lib/rate-limit.mjs`
- 修改：`backend/app.mjs`、`backend/test/api.test.mjs`

**接口：**

- `POST /mobile/v1/auth/login`：接收 `{ email, password }`，成功返回令牌和用户资料。
- `POST /mobile/v1/auth/refresh`：接收 `{ refreshToken }`。
- `GET /mobile/v1/auth/me` 与 `POST /mobile/v1/auth/logout`：要求 `Authorization: Bearer <accessToken>`。
- `readJsonBody(request, 16 * 1024)`：非 JSON、无效 JSON、超大 body 均用 `BAD_REQUEST` 拒绝。

- [ ] **Step 1：先写失败的登录与注销测试**

```js
test('logout revokes the access token used to call it', async () => {
  const login = await loginAsDemoUser();
  const token = login.body.data.accessToken;
  const loggedOut = await requestJson(baseUrl, '/mobile/v1/auth/logout', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  });
  const profile = await requestJson(baseUrl, '/mobile/v1/auth/me', {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(loggedOut.status, 200);
  assert.deepEqual(loggedOut.body.data, { ok: true });
  assert.equal(profile.status, 401);
  assert.equal(profile.body.code, 'UNAUTHORIZED');
});
```

- [ ] **Step 2：运行测试并确认认证路由未实现**

运行：`node --test --test-name-pattern='logout revokes' backend/test/api.test.mjs`

预期：失败，`/mobile/v1/auth/logout` 返回 `404`。

- [ ] **Step 3：实现认证路由与防护**

登录只对完全匹配的演示凭证创建会话，其他凭证统一返回 `401 UNAUTHORIZED`。对每个来源地址保存 15 分钟滑动窗口，窗口内第 6 次登录返回 `429 RATE_LIMITED`。所有写接口设置 `Cache-Control: no-store`。在 `TRUST_PROXY=true` 前不得读取 `x-forwarded-for`；否则使用 socket remote address。日志只记录 method、path、status、traceId、duration 与错误码。

- [ ] **Step 4：验证所有认证分支**

增加并运行测试：空邮箱 `422 VALIDATION_ERROR`、错误凭证 `401`、第六次重复登录 `429`、无 Bearer token 的资料请求 `401`、错误 HTTP 方法 `405` 且具有 `Allow`。运行：`pnpm test:backend`。

- [ ] **Step 5：提交**

```bash
git add backend
git commit -m "feat: add mobile authentication routes"
```

### Task 4: 实现商品 API 与部署说明

**文件：**

- 修改：`backend/data/demo-data.mjs`、`backend/app.mjs`、`backend/test/api.test.mjs`
- 创建：`backend/DEPLOYMENT.md`

**接口：**

- `GET /mobile/v1/products?q=&category=&featured=` 返回 Nuxt `ProductSummary[]`。
- `GET /mobile/v1/products/:slug` 返回 Nuxt `ProductDetail`。
- `backend/DEPLOYMENT.md` 说明运行配置、systemd/容器的内网监听要求、`api.rn-mall.com` 的 HTTPS 反向代理路径。

- [ ] **Step 1：先写失败的商品筛选测试**

```js
test('product catalog applies featured, category, and text filters', async () => {
  const featured = await requestJson(baseUrl, '/mobile/v1/products?featured=true');
  const category = await requestJson(baseUrl, '/mobile/v1/products?category=%E6%95%B0%E7%A0%81');
  const search = await requestJson(baseUrl, '/mobile/v1/products?q=desk');

  assert.equal(featured.status, 200);
  assert.deepEqual(
    featured.body.data.map((item) => item.slug),
    ['aero-desk-lamp', 'terra-weekender-pack', 'pulse-mini-speaker'],
  );
  assert.deepEqual(
    category.body.data.map((item) => item.slug),
    ['pulse-mini-speaker', 'modular-cable-kit'],
  );
  assert.deepEqual(
    search.body.data.map((item) => item.slug),
    ['aero-desk-lamp', 'modular-cable-kit'],
  );
});
```

- [ ] **Step 2：运行测试并确认商品路由未实现**

运行：`node --test --test-name-pattern='product catalog applies' backend/test/api.test.mjs`

预期：失败，状态码为 `404`。

- [ ] **Step 3：实现商品数据与路由**

将 Nuxt 的六个商品以独立常量复制到 `demo-data.mjs`；列表端点始终映射为摘要字段，详情端点返回 `description`、`stock`、`highlights`。仅接受 `featured` 缺省、`true`、`false`；其他值返回 `422`。`slug` 未匹配时返回 `404 NOT_FOUND`。

`DEPLOYMENT.md` 必须列出：域名 A/AAAA 或 CNAME 配置责任、TLS 由反向代理管理、生产环境必须设置 `NODE_ENV=production` 和 `MOBILE_API_TOKEN_SECRET`、服务只绑定 loopback、代理只转发 `/health` 与 `/mobile/v1/`。

- [ ] **Step 4：验证商品和服务边界**

新增并运行：详情商品包含库存与卖点、不存在 slug 返回 `404`、`featured=maybe` 返回 `422`、未知路径返回统一 `404`。运行：`pnpm test:backend && pnpm run format:check`。

- [ ] **Step 5：提交**

```bash
git add backend
git commit -m "feat: add mobile catalog api"
```

### Task 5: 将 App 认证改为移动 API 契约

**文件：**

- 修改：`src/features/auth/constants/authEndpoints.ts`、`src/features/auth/api/authApi.ts`
- 修改：`src/features/auth/hooks/useLoginForm.ts`、`src/features/auth/hooks/useSignOut.ts`
- 修改：`src/features/auth/components/LoginScreen.tsx`
- 修改：`src/shared/api/authResponseHandler.ts`、`src/shared/api/client.ts`

**接口：**

- `login({ email, password })` 和 `refreshSession(refreshToken)` 返回 `{ session: { accessToken, user }, refreshToken }`。
- `logout()` 请求 `POST /mobile/v1/auth/logout`，无论远端注销是否因网络失败，均清理本地 refresh token 和 Zustand 会话。
- 任一非登录、非刷新请求收到 HTTP `401` 时，只刷新一次 token 后重试原请求；刷新失败则清理本地认证态。

- [ ] **Step 1：写出当前和目标认证请求的类型契约，再执行类型检查**

在 `authApi.ts` 中先定义：

```ts
type MobileApiSuccess<T> = { data: T; traceId: string };
type MobileAuthData = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    tier: string;
    points: number;
    preference: string;
  };
};
```

随后运行：`pnpm run typecheck`。

预期：在旧的手机号/MFA `LoginPayload`、现有表单和新目标类型之间出现类型不兼容，作为迁移前的失败信号。

- [ ] **Step 2：实现最小认证迁移**

认证路径固定为 `/mobile/v1/auth/login`、`/mobile/v1/auth/refresh`、`/mobile/v1/auth/logout`。登录请求只提交 `{ email, password }`，不再 base64 编码密码，不携带 MFA 或商户选择分支。表单初值使用演示邮箱和密码；仅校验邮箱非空/格式与密码非空。登录成功后仍按原方式写入 `authTokenStorage`，再设置 Zustand session 并跳转首页。

在 Axios 错误拦截器中将 `error.response` 交给认证响应处理器：当状态为 `401` 且请求尚未重试、也不是登录/刷新接口时，执行一次去重刷新并重放原请求；刷新失败时调用既有 `notifyUnauthorized`。保留对旧 API envelope token 过期码的兼容处理，避免该共享层失去既有行为。

- [ ] **Step 3：验证认证迁移**

运行：`pnpm run typecheck && pnpm run lint && pnpm run format:check`。

手动验证：本地 API 启动后，登录调用只含 email/password；App 冷启动用 SecureStore refresh token 恢复；退出请求抵达后端，且本地状态无论网络结果都被清除；受保护请求首次 `401` 后最多重试一次。

- [ ] **Step 4：提交**

```bash
git add src/features/auth src/shared/api
git commit -m "feat: connect app authentication to mobile api"
```

### Task 6: 实现首页、商品流、详情和账户资料

**文件：**

- 创建：`src/features/products/api/productsApi.ts`、`src/features/products/types.ts`
- 创建：`src/features/products/components/ProductCard.tsx`、`ProductListScreen.tsx`、`ProductDetailScreen.tsx`
- 创建：`src/features/home/components/HomeScreen.tsx`
- 创建：`src/features/profile/components/ProfileScreen.tsx`
- 创建：`app/products/index.tsx`、`app/products/[slug].tsx`、`app/profile.tsx`
- 修改：`app/home.tsx`、`src/shared/routing/routes.ts`、`src/shared/routing/useAppNavigation.ts`

**接口：**

- `getProducts(filter)` 读取 `/mobile/v1/products`；`getProduct(slug)` 读取 `/mobile/v1/products/:slug`。
- `ProductListScreen` 支持关键词、五个 Nuxt 分类及刷新/错误重试。
- `ProductDetailScreen` 展示商品图、分类、系列、价格、库存、描述、卖点；不存在商品展示可返回列表的错误态。
- `ProfileScreen` 展示 `name`、`email`、`tier`、`points`、`preference` 与退出按钮。

- [ ] **Step 1：先建立类型与路由消费点，并让类型检查失败**

```ts
export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  series: string;
  category: string;
  summary: string;
  price: number;
  featured: boolean;
  image: string;
};
```

让 `/products/[slug]` 调用尚未实现的 `getProduct(slug)`，然后运行 `pnpm run typecheck`。

预期：失败，指出 `productsApi` 缺失或未导出 `getProduct`。

- [ ] **Step 2：实现商品 API 与原生屏幕**

使用现有 `apiClient` 和 `Screen`、`AppButton`、`FormTextInput` 共享组件。首页调用 `getProducts({ featured: true })`；商品流在关键词变化后等待 250 ms 再请求，分类为“全部、家居、户外、数码、穿搭”；卡片进入详情；详情、列表、首页都要提供初次加载、空数据、错误和重试状态。使用 React Native `Image` 处理远程商品图，禁止引入图片或导航依赖。

`ProfileScreen` 使用 `ProtectedRoute`，退出调用 Task 5 的 `useSignOut`。所有新路由均要在 `APP_ROUTES` 中定义，避免散落字符串。

- [ ] **Step 3：执行项目质量检查与手动用户流程验证**

运行：`pnpm run typecheck && pnpm run lint && pnpm run format:check && pnpm test:backend`。

手动验证顺序：登录 → 首页显示三件精选商品 → 商品流按“数码”筛选 → 搜索 `desk` → 打开 `aero-desk-lamp` → 返回 → 查看资料 → 退出 → 尝试访问 `/profile` 自动回到登录。

- [ ] **Step 4：提交**

```bash
git add app src/features src/shared/routing
git commit -m "feat: add native mall experience"
```

### Task 7: 端到端运行与部署交接

**文件：**

- 修改：`README.md`
- 修改：`backend/DEPLOYMENT.md`

**接口：**

- README 描述 `pnpm backend`、`pnpm test:backend`、本地 API 地址和真机 HTTPS 限制，不回显任何真实环境变量值。
- 部署文档给出 `api.rn-mall.com` 的 Nginx 路径示例和上线前检查清单。

- [ ] **Step 1：先执行未配置生产密钥的启动检查**

运行：`NODE_ENV=production node backend/server.mjs`

预期：进程以非零状态退出，并说明必须设置 `MOBILE_API_TOKEN_SECRET`；输出中没有任何密钥内容。

- [ ] **Step 2：补齐运行与部署文档**

README 仅展示变量名、命令和占位符。Nginx 示例必须对 `/health`、`/mobile/v1/` 使用 `proxy_pass http://127.0.0.1:4000`，同时传递 `Host`、`X-Forwarded-For` 与 `X-Forwarded-Proto`，并拒绝其他路径。

- [ ] **Step 3：执行最终验证**

运行：`pnpm test:backend && pnpm run quality`。

在开发环境以临时的非生产密钥启动服务，执行：`curl -sS http://127.0.0.1:4000/health`，确认只返回健康 envelope。随后停止服务。

- [ ] **Step 4：提交**

```bash
git add README.md backend/DEPLOYMENT.md
git commit -m "docs: add mobile api deployment guide"
```

## 计划自检

- 设计文档中的独立 API、域名、令牌、会话、限流、数据、RN 页面和验证要求均有对应任务。
- 后端每项新增行为均先定义真实 HTTP 集成测试，再实现。
- 类型、函数名、接口路径和令牌字段在任务间一致：`createApp`、`login`、`refreshSession`、`getProducts`、`getProduct`，以及 `/mobile/v1/*`。
- 未包含购物车、支付、真实用户、数据库或新依赖；未要求输出或改写真实环境值。
