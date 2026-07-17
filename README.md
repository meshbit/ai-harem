# 🏯 AI后宫 (ai-harem)

AI 角色扮演聊天平台，804 个 AI 角色沉浸式对话体验。

> 在线地址：https://ai.okva.cc

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Go + net/http + SQLite (modernc) |
| 前端 | React 19 + Vite 8 |
| 部署 | Cloudflare Tunnel → okva.cc |
| 端口 | 8989 |

## 功能

- 🎭 **804 个 AI 角色** — 爬取自线上平台，含名称、头像、设定文案
- 🏠 **角色广场** — 搜索、分类标签、热门推荐横滚、6列网格
- 💬 **角色聊天** — 单角色对话页面，聊天气泡界面（mock 回复，待接 LLM）
- 🎨 **AI 绘图** — 文生图/图生图页面（框架就绪）
- 👤 **用户中心** — 签到转盘、充值套餐、推广返利、收藏消息
- 📱 **响应式** — 手机端汉堡菜单 + 自适应网格（6→5→4→3→2列）

## 快速启动

```bash
# 后端
cd server
go build -o aiharem .
./aiharem    # 首次运行自动导入 804 个角色

# 前端开发
cd web
npm install
npm run dev

# 生产构建
npm run build    # 输出到 web/dist/
```

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/portal/public/bootstrap` | 站点配置 |
| GET | `/api/portal/public/characters` | 角色列表 |
| GET | `/api/portal/public/characters/featured` | 热门推荐 |
| GET | `/api/portal/public/tags` | 标签列表 |
| GET | `/api/portal/public/comments/hot` | 热门评论 |
| POST | `/api/chat/` | 发送消息 |

## 设计系统

暗色渐变主题，dopa 设计令牌：

```css
--p-bg: #0e0f15;
--p-bg-card: rgba(255,255,255,0.035);
--p-text: #e7e7e2;
--dopa-grad: linear-gradient(135deg, #ff5c8a, #8b5cf6, #22d3ee);
```

## License

MIT
