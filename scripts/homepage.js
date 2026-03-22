(function () {
    const MARKDOWN_PATH = 'data/academic.md';
    const SCHOLAR_PATH = 'scripts/scholar.json';

    function processProfilePhoto() {
        const container = document.getElementById('main-content');
        const firstImage = container?.querySelector('img');
        if (!firstImage || !firstImage.alt.includes('profile')) {
            return;
        }

        const photo = document.createElement('div');
        photo.className = 'profile-photo';
        photo.appendChild(firstImage.cloneNode(true));
        container.insertBefore(photo, container.firstChild);
        firstImage.parentNode.remove();
    }

    function transformLegacyTables() {
        const mainContent = document.getElementById('main-content');
        const sectionTitles = mainContent.querySelectorAll('h3');

        sectionTitles.forEach(title => {
            const imageParagraph = title.nextElementSibling;
            if (!imageParagraph || !imageParagraph.querySelector('img')) {
                return;
            }

            const image = imageParagraph.querySelector('img');
            const list = imageParagraph.nextElementSibling;
            const altParts = image.alt.split('|');
            const prefix = altParts[0];

            const table = document.createElement('table');
            table.className = `${prefix}-table`;

            const row = table.insertRow();
            const imageCell = row.insertCell();
            const contentCell = row.insertCell();
            contentCell.className = 'common-content';

            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            imageContainer.appendChild(image.cloneNode(true));

            if (prefix === 'pub' && altParts.length > 2) {
                const tag = document.createElement('div');
                tag.className = 'pub-tag';
                tag.textContent = altParts[1];
                imageContainer.appendChild(tag);
            }

            imageCell.appendChild(imageContainer);
            imageParagraph.remove();

            const content = document.createElement('div');
            content.className = 'common-text';
            content.appendChild(list);
            contentCell.appendChild(content);

            title.parentNode.replaceChild(table, title);
        });
    }

    async function updateScholarBadge() {
        try {
            const response = await fetch(SCHOLAR_PATH);
            const data = await response.json();
            const totalCitations = data.citedby ?? 0;

            document.querySelectorAll('img').forEach(image => {
                const href = image.parentNode?.href;
                if (!href) {
                    return;
                }

                if (href.includes('github') || href.includes('scholar')) {
                    image.style = 'height: 1em;';
                }

                if (href.includes('scholar.google.com/citations?user=')) {
                    image.src = `https://img.shields.io/badge/Citations-${totalCitations}-blue.svg?logo=google-scholar`;
                }
            });
        } catch (error) {
            console.error('Error loading scholar data:', error);
        }
    }

    function slugifyHeading(text, usedIds) {
        const normalized = text
            .toLowerCase()
            .trim()
            .replace(/<[^>]+>/g, '')
            .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        const baseId = normalized || 'section';
        let candidate = baseId;
        let counter = 2;

        while (usedIds.has(candidate)) {
            candidate = `${baseId}-${counter}`;
            counter += 1;
        }

        usedIds.add(candidate);
        return candidate;
    }

    function buildNavigation() {
        const navLinks = document.getElementById('site-nav-links');
        const mainContent = document.getElementById('main-content');
        const headings = mainContent.querySelectorAll('h2');
        const usedIds = new Set();

        navLinks.innerHTML = '';

        headings.forEach(heading => {
            if (!heading.id) {
                heading.id = slugifyHeading(heading.textContent, usedIds);
            } else {
                usedIds.add(heading.id);
            }

            const link = document.createElement('a');
            link.href = `#${heading.id}`;
            link.textContent = heading.textContent.trim();
            navLinks.appendChild(link);
        });
    }

    function setupNavigationVisibility() {
        const nav = document.querySelector('.site-nav');
        if (!nav) {
            return;
        }

        let lastScrollY = window.scrollY;
        let isAnchorNavigating = false;
        let lastTouchY = null;

        function showNavigation() {
            nav.classList.remove('site-nav-hidden');
        }

        function hideNavigation() {
            nav.classList.add('site-nav-hidden');
        }

        function handleAnchorNavigation() {
            isAnchorNavigating = true;
            lastTouchY = null;
            showNavigation();
            lastScrollY = window.scrollY;
        }

        function handleDirectionalIntent(delta) {
            isAnchorNavigating = false;

            if (window.scrollY <= 12) {
                showNavigation();
                return;
            }

            if (delta > 0) {
                hideNavigation();
            } else if (delta < 0) {
                showNavigation();
            }
        }

        function handleWheel(event) {
            handleDirectionalIntent(event.deltaY);
            lastScrollY = window.scrollY;
        }

        function handleTouchStart(event) {
            if (event.touches.length > 0) {
                isAnchorNavigating = false;
                lastTouchY = event.touches[0].clientY;
            }
        }

        function handleTouchMove(event) {
            if (event.touches.length === 0 || lastTouchY === null) {
                return;
            }

            const currentTouchY = event.touches[0].clientY;
            handleDirectionalIntent(lastTouchY - currentTouchY);
            lastTouchY = currentTouchY;
            lastScrollY = window.scrollY;
        }

        function handleKeydown(event) {
            const hideKeys = new Set(['ArrowDown', 'PageDown', 'End', ' ']);
            const showKeys = new Set(['ArrowUp', 'PageUp', 'Home']);

            if (hideKeys.has(event.key)) {
                handleDirectionalIntent(1);
            } else if (showKeys.has(event.key)) {
                handleDirectionalIntent(-1);
            }
        }

        function updateNavigationVisibility() {
            if (window.scrollY <= 12) {
                showNavigation();
            } else if (isAnchorNavigating) {
                showNavigation();
            }

            lastScrollY = window.scrollY;
        }

        nav.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', handleAnchorNavigation);
        });

        window.addEventListener('wheel', handleWheel, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('keydown', handleKeydown);
        window.addEventListener('scroll', updateNavigationVisibility, { passive: true });
        window.addEventListener('hashchange', () => {
            isAnchorNavigating = false;
            nav.classList.remove('site-nav-hidden');
            lastScrollY = window.scrollY;
        });
    }

    function clickEffects(event) {
        if (event.target.closest('.theme-toggle')) {
            return;
        }

        const words = [
            'CVPR+1',
            'ICCV+1',
            'ECCV+1',
            'ICML+1',
            'NeurIPS+1',
            'ICLR+1',
            'AAAI+1',
            'IJCAI+1',
            'ACM MM+1',
            'IEEE Transactions+1'
        ];

        const span = document.createElement('span');
        span.textContent = words[Math.floor(Math.random() * words.length)];
        span.style.position = 'absolute';
        span.style.left = `${event.pageX}px`;
        span.style.top = `${event.pageY}px`;
        span.style.fontWeight = '600';
        span.style.color = '#ae1324';
        span.style.zIndex = 9999;
        span.style.transition = 'all 1.2s ease-out';
        document.body.appendChild(span);

        setTimeout(() => {
            span.style.top = `${event.pageY - 60}px`;
            span.style.opacity = 0;
        }, 10);

        setTimeout(() => span.remove(), 1300);
    }

    async function renderMarkdown() {
        const response = await fetch(MARKDOWN_PATH);
        const markdown = await response.text();
        const converter = new showdown.Converter();
        document.getElementById('main-content').innerHTML = converter.makeHtml(markdown);
    }

    async function renderPage() {
        try {
            await renderMarkdown();
            processProfilePhoto();
            transformLegacyTables();
            await Promise.all([
                updateScholarBadge(),
                window.PublicationSite.renderFeaturedPublications('featured-publications-section'),
                window.NewsSite.renderRecentNews('recent-news-section')
            ]);
            buildNavigation();
            setupNavigationVisibility();
        } catch (error) {
            console.error('Error loading Markdown:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', renderPage);
    document.addEventListener('click', clickEffects);
})();
