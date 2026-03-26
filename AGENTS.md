# AGENTS.md

## 项目概览

- 本仓库是 `CLI Proxy API` 的前端管理界面，不是代理服务本体。
- 技术栈：`React 19`、`TypeScript`、`Vite 7`、`Zustand`、`react-router-dom v7`、`SCSS Modules`、`i18next`。
- 构建目标是单文件页面，产物为 `dist/index.html`，发布时会重命名为 `management.html`。
- 路由使用 `HashRouter`；不要无故改成 history 路由。

## 常用命令

- 安装依赖：`npm install`
- 本地开发：`npm run dev`
- 类型检查：`npm run type-check`
- 代码检查：`npm run lint`
- 构建：`npm run build`
- 本地预览：`npm run preview`
- 格式化：`npm run format`

## 目录约定

- `src/pages`：页面级路由组件；通常一个页面对应一个 `Page.tsx`，复杂页面可搭配 `*.module.scss` 或 layout 页面。
- `src/components`：复用 UI 和业务组件；优先复用现有组件而不是重复造轮子。
- `src/services/api`：所有后端 Management API 调用统一放这里；新增接口优先加到这一层。
- `src/stores`：`Zustand` 全局状态；跨页面状态、登录态、缓存态优先放这里。
- `src/hooks`：可复用逻辑；保持职责单一。
- `src/types`：共享类型定义；新增接口字段时优先补这里。
- `src/utils`：纯函数、格式化、校验、连接串处理等工具。
- `src/i18n/locales`：国际化文案；新增或修改用户可见文本时，同时更新 `zh-CN.json`、`en.json`、`ru.json`。
- `src/styles`：全局样式、变量、混入；页面局部样式优先继续用 `module.scss`。

## 开发约定

- 优先遵循现有模式，小步修改，避免大规模重构。
- 导入优先使用路径别名 `@/`。
- 保持 TypeScript 严格类型；除非已有相邻模式，否则不要引入 `any`。
- 页面组件负责组合视图与交互，网络请求和数据转换尽量下沉到 `services`、`stores`、`hooks`。
- 不要在组件里散落重复的请求逻辑；复用现有 `apiClient`、store action 和工具函数。
- 登录态、管理密钥、持久化存储相关逻辑优先复用 `src/stores/useAuthStore.ts` 和 `src/services/storage/secureStorage.ts`，不要直接新增明文存储方案。
- API 地址处理优先复用 `src/utils/connection.ts` 中的归一化逻辑，避免手写重复解析。
- 新增页面时，保持与 `src/router/MainRoutes.tsx` 的组织方式一致；如为二级编辑流程，优先沿用现有 layout + children 路由模式。
- 新增样式时，优先复用现有变量、mixins 和主题体系，不要引入与单文件构建冲突的外部运行时样式依赖。
- 构建产物是单 HTML；避免引入依赖外部静态资源路径的实现，除非确认会被内联或已有先例。

## 修改建议

- 修改 API 相关功能时，通常需要同步检查：`src/types`、`src/services/api`、相关 `store`、对应页面。
- 修改用户可见功能时，通常需要同步检查：路由入口、页面文案、多语言、通知提示、空态/错误态。
- 修改配置编辑、模型映射、配额、OAuth 等模块时，先搜索相邻页面和已有工具函数，优先在既有抽象上扩展。
- 如果新增表单字段，注意保存流程、回填逻辑、默认值、校验和后端字段命名保持一致。

## 验证要求

- 变更完成后，至少优先运行与改动最相关的检查。
- 常规前端改动建议运行：`npm run type-check` 和 `npm run lint`。
- 涉及构建、入口、路由、样式打包、版本注入或单文件输出时，再补跑 `npm run build`。
- 当前仓库未见单元测试体系；不要额外引入测试框架，除非用户明确要求。

## 提交前注意事项

- 不要提交 `dist` 或其他构建产物，除非用户明确要求。
- 不要修改无关文件或顺手修 unrelated 问题。
- 如果改动影响文档、命令或使用方式，同步更新 `README.md` 和 `README_CN.md`。
