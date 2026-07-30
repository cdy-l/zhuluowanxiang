# 蛛罗万象 — 项目状态快照

## 项目位置
`C:\Users\chang'dong'yu\Desktop\大三下小学期\code`

## 启动方式
```powershell
cd C:\Users\chang'dong'yu\Desktop\大三下小学期\code\backend
uvicorn main:app --host 0.0.0.0 --port 8000
```
访问 http://localhost:8000

外网：`lt --port 8000 --subdomain zhuluowanxiang`

## 所需依赖
```
fastapi>=0.110.0
uvicorn>=0.29.0
requests>=2.31.0
parsel>=1.8.0
pyexecjs>=1.5.1
jsonpath>=0.82
httpx
```
需安装 Node.js（v22+）供 execjs 使用。

## 后端结构
```
backend/
├── main.py                    # FastAPI 入口 + 排行榜API + 音乐代理API
├── requirements.txt
├── auth.py                    # 用户认证（注册/登录/VIP）
├── netease_crypto.py          # 网易云加密（execjs + RSA + AES）
├── wangyiyun.js               # 网易云JS加密核心
├── netease_cookie.txt         # 用户配置的网易云Cookie
├── game_scores/               # 游戏排行榜JSON存储
└── crawlers/
    ├── base.py                # BaseCrawler 抽象基类
    ├── __init__.py            # 注册器 + 分类排序
    ├── vip_video.py           # VIP视频破解
    ├── vip_music.py           # VIP音乐搜索（网易云）
    ├── movie_info.py          # 影视资讯
    ├── steam_deals.py         # Steam折扣
    ├── novel.py               # 小说爬取
    ├── price_compare.py       # 商品比价
    ├── trending.py            # 热搜热榜
    ├── ai_tools.py            # AI智能助手（DeepSeek）
    ├── name_picker.py         # 随机点名
    ├── today_in_history.py    # 历史上的今天
    └── mini_games.py          # 小游戏合集
```

## 前端结构
```
frontend/
├── index.html                 # 主页面（159行）
├── css/style.css              # 科技风样式（1202行）
└── js/
    ├── app.js                 # 页面逻辑 + 音乐播放器 + 导航折叠
    ├── games.js               # 小游戏引擎（贪吃蛇/打砖块/2048/俄罗斯方块）
    ├── nebula.js              # Three.js 3D星云背景（12个导航节点）
    ├── OrbitControls.js       # 相机控制
    └── tutorial-particles.js  # 教程页Canvas粒子
```

## 模块分类

| 音影娱乐 | 实用工具 | 内容抓取 | 休闲娱乐 |
|----------|----------|----------|----------|
| VIP视频破解 | AI智能助手 | 小说爬取 | 小游戏合集 |
| VIP音乐搜索 | 随机点名 | 商品比价 | |
| 影视资讯 | 历史上的今天 | 热搜热榜 | |
| Steam折扣 | | | |

## 当前功能
1. **VIP视频破解** — 输入视频链接 → 跳转解析服务播放
2. **VIP音乐搜索** — 搜索歌曲 → 网易云execjs解密 → 完整播放（需配Cookie）
3. **影视资讯** — 正在热映 + Top250
4. **Steam折扣** — 特惠 + 热销
5. **小说爬取** — Wuxiaworld逐章下载
6. **商品比价** — 演示模式，内置20款商品
7. **热搜热榜** — 微博/头条/百度
8. **AI智能助手** — DeepSeek API对话
9. **随机点名** — 名单随机抽取
10. **历史上的今天** — 历史上的今天事件
11. **小游戏合集** — 贪吃蛇/打砖块/2048/俄罗斯方块 + 排行榜

## 其他页面
- **万象平台** — 功能卡片总览 + 3D星云背景
- **使用教程** — Canvas粒子 + 磨砂玻璃卡片
- **个人信息** — 用户资料编辑 + VIP状态显示
- **VIP会员** — 月付/年付模拟支付

## 侧边栏
- 使用 HTML `<details>` 原生折叠，4个分类默认展开
- 左下角用户区：未登录点→登录弹窗；已登录点→下拉菜单（个人信息/VIP/切换账号/退出）
- 左侧栏文字已放大1.3倍，宽度240px

## 音乐播放器
- 左右分栏：左列表 + 右播放器
- 搜索后生成播放列表，点击歌曲通过 `/api/proxy/music/{id}/url` 获取真实链接
- 播放器：封面旋转、进度条拖拽、音量控制、上一首/下一首
- 需在右上角配置网易云Cookie（含 MUSIC_U）

## 已知问题
- 商品比价为演示数据
- 网易云需要有效Cookie才能获取完整歌曲
- Steam/影视资讯需要网络代理访问外网
- 部分老版块中文/emoji曾被编码损坏，已修复

## 最新修改（2026-07-09）
- 音乐模块改用 execjs + wangyiyun.js 获取真实歌曲链接
- 音乐页面重设计：左右分栏 + 封面旋转 + 播放器控件
- 新增小游戏模块：贪吃蛇/打砖块/2048/俄罗斯方块 + 排行榜API
- 侧边栏改为 `<details>` 折叠面板，全部默认展开
- 删除 IP/域名查询 和 扫雷 模块
- AI助手从音影娱乐移到实用工具
- 侧边栏文字放大1.3倍
- 导航星云新增小游戏节点（共12个）
- 个人信息增加VIP状态卡
