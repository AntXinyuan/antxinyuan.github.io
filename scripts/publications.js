(function () {
    const PUBLICATIONS_PATH = 'data/publications.json';
    const SCHOLAR_PATH = 'scripts/scholar.json';
    const {
        fetchJson,
        createElement,
        createActionLink,
        getFilterOptions,
        renderHomepageArchiveIntro,
        renderFilterBar
    } = window.SiteUiUtils;

    let publicationDataPromise = null;

    function normalizeCitationCount(value) {
        const parsed = Number.parseInt(value ?? '0', 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function enrichPublication(publication, scholarMap) {
        const scholarEntry = publication.scholar_id ? scholarMap[publication.scholar_id] : null;
        const citationCount = normalizeCitationCount(scholarEntry?.num_citations);

        return {
            ...publication,
            citation_count: citationCount,
            scholar_url: publication.scholar_id
                ? `https://scholar.google.com/citations?view_op=view_citation&citation_for_view=${publication.scholar_id}`
                : null
        };
    }

    async function loadPublicationData() {
        if (!publicationDataPromise) {
            publicationDataPromise = Promise.all([
                fetchJson(PUBLICATIONS_PATH),
                fetchJson(SCHOLAR_PATH).catch(() => ({ publications: {}, citedby: '0', updated: '' }))
            ]).then(([catalog, scholar]) => {
                const scholarMap = scholar.publications || {};
                const publications = (catalog.publications || [])
                    .map(publication => enrichPublication(publication, scholarMap))
                    .sort((left, right) => left.order - right.order);

                return {
                    catalog,
                    scholar,
                    publications
                };
            });
        }

        return publicationDataPromise;
    }

    function createImageBadgeLink(imageUrl, altText, targetUrl, className = 'publication-metric') {
        const link = createActionLink('', targetUrl, className);
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = altText;
        link.appendChild(image);
        return link;
    }

    function createMetric(publication) {
        if (!publication.scholar_url) {
            return null;
        }

        return createImageBadgeLink(
            `https://img.shields.io/badge/Citations-${publication.citation_count}-blue.svg?logo=google-scholar`,
            `Scholar Citations ${publication.citation_count}`,
            publication.scholar_url,
            'publication-metric'
        );
    }

    function createStarMetric(publication) {
        if (!publication.github_repo) {
            return null;
        }

        return createImageBadgeLink(
            `https://img.shields.io/github/stars/${publication.github_repo}?style=social`,
            `GitHub Stars for ${publication.github_repo}`,
            `https://github.com/${publication.github_repo}`,
            'publication-metric'
        );
    }

    function ensureModal() {
        let modal = document.getElementById('publication-image-modal');
        if (modal) {
            return modal;
        }

        modal = createElement('div', 'publication-modal');
        modal.id = 'publication-image-modal';
        modal.innerHTML = `
            <div class="publication-modal-dialog">
                <button class="publication-modal-close" type="button" aria-label="Close preview">×</button>
                <img class="publication-modal-image" alt="">
            </div>
        `;

        const closeModal = () => modal.classList.remove('is-open');
        modal.addEventListener('click', event => {
            if (event.target === modal || event.target.classList.contains('publication-modal-close')) {
                closeModal();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeModal();
            }
        });

        document.body.appendChild(modal);
        return modal;
    }

    function openImageModal(imageUrl, altText) {
        if (!imageUrl) {
            return;
        }

        const modal = ensureModal();
        const image = modal.querySelector('.publication-modal-image');
        image.src = imageUrl;
        image.alt = altText || 'Publication preview';
        modal.classList.add('is-open');
    }

    function appendCommonPublicationBody(container, publication, options) {
        const shouldShowHeaderTag = options.showHeaderTag !== false;
        if (shouldShowHeaderTag) {
            const header = createElement('div', 'publication-header');
            header.appendChild(createElement('span', 'publication-tag', publication.tag));
            container.appendChild(header);
        }

        const title = createElement('h3', options.titleClass || 'publication-title');
        title.textContent = publication.title;
        container.appendChild(title);

        const authors = createElement('p', 'publication-authors');
        authors.innerHTML = publication.authors_html;
        container.appendChild(authors);

        const venue = createElement('p', 'publication-venue');
        venue.innerHTML = publication.venue_html;
        container.appendChild(venue);

        const metaRow = createElement('div', 'publication-meta-row');
        const citationMetric = createMetric(publication);
        const starMetric = createStarMetric(publication);

        if (citationMetric) {
            metaRow.appendChild(citationMetric);
        }
        if (starMetric) {
            metaRow.appendChild(starMetric);
        }
        if (metaRow.children.length > 0) {
            container.appendChild(metaRow);
        }

        const actions = createElement('div', 'publication-actions');
        (publication.links || []).forEach(link => {
            actions.appendChild(createActionLink(link.label, link.url));
        });

        if (actions.children.length > 0) {
            container.appendChild(actions);
        }
    }

    function createFeaturedPublicationCard(publication) {
        const card = createElement('article', 'publication-card');

        if (publication.thumbnail) {
            const media = createElement('div', 'publication-card-media');
            const button = createElement('button', 'publication-card-media-button');
            button.type = 'button';
            button.addEventListener('click', () => openImageModal(publication.thumbnail, publication.thumbnail_alt || publication.title));

            const image = document.createElement('img');
            image.src = publication.thumbnail;
            image.alt = publication.thumbnail_alt || publication.title;

            button.appendChild(createElement('div', 'publication-tag', publication.tag));
            button.appendChild(image);
            media.appendChild(button);
            card.appendChild(media);
        }

        const body = createElement('div', 'publication-card-body');
        appendCommonPublicationBody(body, publication, {
            titleClass: 'publication-title',
            showHeaderTag: false
        });
        card.appendChild(body);

        return card;
    }

    function createArchivePublicationItem(publication) {
        const item = createElement('article', 'publication-archive-item');
        const layout = createElement('div', 'publication-archive-layout');
        const body = createElement('div', 'publication-archive-body');
        const topLine = createElement('div', 'publication-archive-topline');
        topLine.appendChild(createElement('span', 'publication-tag', publication.tag));
        body.appendChild(topLine);

        appendCommonPublicationBody(body, publication, {
            titleClass: 'publication-archive-title',
            showHeaderTag: false
        });

        layout.appendChild(body);

        if (publication.thumbnail) {
            const media = createElement('div', 'publication-archive-media');
            const button = createElement('button', 'publication-archive-media-button');
            button.type = 'button';
            button.addEventListener('click', () => openImageModal(publication.thumbnail, publication.thumbnail_alt || publication.title));

            const image = document.createElement('img');
            image.src = publication.thumbnail;
            image.alt = publication.thumbnail_alt || publication.title;

            button.appendChild(image);
            media.appendChild(button);
            layout.appendChild(media);
        }

        item.appendChild(layout);
        return item;
    }

    function groupPublications(publications) {
        const groups = new Map();

        publications.forEach(publication => {
            if (!groups.has(publication.section)) {
                groups.set(publication.section, []);
            }
            groups.get(publication.section).push(publication);
        });

        return groups;
    }

    function renderHomepageSummary(target, summaryData) {
        if (!summaryData) {
            return;
        }

        const block = createElement('div', 'publication-summary-block');
        const grid = createElement('div', 'publication-summary-grid');

        const overviewCard = createElement('div', 'publication-summary-card');
        overviewCard.appendChild(createElement('div', 'publication-summary-label', 'Publication Overview'));
        const overviewList = createElement('div', 'publication-summary-list');
        (summaryData.overview || []).forEach(item => overviewList.appendChild(createElement('span', 'publication-summary-pill', item)));
        overviewCard.appendChild(overviewList);
        grid.appendChild(overviewCard);

        const authorshipCard = createElement('div', 'publication-summary-card');
        authorshipCard.appendChild(createElement('div', 'publication-summary-label', 'Authorship Summary'));
        const authorshipList = createElement('div', 'publication-summary-list');
        (summaryData.authorship || []).forEach(item => authorshipList.appendChild(createElement('span', 'publication-summary-pill', item)));
        authorshipCard.appendChild(authorshipList);
        grid.appendChild(authorshipCard);

        block.appendChild(grid);

        if (summaryData.note) {
            block.appendChild(createElement('div', 'publication-summary-note', summaryData.note));
        }

        target.appendChild(block);
    }

    function getAuthorRoleOptions(publications) {
        const roleOrder = ['1st-author', '2nd-author', '3rd-author', 'corresponding-author', 'other-author'];
        return roleOrder;
    }

    function renderArchiveGroups(target, publications) {
        target.innerHTML = '';

        if (publications.length === 0) {
            target.appendChild(createElement('div', 'publication-empty', 'No publications match the selected filters.'));
            return;
        }

        const groups = groupPublications(publications);
        groups.forEach((items, sectionName) => {
            const section = createElement('section', 'publication-archive-group');
            section.appendChild(createElement('h2', 'publication-archive-group-title', sectionName));

            const list = createElement('div', 'publication-archive-list');
            items.forEach(publication => list.appendChild(createArchivePublicationItem(publication)));
            section.appendChild(list);
            target.appendChild(section);
        });
    }

    function renderArchiveFilters(container, publications, onChange) {
        renderFilterBar(container, [
            {
                name: 'year',
                label: 'Filter by Year',
                defaultLabel: 'All Years',
                options: getFilterOptions(publications, 'year')
                    .sort((left, right) => right - left)
                    .map(year => ({ value: String(year), label: String(year) }))
            },
            {
                name: 'level',
                label: 'Filter by Level',
                defaultLabel: 'All Levels',
                options: getFilterOptions(publications, 'level')
                    .map(level => ({ value: level, label: level }))
            },
            {
                name: 'keyword',
                label: 'Filter by Keyword',
                defaultLabel: 'All Keywords',
                options: getFilterOptions(publications, 'keyword')
                    .sort((left, right) => left.localeCompare(right))
                    .map(keyword => ({ value: keyword, label: keyword }))
            },
            {
                name: 'authorRole',
                label: 'Filter by Author',
                defaultLabel: 'All Author Roles',
                selectClassName: 'publication-filter-select publication-filter-select-author',
                options: getAuthorRoleOptions(publications)
                    .map(role => ({ value: role, label: role }))
            }
        ], onChange);
    }

    async function renderFeaturedPublications(containerId) {
        const target = document.getElementById(containerId);
        if (!target) {
            return;
        }

        const { catalog, publications } = await loadPublicationData();
        const featured = publications.filter(publication => publication.featured);
        const limit = catalog.homepage_featured_limit || featured.length;
        const items = featured.slice(0, limit);

        target.innerHTML = '';
        renderHomepageArchiveIntro(target, 'Selected publications are highlighted here.', 'publications.html', 'View All Publications');
        renderHomepageSummary(target, catalog.homepage_summary);

        if (items.length === 0) {
            target.appendChild(createElement('div', 'publication-empty', 'No featured publications have been selected yet.'));
            return;
        }

        const grid = createElement('div', 'featured-publications-grid');
        items.forEach(publication => grid.appendChild(createFeaturedPublicationCard(publication)));
        target.appendChild(grid);
    }

    async function renderPublicationArchive(containerId, summaryId, filterId) {
        const target = document.getElementById(containerId);
        if (!target) {
            return;
        }

        const { scholar, publications } = await loadPublicationData();

        if (summaryId) {
            const summaryTarget = document.getElementById(summaryId);
            if (summaryTarget) {
                summaryTarget.textContent = `${publications.length} publications in total. Figures stay hidden by default on this page and can be opened on demand. Scholar citations last synced at ${scholar.updated || 'an unknown time'}.`;
            }
        }

        const filterTarget = filterId ? document.getElementById(filterId) : null;
        renderArchiveFilters(filterTarget, publications, ({ year, level, keyword, authorRole, countElement }) => {
            const filtered = publications.filter(publication => {
                const yearMatches = year === 'all' || String(publication.year) === year;
                const levelMatches = level === 'all' || publication.level === level;
                const keywordMatches = keyword === 'all' || publication.keyword === keyword;
                const authorRoleMatches = authorRole === 'all' || publication.author_role === authorRole;
                return yearMatches && levelMatches && keywordMatches && authorRoleMatches;
            });

            if (countElement) {
                countElement.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
            }

            renderArchiveGroups(target, filtered);
        });
    }

    window.PublicationSite = {
        loadPublicationData,
        renderFeaturedPublications,
        renderPublicationArchive,
        openImageModal
    };
})();
