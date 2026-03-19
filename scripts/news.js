(function () {
    const NEWS_PATH = 'data/news.json';

    let newsDataPromise = null;

    async function fetchJson(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load ${path}: ${response.status}`);
        }
        return response.json();
    }

    function createElement(tagName, className, textContent) {
        const element = document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        if (textContent !== undefined) {
            element.textContent = textContent;
        }
        return element;
    }

    function createActionLink(label, url, className = 'publication-action') {
        const link = createElement('a', className, label);
        link.href = url;
        const isExternal = /^https?:\/\//.test(url);
        if (isExternal) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
        return link;
    }

    function formatDateLabel(dateValue) {
        const date = new Date(dateValue);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        return `${month}/${year}`;
    }

    function sortNews(items) {
        return [...items].sort((left, right) => {
            const dateDelta = new Date(right.date).getTime() - new Date(left.date).getTime();
            if (dateDelta !== 0) {
                return dateDelta;
            }
            return left.order - right.order;
        });
    }

    async function loadNewsData() {
        if (!newsDataPromise) {
            newsDataPromise = fetchJson(NEWS_PATH).then(catalog => {
                const news = sortNews(catalog.news || []);
                return { catalog, news };
            });
        }

        return newsDataPromise;
    }

    function createNewsItem(item, compact = false) {
        const article = createElement('article', `news-item${compact ? ' news-item-compact' : ''}`);
        const meta = createElement('div', 'news-item-meta');
        meta.appendChild(createElement('span', 'news-item-date', formatDateLabel(item.date)));
        meta.appendChild(createElement('span', 'news-item-theme', item.theme));
        article.appendChild(meta);

        const body = createElement('div', 'news-item-body');
        const icon = createElement('span', 'news-item-icon', item.icon || '•');
        body.appendChild(icon);

        const text = createElement('div', 'news-item-text');
        text.innerHTML = item.content_html;
        body.appendChild(text);

        article.appendChild(body);
        return article;
    }

    function getFilterOptions(items, key) {
        return Array.from(new Set(items.map(item => item[key]).filter(Boolean)));
    }

    function renderHomepageArchiveIntro(target, text, url, label) {
        const intro = createElement('div', 'homepage-section-intro');
        intro.appendChild(createElement('div', 'homepage-section-intro-text', text));
        intro.appendChild(createActionLink(label, url, 'publication-archive-link'));
        target.appendChild(intro);
    }

    function renderRecentNews(containerId) {
        return loadNewsData().then(({ catalog, news }) => {
            const target = document.getElementById(containerId);
            if (!target) {
                return;
            }

            target.innerHTML = '';

            const latestDate = news.length > 0 ? new Date(news[0].date) : null;
            const windowDays = catalog.homepage_window_days || 365;
            const cutoffDate = latestDate
                ? new Date(latestDate.getTime() - windowDays * 24 * 60 * 60 * 1000)
                : null;

            const recentItems = cutoffDate
                ? news.filter(item => new Date(item.date).getTime() >= cutoffDate.getTime())
                : [];

            renderHomepageArchiveIntro(target, 'Recent news from the past year is highlighted here.', 'news.html', 'View All News');

            if (recentItems.length === 0) {
                target.appendChild(createElement('div', 'publication-empty', 'No recent news is available yet.'));
                return;
            }

            const list = createElement('div', 'news-list news-list-compact');
            recentItems.forEach(item => list.appendChild(createNewsItem(item, true)));
            target.appendChild(list);
        });
    }

    function renderArchiveGroups(container, items) {
        container.innerHTML = '';

        if (items.length === 0) {
            container.appendChild(createElement('div', 'publication-empty', 'No news matches the selected filters.'));
            return;
        }

        const groups = new Map();
        items.forEach(item => {
            if (!groups.has(item.year)) {
                groups.set(item.year, []);
            }
            groups.get(item.year).push(item);
        });

        Array.from(groups.entries())
            .sort((left, right) => right[0] - left[0])
            .forEach(([year, yearItems]) => {
                const section = createElement('section', 'publication-archive-group');
                section.appendChild(createElement('h2', 'publication-archive-group-title', String(year)));

                const list = createElement('div', 'news-list');
                yearItems.forEach(item => list.appendChild(createNewsItem(item)));
                section.appendChild(list);
                container.appendChild(section);
            });
    }

    function renderArchiveFilters(container, news, onChange) {
        if (!container) {
            return;
        }

        container.innerHTML = '';

        const bar = createElement('div', 'publication-filter-bar');

        const yearField = createElement('label', 'publication-filter-field');
        yearField.appendChild(createElement('span', 'publication-filter-label', 'Filter by Year'));
        const yearSelect = createElement('select', 'publication-filter-select');
        yearSelect.innerHTML = '<option value="all">All Years</option>';
        getFilterOptions(news, 'year')
            .sort((left, right) => right - left)
            .forEach(year => {
                const option = document.createElement('option');
                option.value = String(year);
                option.textContent = String(year);
                yearSelect.appendChild(option);
            });
        yearField.appendChild(yearSelect);
        bar.appendChild(yearField);

        const themeField = createElement('label', 'publication-filter-field');
        themeField.appendChild(createElement('span', 'publication-filter-label', 'Filter by Theme'));
        const themeSelect = createElement('select', 'publication-filter-select');
        themeSelect.innerHTML = '<option value="all">All Themes</option>';
        getFilterOptions(news, 'theme')
            .sort((left, right) => left.localeCompare(right))
            .forEach(theme => {
                const option = document.createElement('option');
                option.value = theme;
                option.textContent = theme;
                themeSelect.appendChild(option);
            });
        themeField.appendChild(themeSelect);
        bar.appendChild(themeField);

        const resetButton = createElement('button', 'publication-filter-reset', 'Reset');
        resetButton.type = 'button';
        bar.appendChild(resetButton);

        const count = createElement('div', 'publication-filter-count');
        bar.appendChild(count);

        const triggerChange = () => {
            onChange({
                year: yearSelect.value,
                theme: themeSelect.value,
                countElement: count
            });
        };

        yearSelect.addEventListener('change', triggerChange);
        themeSelect.addEventListener('change', triggerChange);
        resetButton.addEventListener('click', () => {
            yearSelect.value = 'all';
            themeSelect.value = 'all';
            triggerChange();
        });

        container.appendChild(bar);
        triggerChange();
    }

    function renderNewsArchive(containerId, filterId) {
        return loadNewsData().then(({ news }) => {
            const target = document.getElementById(containerId);
            if (!target) {
                return;
            }

            const filterTarget = filterId ? document.getElementById(filterId) : null;
            renderArchiveFilters(filterTarget, news, ({ year, theme, countElement }) => {
                const filtered = news.filter(item => {
                    const yearMatches = year === 'all' || String(item.year) === year;
                    const themeMatches = theme === 'all' || item.theme === theme;
                    return yearMatches && themeMatches;
                });

                if (countElement) {
                    countElement.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
                }

                renderArchiveGroups(target, filtered);
            });
        });
    }

    window.NewsSite = {
        loadNewsData,
        renderRecentNews,
        renderNewsArchive
    };
})();
