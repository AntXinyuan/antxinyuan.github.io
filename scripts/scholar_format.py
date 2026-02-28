import os
import json
from datetime import datetime
from collections import OrderedDict
from bs4 import BeautifulSoup
import urllib.parse

file_path = 'scripts/scholar.html'
with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'lxml') # 如果没有 lxml，可替换为 'html.parser'

# ================= 提取用户信息 =================
# 1. 姓名
name_tag = soup.find(id='gsc_prf_in')
name = name_tag.contents[0].strip() if name_tag else ""

# 2. 用户 ID (从 canonical 链接中提取参数)
user_id = ""
canonical_link = soup.find('link', rel='canonical')
if canonical_link and 'href' in canonical_link.attrs:
    parsed_url = urllib.parse.urlparse(canonical_link['href'])
    user_id = urllib.parse.parse_qs(parsed_url.query).get('user', [''])[0]

# 3. 单位
affiliation_tag = soup.find('div', class_='gsc_prf_il')
affiliation = affiliation_tag.text.strip() if affiliation_tag else ""

# 4. 主页链接
homepage = ""
for a in soup.find_all('a', class_='gsc_prf_ila'):
    if a.text == "首页":
        homepage = a.get('href', '')
        break

# 5. 研究兴趣
interests = []
interests_div = soup.find(id='gsc_prf_int')
if interests_div:
    for a in interests_div.find_all('a', class_='gsc_prf_inta'):
        interests.append(a.text.strip())

# 6. 总引用量
citations_total = ""
cit_table = soup.find(id='gsc_rsb_st')
if cit_table:
    first_row = cit_table.find('tbody').find('tr')
    if first_row:
        citations_total = first_row.find_all('td')[1].text.strip()

user_info = {
    "user_id": user_id,
    "name": name,
    "affiliation": affiliation,
    "homepage": homepage,
    "interests": interests,
    "citedby": citations_total
}

# ================= 提取论文信息 =================
papers = OrderedDict()  # 使用有序字典保持论文顺序
for tr in soup.find_all('tr', class_='gsc_a_tr'):
    # 标题与论文 ID
    title_tag = tr.find('a', class_='gsc_a_at')
    title = title_tag.text.strip() if title_tag else ""
    
    paper_id = ""
    if title_tag and 'href' in title_tag.attrs:
        href = title_tag['href']
        parsed_href = urllib.parse.urlparse(href)
        # 从 URL 参数中提取 citation_for_view 的值
        paper_id = urllib.parse.parse_qs(parsed_href.query).get('citation_for_view', [''])[0]
    
    # 作者和刊物
    grays = tr.find_all('div', class_='gs_gray')
    authors = grays[0].text.strip() if len(grays) > 0 else ""
    venue = grays[1].text.replace('\xa0', ' ').strip() if len(grays) > 1 else ""
    
    # 引用量
    cit_tag = tr.find('a', class_='gsc_a_ac')
    paper_citations = cit_tag.text.strip() if cit_tag else "0"
    paper_citations = paper_citations if paper_citations != "" else "0" 

    
    # 年份
    year_tag = tr.find('span', class_='gsc_a_h')
    year = year_tag.text.strip() if year_tag else ""
    
    papers[paper_id] = {
        "pub_id": paper_id,
        "title": title,
        "authors": authors,
        "venue": venue,
        "pub_year": year,
        "num_citations": paper_citations
    }

# ================= 组合并输出 JSON =================
result = {
    **user_info,
    "publications": papers,
    "updated": str(datetime.now())
}

print(json.dumps(result, indent=2, ensure_ascii=False))
with open(f'scripts/scholar.json', 'w') as outfile:
    json.dump(result, outfile, ensure_ascii=False, indent=2)