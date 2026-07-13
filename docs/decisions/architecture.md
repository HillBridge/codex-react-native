# 架构决策记录

## 为什么 `src/shared/api/` 的 token 注入/刷新逻辑是红线

`apiClient`（`client.ts`）是全局唯一的 axios 实例，鉴权逻辑拆成了几个协作文件：

- `apiAuth.ts`：保存 `configureAccessTokenGetter` 注入的 getter、`configureApiAuthHandlers` 注入的 `refreshAccessToken`/`onUnauthorized` 回调，并对刷新请求做了去重（`refreshPromise`/`unauthorizedPromise` 单例化，避免并发 401 触发多次刷新）
- `requestHeaders.ts`：请求拦截器里把 getter 返回的 access token 塞进 Authorization header
- `authResponseHandler.ts`：响应拦截器里判断是否需要用刷新后的 token 重试原请求

这些 getter/回调目前由 `useConfigureAuthApiClient`（在 `app/_layout.tsx` 里挂载）连接到 `authStore` 和 `authTokenStorage`。改动这里的时序或实现方式，会影响应用内所有网络请求的鉴权，且问题通常要等到具体接口调用失败才会暴露，排查成本高。

## 为什么 `.env.development` / `.env.example` 的内容不该被回显或改写

`EXPO_PUBLIC_API_BASE_URL`、`EXPO_PUBLIC_MATERA_WEB_CLIENT_ID` 指向真实的金融业务后端配置。虽然是 dev 环境，但：

- `EXPO_PUBLIC_*` 变量会被打进客户端 bundle，本身就是"半公开"信息，没必要在对话记录里再明文重复一遍
- 误改地址会导致 app 静默连到错误的后端，且不会有编译期报错，只会在运行时才发现

## 为什么 `authTokenStorage.ts` 的存储 key / 存储介质不能随便改

`authStore.ts`（zustand）不再使用 `persist`：access token 只存在内存里，app 冷启动后会丢失。真正跨重启存活的是 refresh token，由 `authTokenStorage.ts` 通过 `secureStorage`（`expo-secure-store`，key 为 `auth.refreshToken`）持久化到系统 Keychain（`WHEN_UNLOCKED_THIS_DEVICE_ONLY`）。冷启动流程（`useAuthBootstrap`）靠这个 refresh token 换回新的 access token 来恢复登录态。如果改这个 key 名或换存储介质，已安装用户设备上现有的 refresh token 会读不到，等价于让所有在线用户被强制登出，需要用户明确评估后才能做。

## 技术选型背景

- **zustand（access token 仅存内存）+ expo-secure-store（refresh token 落盘）**：早期版本用 `persist` middleware 把整个登录态（含 access token）落到 AsyncStorage，后来改为安全存储方案：access token 只在内存里，减少设备存储被读取时的暴露面；refresh token 单独放进 Keychain-backed 的 secure store，冷启动时用它换取新 access token（见上一节）。因此项目已不再依赖 `@react-native-async-storage/async-storage`。
- **feature-based 目录结构**（`features/<name>/{api,components,constants,guards,hooks,store,utils}`）：目前只有 `auth` 一个 feature，但已经按此结构组织，后续新增业务模块应遵循同样的拆分（api 请求 / 业务逻辑与状态 / UI 展示 / 路由守卫等），避免大杂烩式的单文件实现。
- **无测试框架**：项目处于早期阶段，优先把功能和结构跑通，测试框架的引入决策留给后续，不在当前阶段强制要求。
