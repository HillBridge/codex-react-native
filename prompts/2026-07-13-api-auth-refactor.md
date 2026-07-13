# API/鉴权模块重构（2026-07-13）

## 原始需求

在此前"同步登录功能"的基础上，把鉴权 token 管理改造为更安全的方案，并把 api 相关代码从 `src/api/` 抽离到 `src/shared/api/`、`src/store/authStore.ts` 抽离到 `src/features/auth/store/`。

## 关键决策

- Access token 不再持久化（不用 zustand `persist`），只存内存；冷启动后靠 refresh token 换回，避免 access token 长期躺在设备存储里。
- Refresh token 通过 `expo-secure-store`（Keychain，`WHEN_UNLOCKED_THIS_DEVICE_ONLY`）持久化，替代原来 `persist` + AsyncStorage 的整体登录态存储方案；因此项目移除了 `@react-native-async-storage/async-storage` 依赖。
- Token 注入/刷新逻辑从单文件 `client.ts` 拆成 `apiAuth.ts`（getter/回调 + 刷新去重）/ `requestHeaders.ts`（请求头注入）/ `authResponseHandler.ts`（响应重试）三个协作文件，降低单文件复杂度。

## 三件套变更

- `CLAUDE.md`：架构区块更新为新目录结构；红线路径由 `src/api/client.ts`、`src/store/authStore.ts` 改为 `src/shared/api/` 拦截器文件簇、`src/features/auth/utils/authTokenStorage.ts`；移除已失效的 zustand persist 类型断言历史教训（persist 已被移除，该记录不再适用）。
- `docs/decisions/architecture.md`：重写两条红线的"为什么"说明以匹配新实现；技术选型背景改为描述"内存 access token + secure-store refresh token"方案；移除已解决的技术债记录。
- `prompts/`：本文件，存档本次重构的需求与决策。
