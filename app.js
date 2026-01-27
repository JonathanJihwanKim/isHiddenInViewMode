// PBIR Visual Manager - Main Application

class PBIRVisualManager {
    constructor() {
        this.folderHandle = null;
        this.visuals = [];
        this.pageDisplayNames = new Map();

        // Active tab state
        this.activeTab = 'filter-visibility';

        // Filter Visibility tab state
        this.filterHistory = [];
        this.filterSelectedVisuals = new Set();
        this.filterCurrentFilter = 'all';

        // Layer Order tab state
        this.layerHistory = [];
        this.layerSelectedVisuals = new Set();
        this.layerCurrentFilter = 'all';

        // Pro features state
        this.isProUser = false; // Will be set based on license validation

        // Presets state
        this.presets = this.loadPresets();
        this.builtInPresets = [
            { id: 'hide-all-filters', name: 'Hide All Filters', type: 'filter', value: true },
            { id: 'show-all-filters', name: 'Show All Filters', type: 'filter', value: false },
            { id: 'reset-all-filters', name: 'Reset All Filters', type: 'filter', value: undefined },
            { id: 'lock-all-layers', name: 'Lock All Layers', type: 'layer', value: true },
            { id: 'unlock-all-layers', name: 'Unlock All Layers', type: 'layer', value: false },
            { id: 'reset-all-layers', name: 'Reset All Layers', type: 'layer', value: undefined }
        ];

        this.initElements();
        this.checkBrowserSupport();
        this.bindEvents();
        this.renderPresetDropdowns();
    }

    initElements() {
        // Global buttons
        this.selectFolderBtn = document.getElementById('select-folder-btn');
        this.tabNavigation = document.getElementById('tab-navigation');

        // Sections
        this.emptyState = document.getElementById('empty-state');
        this.browserWarning = document.getElementById('browser-warning');

        // Display elements
        this.folderPath = document.getElementById('folder-path');

        // Modal elements
        this.docModal = document.getElementById('doc-modal');
        this.manualBtn = document.getElementById('manual-btn');
        this.closeModalBtn = document.getElementById('close-modal-btn');

        // Filter Visibility tab elements
        this.filterElements = {
            summarySection: document.getElementById('filter-summary-section'),
            actionsSection: document.getElementById('filter-actions-section'),
            tableSection: document.getElementById('filter-table-section'),
            saveSection: document.getElementById('filter-save-section'),
            historySection: document.getElementById('filter-history-section'),
            selectAllBtn: document.getElementById('filter-select-all-btn'),
            selectNoneBtn: document.getElementById('filter-select-none-btn'),
            setTrueBtn: document.getElementById('set-true-btn'),
            setFalseBtn: document.getElementById('set-false-btn'),
            removePropBtn: document.getElementById('filter-remove-prop-btn'),
            saveBtn: document.getElementById('filter-save-btn'),
            undoBtn: document.getElementById('filter-undo-btn'),
            undoAllBtn: document.getElementById('filter-undo-all-btn'),
            exportCsvBtn: document.getElementById('filter-export-csv-btn'),
            exportJsonBtn: document.getElementById('filter-export-json-btn'),
            headerCheckbox: document.getElementById('filter-header-checkbox'),
            statusFilter: document.getElementById('filter-status-filter'),
            visualsTbody: document.getElementById('filter-visuals-tbody'),
            modifiedStatus: document.getElementById('filter-modified-status'),
            historyStatus: document.getElementById('filter-history-status'),
            totalVisuals: document.getElementById('total-visuals'),
            totalFilters: document.getElementById('total-filters'),
            hiddenFilters: document.getElementById('hidden-filters'),
            visibleFilters: document.getElementById('visible-filters'),
            defaultFilters: document.getElementById('default-filters')
        };

        // Layer Order tab elements
        this.layerElements = {
            summarySection: document.getElementById('layer-summary-section'),
            actionsSection: document.getElementById('layer-actions-section'),
            tableSection: document.getElementById('layer-table-section'),
            saveSection: document.getElementById('layer-save-section'),
            historySection: document.getElementById('layer-history-section'),
            selectAllBtn: document.getElementById('layer-select-all-btn'),
            selectNoneBtn: document.getElementById('layer-select-none-btn'),
            setTrueBtn: document.getElementById('layer-set-true-btn'),
            setFalseBtn: document.getElementById('layer-set-false-btn'),
            removePropBtn: document.getElementById('layer-remove-prop-btn'),
            saveBtn: document.getElementById('layer-save-btn'),
            undoBtn: document.getElementById('layer-undo-btn'),
            undoAllBtn: document.getElementById('layer-undo-all-btn'),
            exportCsvBtn: document.getElementById('layer-export-csv-btn'),
            exportJsonBtn: document.getElementById('layer-export-json-btn'),
            headerCheckbox: document.getElementById('layer-header-checkbox'),
            statusFilter: document.getElementById('layer-status-filter'),
            visualsTbody: document.getElementById('layer-visuals-tbody'),
            modifiedStatus: document.getElementById('layer-modified-status'),
            historyStatus: document.getElementById('layer-history-status'),
            totalVisuals: document.getElementById('layer-total-visuals'),
            enabled: document.getElementById('layer-enabled'),
            disabled: document.getElementById('layer-disabled'),
            notSet: document.getElementById('layer-not-set')
        };
    }

    checkBrowserSupport() {
        if (!('showDirectoryPicker' in window)) {
            this.browserWarning.classList.remove('hidden');
            this.selectFolderBtn.disabled = true;
        }
    }

