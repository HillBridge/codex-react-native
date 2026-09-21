# codex-react-native

基于 Expo 的 React Native TypeScript 项目骨架，采用 feature-sliced 的目录组织方式。

## 环境要求

- Node.js >= 20.19.4
- pnpm >= 11（直接安装，不通过 Corepack 管理）
- macOS 建议安装 Watchman，避免 Metro 出现 `EMFILE: too many open files, watch`

建议使用 Node 20 LTS。Node 23 可能触发 Expo CLI 端口扫描异常：

```text
ERR_SOCKET_BAD_PORT
```

首次使用请直接安装 pnpm，并关闭 Corepack 为 pnpm 提供的代理：

```bash
corepack disable pnpm
npm install --global pnpm@11
```

## 常用命令

```bash
pnpm install
pnpm start
pnpm android
pnpm ios
pnpm web
pnpm quality
pnpm backend
pnpm test:backend
```

## EAS 构建、更新与发布

项目已提供三套 EAS Build profile：`development`、`preview` 和 `production`。配置位于 [eas.json](eas.json)，对应命令位于 `package.json`。

首次使用 EAS 时，需要登录 Expo 账号并完成项目与 OTA 更新配置：

```bash
pnpm eas:configure
pnpm eas:updates:install
pnpm eas:updates:configure
```

`eas:updates:configure` 会为项目绑定 EAS Update，并写入更新所需的 Expo 配置。完成后需要至少构建并安装一次 Preview 或 Production 包，之后该包才能接收 OTA 更新。

### Development Build：开发与真机调试

Development Build 是带开发工具的项目专属客户端，用于加载本机 Metro 服务。它不提交到应用商店。

```bash
pnpm build:dev:ios
pnpm build:dev:android
pnpm start:dev-client
```

构建完成后，从 EAS 构建页面下载并安装到设备；再执行 `pnpm start:dev-client`，用已安装的 Development Build 打开项目。

### Preview Build：测试验收

Preview Build 是给测试、产品或内部人员使用的稳定安装包，不依赖开发电脑上的 Metro。

```bash
pnpm build:preview
```

Android 会生成可直接安装的 APK；iOS 使用内部 Ad Hoc 分发，或将 Production Build 上传 TestFlight 进行测试。

### EAS Update：JS 与资源热更新

当只修改 TypeScript/JavaScript、页面、样式、图片或字体，且不改变原生运行时能力时，不需要重新构建安装包：

```bash
pnpm update:preview --message "Fix login loading state"
pnpm update:production --message "Fix login loading state"
```

Preview 和 Production 分别使用独立 channel，避免测试更新误推给正式用户。已安装的兼容 App 会在启动时检查并下载更新，通常在下一次重新打开 App 后使用新版本。

### Production Build：商店版本

当准备发布新的原生版本时，先构建 Production 包：

```bash
pnpm build:production
```

需要上传 App Store Connect 或 Google Play 时再执行提交命令：

```bash
pnpm submit:ios
pnpm submit:android
```

`submit` 只会将安装包上传到商店后台，不代表已经正式上架。iOS 可先通过 TestFlight 测试，Android 可先使用 Google Play 内部测试或封闭测试，再由人工发起审核和正式发布。

### 何时 Build、Update 或 Submit

| 场景                                          | 应执行的操作                                             | 是否 Submit      |
| --------------------------------------------- | -------------------------------------------------------- | ---------------- |
| 开发页面、调试真机或原生能力                  | `pnpm build:dev:ios` 或 `pnpm build:dev:android`         | 否               |
| 功能完成，交给测试或产品验收                  | `pnpm build:preview`                                     | 否               |
| 仅修复 JS 逻辑、样式或资源                    | `pnpm update:preview` 或 `pnpm update:production`        | 否               |
| 新增原生 SDK、权限、原生配置，或升级 Expo SDK | 重新执行 `pnpm build:preview` 或 `pnpm build:production` | 仅发布商店时需要 |
| 发布新的商店版本                              | `pnpm build:production` 后执行对应 `pnpm submit:*`       | 是               |

以下改动不能通过 EAS Update 发布，必须重新 Build：新增或移除原生依赖、修改系统权限、修改图标或启动屏、修改原生配置、升级 Expo SDK / React Native、修改 `runtimeVersion`。

## 移动商城 API

移动端专属 API 位于 `backend/`。本地默认地址为 `http://127.0.0.1:4000`，生产域名为 `https://api.rn-mall.com/mobile/v1`。部署与反向代理要求见 [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md)。

生产部署可使用 `docker compose up -d --build` 启动 API 与自动 HTTPS 代理；密钥只保存在服务器的未提交 `.env` 中。

## 环境变量

默认 dev 环境配置在 `.env.development`：

```bash
EXPO_PUBLIC_API_BASE_URL=https://ebanking-merchant-api-dev.transfersmile.com
```

Sandbox 环境配置在 `.env.sandbox`，启动命令：

```bash
pnpm start:sandbox
pnpm ios:sandbox
pnpm android:sandbox
pnpm web:sandbox
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
