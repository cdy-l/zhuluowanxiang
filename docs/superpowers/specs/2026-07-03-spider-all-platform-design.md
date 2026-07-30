# 蛛罗万象—全场景可视化爬虫集成平台 设计文档

## 1. 概述

**蛛罗万象**是一个全场景可视化的爬虫集成平台，旨在将各种 Python 爬虫功能统一整合到一套美观的 Web 界面中。V1 阶段实现 VIP 视频破解功能，后续可扩展小说爬取等其他爬虫模块。

## 2. 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 后端框架 | FastAPI | 异步性能好，自动 OpenAPI 文档，Python 生态 |
| 前端 | 纯 HTML/CSS/JS | 零构建步骤，直接运行，适合桌面使用场景 |
| 通信 | REST API (Fetch) | 简单可靠，无需额外依赖 |
| 视频解析 | jx.xmflv.cc 第三方服务 | 复用现有 VIP视频破解程序.py 的方案 |

## 3. 项目结构

```
code/
├── backend/
│   ├── main.py              # FastAPI 入口，CORS 配置，路由注册
│   ├── requirements.txt     # fastapi, uvicorn
│   └── crawlers/            # 爬虫插件目录
│       ├── __init__.py
│       ├── base.py          # 爬虫基类（定义统一接口）
│       └── vip_video.py     # VIP视频破解模块
├── frontend/
│   ├── index.html           # 主页面（仪表盘）
│   ├── css/
│   │   └── style.css        # 科技风格样式
│   └── js/
│       └── app.js           # 前端应用逻辑
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-07-03-spider-all-platform-design.md
```

## 4. 后端设计

### 4.1 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/crawlers` | 获取所有可用爬虫模块列表 |
| GET | `/api/crawlers/{id}` | 获取单个爬虫模块详情 |
| POST | `/api/crawlers/vip-video/play` | VIP视频解析播放 |

### 4.2 爬虫插件接口

每个爬虫模块继承 `BaseCrawler`，实现统一接口：

```python
class BaseCrawler:
    name: str          # 爬虫名称
    description: str   # 功能描述
    icon: str          # 图标标识
    
    def get_info() -> dict          # 返回模块信息
    def execute(params: dict) -> dict  # 执行爬虫功能
```

### 4.3 VIP视频模块

- 输入：视频页面 URL（爱奇艺/腾讯/优酷等）
- 处理：拼接解析服务 URL `https://jx.xmflv.cc/?url={video_url}`
- 输出：返回解析后的可播放 URL 或直接 302 跳转

## 5. 前端设计

### 5.1 视觉风格

- 深色主题 (`#0a0e1a` 背景)
- 霓虹蓝色 (`#00d4ff`) 为主色调，带发光效果
- 粒子/光效动态背景
- 毛玻璃效果卡片

### 5.2 页面结构

- **左侧导航栏**：可收缩，显示平台 Logo 和爬虫模块列表
- **主内容区**：根据选中的爬虫模块动态切换
- **仪表盘首页**：爬虫模块卡片网格 + 简单统计 + 动态背景

### 5.3 交互流程

1. 用户访问首页 → 看到仪表盘
2. 点击 VIP 视频爬虫卡片 → 进入 VIP视频功能页
3. 粘贴视频链接 / 点击平台快捷按钮 → 调后端 API → 跳转解析播放
4. 后续新增爬虫模块自动出现在仪表盘

## 6. 启动方式

```bash
# 启动后端 (backend 目录)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 前端直接用浏览器打开 frontend/index.html
# 或使用任意静态服务器
```

## 7. 扩展机制

新增爬虫只需：
1. 在 `crawlers/` 下创建新 `.py` 文件，继承 `BaseCrawler`
2. 实现 `get_info()` 和 `execute()` 方法
3. 后端自动发现并注册到 `/api/crawlers` 列表
4. 前端自动展示新模块卡片

## 8. 边界与限制

- VIP 视频解析依赖第三方服务（jx.xmflv.cc），服务可用性不受本平台控制
- V1 仅实现 VIP 视频一个爬虫模块，代码结构已预留扩展点
- 前端需要支持 ES6 的现代浏览器
