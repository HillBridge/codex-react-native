# 第 3 周路由与会话状态记录

**关联计划：** `plans/2026-09-10-react-native-native-capabilities-training.md`

## 模块职责

| 模块               | 职责                                                                      |
| ------------------ | ------------------------------------------------------------------------- |
| `app/_layout.tsx`  | 启动认证恢复、配置 API 认证处理器，并提供 Expo Router 根导航。            |
| `useAuthBootstrap` | 冷启动读取 SecureStore 中的 refresh token；在应用回到前台时受控刷新会话。 |
| `ProtectedRoute`   | 等待会话恢复；未登录时前往登录页，并携带允许的登录后返回路由。            |
| `GuestOnlyRoute`   | 已登录用户访问登录页时，跳到预期的受保护页面。                            |
| `useSignOut`       | 无论登出接口结果如何，都移除本地 refresh token、清除会话并回到登录页。    |

## 路由结果

| 场景                        | 结果                                                |
| --------------------------- | --------------------------------------------------- |
| 冷启动且没有 refresh token  | 进入未登录状态；公开商品流可直接浏览。              |
| 冷启动且 refresh token 有效 | 恢复会话；登录页会跳到首页或指定的受保护页面。      |
| refresh token 失效          | 删除 SecureStore 中的 token；受保护页转到登录页。   |
| 退出登录                    | 删除 SecureStore 中的 token；转到 `/login`。        |
| 未登录访问 `/profile`       | 转到 `/login?next=/profile`；登录成功后回到资料页。 |
| 未登录打开商品详情          | 商品与详情是公开浏览内容，直接打开，不要求登录。    |

## 前后台与深链

- App 从 `background` 或 `inactive` 回到 `active` 时，只有已登录会话会刷新。
- 前台刷新正在进行时，重复的 AppState 事件会被忽略，避免并发 refresh token 请求。
- 自定义 Scheme 为 `rnmall`；development build 可使用 `rnmall://products/aero-desk-lamp` 直接打开公开商品详情。
- Expo Go 中应使用当前开发服务器提供的 `exp://.../--/products/aero-desk-lamp` 地址；自定义 Scheme 的稳定行为需要 development build。

## 手工验收清单

- [ ] 登录后完全关闭并重开 App，确认会话恢复。
- [ ] 将 App 切到后台再回前台，确认不会出现重复刷新或闪屏。
- [ ] 清除本地会话后访问资料页，登录成功后确认返回资料页。
- [ ] 在 development build 打开 `rnmall://products/aero-desk-lamp`，确认直接进入商品详情。
- [ ] 在飞行模式和接口 5xx 下测试登录、商品列表和详情：页面不崩溃，错误文案不包含服务端原始细节。
