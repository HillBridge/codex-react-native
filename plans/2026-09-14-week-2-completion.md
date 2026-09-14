# 第 2 周完成记录：长列表、搜索、刷新与状态面

**完成日期：** 2026-09-14  
**关联计划：** `plans/2026-09-10-react-native-native-capabilities-training.md`

## 已完成

- [x] 商品流从 `ScrollView + map` 改为 `FlatList` 虚拟化渲染；使用商品 id 作为 `keyExtractor`，不使用数组下标。
- [x] 首次加载显示全屏加载状态；列表头部、空数据、底部错误和重试区域分别拆分为独立渲染组件。
- [x] 搜索输入采用 300ms 防抖；清空关键词会恢复完整商品流。
- [x] 加入请求版本门控：快速连续输入时，旧请求即使较晚返回也不能覆盖最后一次搜索结果。
- [x] 加入 `RefreshControl` 下拉刷新；刷新过程中保留既有商品，不显示整页 loading。
- [x] 商品列表具备成功、首次加载、空数据、失败重试和图片加载失败占位状态。
- [x] mock 商品扩展为 54 条，支持长列表滚动、搜索与分类练习。
- [x] 访客可直接浏览商品流和商品详情；登录入口迁移到 `/login`，账户资料仍要求已登录。
- [x] 商品接口不可连接时自动回退本地 mock 数据；列表、分类、搜索、刷新和商品详情均可继续练习。
- [x] 登录或刷新接口不可连接时，演示账号可使用本地会话登录和恢复；服务端已响应的密码/参数错误不会被回退掩盖。

## 验证结果

| 检查项               | 结果                           |
| -------------------- | ------------------------------ |
| `pnpm test:frontend` | 10/10 通过                     |
| `pnpm quality`       | 通过：类型检查、Lint、格式检查 |
| `pnpm test:backend`  | 9/9 通过                       |

## 待手工验收

- [ ] 在 iOS Simulator 或真机连续输入多个搜索词，确认只显示最后一次搜索结果。
- [ ] 下拉刷新一次，确认旧商品在刷新期间不会消失。
- [ ] 使用无匹配关键词或分类，确认显示空数据提示。
- [ ] 在 Android 设备上手工确认长列表滚动顺畅、返回行为正确。

## 相关代码

- `src/features/products/components/ProductListScreen.tsx`
- `src/features/products/productRequestGate.ts`
- `src/features/products/api/productsApi.ts`
- `src/features/products/productFallback.ts`
- `src/features/products/mockProducts.ts`
- `src/features/auth/api/authApi.ts`
- `src/features/auth/api/authFallback.ts`
- `src/features/auth/api/mockAuth.ts`
- `app/index.tsx`
- `app/login.tsx`
- `app/products/index.tsx`
- `app/products/[slug].tsx`
- `scripts/test/product-request-gate.test.mts`
- `scripts/test/product-api-fallback.test.mts`
- `scripts/test/auth-api-fallback.test.mts`
