from datetime import datetime
from unittest import result
from collections import OrderedDict

from selenium import webdriver
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import urllib.parse
import json
import time

def fetch_full_scholar_html(user_id, lang='zh-CN'):
    """
    使用 Selenium 自动加载用户所有的 Google Scholar 文章并返回完整 HTML
    """
    print(f"开始抓取用户 {user_id} 的主页...")
    
    # 1. 配置无头浏览器 (Headless Chrome)
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  # 隐藏浏览器界面
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    # 添加一个常见的 User-Agent 降低被识别为机器人的概率
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36')
    
    driver = webdriver.Chrome(options=options)
    
    # 2. 访问主页
    url = f"https://scholar.google.com/citations?user={user_id}&hl={lang}"
    driver.get(url)
    
    # 3. 循环点击“展开” (Show more) 按钮
    while True:
        try:
            # 找到展开按钮
            more_button = driver.find_element(By.ID, "gsc_bpf_more")
            
            # 检查按钮是否被禁用 (disabled 属性)。如果被禁用，说明文章已全部加载完毕
            if more_button.get_attribute("disabled"):
                print("所有文章加载完毕！")
                break
            
            # 点击按钮
            more_button.click()
            print("点击了一次【展开】按钮...")
            
            # 强制等待一下，让 AJAX 请求完成 (可根据网络情况适当调大)
            time.sleep(5) 
            
        except Exception as e:
            print(f"停止加载，原因: {e}")
            break
            
    # 4. 获取加载完成后的完整页面源码
    html_content = driver.page_source
    driver.quit()
    
    return html_content

def parse_scholar_html(html):
    """
    之前的解析逻辑，直接传入 HTML 文本即可
    """
    soup = BeautifulSoup(html, 'lxml')
    
    # --- 提取用户信息 ---
    name_tag = soup.find(id='gsc_prf_in')
    name = name_tag.contents[0].strip() if name_tag else ""

    user_id = ""
    canonical_link = soup.find('link', rel='canonical')
    if canonical_link and 'href' in canonical_link.attrs:
        parsed_url = urllib.parse.urlparse(canonical_link['href'])
        user_id = urllib.parse.parse_qs(parsed_url.query).get('user', [''])[0]

    affiliation_tag = soup.find('div', class_='gsc_prf_il')
    affiliation = affiliation_tag.text.strip() if affiliation_tag else ""

    homepage = ""
    for a in soup.find_all('a', class_='gsc_prf_ila'):
        if a.text in ["首页", "Homepage"]:
            homepage = a.get('href', '')
            break

    interests = [a.text.strip() for a in (soup.find(id='gsc_prf_int').find_all('a', class_='gsc_prf_inta') if soup.find(id='gsc_prf_int') else [])]

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

    # --- 提取论文信息 ---
    papers = OrderedDict()
    for tr in soup.find_all('tr', class_='gsc_a_tr'):
        title_tag = tr.find('a', class_='gsc_a_at')
        title = title_tag.text.strip() if title_tag else ""
        
        paper_id = ""
        if title_tag and 'href' in title_tag.attrs:
            href = title_tag['href']
            parsed_href = urllib.parse.urlparse(href)
            paper_id = urllib.parse.parse_qs(parsed_href.query).get('citation_for_view', [''])[0]
        
        grays = tr.find_all('div', class_='gs_gray')
        authors = grays[0].text.strip() if len(grays) > 0 else ""
        venue = grays[1].text.replace('\xa0', ' ').strip() if len(grays) > 1 else ""
        
        cit_tag = tr.find('a', class_='gsc_a_ac')
        paper_citations = cit_tag.text.strip() if cit_tag else "0"
        
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

    result = {
        **user_info,
        "publications": papers,
        "updated": str(datetime.now())
    }

    return result
        

# ================= 运行主程序 =================
if __name__ == "__main__":
    target_user_id = "eXwizz8AAAAJ"  # 刘鑫源的 ID
    
    # 1. 自动化获取完整的 HTML
    full_html = fetch_full_scholar_html(target_user_id)
    
    # 2. 解析提取数据
    parsed_data = parse_scholar_html(full_html)
    
    # 3. 输出结果
    print(json.dumps(parsed_data, indent=2, ensure_ascii=False))
    with open(f'scripts/scholar.json', 'w') as outfile:
        json.dump(parsed_data, outfile, ensure_ascii=False, indent=2)