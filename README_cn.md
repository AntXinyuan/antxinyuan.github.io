# 🌟 个人学术主页模板 | 自适应 & 极简部署

在寻找中文版本？ [README (English)](README_en.md)

这是一个兼顾 **PC/移动端自适应**、**极简二次开发** 和 **内容快速更新** 的个人学术主页模板，基于纯 HTML+CSS 构建，无需复杂依赖。既可直接作为个人主页使用（当前是[Antxinyuan的学术主页](https://antxinyuan.github.io/)），也能通过几分钟的简单修改，部署属于你自己的专业学术主页～

如果这个模板帮到了你，欢迎点亮 ⭐️ Star 支持；若我的研究工作对你有启发，也欢迎引用相关成果！


## ✨ 核心特性
- 📱 **全端自适应**：自动适配电脑、平板、手机等设备，布局简洁优雅，阅读体验流畅
- 🛠️ **极简开发**：仅依赖基础 HTML+CSS，代码结构清晰，二次开发门槛极低
- 📝 **内容与样式分离**：所有个人信息（论文、教育经历等）集中在单个 Markdown 文件中，更新无需改动样式
- 🔄 **自动同步数据**：支持一键抓取并更新谷歌学术引用量、Github 仓库 Star 数，无需手动维护
- 🚀 **零配置部署**：依托 Github Pages + Github Action，push 代码后自动部署，无需额外操作


## 🚀 快速安装部署
### 步骤 1：基于模板创建仓库
1. 点击本仓库右上角的 **Use this template → Create a new repository**
2. 仓库命名必须为 `<your-username>.github.io`（⚠️ 关键！`your-username` 需与你的 Github 用户名完全一致，例如我的用户名为 `antxinyuan`，仓库名即为 `antxinyuan.github.io`）
3. 完成创建后，Github 会自动复制模板所有文件到你的仓库


### 步骤 2：本地预览（可选但推荐）
在推送代码到 Github 前，可先本地预览效果，确保修改无误：
```shell
# 1. 克隆你的仓库到本地
git clone https://github.com/<your-username>/<your-username>.github.io.git
cd <your-username>.github.io

# 2. 启动 Python 简易 HTTP 服务（无需额外安装依赖）
python -m http.server -b 127.0.0.1
```
启动后，打开浏览器访问 `127.0.0.1:8000` 即可查看本地版本。


### 步骤 3：云端自动部署
1. 本地修改完成后，提交并 push 到 Github 仓库：
   ```shell
   git add .
   git commit -m "Update personal info"
   git push origin main
   ```
2. Push 后会自动触发 Github Action 部署流程（无需手动配置）
3. 等待 1-2 分钟后，访问 `https://<your-username>.github.io` 即可看到在线版本的个人主页～


## 📝 个性化信息修改
所有核心内容都集中在 **单个文件** 中，修改无需触碰样式代码，新手也能快速上手！

### 1. 修改网页元信息（SEO 优化）
编辑 `index.html` 中的 `<head>` 部分，替换为你的个人信息（有助于搜索引擎索引）：
```html
<head>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>你的名字 | 单位</title> <!-- 网页标题 -->
    <meta name="description" content="一句话介绍自己（例如：XX大学博士生，研究方向为计算机视觉）"> <!-- 搜索描述 -->
    <meta name="keywords" content="你的名字, 研究方向, 单位, 关键词"> <!-- 搜索关键词 -->
    <link rel="shortcut icon" type="image/png" href="images/logo.ico" /> <!-- 网页图标（替换 images/logo.ico 即可） -->
</head>
```

### 2. 修改核心内容（论文、教育经历等）
编辑 **`academic.md`** 文件（核心内容文件），按以下格式替换为你的信息即可：

#### 🔍 论文信息格式（自动渲染标签+链接）
⚠️ 关键规则：图片 caption 格式为 `pub|会议缩写`（例如 `pub|CVPR24`），用于自动渲染会议标签
```markdown
### ACM
![pub|CVPR24|Rethinking Boundary Discontinuity Problem for Oriented Object Detection](docs/cvpr2024/thumbnail.webp) 

- **Rethinking Boundary Discontinuity Problem for Oriented Object Detection**
- Hang Xu\*, **Xinyuan Liu\***, Haonan Xu, Yike Ma, Zunjie Zhu, Chenggang Yan and Feng Dai†
- ***CVPR 2024*** (<span style="color:#ae1324;">CCF-A</span>) [![Scholar Citatinos](https://img.shields.io/badge/Citations--blue.svg?logo=google-scholar)](https://scholar.google.com/citations?view_op=view_citation&citation_for_view=eXwizz8AAAAJ:d1gkVwhDpl0C) / [![GitHub Stars](https://img.shields.io/github/stars/hangxu-cv/cvpr24acm?style=social)](https://github.com/hangxu-cv/cvpr24acm)
- [PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Xu_Rethinking_Boundary_Discontinuity_Problem_for_Oriented_Object_Detection_CVPR_2024_paper.pdf) / [Supp](https://openaccess.thecvf.com/content/CVPR2024/supplemental/Xu_Rethinking_Boundary_Discontinuity_CVPR_2024_supplemental.pdf) / [arXiv](https://arxiv.org/abs/2305.10061) / [Code](https://github.com/hangxu-cv/cvpr24acm) / [Slides](docs/cvpr2024/acm_slides.pdf) / [Poster](docs/cvpr2024/acm_poster.pdf) / [BibTex](docs/cvpr2024/bibtex.txt)  
```

#### 🏫 教育经历格式
⚠️ 关键规则：图片 caption 格式为 `edu|单位缩写`（例如 `edu|UCAS`），用于自动渲染教育卡片
```markdown
### UCAS
![edu|UCAS](images/ucas.webp)

- **Ph.D.** candidate, [Institute of Computing Technology, Chinese Academy of Science (ICT,CAS)](http://www.ict.ac.cn) 
- Beijing, China 
- Sep. 2021 - Now 
```

#### 📌 其他内容（可自由扩展）
可在 `academic.md` 中添加「研究方向」「项目经历」「获奖情况」「联系方式」等模块，格式与上述一致，HTML 会自动适配样式～


## 📂 文件结构说明
```shell
<your-username>.github.io/
├── .github/
│   └── workflows/          # 自动化配置（无需修改）
│       ├── static.yml      # 网页自动部署脚本
│       └── scholar_crawler.yml # 谷歌学术引用量自动抓取脚本
├── README.md               # 本说明文档
├── academic.md             # 🔴 核心！个人所有内容都在这里修改
├── index.html              # 网页样式框架（仅需修改 <head> 元信息）
├── docs/                   # 📁 论文相关资源（海报、slides、BibTex 等）
│   └── cvpr2024/           # 按会议/年份分类存放
├── images/                 # 📁 图片资源（校徽、网页图标、论文缩略图等）
│   └── logo.ico            # 网页图标（可替换）
├── scripts/                # 🛠️ 辅助脚本（无需修改）
│   ├── scholar_crawler.py  # 谷歌学术引用量抓取脚本
│   ├── sitemap_generator.py # 站点地图生成脚本
│   └── scholar.json        # 抓取结果存储
├── sitemap.xml             # 搜索引擎站点地图（自动生成）
└── robots.txt              # 搜索引擎爬取配置
```


## 🎯 进阶功能：自动更新引用量 & Star 数
模板内置自动化脚本，无需手动更新数据：
1. 谷歌学术引用量：通过 `scripts/scholar_crawler.py` 定期抓取，配置在 `.github/workflows/scholar_crawler.yml` 中（默认每周执行一次，可修改频率）
2. Github Star 数：通过徽章链接 `https://img.shields.io/github/stars/<your github repo>?style=social` 实时同步，无需额外配置


## 🙏 致谢 & 反馈
如果使用过程中遇到问题、有优化建议，或者想要分享你的主页，欢迎通过以下方式联系我：
- 提交 Github Issue
- 直接 Fork 仓库进行优化，提交 Pull Request

再次感谢你的支持！🌟 祝大家都能拥有一个简洁美观的学术主页～