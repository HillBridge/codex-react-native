# 跨平台质量提升实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Android 与 iOS 的可执行质量基线、验证机制和发布门禁，使每个新功能在开发、测试和上线前均能一致地评估跨平台风险。

**Architecture:** 将跨平台兼容性作为横向质量约束，而不是单独的收尾测试项。项目以一份版本化基线文档定义通用标准，以按功能维护的兼容性矩阵记录风险和验收证据，并由可自动验证的配置检查和人工真机验收共同组成发布门禁。

**Tech Stack:** Expo SDK 57、React Native 0.86、Expo Router、TypeScript、Node.js 内置测试运行器、ESLint、Prettier。

**Spec:** 本文档；实施前还必须查阅 Expo SDK 57 的对应官方版本文档，不得以其他 SDK 版本的配置或 API 为依据。

## Global Constraints

- 所有新增移动端能力必须同时说明 Android 与 iOS 的支持状态、降级行为和验证证据；未验证不得标记为完成。
- 代码、配置和原生能力必须保持 Expo SDK 57、React Native 0.86 与 React 19.2 兼容。
- 未经产品明确确认，不改变既有 `app.json` 中的产品策略：仅竖屏、当前浅色外观、iOS 支持平板、Android 预测返回手势关闭。
- 平台权限仅在实际需要功能时声明；每项权限必须有拒绝后的可理解提示和可继续使用的降级路径。
- 安全凭据、Token、真实环境变量和用户个人数据不得进入质量文档、测试夹具、日志或截图。
- 自动化检查用于发现静态配置与文档缺口；相机、通知、支付、登录回调、后台行为等系统能力必须在真机完成验收。
- 每次功能发布前运行 `pnpm quality`、相关前端测试、跨平台质量检查，并记录 Android/iOS 真机结果。

---

## 文件结构

```text
docs/
  quality/
    cross-platform-baseline.md       Android/iOS 共同质量标准、风险分级与验收规则
    compatibility-matrix.md         功能到平台差异、最低版本、降级方案和真机证据的登记表
    release-checklist.md             每次发布使用的简明准入清单
  decisions/
    architecture.md                  记录影响双端行为的架构决策及其迁移风险
scripts/
  verify-cross-platform-quality.mjs  校验质量文档结构和必须填写的字段
  test/
    verify-cross-platform-quality.test.mts  覆盖质量门禁脚本的可预测行为
app.json                             Expo 双端能力与权限的唯一配置来源
package.json                         增加可单独运行的质量门禁脚本
README.md                            指向质量基线与日常执行命令
```

## 质量模型与优先级

跨平台质量贯穿产品、设计、研发、测试、发布和运营。对当前商城类 App，它应占日常研发关注度的约 20%–30%；涉及支付、音视频、定位、蓝牙、持续后台任务或硬件接入时，提升至 30%–40% 以上，并在方案评审阶段先处理高风险项。

| 等级 | 触发条件                                             | 最低要求                                   | 是否阻断发布       |
| ---- | ---------------------------------------------------- | ------------------------------------------ | ------------------ |
| P0   | 登录、支付、核心浏览/下单、数据丢失、安全或无法启动  | Android 与 iOS 真机通过；无可接受降级      | 是                 |
| P1   | 权限、通知、深链、文件、相机、后台恢复、严重布局差异 | 双端真机通过，或产品书面确认平台差异与降级 | 是                 |
| P2   | 一般交互、视觉、性能、文案差异                       | 建立缺陷并确定修复版本                     | 否，除非影响主流程 |
| P3   | 仅个别机型或边缘场景的轻微差异                       | 记录复现条件与观察结果                     | 否                 |

### Task 1: 建立跨平台质量基线

**Files:**

- Create: `docs/quality/cross-platform-baseline.md`
- Create: `docs/quality/release-checklist.md`
- Modify: `README.md`

**Interfaces:**

- Consumes: `app.json` 的应用能力声明、`docs/decisions/architecture.md` 的现有架构红线。
- Produces: `docs/quality/cross-platform-baseline.md` 中的“必须验证”条目；`docs/quality/release-checklist.md` 中每项为 `- [ ]` 的可勾选发布清单。

- [ ] **Step 1: 写入质量基线范围与风险分级**

在 `cross-platform-baseline.md` 建立下列章节，逐项写明 Android 与 iOS 的共同目标、平台差异和验收证据要求：设备与安全区域、交互与返回、系统版本、权限与隐私、通知与后台、网络与存储、多媒体与硬件、深链与 WebView、第三方 SDK、性能稳定性、安全、发布审核。

