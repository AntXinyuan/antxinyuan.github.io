# 个人学术主页模板

[English README](README_en.md) | [快速开始](#-如何改造成你自己的主页)

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-222222?logo=githubpages)
![Static Site](https://img.shields.io/badge/Static%20Site-HTML%2FCSS%2FJS-0f766e)
![No Build](https://img.shields.io/badge/No%20Build-Required-2563eb)
![Content Model](https://img.shields.io/badge/Content-Markdown%20%2B%20JSON-a21caf)

这是一个基于静态 HTML / CSS / JavaScript 的个人学术主页模板，适合部署到 GitHub Pages。当前仓库已经演化成“Markdown + JSON + 轻量脚本”的内容管理方式：

- 主页主体内容来自 `data/academic.md`
- 论文列表来自 `data/publications.json`
- 新闻列表来自 `data/news.json`
- Google Scholar 引用数据来自 `scripts/scholar.json`

整体目标是：内容结构化、前端无框架、部署简单、维护成本低。

## ✨ 特性

- 主页与归档页分离：主页只展示精选论文和近一年新闻，完整列表放到独立页面
- 内容结构化：论文、新闻都使用 JSON 管理，便于筛选、统计和批量维护
- 轻量前端：无构建工具、无依赖安装，直接用浏览器即可运行
- 自动数据融合：前端会将手工维护的论文信息与 Scholar 引用量合并
- 响应式布局：桌面和移动端都可正常浏览

## 🗂️ 当前结构

```text
.
├── index.html                 # 主页入口
├── publications.html          # 完整论文页
├── news.html                  # 完整新闻页
├── data/
│   ├── academic.md            # 主页的非结构化正文内容（Biography / Education / Awards 等）
│   ├── publications.json      # 论文数据源
│   └── news.json              # 新闻数据源
├── scripts/
│   ├── homepage.js            # 主页渲染逻辑
│   ├── publications.js        # 论文渲染逻辑
│   ├── news.js                # 新闻渲染逻辑
│   ├── site-utils.js          # 共享前端工具
│   ├── scholar.json           # Scholar 数据缓存
│   ├── scholar_fetch.py       # Scholar 抓取
│   ├── scholar_format.py      # Scholar HTML 格式化
│   ├── scholar_crawler.py     # Scholar 兼容抓取脚本
│   └── sitemap_generator.py   # 站点地图生成
├── styles/
│   ├── site.css               # 页面级共享样式
│   └── details.css            # 论文 / 新闻 / 筛选 / 归档等内容样式
├── docs/                      # 论文资源（缩略图、BibTex、Slides、Poster 等）
└── images/                    # 站点图片资源
```

## ✍️ 内容维护方式

### 1. 🏠 修改主页普通内容

编辑 `data/academic.md`。

这里适合放：

- 个人简介
- 教育经历
- 获奖
- 联系方式
- 主页中需要自由写作的其它部分

注意：

- `News` 区块只保留 `<div id="recent-news-section"></div>`
- `Publications` 区块只保留 `<div id="featured-publications-section"></div>`

这两个容器会由前端脚本自动渲染。

### 2. 📚 修改论文列表

编辑 `data/publications.json`。

每篇论文目前支持的核心字段包括：

- `id`
- `order`
- `featured`
- `section`
- `type`
- `level`
- `keyword`
- `author_role`
- `tag`
- `year`
- `title`
- `authors_html`
- `venue_html`
- `thumbnail`
- `thumbnail_alt`
- `scholar_id`
- `github_repo`
- `links`

其中：

- `featured: true` 的论文会进入主页精选区
- `keyword` 用于完整论文页筛选
- `author_role` 用于作者身份筛选
- `scholar_id` 只负责和 `scripts/scholar.json` 中的引用量数据对齐

主页中的论文统计摘要也在同一个文件里：

- `homepage_featured_limit`
- `homepage_summary`

### 3. 📰 修改新闻列表

编辑 `data/news.json`。

每条新闻目前支持的核心字段包括：

- `id`
- `order`
- `date`
- `year`
- `theme`
- `icon`
- `content_html`

其中：

- 首页只展示最近一年的新闻
- 完整新闻页支持按 `Year` 和 `Theme` 筛选

## 📈 Scholar 数据说明

当前论文的标题、作者、会议信息都以 `data/publications.json` 为准，不再依赖 Google Scholar 返回的元数据。

Scholar 只负责提供：

- 论文 ID 对应的引用量
- 总引用量

相关文件：

- `scripts/scholar.json`
- `scripts/scholar_fetch.py`
- `scripts/scholar_format.py`
- `scripts/scholar_crawler.py`

推荐流程：

1. 获取 Scholar 页面原始内容
2. 更新 `scripts/scholar.json`
3. 前端在渲染论文时自动合并 citation 数据

## 🧪 本地预览

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://127.0.0.1:8000
```

建议同时检查：

- `/index.html`
- `/publications.html`
- `/news.html`

## 🚀 如何改造成你自己的主页

如果你希望把这个仓库直接改成自己的个人主页，推荐按下面的顺序进行。

### 1. 🧱 创建你自己的仓库

推荐两种方式：

- 直接 Fork 本仓库
- 使用 GitHub 的 “Use this template” 创建新仓库

如果你希望把它部署成 GitHub Pages 个人主页，仓库名通常应设置为：

```text
<your-username>.github.io
```

### 2. 🎯 先完成最小替换

第一次改造时，优先改这些最关键的信息：

1. `index.html`、`publications.html`、`news.html` 中的页面标题和 meta 信息
2. `data/academic.md` 中的个人简介、教育经历、获奖、联系方式
3. `data/publications.json` 中的论文条目
4. `data/news.json` 中的新闻条目
5. `images/` 中的头像和站点图片

这样通常就能在不碰前端逻辑的情况下，快速得到一个属于你自己的主页版本。

### 3. 🧩 论文和新闻尽量只改数据，不改脚本

这个仓库现在的设计目标，是把“内容”和“渲染逻辑”尽量分开：

- 论文改 `data/publications.json`
- 新闻改 `data/news.json`
- 普通主页内容改 `data/academic.md`

除非你想改交互逻辑、筛选方式或视觉设计，否则一般不需要先修改：

- `scripts/homepage.js`
- `scripts/publications.js`
- `scripts/news.js`
- `scripts/site-utils.js`

### 4. 🔄 替换你的 Scholar 对齐信息

如果你也希望显示 Scholar 引用量：

1. 用你自己的 Scholar 页面更新原始数据
2. 重新生成或替换 `scripts/scholar.json`
3. 在 `data/publications.json` 中给每篇论文填好对应的 `scholar_id`

注意：这个项目默认以手工维护的论文 JSON 为准，Scholar 只负责补充 citation，不负责覆盖标题、作者或 venue。

### 5. 👀 本地检查后再推送

建议每次做完主要修改后，都先本地预览一次：

```bash
python3 -m http.server 8000
```

重点检查：

- 首页是否正常显示 Biography / News / Publications / Education / Awards
- 精选论文和近一年新闻是否正确加载
- `publications.html` 和 `news.html` 的筛选是否正常
- 图片、论文链接、代码链接、Badge 是否都能显示

### 6. ☁️ 推送到 GitHub Pages

内容确认无误后，直接提交并推送即可：

```bash
git add .
git commit -m "Customize homepage"
git push
```

如果仓库名是 `<your-username>.github.io`，通常推送后 GitHub Pages 就会自动更新。

## 🛠️ 自定义建议

如果你要基于这个模板做自己的主页，优先修改这些地方：

1. `index.html`、`publications.html`、`news.html` 里的 `<title>` / `<meta>`
2. `data/academic.md`
3. `data/publications.json`
4. `data/news.json`
5. `images/` 和 `docs/` 中的资源

通常不需要先改：

- `scripts/homepage.js`
- `scripts/publications.js`
- `scripts/news.js`
- `scripts/site-utils.js`
- `styles/site.css`
- `styles/details.css`

## 📦 部署

如果仓库名是 `<your-username>.github.io`，直接推送到 GitHub 即可使用 GitHub Pages 部署。

常见步骤：

```bash
git add .
git commit -m "Update homepage content"
git push
```

## 🙌 致谢

如果这个模板对你有帮助，欢迎 Star 仓库。也欢迎基于它继续修改、精简或扩展成你自己的主页版本。
