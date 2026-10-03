# S&M · 我们的网站与生日小游戏

这个仓库同时维护 S&M 首页和「礼物寄存站 · 2026 生日任务」。两个应用各自保留页面、样式、素材和本地服务，通过首页的普通链接连接。

## 目录结构

```text
SLS_MXY/
├── apps/
│   ├── website/                 # S&M 首页
│   │   ├── dist/                # 可直接编辑的静态页面、样式、脚本和素材
│   │   ├── public/hero/         # 首页拼贴照片（01.png～05.png）
│   │   └── serve.mjs            # 首页本地服务
│   └── gift-game/               # 独立生日小游戏
│       ├── dist/                # 前台、地图关、翻牌关、电视关及素材
│       ├── source-assets/      # 原始素材
│       ├── README.md            # 玩法说明与素材替换方法
│       └── serve.mjs            # 小游戏本地服务
├── .openai/hosting.json         # 已有首页静态目录配置
├── package.json                # 两个应用的启动命令
├── serve.mjs                   # 兼容原来的首页启动命令
└── README.md
```

`dist/` 中的文件就是当前应用源码，可以直接修改。这里没有前端构建步骤，也不需要安装 npm 依赖。

## 本地运行

需要 Node.js 18 或更高版本。在仓库根目录打开两个终端：

```sh
npm run dev:website
```

```sh
npm run dev:game
```

| 应用 | 本地地址 | 页面入口 |
| --- | --- | --- |
| S&M 首页 | http://127.0.0.1:5200/ | `apps/website/dist/index.html` |
| 礼物寄存站 | http://127.0.0.1:5202/ | `apps/gift-game/dist/index.html` |

首页的「解锁2026礼物线索」按钮会打开小游戏。服务只监听本机；如果端口被占用，可以设置 `PORT` 环境变量。服务根据自身脚本位置读取素材，可以从不同的工作目录启动。

原来的 `node serve.mjs` 仍然可以启动首页。

## 修改位置

- 首页排版与入口：`apps/website/dist/`；拼贴照片：`apps/website/public/hero/`。
- 小游戏各关卡与纪念物文案：`apps/gift-game/dist/`。
- 小游戏真实照片、视频和卡面替换：见 [小游戏说明](apps/gift-game/README.md)。

以后部署到自己的服务器时，需要将首页按钮的地址改成小游戏的实际地址。两个应用仍然可以分别部署、分别撤下。

## 版本管理

日常修改、提交和推送都在这个仓库中完成。小游戏已作为普通目录并入，原有开发历史一起保留；子目录内没有嵌套 Git 仓库，也不需要初始化 submodule。
