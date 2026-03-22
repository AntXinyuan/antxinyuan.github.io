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
        reactionsEnabled: '1',
        emitMetadata: '0',
        inputPosition: 'top',
        lang: 'en',
        loading: 'lazy'
    };

    const GUESTBOOK_TOPICS = [
        {
            key: 'academic',
            label: 'Academic Research',
            term: 'academic-research'
        },
        {
            key: 'website',
            label: 'Website Building',
            term: 'website-building'
        },
        {
            key: 'daily',
            label: 'Daily Chat',
            term: 'daily-chat'
        }
    ];

    const DEFAULT_TOPIC_KEY = 'academic';
    const RECOVERABLE_GISCUS_ERRORS = [
        'Unable to retrieve token',
        'Bad credentials',
        'Invalid state value',
        'State has expired'
    ];

    let hasAttemptedSessionRecovery = false;
    let hasBoundThemeSync = false;
    let hasBoundMessageRecovery = false;

    function isConfigured() {
        return ![GISCUS_CONFIG.repoId, GISCUS_CONFIG.categoryId].some(value => value.startsWith('REPLACE_WITH_'));
    }

    function getTopicByKey(topicKey) {
        return GUESTBOOK_TOPICS.find(topic => topic.key === topicKey) || GUESTBOOK_TOPICS[0];
    }

    function getTopicFromLocation() {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash) {
            return getTopicByKey(hash);
        }

        const searchParams = new URLSearchParams(window.location.search);
        const topic = searchParams.get('topic');
        return topic ? getTopicByKey(topic) : getTopicByKey(DEFAULT_TOPIC_KEY);
    }

    function updateLocationForTopic(topicKey) {
        const url = new URL(window.location.href);
        url.hash = topicKey;
        window.history.replaceState({}, '', url);
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

    function renderStatusNotice(title, text) {
        const status = document.getElementById('guestbook-status');
        if (!status) {
            return;
        }

        status.innerHTML = '';

        const card = createElement('section', 'guestbook-setup-card');
        card.appendChild(createElement('h2', 'guestbook-setup-title', title));
        card.appendChild(createElement('p', 'guestbook-setup-text', text));
        status.appendChild(card);
    }

    function renderTopicTabs(activeTopicKey, onSelect) {
        const container = document.getElementById('guestbook-topic-tabs');
        if (!container) {
            return;
        }

        container.innerHTML = '';

        const tabBar = createElement('div', 'guestbook-topic-bar');
        GUESTBOOK_TOPICS.forEach(topic => {
            const button = createElement(
                'button',
                `guestbook-topic-tab${topic.key === activeTopicKey ? ' is-active' : ''}`,
                topic.label
            );
            button.type = 'button';
            button.setAttribute('aria-pressed', topic.key === activeTopicKey ? 'true' : 'false');
            button.addEventListener('click', () => onSelect(topic.key));
            tabBar.appendChild(button);
        });

        container.appendChild(tabBar);
    }

    function loadGiscus(topic) {
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
        script.setAttribute('data-term', topic.term);
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

    function clearSetupNotice() {
        const status = document.getElementById('guestbook-status');
        if (status) {
            status.innerHTML = '';
        }
    }

    function hasRecoverableGiscusError(message) {
        return RECOVERABLE_GISCUS_ERRORS.some(keyword => message.includes(keyword));
    }

    function bindGiscusRecovery(onRecover) {
        if (hasBoundMessageRecovery) {
            return;
        }

        window.addEventListener('message', event => {
            if (event.origin !== 'https://giscus.app') {
                return;
            }

            const payload = event.data;
            const errorMessage = payload?.giscus?.error;
            if (typeof errorMessage !== 'string' || !hasRecoverableGiscusError(errorMessage)) {
                return;
            }

            const storedSession = window.localStorage.getItem('giscus-session');
            if (!storedSession || hasAttemptedSessionRecovery) {
                return;
            }

            hasAttemptedSessionRecovery = true;
            window.localStorage.removeItem('giscus-session');
            renderStatusNotice(
                'Refreshing Guestbook Session',
                'A stale local GitHub discussion session was detected and has been cleared. Reloading the guestbook now.'
            );

            window.setTimeout(() => {
                clearSetupNotice();
                onRecover();
            }, 120);
        });

        hasBoundMessageRecovery = true;
    }

    function renderGuestbook() {
        if (!isConfigured()) {
            renderSetupNotice();
            return;
        }

        clearSetupNotice();

        let activeTopic = getTopicFromLocation();

        function renderTopic(topicKey) {
            activeTopic = getTopicByKey(topicKey);
            updateLocationForTopic(activeTopic.key);
            renderTopicTabs(activeTopic.key, renderTopic);
            loadGiscus(activeTopic);
        }

        renderTopic(activeTopic.key);
        if (!hasBoundThemeSync) {
            document.addEventListener('site-theme-change', syncGiscusTheme);
            hasBoundThemeSync = true;
        }

        bindGiscusRecovery(() => renderTopic(activeTopic.key));

        window.addEventListener('hashchange', () => {
            const nextTopic = getTopicFromLocation();
            if (nextTopic.key !== activeTopic.key) {
                renderTopic(nextTopic.key);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', renderGuestbook);

    window.MessageBoardSite = {
        renderGuestbook
    };
})();
