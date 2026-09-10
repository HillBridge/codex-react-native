# 第 1 周完成记录：布局、表单与基础交互

**完成日期：** 2026-09-10  
**关联计划：** `plans/2026-09-10-react-native-native-capabilities-training.md`

## 已完成

- [x] 登录页改为可滚动布局；键盘弹起时可滚动查看和操作表单。
- [x] 邮箱输入框支持邮箱键盘、自动填充、关闭自动纠错和“下一项”提交键。
- [x] 密码输入框支持密码遮蔽、自动填充和“完成”提交键。
- [x] 邮箱提交后会将焦点交给密码输入框；密码提交会调用既有登录处理函数。
- [x] 登录按钮补充无障碍标签、提示和加载/禁用状态。
- [x] 表单输入框支持转发 ref，并为输入错误提供可读的无障碍提示。
- [x] 商品卡片、分类筛选和导航入口补充按压反馈及无障碍标签。
- [x] 资料页内容增加最大宽度限制，避免大屏上内容过宽。
- [x] 提取登录表单校验函数，覆盖无效邮箱、空密码和有效输入三种自动化测试。
- [x] iPhone 17 Pro 模拟器成功加载更新后的登录页。

## 验证结果

| 检查项               | 结果                           |
| -------------------- | ------------------------------ |
| `pnpm test:frontend` | 3/3 通过                       |
| `pnpm quality`       | 通过：类型检查、Lint、格式检查 |
| `pnpm test:backend`  | 9/9 通过                       |

## 待手工验收

- [ ] 在模拟器中点击邮箱输入框，确认键盘“下一项”将焦点移动到密码框。
- [ ] 在模拟器中点击密码输入框，确认键盘“完成”会提交登录。
- [ ] 使用小屏 iPhone 模拟器补一张登录页截图；此前小屏 Simulator 在启动过程中自动关闭，未完成截图验证。
- [ ] 登录成功后打开商品页和资料页，目测确认卡片按压反馈与大屏宽度表现。

## 相关代码

- `src/features/auth/components/LoginScreen.tsx`
- `src/features/auth/hooks/loginFormValidation.ts`
- `src/features/auth/hooks/useLoginForm.ts`
- `src/shared/package/AppButton.tsx`
- `src/shared/package/FormTextInput.tsx`
- `src/shared/package/Screen.tsx`
- `src/features/products/components/ProductListScreen.tsx`
- `src/features/profile/components/ProfileScreen.tsx`
- `scripts/test/login-form-validation.test.mts`