    bindEvents() {
        this.selectFolderBtn.addEventListener('click', () => this.selectFolder());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Modal events
        this.manualBtn.addEventListener('click', () => this.openDocModal());
        this.closeModalBtn.addEventListener('click', () => this.closeDocModal());
        this.docModal.addEventListener('click', (e) => {
            if (e.target === this.docModal) this.closeDocModal();
        });

        // Filter Visibility tab events
        this.filterElements.selectAllBtn.addEventListener('click', () => this.filterSelectAll());
        this.filterElements.selectNoneBtn.addEventListener('click', () => this.filterSelectNone());
        this.filterElements.setTrueBtn.addEventListener('click', () => this.filterBulkSetValue(true));
        this.filterElements.setFalseBtn.addEventListener('click', () => this.filterBulkSetValue(false));
        this.filterElements.removePropBtn.addEventListener('click', () => this.filterBulkSetValue(undefined));
        this.filterElements.saveBtn.addEventListener('click', () => this.saveChanges());
        this.filterElements.undoBtn.addEventListener('click', () => this.filterUndo());
        this.filterElements.undoAllBtn.addEventListener('click', () => this.filterUndoAll());
        this.filterElements.exportCsvBtn.addEventListener('click', () => this.exportFilterReport('csv'));
        this.filterElements.exportJsonBtn.addEventListener('click', () => this.exportFilterReport('json'));
        this.filterElements.headerCheckbox.addEventListener('change', (e) => this.filterToggleAllVisible(e.target.checked));
        this.filterElements.statusFilter.addEventListener('change', (e) => {
            this.filterCurrentFilter = e.target.value;
            this.renderFilterTable();
        });

        // Layer Order tab events
        this.layerElements.selectAllBtn.addEventListener('click', () => this.layerSelectAll());
        this.layerElements.selectNoneBtn.addEventListener('click', () => this.layerSelectNone());
        this.layerElements.setTrueBtn.addEventListener('click', () => this.layerBulkSetValue(true));
        this.layerElements.setFalseBtn.addEventListener('click', () => this.layerBulkSetValue(false));
        this.layerElements.removePropBtn.addEventListener('click', () => this.layerBulkSetValue(undefined));
        this.layerElements.saveBtn.addEventListener('click', () => this.saveChanges());
        this.layerElements.undoBtn.addEventListener('click', () => this.layerUndo());
        this.layerElements.undoAllBtn.addEventListener('click', () => this.layerUndoAll());
        this.layerElements.exportCsvBtn.addEventListener('click', () => this.exportLayerReport('csv'));
        this.layerElements.exportJsonBtn.addEventListener('click', () => this.exportLayerReport('json'));
        this.layerElements.headerCheckbox.addEventListener('change', (e) => this.layerToggleAllVisible(e.target.checked));
        this.layerElements.statusFilter.addEventListener('change', (e) => {
            this.layerCurrentFilter = e.target.value;
            this.renderLayerTable();
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            const isActive = content.id === `tab-${tabId}`;
            content.classList.toggle('active', isActive);
            content.classList.toggle('hidden', !isActive);
        });
    }

    async selectFolder() {
        try {
            this.folderHandle = await window.showDirectoryPicker();
            this.folderPath.textContent = this.folderHandle.name;
            await this.scanVisuals();
        } catch (err) {
            if (err.name !== 'AbortError') {
                this.showToast('Error selecting folder: ' + err.message, 'error');
            }
        }
    }

    async scanVisuals() {
        this.visuals = [];
        this.filterHistory = [];
        this.layerHistory = [];
        this.filterSelectedVisuals.clear();
        this.layerSelectedVisuals.clear();
        this.pageDisplayNames.clear();

        try {
            // Pass 1: Collect all page display names first
            await this.collectPageDisplayNames(this.folderHandle, '');

            // Pass 2: Process visual.json files
            await this.scanForVisuals(this.folderHandle, '');

            if (this.visuals.length === 0) {
                this.showEmptyState();
            } else {
                this.showContent();
                this.updateFilterSummary();
                this.updateLayerSummary();
                this.renderFilterTable();
                this.renderLayerTable();
            }
        } catch (err) {
            this.showToast('Error scanning folder: ' + err.message, 'error');
        }
    }

    async collectPageDisplayNames(dirHandle, currentPath, depth = 0) {
        // Limit recursion depth to prevent stack overflow from circular symlinks
        const MAX_DEPTH = 50;
        if (depth >= MAX_DEPTH) {
            console.warn(`Max directory depth (${MAX_DEPTH}) reached at: ${currentPath}`);
            return;
        }

        for await (const entry of dirHandle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            if (entry.kind === 'directory') {
                await this.collectPageDisplayNames(entry, entryPath, depth + 1);
            } else if (entry.kind === 'file' && entry.name === 'page.json') {
                await this.readPageDisplayName(entry, currentPath);
            }
        }
    }

    async scanForVisuals(dirHandle, currentPath, depth = 0) {
        // Limit recursion depth to prevent stack overflow from circular symlinks
        const MAX_DEPTH = 50;
        if (depth >= MAX_DEPTH) {
            console.warn(`Max directory depth (${MAX_DEPTH}) reached at: ${currentPath}`);
            return;
        }

        for await (const entry of dirHandle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            if (entry.kind === 'directory') {
                await this.scanForVisuals(entry, entryPath, depth + 1);
            } else if (entry.kind === 'file' && entry.name === 'visual.json') {
                await this.processJsonFile(entry, entryPath);
            }
        }
    }