- [ ] **Step 2: 定义每个新功能的必填验收记录**

在基线中固定以下模板；功能 PR、测试记录和发布记录必须按此填写：

```markdown
### <功能名称>

- 风险等级：P0 / P1 / P2 / P3
- Android：支持的最低系统、已测机型/系统、系统差异、降级方案、验证结果
- iOS：支持的最低系统、已测机型/系统、系统差异、降级方案、验证结果
- 权限与隐私：所需权限、拒绝后的行为、数据处理影响
- 失败恢复：弱网、断网、前后台切换、升级安装后的行为
- 结论：通过 / 有条件通过（附批准）/ 阻断
```

- [ ] **Step 3: 编写发布清单**

`release-checklist.md` 至少包含：安装与升级、首次启动、登录与登出、核心业务路径、系统返回、深链、权限拒绝、弱网/断网、前后台切换、深色/字体缩放（如功能支持）、崩溃与日志检查、商店元数据与隐私声明。P0/P1 项必须要求同时附 Android 和 iOS 的真机结论。

- [ ] **Step 4: 在项目入口说明日常使用方式**

在 `README.md` 的“提交质量检查”后增加“跨平台质量”小节，链接上述两份文档，并明确：需求评审时查基线、功能完成时填矩阵、发版前跑清单。

- [ ] **Step 5: 验证文档完整性并提交**

运行：`pnpm run format:check`

预期：新增 Markdown 均通过格式检查。提交内容只包括 `README.md` 与 `docs/quality/`。

### Task 2: 建立功能兼容性矩阵与设备覆盖策略

**Files:**

- Create: `docs/quality/compatibility-matrix.md`
- Modify: `docs/quality/cross-platform-baseline.md`

**Interfaces:**

- Consumes: Task 1 的风险等级和功能验收记录模板。
- Produces: 一张按功能维护的矩阵；每行可被发布清单直接引用，包含负责人、风险等级、双端结果和证据位置。

- [ ] **Step 1: 写入初始矩阵列**

创建下表并将现有功能 `应用启动与路由`、`邮箱密码登录`、`令牌刷新与登出`、`商品列表`、`商品详情`、`个人资料` 分别作为初始行：

```markdown
| 功能           | 风险 | Android 覆盖与结果 | iOS 覆盖与结果 | 权限/系统能力 | 降级与已知差异 | 证据链接 | 状态   |
| -------------- | ---- | ------------------ | -------------- | ------------- | -------------- | -------- | ------ |
| 应用启动与路由 | P0   | 待填               | 待填           | 无            | 待填           | 待填     | 未验证 |
```

- [ ] **Step 2: 固化最小设备覆盖原则**

在基线中规定每次 P0/P1 变更至少覆盖：一台较新 Android 真机、一台 Android 真机（不同厂商或较旧系统）、一台带刘海/灵动岛的 iPhone；涉及平板布局时增加 iPad；涉及 Android 大屏或折叠布局时增加对应真机或可信模拟器。记录具体型号和系统版本，不使用“已测安卓/已测 iOS”作为证据。

- [ ] **Step 3: 固化场景覆盖原则**

在矩阵说明中要求按风险选择场景：冷启动、前后台切换、系统权限首次询问/拒绝/再次授权、弱网和断网恢复、横竖屏策略、升级覆盖安装、深链/登录回调，以及必要的低电量或系统省电限制。

- [ ] **Step 4: 复核现有配置与矩阵假设**

读取 `app.json`，将现状记入基线：当前为仅竖屏、浅色模式、iOS 支持平板、Android 预测返回手势关闭。不得把这些现状误写为已完成的真机兼容结论；如要改变，必须在对应功能行创建 P1 验收项。

- [ ] **Step 5: 格式验证并提交**

运行：`pnpm run format:check`

预期：矩阵和基线格式检查通过，初始功能均有未验证状态，避免虚构测试结果。

### Task 3: 增加可自动执行的质量门禁

**Files:**

- Create: `scripts/verify-cross-platform-quality.mjs`
- Create: `scripts/test/verify-cross-platform-quality.test.mts`
- Modify: `package.json`

**Interfaces:**

- Consumes: `docs/quality/cross-platform-baseline.md`、`docs/quality/compatibility-matrix.md` 与 `docs/quality/release-checklist.md`。
- Produces: `pnpm run quality:platform`，退出码为 `0` 表示质量文档结构完整，非 `0` 表示缺少必填章节、矩阵列或发布清单项。

