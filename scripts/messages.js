(function () {
    const {
        createElement,
        createActionLink,
        getCurrentTheme
    } = window.SiteUiUtils;

    const GISCUS_CONFIG = {
        repo: 'AntXinyuan/antxinyuan.github.io',
        repoId: 'R_kgDOLi5vPQ',
        category: 'Announcements',
        categoryId: 'DIC_kwDOLi5vPc4C5AYx',
        mapping: 'specific',
        term: 'guestbook',
        reactionsEnabled: '1',
        emitMetadata: '0',
        inputPosition: 'top',
        lang: 'en',
        loading: 'lazy'
    };

    function isConfigured() {
        return ![GISCUS_CONFIG.repoId, GISCUS_CONFIG.categoryId].some(value => value.startsWith('REPLACE_WITH_'));
    }

    function getGiscusTheme() {
        return getCurrentTheme() === 'dark' ? 'dark_dimmed' : 'light';
    }

    function renderSetupNotice() {
        const status = document.getElementById('guestbook-status');
        if (!status) {
            return;
        }

        status.innerHTML = '';

        const card = createElement('section', 'guestbook-setup-card');
        card.appendChild(createElement('h2', 'guestbook-setup-title', 'Guestbook Setup Required'));
        card.appendChild(createElement(
            'p',
            'guestbook-setup-text',
            'Enable GitHub Discussions for this repository, create a Guestbook category, then replace the placeholder repo/category IDs in scripts/messages.js.'
        ));

        const actions = createElement('div', 'guestbook-setup-actions');
        actions.appendChild(createActionLink('Open giscus configuration guide', 'https://giscus.app/', 'publication-archive-link'));
        actions.appendChild(createActionLink('Open repository discussions', 'https://github.com/AntXinyuan/antxinyuan.github.io/discussions', 'publication-archive-link'));
        card.appendChild(actions);

        status.appendChild(card);
    }

    function loadGiscus() {
        const container = document.getElementById('guestbook-thread');
        if (!container) {
            return;
        }

        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.setAttribute('data-repo', GISCUS_CONFIG.repo);
        script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
        script.setAttribute('data-category', GISCUS_CONFIG.category);
        script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
        script.setAttribute('data-mapping', GISCUS_CONFIG.mapping);
        script.setAttribute('data-term', GISCUS_CONFIG.term);
        script.setAttribute('data-strict', '0');
        script.setAttribute('data-reactions-enabled', GISCUS_CONFIG.reactionsEnabled);
        script.setAttribute('data-emit-metadata', GISCUS_CONFIG.emitMetadata);
        script.setAttribute('data-input-position', GISCUS_CONFIG.inputPosition);
        script.setAttribute('data-theme', getGiscusTheme());
        script.setAttribute('data-lang', GISCUS_CONFIG.lang);
        script.setAttribute('data-loading', GISCUS_CONFIG.loading);

        container.appendChild(script);
    }

    function syncGiscusTheme() {
        const iframe = document.querySelector('iframe.giscus-frame');
        if (!iframe) {
            return;
        }

        iframe.contentWindow?.postMessage(
            {
                giscus: {
                    setConfig: {
                        theme: getGiscusTheme()
                    }
                }
            },
            'https://giscus.app'
        );
    }

    function renderGuestbook() {
        if (!isConfigured()) {
            renderSetupNotice();
            return;
        }

        loadGiscus();
        document.addEventListener('site-theme-change', syncGiscusTheme);
    }

    document.addEventListener('DOMContentLoaded', renderGuestbook);

    window.MessageBoardSite = {
        renderGuestbook
    };
})();