    async readPageDisplayName(fileHandle, folderPath) {
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            const json = JSON.parse(content);

            if (json.displayName) {
                const pathParts = folderPath.split('/');
                const pageId = pathParts[pathParts.length - 1];
                this.pageDisplayNames.set(pageId, json.displayName);
            }
        } catch (err) {
            // Log to console for debugging, but don't show toast for page.json (non-critical)
            console.warn(`Could not read page.json at ${folderPath}: ${err.message}`);
        }
    }

    async processJsonFile(fileHandle, filePath) {
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            const json = JSON.parse(content);

            const pathParts = filePath.split('/');

            let pageName = '';
            let visualId = '';

            const pagesIndex = pathParts.indexOf('pages');
            const visualsIndex = pathParts.indexOf('visuals');

            if (pagesIndex !== -1 && pagesIndex + 1 < pathParts.length) {
                pageName = pathParts[pagesIndex + 1];
            }

            if (visualsIndex !== -1 && visualsIndex + 1 < pathParts.length) {
                visualId = pathParts[visualsIndex + 1];
            }

            if (!pageName && pathParts.length >= 2) {
                pageName = pathParts.length >= 4 ? pathParts[pathParts.length - 4] : pathParts[0];
            }

            if (!visualId && pathParts.length >= 2) {
                visualId = pathParts[pathParts.length - 2];
            }

            if (!visualId) {
                visualId = fileHandle.name.replace('.json', '');
            }

            const pageDisplayName = this.pageDisplayNames.get(pageName) || pageName || 'Unknown';

            const visual = {
                path: filePath,
                fileName: fileHandle.name,
                pageName: pageName || 'Unknown',
                pageDisplayName: pageDisplayName,
                visualId: visualId,
                visualType: this.getVisualType(json),
                visualName: this.getVisualName(json),
                filters: this.extractFilters(json),
                keepLayerOrder: this.extractKeepLayerOrder(json),
                fileHandle: fileHandle,
                originalJson: JSON.parse(content),
                currentJson: json,
                filterModified: false,
                layerModified: false
            };

            this.visuals.push(visual);
        } catch (err) {
            console.error(`Error parsing ${filePath}:`, err);
            this.showToast(`Skipped invalid file: ${filePath.split('/').pop()}`, 'error');
        }
    }

    getVisualType(json) {
        if (json.visual && json.visual.visualType) {
            return json.visual.visualType;
        }
        if (json.visualType) {
            return json.visualType;
        }
        if (json.singleVisual && json.singleVisual.visualType) {
            return json.singleVisual.visualType;
        }
        return 'unknown';
    }

    getVisualName(json) {
        if (json.visual?.visualContainerObjects?.title) {
            const titleProps = json.visual.visualContainerObjects.title[0]?.properties;
            if (titleProps?.text?.expr?.Literal?.Value) {
                return titleProps.text.expr.Literal.Value.replace(/^'|'$/g, '');
            }
        }

        if (json.name) {
            return json.name;
        }
        if (json.visual && json.visual.name) {
            return json.visual.name;
        }
        return '';
    }

    extractFilters(json) {
        const filters = [];

        if (json.filterConfig && Array.isArray(json.filterConfig.filters)) {
            for (const filter of json.filterConfig.filters) {
                filters.push({
                    name: filter.name || 'Unnamed Filter',
                    field: this.getFilterField(filter),
                    type: filter.type || 'Unknown',
                    isHiddenInViewMode: filter.isHiddenInViewMode
                });
            }
        }

        if (Array.isArray(json.filters)) {
            for (const filter of json.filters) {
                filters.push({
                    name: filter.name || 'Unnamed Filter',
                    field: this.getFilterField(filter),
                    type: filter.type || 'Unknown',
                    isHiddenInViewMode: filter.isHiddenInViewMode
                });
            }
        }

        return filters;
    }

    extractKeepLayerOrder(json) {
        // Path: visual.visualContainerObjects.general[0].properties.keepLayerOrder.expr.Literal.Value
        const general = json.visual?.visualContainerObjects?.general;
        if (Array.isArray(general) && general[0]?.properties?.keepLayerOrder) {
            const value = general[0].properties.keepLayerOrder.expr?.Literal?.Value;
            if (value === 'true') return true;
            if (value === 'false') return false;
        }
        return undefined;
    }

    getFilterField(filter) {
        if (filter.field) {
            if (typeof filter.field === 'string') return filter.field;
            if (filter.field.Column) return filter.field.Column.Property || '';
            if (filter.field.Measure) return filter.field.Measure.Property || '';
        }
        return '';
    }

    // ==================== Filter Visibility Methods ====================

    getVisualFilterStatus(visual) {
        if (visual.filters.length === 0) {
            return 'no-filters';
        }

        const statuses = visual.filters.map(f => {
            if (f.isHiddenInViewMode === true) return 'hidden';
            if (f.isHiddenInViewMode === false) return 'visible';
            return 'default';
        });

        const unique = [...new Set(statuses)];
        if (unique.length > 1) return 'mixed';
        return unique[0];
    }

    getFilterStatusDisplay(status) {
        switch (status) {
            case 'hidden': return { text: 'Hidden', class: 'status-hidden' };
            case 'visible': return { text: 'Visible', class: 'status-visible' };
            case 'default': return { text: 'Default', class: 'status-default' };
            case 'mixed': return { text: 'Mixed', class: 'status-mixed' };
            case 'no-filters': return { text: 'No Filters', class: 'status-no-filters' };
            default: return { text: status, class: 'status-default' };
        }
    }

    getFilteredVisualsForFilterTab() {
        if (this.filterCurrentFilter === 'all') {
            return this.visuals;
        }
        return this.visuals.filter(v => this.getVisualFilterStatus(v) === this.filterCurrentFilter);
    }

    renderFilterTable() {
        const filtered = this.getFilteredVisualsForFilterTab();
        this.filterElements.visualsTbody.innerHTML = '';

        for (const visual of filtered) {
            const status = this.getVisualFilterStatus(visual);
            const statusDisplay = this.getFilterStatusDisplay(status);
            const isSelected = this.filterSelectedVisuals.has(visual.path);

            const row = document.createElement('tr');
            row.className = isSelected ? 'selected' : '';
            row.dataset.path = visual.path;

            row.innerHTML = `
                <td class="col-checkbox">
                    <input type="checkbox" class="visual-checkbox" data-path="${visual.path}" ${isSelected ? 'checked' : ''}>
                </td>
                <td class="col-expand">
                    ${visual.filters.length > 0 ?
                        `<button class="expand-btn" data-path="${visual.path}">&#9654;</button>` :
                        ''}
                </td>
                <td class="col-page" title="${this.escapeHtml(visual.path)}">${this.escapeHtml(visual.pageDisplayName)}</td>
                <td class="col-visual" title="${this.escapeHtml(visual.visualId)}">${this.escapeHtml(visual.visualName || visual.visualId)}</td>
                <td class="col-type">${this.escapeHtml(visual.visualType)}</td>
                <td class="col-filters">${visual.filters.length}</td>
                <td class="col-status">
                    <span class="status-badge ${statusDisplay.class}">${statusDisplay.text}</span>
                    ${visual.filterModified ? ' *' : ''}
                </td>
            `;

            this.filterElements.visualsTbody.appendChild(row);

            const checkbox = row.querySelector('.visual-checkbox');
            checkbox.addEventListener('change', (e) => this.filterToggleSelection(visual.path, e.target.checked));

            const expandBtn = row.querySelector('.expand-btn');
            if (expandBtn) {
                expandBtn.addEventListener('click', () => this.filterToggleExpand(visual.path, expandBtn));
            }
        }

        this.updateFilterSelectionButtons();
        this.updateFilterHeaderCheckbox();
    }

    filterToggleExpand(path, button) {
        const visual = this.visuals.find(v => v.path === path);
        if (!visual || visual.filters.length === 0) return;

        const existingDetails = document.querySelector(`.filter-details-row[data-path="${path}"]`);
        if (existingDetails) {
            existingDetails.remove();
            button.classList.remove('expanded');
            return;
        }

        button.classList.add('expanded');

        const mainRow = button.closest('tr');
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'filter-details-row';
        detailsRow.dataset.path = path;

        let filterRows = '';
        for (let i = 0; i < visual.filters.length; i++) {
            const filter = visual.filters[i];
            const currentValue = filter.isHiddenInViewMode;

            filterRows += `
                <tr>
                    <td>${this.escapeHtml(filter.name)}</td>
                    <td>${this.escapeHtml(filter.field)}</td>
                    <td>${this.escapeHtml(filter.type)}</td>
                    <td>
                        <select class="filter-status-select" data-path="${path}" data-index="${i}">
                            <option value="undefined" ${currentValue === undefined ? 'selected' : ''}>Default (not set)</option>
                            <option value="true" ${currentValue === true ? 'selected' : ''}>Hidden (true)</option>
                            <option value="false" ${currentValue === false ? 'selected' : ''}>Visible (false)</option>
                        </select>
                    </td>
                </tr>
            `;
        }

        detailsRow.innerHTML = `
            <td colspan="7">
                <div class="filter-details">
                    <table class="filter-details-table">
                        <thead>
                            <tr>
                                <th>Filter Name</th>
                                <th>Field</th>
                                <th>Type</th>
                                <th>isHiddenInViewMode</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filterRows}
                        </tbody>
                    </table>
                </div>
            </td>
        `;

        mainRow.after(detailsRow);

        const selects = detailsRow.querySelectorAll('.filter-status-select');
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                const filterIndex = parseInt(e.target.dataset.index);
                let newValue;
                if (e.target.value === 'true') newValue = true;
                else if (e.target.value === 'false') newValue = false;
                else newValue = undefined;

                this.updateSingleFilter(path, filterIndex, newValue);
            });
        });
    }

    updateSingleFilter(path, filterIndex, newValue) {
        const visual = this.visuals.find(v => v.path === path);
        if (!visual) return;

        // Bounds check for filter index
        if (filterIndex < 0 || filterIndex >= visual.filters.length) return;

        const oldValue = visual.filters[filterIndex].isHiddenInViewMode;
        if (oldValue === newValue) return;

        this.filterHistory.push({
            type: 'single',
            visualPath: path,
            filterIndex: filterIndex,
            filterName: visual.filters[filterIndex].name,
            oldValue: oldValue,
            newValue: newValue,
            timestamp: new Date()
        });

        visual.filters[filterIndex].isHiddenInViewMode = newValue;
        this.applyFilterToJson(visual);
        visual.filterModified = true;

        this.updateFilterSummary();
        this.updateFilterModifiedStatus();
        this.updateFilterHistoryStatus();
        this.renderFilterTable();
    }

    applyFilterToJson(visual) {
        if (visual.currentJson.filterConfig && Array.isArray(visual.currentJson.filterConfig.filters)) {
            for (let i = 0; i < visual.filters.length; i++) {
                const filter = visual.filters[i];
                const jsonFilter = visual.currentJson.filterConfig.filters[i];
                if (jsonFilter) {
                    if (filter.isHiddenInViewMode === undefined) {
                        delete jsonFilter.isHiddenInViewMode;
                    } else {
                        jsonFilter.isHiddenInViewMode = filter.isHiddenInViewMode;
                    }
                }
            }
        }

        if (Array.isArray(visual.currentJson.filters)) {
            for (let i = 0; i < visual.filters.length; i++) {
                const filter = visual.filters[i];
                const jsonFilter = visual.currentJson.filters[i];
                if (jsonFilter) {
                    if (filter.isHiddenInViewMode === undefined) {
                        delete jsonFilter.isHiddenInViewMode;
                    } else {
                        jsonFilter.isHiddenInViewMode = filter.isHiddenInViewMode;
                    }
                }
            }
        }
    }

    filterToggleSelection(path, selected) {
        if (selected) {
            this.filterSelectedVisuals.add(path);
        } else {
            this.filterSelectedVisuals.delete(path);
        }

        const row = this.filterElements.visualsTbody.querySelector(`tr[data-path="${path}"]`);
        if (row) {
            row.classList.toggle('selected', selected);
        }

        this.updateFilterSelectionButtons();
        this.updateFilterHeaderCheckbox();
    }

    filterToggleAllVisible(selected) {
        const filtered = this.getFilteredVisualsForFilterTab();
        for (const visual of filtered) {
            if (selected) {
                this.filterSelectedVisuals.add(visual.path);
            } else {
                this.filterSelectedVisuals.delete(visual.path);
            }
        }
        this.renderFilterTable();
    }

    filterSelectAll() {
        const filtered = this.getFilteredVisualsForFilterTab();
        for (const visual of filtered) {
            this.filterSelectedVisuals.add(visual.path);
        }
        this.renderFilterTable();
    }

    filterSelectNone() {
        this.filterSelectedVisuals.clear();
        this.renderFilterTable();
    }

    updateFilterSelectionButtons() {
        const hasSelection = this.filterSelectedVisuals.size > 0;
        this.filterElements.setTrueBtn.disabled = !hasSelection;
        this.filterElements.setFalseBtn.disabled = !hasSelection;
        this.filterElements.removePropBtn.disabled = !hasSelection;

        // Update action hint visibility
        const actionHint = document.getElementById('filter-action-hint');
        if (actionHint) {
            actionHint.style.display = hasSelection ? 'none' : 'block';
        }
    }

    updateFilterHeaderCheckbox() {
        const filtered = this.getFilteredVisualsForFilterTab();
        const allSelected = filtered.length > 0 && filtered.every(v => this.filterSelectedVisuals.has(v.path));
        const someSelected = filtered.some(v => this.filterSelectedVisuals.has(v.path));

        this.filterElements.headerCheckbox.checked = allSelected;
        this.filterElements.headerCheckbox.indeterminate = someSelected && !allSelected;
    }

    filterBulkSetValue(value) {
        if (this.filterSelectedVisuals.size === 0) return;

        const changes = [];

        for (const path of this.filterSelectedVisuals) {
            const visual = this.visuals.find(v => v.path === path);
            if (!visual || visual.filters.length === 0) continue;

            for (let i = 0; i < visual.filters.length; i++) {
                const filter = visual.filters[i];
                const oldValue = filter.isHiddenInViewMode;

                if (oldValue !== value) {
                    changes.push({
                        type: 'bulk',
                        visualPath: path,
                        filterIndex: i,
                        filterName: filter.name,
                        oldValue: oldValue,
                        newValue: value
                    });

                    filter.isHiddenInViewMode = value;
                }
            }

            this.applyFilterToJson(visual);
            visual.filterModified = true;
        }

        if (changes.length > 0) {
            this.filterHistory.push({
                type: 'bulk',
                changes: changes,
                value: value,
                timestamp: new Date()
            });
        }

        this.updateFilterSummary();
        this.updateFilterModifiedStatus();
        this.updateFilterHistoryStatus();
        this.renderFilterTable();

        const valueText = value === true ? 'hidden' : (value === false ? 'visible' : 'default');
        this.showToast(`Set ${changes.length} filter(s) to ${valueText}`, 'success');
    }

    filterUndo() {
        if (this.filterHistory.length === 0) return;

        const entry = this.filterHistory.pop();

        if (entry.type === 'bulk') {
            // Validate entry.changes exists and is an array
            if (!entry.changes || !Array.isArray(entry.changes)) return;

            for (const change of entry.changes) {
                const visual = this.visuals.find(v => v.path === change.visualPath);
                // Bounds check for filter index
                if (visual && change.filterIndex >= 0 && change.filterIndex < visual.filters.length) {
                    visual.filters[change.filterIndex].isHiddenInViewMode = change.oldValue;
                    this.applyFilterToJson(visual);
                }
            }
        } else if (entry.type === 'single') {
            const visual = this.visuals.find(v => v.path === entry.visualPath);
            // Bounds check for filter index
            if (visual && entry.filterIndex >= 0 && entry.filterIndex < visual.filters.length) {
                visual.filters[entry.filterIndex].isHiddenInViewMode = entry.oldValue;
                this.applyFilterToJson(visual);
            }
        }

        this.checkFilterModifications();
        this.updateFilterSummary();
        this.updateFilterModifiedStatus();
        this.updateFilterHistoryStatus();
        this.renderFilterTable();

        this.showToast('Change undone', 'success');
    }

    filterUndoAll() {
        if (this.filterHistory.length === 0) return;

        for (const visual of this.visuals) {
            visual.currentJson = JSON.parse(JSON.stringify(visual.originalJson));
            visual.filters = this.extractFilters(visual.currentJson);
            visual.keepLayerOrder = this.extractKeepLayerOrder(visual.currentJson);
            visual.filterModified = false;
        }

        this.filterHistory = [];
        this.updateFilterSummary();
        this.updateFilterModifiedStatus();
        this.updateFilterHistoryStatus();
        this.renderFilterTable();

        this.showToast('All filter changes undone', 'success');
    }

    checkFilterModifications() {
        for (const visual of this.visuals) {
            const originalFilters = this.extractFilters(visual.originalJson);
            let hasChanges = false;

            for (let i = 0; i < visual.filters.length; i++) {
                if (visual.filters[i].isHiddenInViewMode !== originalFilters[i]?.isHiddenInViewMode) {
                    hasChanges = true;
                    break;
                }
            }

            visual.filterModified = hasChanges;
        }
    }

    updateFilterSummary() {
        let totalFilters = 0;
        let hiddenCount = 0;
        let visibleCount = 0;
        let defaultCount = 0;

        for (const visual of this.visuals) {
            totalFilters += visual.filters.length;
            for (const filter of visual.filters) {
                if (filter.isHiddenInViewMode === true) hiddenCount++;
                else if (filter.isHiddenInViewMode === false) visibleCount++;
                else defaultCount++;
            }
        }

        this.filterElements.totalVisuals.textContent = this.visuals.length;
        this.filterElements.totalFilters.textContent = totalFilters;
        this.filterElements.hiddenFilters.textContent = hiddenCount;
        this.filterElements.visibleFilters.textContent = visibleCount;
        this.filterElements.defaultFilters.textContent = defaultCount;
    }

    updateFilterModifiedStatus() {
        const modifiedCount = this.visuals.filter(v => v.filterModified).length;

        if (modifiedCount === 0) {
            this.filterElements.modifiedStatus.textContent = 'No changes';
            this.filterElements.modifiedStatus.classList.remove('has-changes');
            this.filterElements.saveBtn.disabled = true;
        } else {
            this.filterElements.modifiedStatus.textContent = `${modifiedCount} file(s) modified`;
            this.filterElements.modifiedStatus.classList.add('has-changes');
            this.filterElements.saveBtn.disabled = false;
        }
    }

    updateFilterHistoryStatus() {
        this.filterElements.historyStatus.textContent = `History: ${this.filterHistory.length} change(s)`;
        this.filterElements.undoBtn.disabled = this.filterHistory.length === 0;
        this.filterElements.undoAllBtn.disabled = this.filterHistory.length === 0;
    }

    exportFilterReport(format) {
        const data = this.visuals.map(v => ({
            path: v.path,
            pageDisplayName: v.pageDisplayName,
            visualId: v.visualId,
            visualName: v.visualName || v.visualId,
            visualType: v.visualType,
            filterCount: v.filters.length,
            status: this.getVisualFilterStatus(v),
            filters: v.filters.map(f => ({
                name: f.name,
                field: f.field,
                type: f.type,
                isHiddenInViewMode: f.isHiddenInViewMode
            }))
        }));

        let content, filename, type;

        if (format === 'csv') {
            const rows = [['Page', 'Visual', 'Visual Type', 'Filter Count', 'Status', 'Filter Name', 'Filter Field', 'Filter Type', 'isHiddenInViewMode', 'Path']];

            for (const visual of data) {
                if (visual.filters.length === 0) {
                    rows.push([
                        visual.pageDisplayName,
                        visual.visualName,
                        visual.visualType,
                        visual.filterCount,
                        visual.status,
                        '', '', '', '',
                        visual.path
                    ]);
                } else {
                    for (const filter of visual.filters) {
                        rows.push([
                            visual.pageDisplayName,
                            visual.visualName,
                            visual.visualType,
                            visual.filterCount,
                            visual.status,
                            filter.name,
                            filter.field,
                            filter.type,
                            filter.isHiddenInViewMode === undefined ? '' : filter.isHiddenInViewMode,
                            visual.path
                        ]);
                    }
                }
            }

            content = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
            filename = 'filter-visibility-report.csv';
            type = 'text/csv';
        } else {
            content = JSON.stringify(data, null, 2);
            filename = 'filter-visibility-report.json';
            type = 'application/json';
        }

        this.downloadFile(content, filename, type);
        this.showToast(`Exported ${format.toUpperCase()} report`, 'success');
    }

    // ==================== Layer Order Methods ====================

    getLayerOrderStatus(visual) {
        if (visual.keepLayerOrder === true) return 'enabled';
        if (visual.keepLayerOrder === false) return 'disabled';
        return 'not-set';
    }

    getLayerStatusDisplay(status) {
        switch (status) {
            case 'enabled': return { text: 'Enabled', class: 'status-visible' };
            case 'disabled': return { text: 'Disabled', class: 'status-hidden' };
            case 'not-set': return { text: 'Not Set', class: 'status-default' };
            default: return { text: status, class: 'status-default' };
        }
    }

    getFilteredVisualsForLayerTab() {
        if (this.layerCurrentFilter === 'all') {
            return this.visuals;
        }
        return this.visuals.filter(v => this.getLayerOrderStatus(v) === this.layerCurrentFilter);
    }

    renderLayerTable() {
        const filtered = this.getFilteredVisualsForLayerTab();
        this.layerElements.visualsTbody.innerHTML = '';

        for (const visual of filtered) {
            const status = this.getLayerOrderStatus(visual);
            const statusDisplay = this.getLayerStatusDisplay(status);
            const isSelected = this.layerSelectedVisuals.has(visual.path);

            const row = document.createElement('tr');
            row.className = isSelected ? 'selected' : '';
            row.dataset.path = visual.path;

            row.innerHTML = `
                <td class="col-checkbox">
                    <input type="checkbox" class="layer-checkbox" data-path="${visual.path}" ${isSelected ? 'checked' : ''}>
                </td>
                <td class="col-page" title="${this.escapeHtml(visual.path)}">${this.escapeHtml(visual.pageDisplayName)}</td>
                <td class="col-visual" title="${this.escapeHtml(visual.visualId)}">${this.escapeHtml(visual.visualName || visual.visualId)}</td>
                <td class="col-type">${this.escapeHtml(visual.visualType)}</td>
                <td class="col-status">
                    <span class="status-badge ${statusDisplay.class}">${statusDisplay.text}</span>
                    ${visual.layerModified ? ' *' : ''}
                </td>
            `;

            this.layerElements.visualsTbody.appendChild(row);

            const checkbox = row.querySelector('.layer-checkbox');
            checkbox.addEventListener('change', (e) => this.layerToggleSelection(visual.path, e.target.checked));
        }

        this.updateLayerSelectionButtons();
        this.updateLayerHeaderCheckbox();
    }

    layerToggleSelection(path, selected) {
        if (selected) {
            this.layerSelectedVisuals.add(path);
        } else {
            this.layerSelectedVisuals.delete(path);
        }

        const row = this.layerElements.visualsTbody.querySelector(`tr[data-path="${path}"]`);
        if (row) {
            row.classList.toggle('selected', selected);
        }

        this.updateLayerSelectionButtons();
        this.updateLayerHeaderCheckbox();
    }

    layerToggleAllVisible(selected) {
        const filtered = this.getFilteredVisualsForLayerTab();
        for (const visual of filtered) {
            if (selected) {
                this.layerSelectedVisuals.add(visual.path);
            } else {
                this.layerSelectedVisuals.delete(visual.path);
            }
        }
        this.renderLayerTable();
    }

    layerSelectAll() {
        const filtered = this.getFilteredVisualsForLayerTab();
        for (const visual of filtered) {
            this.layerSelectedVisuals.add(visual.path);
        }
        this.renderLayerTable();
    }

    layerSelectNone() {
        this.layerSelectedVisuals.clear();
        this.renderLayerTable();
    }

    updateLayerSelectionButtons() {
        const hasSelection = this.layerSelectedVisuals.size > 0;
        this.layerElements.setTrueBtn.disabled = !hasSelection;
        this.layerElements.setFalseBtn.disabled = !hasSelection;
        this.layerElements.removePropBtn.disabled = !hasSelection;

        // Update action hint visibility
        const actionHint = document.getElementById('layer-action-hint');
        if (actionHint) {
            actionHint.style.display = hasSelection ? 'none' : 'block';
        }
    }

    updateLayerHeaderCheckbox() {
        const filtered = this.getFilteredVisualsForLayerTab();
        const allSelected = filtered.length > 0 && filtered.every(v => this.layerSelectedVisuals.has(v.path));
        const someSelected = filtered.some(v => this.layerSelectedVisuals.has(v.path));

        this.layerElements.headerCheckbox.checked = allSelected;
        this.layerElements.headerCheckbox.indeterminate = someSelected && !allSelected;
    }

    layerBulkSetValue(value) {
        if (this.layerSelectedVisuals.size === 0) return;

        const changes = [];

        for (const path of this.layerSelectedVisuals) {
            const visual = this.visuals.find(v => v.path === path);
            if (!visual) continue;

            const oldValue = visual.keepLayerOrder;

            if (oldValue !== value) {
                changes.push({
                    visualPath: path,
                    oldValue: oldValue,
                    newValue: value
                });

                visual.keepLayerOrder = value;
                this.applyKeepLayerOrderToJson(visual, value);
                visual.layerModified = true;
            }
        }

        if (changes.length > 0) {
            this.layerHistory.push({
                type: 'bulk',
                changes: changes,
                value: value,
                timestamp: new Date()
            });
        }

        this.updateLayerSummary();
        this.updateLayerModifiedStatus();
        this.updateLayerHistoryStatus();
        this.renderLayerTable();

        const valueText = value === true ? 'enabled' : (value === false ? 'disabled' : 'removed');
        this.showToast(`Set keepLayerOrder to ${valueText} for ${changes.length} visual(s)`, 'success');
    }

    applyKeepLayerOrderToJson(visual, value) {
        // Ensure path exists
        if (!visual.currentJson.visual) visual.currentJson.visual = {};
        if (!visual.currentJson.visual.visualContainerObjects) {
            visual.currentJson.visual.visualContainerObjects = {};
        }

        const vco = visual.currentJson.visual.visualContainerObjects;

        if (value === undefined) {
            // Remove the property
            if (vco.general?.[0]?.properties?.keepLayerOrder) {
                delete vco.general[0].properties.keepLayerOrder;
                // Clean up empty objects
                if (Object.keys(vco.general[0].properties).length === 0) {
                    delete vco.general[0].properties;
                }
                if (vco.general[0] && Object.keys(vco.general[0]).length === 0) {
                    vco.general.shift();
                }
                if (vco.general && vco.general.length === 0) {
                    delete vco.general;
                }
            }
        } else {
            // Set the property
            if (!vco.general) vco.general = [];
            if (vco.general.length === 0) vco.general.push({});
            if (!vco.general[0].properties) vco.general[0].properties = {};

            vco.general[0].properties.keepLayerOrder = {
                expr: { Literal: { Value: value.toString() } }
            };
        }
    }

    layerUndo() {
        if (this.layerHistory.length === 0) return;

        const entry = this.layerHistory.pop();

        if (entry.type === 'bulk') {
            // Validate entry.changes exists and is an array
            if (!entry.changes || !Array.isArray(entry.changes)) return;

            for (const change of entry.changes) {
                const visual = this.visuals.find(v => v.path === change.visualPath);
                if (visual) {
                    visual.keepLayerOrder = change.oldValue;
                    this.applyKeepLayerOrderToJson(visual, change.oldValue);
                }
            }
        }

        this.checkLayerModifications();
        this.updateLayerSummary();
        this.updateLayerModifiedStatus();
        this.updateLayerHistoryStatus();
        this.renderLayerTable();

        this.showToast('Change undone', 'success');
    }

    layerUndoAll() {
        if (this.layerHistory.length === 0) return;

        for (const visual of this.visuals) {
            visual.currentJson = JSON.parse(JSON.stringify(visual.originalJson));
            visual.filters = this.extractFilters(visual.currentJson);
            visual.keepLayerOrder = this.extractKeepLayerOrder(visual.currentJson);
            visual.layerModified = false;
        }

        this.layerHistory = [];
        this.updateLayerSummary();
        this.updateLayerModifiedStatus();
        this.updateLayerHistoryStatus();
        this.renderLayerTable();

        this.showToast('All layer order changes undone', 'success');
    }

    checkLayerModifications() {
        for (const visual of this.visuals) {
            const originalKeepLayerOrder = this.extractKeepLayerOrder(visual.originalJson);
            visual.layerModified = visual.keepLayerOrder !== originalKeepLayerOrder;
        }
    }

    updateLayerSummary() {
        let enabled = 0, disabled = 0, notSet = 0;

        for (const visual of this.visuals) {
            if (visual.keepLayerOrder === true) enabled++;
            else if (visual.keepLayerOrder === false) disabled++;
            else notSet++;
        }

        this.layerElements.totalVisuals.textContent = this.visuals.length;
        this.layerElements.enabled.textContent = enabled;
        this.layerElements.disabled.textContent = disabled;
        this.layerElements.notSet.textContent = notSet;
    }

    updateLayerModifiedStatus() {
        const modifiedCount = this.visuals.filter(v => v.layerModified).length;

        if (modifiedCount === 0) {
            this.layerElements.modifiedStatus.textContent = 'No changes';
            this.layerElements.modifiedStatus.classList.remove('has-changes');
            this.layerElements.saveBtn.disabled = true;
        } else {
            this.layerElements.modifiedStatus.textContent = `${modifiedCount} file(s) modified`;
            this.layerElements.modifiedStatus.classList.add('has-changes');
            this.layerElements.saveBtn.disabled = false;
        }
    }

    updateLayerHistoryStatus() {
        this.layerElements.historyStatus.textContent = `History: ${this.layerHistory.length} change(s)`;
        this.layerElements.undoBtn.disabled = this.layerHistory.length === 0;
        this.layerElements.undoAllBtn.disabled = this.layerHistory.length === 0;
    }

    exportLayerReport(format) {
        const data = this.visuals.map(v => ({
            path: v.path,
            pageDisplayName: v.pageDisplayName,
            visualId: v.visualId,
            visualName: v.visualName || v.visualId,
            visualType: v.visualType,
            keepLayerOrder: v.keepLayerOrder,
            status: this.getLayerOrderStatus(v)
        }));

        let content, filename, type;

        if (format === 'csv') {
            const rows = [['Page', 'Visual', 'Visual Type', 'keepLayerOrder', 'Status', 'Path']];

            for (const visual of data) {
                rows.push([
                    visual.pageDisplayName,
                    visual.visualName,
                    visual.visualType,
                    visual.keepLayerOrder === undefined ? '' : visual.keepLayerOrder,
                    visual.status,
                    visual.path
                ]);
            }

            content = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
            filename = 'layer-order-report.csv';
            type = 'text/csv';
        } else {
            content = JSON.stringify(data, null, 2);
            filename = 'layer-order-report.json';
            type = 'application/json';
        }

        this.downloadFile(content, filename, type);
        this.showToast(`Exported ${format.toUpperCase()} report`, 'success');
    }

    // ==================== Shared Methods ====================

    showEmptyState() {
        this.tabNavigation.classList.add('hidden');

        // Hide filter tab sections
        this.filterElements.summarySection.classList.add('hidden');
        this.filterElements.actionsSection.classList.add('hidden');
        this.filterElements.tableSection.classList.add('hidden');
        this.filterElements.saveSection.classList.add('hidden');
        this.filterElements.historySection.classList.add('hidden');

        // Hide filter legend
        const filterLegend = document.getElementById('filter-legend-section');
        if (filterLegend) filterLegend.classList.add('hidden');

        // Hide layer tab sections
        this.layerElements.summarySection.classList.add('hidden');
        this.layerElements.actionsSection.classList.add('hidden');
        this.layerElements.tableSection.classList.add('hidden');
        this.layerElements.saveSection.classList.add('hidden');
        this.layerElements.historySection.classList.add('hidden');

        // Hide layer legend
        const layerLegend = document.getElementById('layer-legend-section');
        if (layerLegend) layerLegend.classList.add('hidden');

        this.emptyState.classList.remove('hidden');
    }

    showContent() {
        this.emptyState.classList.add('hidden');
        this.tabNavigation.classList.remove('hidden');

        // Show filter tab sections
        this.filterElements.summarySection.classList.remove('hidden');
        this.filterElements.actionsSection.classList.remove('hidden');
        this.filterElements.tableSection.classList.remove('hidden');
        this.filterElements.saveSection.classList.remove('hidden');
        this.filterElements.historySection.classList.remove('hidden');

        // Show filter legend
        const filterLegend = document.getElementById('filter-legend-section');
        if (filterLegend) filterLegend.classList.remove('hidden');

        // Show layer tab sections
        this.layerElements.summarySection.classList.remove('hidden');
        this.layerElements.actionsSection.classList.remove('hidden');
        this.layerElements.tableSection.classList.remove('hidden');
        this.layerElements.saveSection.classList.remove('hidden');
        this.layerElements.historySection.classList.remove('hidden');

        // Show layer legend
        const layerLegend = document.getElementById('layer-legend-section');
        if (layerLegend) layerLegend.classList.remove('hidden');
    }

    async saveChanges() {
        const modifiedVisuals = this.visuals.filter(v => v.filterModified || v.layerModified);
        if (modifiedVisuals.length === 0) return;

        try {
            for (const visual of modifiedVisuals) {
                const writable = await visual.fileHandle.createWritable();
                const content = JSON.stringify(visual.currentJson, null, 2);
                await writable.write(content);
                await writable.close();

                visual.originalJson = JSON.parse(content);
                visual.filterModified = false;
                visual.layerModified = false;
            }

            this.filterHistory = [];
            this.layerHistory = [];

            this.updateFilterModifiedStatus();
            this.updateFilterHistoryStatus();
            this.updateLayerModifiedStatus();
            this.updateLayerHistoryStatus();
            this.renderFilterTable();
            this.renderLayerTable();

            this.showToast(`Saved ${modifiedVisuals.length} file(s). Reload your report in Power BI Desktop to see changes.`, 'success');
        } catch (err) {
            // Provide specific error messages based on error type
            let errorMessage = 'Error saving files: ';
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Permission denied. Please grant folder access and try again.';
            } else if (err.name === 'QuotaExceededError') {
                errorMessage = 'Disk full. Please free up space and try again.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'File not found. The file may have been moved or deleted.';
            } else {
                errorMessage += err.message;
            }
            this.showToast(errorMessage, 'error');
        }
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + type;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    openDocModal() {
        this.docModal.classList.remove('hidden');
    }

    closeDocModal() {
        this.docModal.classList.add('hidden');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PBIRVisualManager();
});
