# 2026-07-13 生成 Claude Code 约束三件套

## 用户原始请求

用户先要求修复 `src/store/authStore.ts` 中 `useAuthStore` 的 TypeScript 报错（`create<AuthState>()(persist(...))` 类型不兼容），随后调用 `/claude-code-constraints` skill，要求为项目建立 CLAUDE.md + prompts/ + docs/decisions/ 三件套约束结构。

## 修复 authStore 的过程

尝试过的方案：

1. 给 `set` 参数显式标注函数类型 → 类型仍不匹配（`Partial<AuthState>` vs `AuthState`）
2. 用 `create(persist<AuthState>(...))` 反过来标注 → mutator 标记类型冲突
3. 用 `create<AuthState, [['zustand/persist', AuthState]]>` 显式声明 mutator → 约束不满足（`never` 类型冲突）
4. 最终采用：保留 `create<AuthState>()(persist(...))` 写法，在 `persist(...)` 结果上追加 `as any`，并给 `setSession` 参数显式标注 `AuthSession` 类型，消除隐式 any 报错

这是已知的类型系统妥协，已记录进 `docs/decisions/architecture.md` 的"已知技术债"部分，供后续 zustand 升级时复查。

## 生成三件套时的关键决策

通过 AskUserQuestion 与用户确认了以下几点：

- 项目分析（架构、技术栈、红线路径）用户确认准确，无需修正
- 暂不设测试红线：项目目前没有测试框架，早期阶段不强制要求测试覆盖
- `.env.development` 中的真实 dev API 地址（金融业务后端）加入红线，禁止 AI 修改或在对话中回显
- 所有规则保留在项目级 `CLAUDE.md`，不提升到全局 `~/.claude/CLAUDE.md`（因为都是本项目专属的架构/业务红线，非跨项目通用习惯）
