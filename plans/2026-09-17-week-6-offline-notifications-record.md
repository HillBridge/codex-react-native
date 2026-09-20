# 第 6 周完成记录：离线数据、通知、开发构建与原生扩展

**实现日期：** 2026-09-17  
**自动化校验：** 前端 52 项通过；`pnpm quality` 通过；后端 9 项通过。

## 已完成

- [x] 新增 `expo-sqlite`，将最近一次成功获取的完整商品目录按用户写入本地数据库。
- [x] 网络请求失败时优先读取 SQLite 缓存，商品页显示“离线缓存”和最后更新时间；SQLite 不可用时改用当前会话的内存缓存，最后才使用既有 mock 数据。
- [x] 退出登录时只删除当前用户的商品缓存，不影响其他用户的缓存记录。
- [x] 新增 `expo-notifications` 本地商品提醒练习入口；仅在用户点击后请求通知权限。
- [x] 点击通知只允许跳转到 `rnmall://products/<slug>` 对应的商品详情；外部 URL、资料页和无效格式都会被忽略。
- [x] 已配置 `expo-sqlite`、`expo-notifications` config plugin；新增原生模块后必须重新编译 development build。

## 真机手工验收清单

### 离线缓存

- [ ] 先以可访问后端且 `EXPO_PUBLIC_USE_MOCK_DATA=false` 的配置打开“全部商品”，确认网络数据成功加载。
- [ ] 关闭后端或断开网络后重新进入“全部商品”，确认显示“离线缓存 · 更新于 …”。
- [ ] 在离线状态按分类和关键词筛选，确认缓存数据仍可筛选。
- [ ] 退出登录后，重新登录并保持离线，确认前一个用户的缓存不会显示。
- [ ] 模拟 SQLite 不可用时，确认当前会话仍可从内存回退，界面不会崩溃。

### 本地通知与路由

- [ ] 首次点击“发送商品提醒”，允许通知权限，确认收到“商品提醒练习”。
- [ ] App 在前台时点击通知，确认打开 Aero Desk Lamp 商品详情。
- [ ] App 在后台时点击通知，确认打开同一商品详情。
- [ ] 彻底关闭 App 后点击通知，确认冷启动后仍打开同一商品详情。
- [ ] 使用无效 `url` 通知数据验证，确认 App 不会跳转到外部网页或任意内部页面。
- [ ] 拒绝通知权限后再次点击，确认显示可理解提示且 App 其余功能正常。

## Expo Go 与 development build

| 能力                            | 可用环境                                                 | 本项目的验证方式               |
| ------------------------------- | -------------------------------------------------------- | ------------------------------ |
| SQLite 离线缓存                 | Expo Go、development build                               | 真机打开商品列表后断网复测     |
| 本地通知                        | Expo Go、development build                               | 资料页“发送商品提醒”           |
| Android 远程推送                | development build                                        | Expo Go Android 不支持远程推送 |
| Face ID / 指纹与当前原生修复    | development build                                        | 已安装的 iOS development build |
| 相机、照片库、文件、定位、触感  | Expo Go 可做基础练习；development build 做本项目完整回归 | 资料页各练习入口               |
| app.json 的通知/SQLite 原生配置 | development build                                        | 重新编译并安装 iOS/Android App |

## 重新编译说明

本周添加了原生模块和 config plugin。修改 JS 后可通过开发服务器热更新；但首次使用 SQLite 或通知、或修改 `app.json` 后，必须重新编译并安装 development build。iOS 使用当前的 `ios/codexreactnative.xcworkspace` 打开 Xcode 后运行即可；Android 需在安装 Android SDK 的环境中执行对应 development build。

## 发布前仍待执行

- [ ] iOS 真机：无网络、拒绝通知权限、冷启动与后台点击通知。
- [ ] Android 真机：通知渠道、权限拒绝、系统返回与离线缓存。
- [ ] 在有真实后端的设备网络下完成一次商品缓存写入与退出清理验证。
