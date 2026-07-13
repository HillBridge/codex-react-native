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

业务接口路径由各 feature 自己维护，例如登录接口在 `src/features/auth/api/authEndpoints.ts`。

## 目录约定

```text
app/
  只放 Expo Router 页面和布局，页面负责组装，不写业务逻辑。

src/features/
  核心业务功能模块。当前包含 auth 登录模块。

src/shared/
  跨功能共享的 UI、hooks、utils、constants。

src/api/
  请求实例、拦截器、通用接口等基础设施。

src/store/
  Zustand 全局状态。
```

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
