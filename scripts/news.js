(function () {
    const NEWS_PATH = 'data/news.json';
    const {
        fetchJson,
        createElement,
        createActionLink,
        getFilterOptions,
        renderHomepageArchiveIntro,
        renderFilterBar
    } = window.SiteUiUtils;

    let newsDataPromise = null;

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
        renderFilterBar(container, [
            {
                name: 'year',
                label: 'Filter by Year',
                defaultLabel: 'All Years',
                options: getFilterOptions(news, 'year')
                    .sort((left, right) => right - left)
                    .map(year => ({ value: String(year), label: String(year) }))
            },
            {
                name: 'theme',
                label: 'Filter by Theme',
                defaultLabel: 'All Themes',
                options: getFilterOptions(news, 'theme')
                    .sort((left, right) => left.localeCompare(right))
                    .map(theme => ({ value: theme, label: theme }))
            }
        ], onChange);
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
