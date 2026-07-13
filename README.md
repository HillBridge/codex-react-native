# codex-react-native

基于 Expo 的 React Native TypeScript 项目骨架，采用 feature-sliced 的目录组织方式。

## 环境要求

- Node.js >= 20.19.4
- pnpm >= 11
- macOS 建议安装 Watchman，避免 Metro 出现 `EMFILE: too many open files, watch`

## 常用命令

```bash
pnpm install
pnpm start
pnpm android
pnpm ios
pnpm web
pnpm quality
```

## 环境变量

默认 dev 环境配置在 `.env.development`：

```bash
EXPO_PUBLIC_API_BASE_URL=https://ebanking-merchant-api-dev.transfersmile.com
```

业务接口路径由各 feature 自己维护，例如登录接口在 `src/features/auth/constants/authEndpoints.ts`。

## 目录约定

```text
app/
  只放 Expo Router 页面和布局，页面负责组装，不写业务逻辑。

src/features/
  核心业务功能模块。当前包含 auth、home 模块。

src/shared/
  跨功能共享的 package、hooks、utils、constants、routing、storage。

src/api/
  请求实例、拦截器、通用接口等基础设施。

src/store/
  仅放真正跨 feature 的全局状态。当前 auth 状态归属于 `src/features/auth/store`。
```

## 登录态设计

当前 auth 模块采用移动端常见的 access token + refresh token 方案：

- `accessToken`：只放在 auth feature 的 Zustand 内存状态中，App 进程结束后会丢失。
- `refreshToken`：通过 `expo-secure-store` 写入系统安全存储。
- App 启动：读取 `refreshToken`，调用 `AUTH_ENDPOINTS.refreshToken` 换取新的 `accessToken`。
- 登出：清理 Zustand 内存状态和 SecureStore 中的 `refreshToken`。

共享安全存储封装在 `src/shared/storage`。auth feature 内部按职责拆分：接口在 `src/features/auth/api`，常量在 `src/features/auth/constants`，状态在 `src/features/auth/store`，hooks 在 `src/features/auth/hooks`，组件在 `src/features/auth/components`，token 存取工具在 `src/features/auth/utils`。业务接口路径由各 feature 自己维护，例如 auth 接口在 `src/features/auth/constants/authEndpoints.ts`。

## 路由设计

- `app/` 只放 Expo Router 页面，页面只组合路由守卫和 feature screen。
- 路由路径常量和导航封装在 `src/shared/routing`。
- 登录页 `/` 使用 `GuestOnlyRoute`，已登录时自动跳转 `/home`。
- 首页 `/home` 使用 `ProtectedRoute`，未登录时自动跳回 `/`。

## 提交质量检查

项目已配置 ESLint、Prettier、lint-staged 和 Husky。

提交前会自动检查 staged 文件：

```bash
pnpm exec lint-staged
```

完整质量检查：

```bash
pnpm quality
```
