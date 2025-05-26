import os
from datetime import datetime

# 网站基础 URL
BASE_URL = "https://antxinyuan.github.io"

# 需要排除的文件或目录（支持扩展名或名称）
EXCLUDE = {
    ".md", ".py", ".json", "README.md",
    "scripts/", "legacy/jemdoc.css"  # 排除旧版 CSS 文件
}

def generate_sitemap():
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    # 遍历根目录下的文件
    for root, dirs, files in os.walk(".", topdown=True):
        # 排除不需要的目录（如 scripts）
        dirs[:] = [d for d in dirs if d not in EXCLUDE and not d.startswith(".")]
        
        for file in files:
            # 排除指定类型的文件
            if any(file.endswith(ext) for ext in EXCLUDE):
                continue
            
            # 构建文件路径（相对根目录）
            file_path = os.path.join(root, file).lstrip("./")
            
            # 生成完整 URL
            url = f"{BASE_URL}/{file_path}"
            
            # 获取文件最后修改时间（格式：YYYY-MM-DD）
            mtime = datetime.fromtimestamp(os.path.getmtime(os.path.join(root, file))).strftime("%Y-%m-%d")
            
            # 根据文件类型设置更新频率和优先级
            if file == "index.html":
                changefreq = "weekly"
                priority = "1.0"
            elif "docs/" in file_path:  # 论文资源
                changefreq = "monthly"
                priority = "0.8"
            elif "legacy/" in file_path:  # 旧版页面
                changefreq = "yearly"
                priority = "0.5"
            else:  # 图片等静态资源
                changefreq = "yearly"
                priority = "0.5"
            
            # 添加到 XML
            xml += f'  <url>\n'
            xml += f'    <loc>{url}</loc>\n'
            xml += f'    <lastmod>{mtime}</lastmod>\n'
            xml += f'    <changefreq>{changefreq}</changefreq>\n'
            xml += f'    <priority>{priority}</priority>\n'
            xml += '  </url>\n'

    xml += '</urlset>'
    
    # 保存到 sitemap.xml
    with open("../sitemap.xml", "w") as f:
        f.write(xml)
    print("Sitemap generated successfully!")
    print(xml)

if __name__ == "__main__":
    generate_sitemap()