- [ ] **Step 1: 写失败测试，覆盖缺少必填章节的情况**

在 `scripts/test/verify-cross-platform-quality.test.mts` 中编写测试：传入没有“权限与隐私”章节的临时基线文本时，验证函数返回 `['缺少基线章节：权限与隐私']`；传入完整文本时返回空数组。测试使用 Node 内置 `node:test` 和 `node:assert/strict`，不新增测试依赖。

- [ ] **Step 2: 运行测试并确认失败**

运行：`node --experimental-default-type=module --experimental-strip-types --test scripts/test/verify-cross-platform-quality.test.mts`

预期：失败信息指出无法导入尚未创建的 `scripts/verify-cross-platform-quality.mjs`。

- [ ] **Step 3: 实现最小文档验证器**

导出 `validateBaseline(markdown)`、`validateMatrix(markdown)` 和 `validateReleaseChecklist(markdown)`。三者返回字符串错误数组；入口读取三个 `docs/quality/` 文件，逐条输出错误并在任一错误存在时设置 `process.exitCode = 1`。校验内容仅限固定章节、表头和必选清单项，不能猜测或伪造真机测试结果。

- [ ] **Step 4: 接入项目脚本并验证通过**

在 `package.json` 添加：

```json
"quality:platform": "node scripts/verify-cross-platform-quality.mjs"
```

运行：`pnpm run test:frontend && pnpm run quality:platform && pnpm quality`

预期：前端测试、质量门禁、类型检查、Lint 和格式检查全部通过。

- [ ] **Step 5: 提交**

提交内容只包括 `scripts/verify-cross-platform-quality.mjs`、其测试文件与 `package.json`。

### Task 4: 将平台差异纳入功能开发与发布流程

**Files:**

- Modify: `docs/quality/compatibility-matrix.md`
- Modify: `docs/quality/release-checklist.md`
- Modify: `docs/decisions/architecture.md`

**Interfaces:**

- Consumes: Task 1 的基线、Task 2 的矩阵、Task 3 的自动检查命令。
- Produces: 可复查的功能验收条目和架构决策记录；每项 P0/P1 风险都能追溯至双端证据或明确批准。

- [ ] **Step 1: 在需求评审时登记风险**

每个涉及权限、推送、深链、支付、文件、相机、定位、蓝牙、后台任务、WebView 或第三方 SDK 的功能，在编码前新增矩阵行并设为至少 P1；只含纯展示逻辑的功能由评审决定 P2 或 P3。

- [ ] **Step 2: 在开发完成时填写双端结果**

在同一矩阵行写入 Android/iOS 测试设备、系统版本、核心场景结果、权限拒绝结果、已知差异和降级方案；没有任何一端真实验证时保持“未验证”，不得以模拟器结果替代真机结论。

- [ ] **Step 3: 在影响系统行为时记录架构决策**

当改动 `app.json`、原生插件、权限、存储、安全、路由回调或后台策略时，在 `docs/decisions/architecture.md` 记录：变更原因、Android 影响、iOS 影响、迁移/回滚方案和验证范围。

- [ ] **Step 4: 执行发布门禁**

发布负责人依次运行 `pnpm run quality:platform`、`pnpm run test:frontend`、`pnpm quality`，再完成 `release-checklist.md`。任何 P0/P1 的未验证、阻断结论或无批准的“有条件通过”均停止发布。

- [ ] **Step 5: 回顾线上质量信号**

每次发布后观察 Android/iOS 分别的启动失败、崩溃、ANR、登录失败、核心路径转化和用户反馈。若任一平台显著恶化，为对应矩阵功能创建缺陷并更新基线或架构决策，避免只修复个案而不补齐规则。

## 自检结果

- 覆盖性：计划涵盖质量标准、设备与场景覆盖、可自动检查的门禁、发布流程和线上反馈闭环；与 Android/iOS 兼容性所涉及的产品、设计、开发、测试、发布和运营角色一致。
- 无占位项：所有任务均指定文件、输入输出、执行动作和可验证的预期结果；未把真机结果预先标记为已通过。
- 一致性：Task 1 定义基线，Task 2 用矩阵承接功能证据，Task 3 校验文档结构，Task 4 将三者接入日常研发与发布。

## 执行顺序

先完成 Task 1 与 Task 2，使团队立即拥有可填写的基线和矩阵；随后完成 Task 3 把结构要求接入自动检查；最后按 Task 4 将实际功能逐步补齐。现有功能先登记为“未验证”，按 P0 到 P3 的优先级补测，避免为了填表而虚构兼容性结果。
