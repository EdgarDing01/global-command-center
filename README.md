# 全球运营指挥中心

一套面向挂墙场景的全球业务实时指挥大屏 MVP。中央以可拖拽三维地球展示晨昏变化、城市灯光与跨境航线，两侧集中展示经营 KPI、区域下钻、库存周转、回款现金流和实时告警。

## 在线访问

- GitHub Pages：<https://EdgarDing01.github.io/global-command-center/>

> 当前页面使用隔离演示数据。接入生产环境前，需要替换数据接口并完成财务口径、权限和目标硬件验收。

## 功能

- 全球、亚太、华东、上海枢纽四级组织视图联动
- 年度营收、目标达成、毛利率、回款率和库存周转 KPI
- 可拖拽地球、自动巡航、晨昏变化、夜间城市灯光和航线弧光
- 区域达成率、业务结构、库存周转、营收趋势与现金流图表
- 告警详情、确认知悉、数量同步和非法输入拦截
- 实时连接与断线提示、全屏展示、1080p/4K 和窄屏适配
- 页面级 WebMCP `acknowledge_alert` 工具

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
git clone https://github.com/EdgarDing01/global-command-center.git
cd global-command-center
npm install
npm run dev
```

终端显示 `Local: http://localhost:3000/` 后，在浏览器打开：

<http://localhost:3000/>

停止本地服务时，在运行服务的终端按 `Control + C`。

如果 3000 端口已被占用，开发服务通常会给出新的地址，请以终端显示的 `Local` 地址为准。

## 构建检查

```bash
npm run build
```

构建成功后可确认生产代码能够正常编译。GitHub Pages 使用仓库内的 Actions 工作流自动完成静态构建与发布。

## 发布到 GitHub Pages

1. 将代码推送到 `main` 分支。
2. 打开 GitHub 仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 中将 **Source** 设为 **GitHub Actions**。
4. 打开 **Actions** 页面查看 `Deploy to GitHub Pages` 工作流。
5. 工作流完成后访问 `https://EdgarDing01.github.io/global-command-center/`。

此后每次推送到 `main` 分支都会自动重新部署。

## 项目结构

```text
app/dashboard.tsx        大屏交互、地球渲染和演示数据
app/page.tsx             静态页面入口
app/globals.css          大屏布局、主题及响应式样式
app/layout.tsx           页面语言与元数据
next.config.ts           GitHub Pages 路径和静态导出配置
.github/workflows/       GitHub Pages 自动部署工作流
```

## 数据接入说明

当前 MVP 的数据在 `app/page.tsx` 中定义。生产接入建议使用“快照 API + SSE 增量事件”模式，并保持 `snapshotVersion`、`asOf` 和事件游标，避免断线恢复后的数据重复或回退。完整指标口径与验收要求参见项目上级目录中的 PRD。

## 技术栈

- React 19
- Vinext / Vite
- TypeScript
- Canvas 2D 地球渲染
- Tailwind CSS
- GitHub Actions / GitHub Pages

## License

本项目使用 [MIT License](./LICENSE) 开源。
