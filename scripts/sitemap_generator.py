import os
from datetime import datetime
from git import Repo

# 网站基础 URL
BASE_URL = "https://antxinyuan.github.io"

# 需要排除的文件或目录（支持扩展名或名称）
EXCLUDE = {
    ".md", ".py", ".json", ".xml", ".txt", "README.md",
    "scripts/", "legacy/jemdoc.css"  # 排除旧版 CSS 文件
}

def get_all_git_updated_times_gitpython(work_dir):
    """使用 gitpython 库获取所有文件的最后更新时间"""
    try:
        # 打开 Git 仓库
        repo = Repo(work_dir, search_parent_directories=True)
        
        # 获取所有跟踪文件
        tracked_files = repo.git.ls_files().split('\n')
        
        # 获取每个文件的最后更新时间
        result = {}
        for file_path in tracked_files:
            if not file_path:
                continue
                
            # 获取文件的最新提交
            commits = list(repo.iter_commits(paths=file_path, max_count=1))
            if commits:
                # 转换为 ISO 格式
                timestamp = commits[0].committed_datetime.strftime("%Y-%m-%d %H:%M:%S")
                result[file_path] = timestamp
        
        return result
    
    except Exception as e:
        print(e)
        return {}

def generate_sitemap(time_map=None):
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    # 遍历根目录下的文件
    for root, dirs, files in os.walk("..", topdown=True):
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
            if time_map and file_path in time_map:
                mtime = time_map[file_path]
            else:
                # 如果没有提供时间映射，则使用文件系统的修改时间
                mtime = datetime.fromtimestamp(os.path.getmtime(os.path.join(root, file))).strftime("%Y-%m-%d %H:%M:%S")
            
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
    time_map = get_all_git_updated_times_gitpython('..')
    generate_sitemap(time_map)