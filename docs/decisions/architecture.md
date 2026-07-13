# 架构决策记录

## 为什么 `src/api/client.ts` 的 token 注入逻辑是红线

`apiClient` 是全局唯一的 axios 实例，`configureAccessTokenGetter` 注入的 getter 决定了每个请求是否带 Authorization header。这个 getter 目前由 `useConfigureApiClient`（在 `app/_layout.tsx` 里挂载）连接到 `authStore`。改动这里的时序或实现方式，会影响应用内所有网络请求的鉴权，且问题通常要等到具体接口调用失败才会暴露，排查成本高。

## 为什么 `.env.development` / `.env.example` 的内容不该被回显或改写

`EXPO_PUBLIC_API_BASE_URL` 指向真实的金融业务后端（`ebanking-merchant-api-dev.transfersmile.com`）。虽然是 dev 环境，但：

- `EXPO_PUBLIC_*` 变量会被打进客户端 bundle，本身就是"半公开"信息，没必要在对话记录里再明文重复一遍
- 误改地址会导致 app 静默连到错误的后端，且不会有编译期报错，只会在运行时才发现

## 为什么 `authStore.ts` 的持久化 key / 存储介质不能随便改

`persist` middleware 用 `auth-session` 作为 AsyncStorage 的 key。如果改这个 key 名或换存储介质（比如换成 SecureStore），已安装的用户设备上现有的 session 数据会读不到，等价于让所有在线用户被强制登出，这是一个对线上用户有实际影响的变更，需要用户明确评估后才能做。

## 技术选型背景

- **zustand + persist**：项目选择 zustand 而不是 Redux/Context，是为了减少样板代码；`persist` middleware 用于把登录态落到 AsyncStorage，实现"重启 app 后免登录"。
- **feature-based 目录结构**（`features/<name>/{api,model,ui}`）：目前只有 `auth` 一个 feature，但已经按此结构组织，后续新增业务模块应遵循同样的三层拆分（api 请求 / model 业务逻辑与状态 / ui 展示组件），避免大杂烩式的单文件实现。
- **无测试框架**：项目处于早期阶段（3 次提交），优先把功能和结构跑通，测试框架的引入决策留给后续，不在当前阶段强制要求。

## 已知技术债

- `src/store/authStore.ts` 中 `create<AuthState>()(persist(...))` 与 zustand 5 的类型推断存在冲突，最终通过 `as any` 类型断言绕过（2026-07-13）。根因是 `persist` 返回的 `StateCreator` 携带 mutator 标记，与外层 `create<AuthState>()` 的签名不完全兼容。后续升级 zustand 版本时应重新检查是否有更干净的写法（例如显式声明 `StateCreator<AuthState, [], [['zustand/persist', AuthState]]>` 类型）。
