# React Native 原生能力系统练习计划

> **供执行者使用：** 每个练习以复选框追踪；先在 iOS Simulator 完成可重复的基础验证，再用对应真机能力验证。涉及原生依赖时，先确认 Expo Go 是否支持；不支持时使用 development build。

**目标：** 用六周时间，在现有商城项目中系统掌握 React Native 核心 UI、交互、列表、设备能力和原生扩展的开发与调试方式。

**架构：** 不另起练习项目；每周将一个可独立验收的能力加到当前商城 App。基础 UI 和数据状态先在模拟器完成，摄像头、定位、通知、生物识别等能力必须在真机补验。每个功能都要求具备加载、空数据、错误和权限拒绝状态。

**技术栈：** Expo SDK 57、React Native 0.86、React 19、Expo Router、TypeScript、Zustand、Axios、expo-secure-store。

**参考：** [React Native Components and APIs](https://reactnative.dev/docs/components-and-apis)；[Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)。

## 全局约束

- 保持 Expo SDK 57、React Native 0.86、React 19 的兼容性；安装 Expo 模块使用 `npx expo install <package>`。
- `Pressable` 是新增点击交互的默认选择；旧 `Touchable*` 仅用于维护已有代码。
- 安全区域使用既有 `react-native-safe-area-context`；不新增已废弃的 React Native 核心 `SafeAreaView`。
- 密码、access token、refresh token 和 Authorization 不得写入控制台日志、错误提示或测试快照。
- 每项网络功能都必须表现出加载、成功、空数据、请求失败和重试五种状态。
- 每周结束运行 `pnpm quality` 与 `pnpm test:backend`；界面功能同时验证 iOS，涉及 Android 差异时再在 Android 真机或模拟器验证。

---

## 能力地图

| 范围           | 要掌握的组件或 API                                                                             | 练习方式                               |
| -------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------- |
| 布局与显示     | `View`、`Text`、`Image`、`StyleSheet`、`StatusBar`、`Dimensions`                               | 登录、商品卡片、资料页                 |
| 输入与操作     | `Pressable`、`TextInput`、`Switch`、`Modal`、`Alert`、`KeyboardAvoidingView`                   | 表单校验、筛选、确认操作               |
| 滚动与性能     | `ScrollView`、`FlatList`、`SectionList`、`RefreshControl`、`ActivityIndicator`                 | 商品流、分类流、分页和刷新             |
| 应用与系统     | `Platform`、`AppState`、`Linking`、`BackHandler`、`PermissionsAndroid`                         | 前后台恢复、深链、Android 返回行为     |
| 动画与反馈     | `Animated`、`react-native-reanimated`、`expo-haptics`                                          | 商品卡片状态、提交反馈                 |
| 媒体与文件     | `expo-image-picker`、`expo-camera`、`expo-document-picker`、`expo-file-system`、`expo-sharing` | 头像选择、拍照、附件选择与分享         |
| 设备与安全     | `expo-location`、`expo-sensors`、`expo-local-authentication`、`expo-secure-store`              | 定位权限、生物识别解锁、会话保存       |
| 数据与系统集成 | `expo-sqlite`、`expo-notifications`、`expo-linking`、`expo-auth-session`、`expo-task-manager`  | 离线缓存、通知跳转、登录回调与后台任务 |

## 文件结构

```text
app/
  home.tsx                         已登录首页入口
  products/index.tsx               商品列表路由
  products/[slug].tsx              商品详情路由
  profile.tsx                      资料与设备能力入口
src/features/
  products/components/             列表、详情、筛选和加载状态练习
  profile/components/              头像、偏好、生物识别与设备设置练习
  auth/                            表单、会话和安全存储练习
src/shared/
  api/                             网络状态与错误契约
  lifecycle/                       前后台恢复练习
  routing/                         深链与路由练习
```

## 第 1 周：布局、文本、图片与表单

**交付物：** 登录页、资料页和商品卡片在小屏及大屏模拟器中不溢出；输入错误、键盘弹起和按钮禁用状态清晰可见。

- [x] 用 `View`、`Text`、`Image`、`StyleSheet` 审视 `LoginScreen`、`ProfileScreen`、商品卡片的间距、颜色和层级；登录与资料内容容器已限制最大宽度，登录屏可在小尺寸或键盘弹起时滚动。
- [ ] 为登录、资料和商品卡片补齐 320pt 宽与大屏截图；本次已在 iPhone 17 Pro 实际加载登录页，小屏 Simulator 在启动时自动关闭，待 Simulator 服务恢复后补验。
- [x] 将现有新增与关键可点击区域实现为 `Pressable`，加入按下态，并为商品、分类和导航操作提供 `accessibilityRole` 与可读标签。
- [x] 在登录表单实现邮箱键盘、密码遮蔽、自动填充、提交键和焦点链路；`Screen` 使用 `KeyboardAvoidingView`，登录页使用可滚动容器避免键盘遮挡。
- [x] 用自动化测试验证无效邮箱和空密码的错误文案；登录 hook 保持网络失败时的用户可读错误状态。
- [x] 运行 `pnpm test:frontend`、`pnpm quality`、`pnpm test:backend`；前端校验 3/3、后端回归 9/9 通过。
- [ ] 在 iPhone 模拟器手工完成一次登录和退出登录；手工检查邮箱输入后按“下一项”聚焦密码框、密码输入后按“完成”提交。当前自动化界面操作权限未授予，未代替用户发送演示密码。

## 第 2 周：长列表、搜索、刷新与状态面

**交付物：** 商品列表使用虚拟化列表，具备搜索、下拉刷新、加载、空数据、失败和重试状态。

- [ ] 在 `src/features/products/components/ProductListScreen.tsx` 使用 `FlatList` 呈现商品；为商品唯一标识提供 `keyExtractor`，不使用数组下标作为 key。
- [ ] 将列表头部、底部加载提示、空数据页和错误页分别作为可复用渲染函数；刷新期间保留已加载商品，首次加载才显示全屏 loading。
- [ ] 为搜索输入加入 300ms 防抖，并在清空搜索时恢复完整列表；连续快速输入时只采用最后一次请求结果。
- [ ] 给 `FlatList` 加入 `RefreshControl`，验证下拉刷新成功、请求失败后点击重试、分类没有商品三种状态。
- [ ] 在包含至少 50 条模拟商品的数据下滚动检查：无重复卡片、无闪烁、图片加载失败时有占位内容。
- [ ] 运行 `pnpm quality && pnpm test:backend`，并在 Android 设备上验证列表滚动和返回行为一次。

## 第 3 周：路由、登录状态、前后台与网络

**交付物：** 登录状态可恢复，受保护页面不能被未登录用户访问；App 回到前台时能安全刷新会话或提示重新登录。

- [ ] 梳理 `app/_layout.tsx`、`ProtectedRoute`、`GuestOnlyRoute` 和 `useAuthBootstrap` 的职责；记录“启动、已登录、token 失效、退出”四种路由结果。
- [ ] 为一次登录、冷启动恢复、refresh token 失效和退出登录分别做手工验收；确认退出后 SecureStore 中的会话数据被清除。
- [ ] 使用 `AppState` 或现有 `src/shared/lifecycle/useAppForeground.ts` 在从后台回到前台时触发一次受控的会话检查；避免短时间多次前后台切换并发刷新。
- [ ] 使用 `Linking` 为一个商品详情定义深链输入，例如 `rnmall://products/<slug>`；未登录打开时先进入登录，再返回目标商品。
- [ ] 在飞行模式和接口 5xx 时验证：页面不崩溃、不泄露服务端细节，并提供明确重试入口。
- [ ] 运行 `pnpm quality && pnpm test:backend`，记录 iOS 和 Android 的深链测试结果。

## 第 4 周：图片、相机、文件与权限

**交付物：** 用户可选择或拍摄头像；拒绝权限时仍可正常使用其余资料功能。

- [ ] 安装并配置 `expo-image-picker`；在资料页增加“更换头像”入口，支持相册选择与取消选择。
- [ ] 在真机验证首次授权、已授权、拒绝授权、在系统设置重新授权四种流程；拒绝时显示引导，不循环请求权限。
- [ ] 使用 `expo-image-manipulator` 将头像裁剪或压缩为统一尺寸，再将本地 URI 传给现有上传接口或本地 mock。
- [ ] 安装 `expo-document-picker` 与 `expo-file-system`，实现“选择订单附件”的本地练习页；展示文件名、大小与取消状态，但不记录文件内容。
- [ ] 使用 `expo-sharing` 分享一份生成或选择的测试文件；在不支持分享的环境显示不可用状态。
- [ ] 在真机完成上述流程；运行 `pnpm quality && pnpm test:backend`。

## 第 5 周：定位、触感、生物识别与平台差异

**交付物：** 用户能授权定位、启用生物识别解锁；失败或设备不支持时有明确降级路径。

- [ ] 安装 `expo-location`，实现“获取当前配送区域”的练习入口；仅在用户点击后请求定位，不在 App 启动时静默索取权限。
- [ ] 对定位关闭、权限拒绝、模拟器无位置、获取成功分别显示不同状态；不要在界面显示精确经纬度以外的无关调试信息。
- [ ] 安装 `expo-local-authentication`，将生物识别作为“重新打开 App 时解锁已保存会话”的可选设置，而不是取代服务端身份验证。
- [ ] 使用 `expo-haptics` 为登录成功、收藏成功、错误提示提供三种有区分的轻量触感反馈。
- [ ] 使用 `Platform`、`BackHandler`、`PermissionsAndroid` 处理 Android 返回和权限差异；iOS 分支不得包含 Android 专属调用。
- [ ] 在一台 iOS 真机和一台 Android 真机验证权限与生物识别；运行 `pnpm quality && pnpm test:backend`。

## 第 6 周：离线数据、通知、开发构建与原生扩展

**交付物：** App 可缓存最近商品，通知可跳转到目标页面，并明确知道何时必须从 Expo Go 切换到 development build。

- [ ] 安装 `expo-sqlite`，缓存最近成功加载的商品列表；离线时展示缓存来源和最后更新时间，联网后再刷新。
- [ ] 缓存读写失败时回退到内存数据并展示可理解提示；退出登录时删除仅属于该用户的缓存。
- [ ] 安装 `expo-notifications`，实现本地测试通知；点击通知后经 `expo-linking` 打开指定商品或订单页面。
- [ ] 为应用启动、前台收到通知、后台点击通知、通知无效路由四个流程写出手工验证清单。
- [ ] 列出本项目当前 Expo Go 可直接验证的模块与需要 development build 的模块；每新增原生依赖后使用 development build 完成一次启动验证。
- [ ] 完成一次发布前检查：`pnpm quality && pnpm test:backend`、iOS 真机、Android 真机、无网络、权限拒绝、冷启动与后台恢复。

## 完成标准

- [ ] 能独立解释何时使用 `ScrollView`，何时必须使用 `FlatList`。
- [ ] 能为任何设备权限提供“未请求、已授权、拒绝、系统不可用”四种界面状态。
- [ ] 能区分 Expo Go、iOS/Android Simulator、真机和 development build 各自适合验证什么。
- [ ] 每项涉及网络和设备能力的页面都有加载、空数据、错误、重试和权限拒绝的表现。
- [ ] 已在 iOS 与 Android 各完成至少一次真实设备测试。
