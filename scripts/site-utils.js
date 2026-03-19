(function () {
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
        renderFilterBar
    };
})();
