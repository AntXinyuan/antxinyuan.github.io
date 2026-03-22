(function () {
    const THEME_STORAGE_KEY = 'site-theme';

    function getStoredTheme() {
        try {
            return localStorage.getItem(THEME_STORAGE_KEY);
        } catch (error) {
            return null;
        }
    }

    function getPreferredTheme() {
        const storedTheme = getStoredTheme();
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.dispatchEvent(new CustomEvent('site-theme-change', {
            detail: { theme }
        }));
    }

    function persistTheme(theme) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            // Ignore storage write failures and keep the in-memory theme.
        }
    }

    function syncThemeToggleButtons() {
        const theme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
        const buttons = document.querySelectorAll('.theme-toggle');

        buttons.forEach(button => {
            const icon = button.querySelector('.theme-toggle-icon');
            const label = button.querySelector('.theme-toggle-label');
            const isDark = theme === 'dark';

            if (icon) {
                icon.textContent = isDark ? '☀' : '☾';
            }

            if (label) {
                label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
            }

            button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            button.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        });
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        persistTheme(nextTheme);
        syncThemeToggleButtons();
    }

    function ensureThemeToggle() {
        if (document.querySelector('.theme-toggle')) {
            syncThemeToggleButtons();
            return;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'theme-toggle';
        button.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true"></span><span class="theme-toggle-label"></span>';
        button.addEventListener('click', toggleTheme);
        document.body.appendChild(button);
        syncThemeToggleButtons();
    }

    function fetchJson(path) {
        return fetch(path).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.status}`);
            }
            return response.json();
        });
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

        if (/^https?:\/\//.test(url)) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }

        return link;
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

    function renderFilterBar(container, fields, onChange) {
        if (!container) {
            return;
        }

        container.innerHTML = '';

        const bar = createElement('div', 'publication-filter-bar');
        const selects = {};

        fields.forEach(field => {
            const fieldElement = createElement('label', 'publication-filter-field');
            fieldElement.appendChild(createElement('span', 'publication-filter-label', field.label));

            const select = createElement('select', field.selectClassName || 'publication-filter-select');
            const defaultOption = document.createElement('option');
            defaultOption.value = field.defaultValue ?? 'all';
            defaultOption.textContent = field.defaultLabel;
            select.appendChild(defaultOption);

            (field.options || []).forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.label;
                select.appendChild(option);
            });

            fieldElement.appendChild(select);
            bar.appendChild(fieldElement);
            selects[field.name] = select;
        });

        const resetButton = createElement('button', 'publication-filter-reset', 'Reset');
        resetButton.type = 'button';
        bar.appendChild(resetButton);

        const count = createElement('div', 'publication-filter-count');
        bar.appendChild(count);

        const triggerChange = () => {
            const values = Object.fromEntries(
                fields.map(field => [field.name, selects[field.name].value])
            );
            onChange({
                ...values,
                countElement: count
            });
        };

        fields.forEach(field => {
            selects[field.name].addEventListener('change', triggerChange);
        });

        resetButton.addEventListener('click', () => {
            fields.forEach(field => {
                selects[field.name].value = field.defaultValue ?? 'all';
            });
            triggerChange();
        });

        container.appendChild(bar);
        triggerChange();
    }

    window.SiteUiUtils = {
        fetchJson,
        createElement,
        createActionLink,
        getFilterOptions,
        renderHomepageArchiveIntro,
        renderFilterBar,
        ensureThemeToggle,
        applyTheme,
        getPreferredTheme,
        getCurrentTheme: () => document.documentElement.getAttribute('data-theme') || getPreferredTheme()
    };

    applyTheme(getPreferredTheme());

    ensureThemeToggle();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureThemeToggle);
    }
})();
