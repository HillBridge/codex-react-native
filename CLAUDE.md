@AGENTS.md

# CLAUDE.md — AI 编码约束规范

## 项目架构

```
app/                          expo-router 路由入口
src/
  api/                        axios 实例 + token 注入（client.ts, useConfigureApiClient.ts）
  store/                      zustand 全局状态（authStore.ts，persist 到 AsyncStorage）
  features/<name>/            垂直切片：api/ model/ ui/
  shared/                      跨 feature 复用（ui/ constants/）
```

**技术栈**：Expo 54 + expo-router 6 + React Native 0.81 + React 19 + zustand 5 + axios，pnpm 管理。

---

## 红线规则（禁止行为）

> 各红线原因见 @docs/decisions/architecture.md

- 禁止修改 `src/api/client.ts` 中的 token 注入逻辑（interceptor），除非用户明确要求改动鉴权方式
- 禁止修改或输出 `.env.development`、`.env.example` 中的真实 API 地址内容；不要在对话中回显这些文件的完整内容
- 禁止修改 `src/store/authStore.ts` 的持久化 key（`auth-session`）或存储介质（AsyncStorage），会导致老用户登录态丢失
- 禁止引入新第三方依赖，除非用户明确同意
- 禁止修改 `.eslintrc.js`、`.prettierrc`、`tsconfig.json`、`babel.config.js`、`app.json` 等构建配置文件，除非用户明确要求

---

## 执行规范

**执行前**：列出涉及文件 + 方案 → 等用户确认再动手
**执行中**：只改直接相关代码；多方案时列选项让用户决策
**执行后**：列出修改文件清单 + 潜在副作用 + 需手动验证点

---

## 测试规范

- 项目目前没有测试框架（无 jest 等配置），不强制要求新代码写测试
- 若后续引入测试框架，需先与用户确认方案

---

## 编码规范

- 遵循 `.eslintrc.js`（继承 `expo` 规则集）与 `.prettierrc`（单引号、拖尾逗号、100 字符宽度）
- 错误必须处理，不允许空 catch
- feature 内部代码放在对应 `features/<name>/{api,model,ui}` 目录，不要绕过分层直接跨层引用

---

## 历史教训

<!-- 格式：- <日期> <发生了什么> → <新增规则> -->

- 2026-07-13 `src/store/authStore.ts` 中 `create<AuthState>()(persist(...))` 类型推断失败，最终用 `as any` 兜底解决 → 后续若升级 zustand 版本，优先检查该处类型是否可去除 `as any`
