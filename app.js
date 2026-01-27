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
        this.customPresets = this.loadCustomPresets();
        this.builtInPresets = [
            { id: 'hide-all-filters', name: 'Hide All Filters', type: 'filter', value: true },
            { id: 'show-all-filters', name: 'Show All Filters', type: 'filter', value: false },
            { id: 'reset-all-filters', name: 'Reset All Filters', type: 'filter', value: undefined },
            { id: 'lock-all-layers', name: 'Lock All Layers', type: 'layer', value: true },
            { id: 'unlock-all-layers', name: 'Unlock All Layers', type: 'layer', value: false },
            { id: 'reset-all-layers', name: 'Reset All Layers', type: 'layer', value: undefined }
        ];
        this.pendingPresetType = null; // Track which tab preset is being saved from

        // Batch processing state
        this.batchQueue = [];
        this.batchProcessing = false;

        this.initElements();
        this.checkBrowserSupport();
        this.bindEvents();
        this.renderCustomPresets();
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

        // Presets elements
        this.presetElements = {
            filterPresetsSection: document.getElementById('filter-presets-section'),
            filterCustomPresets: document.getElementById('filter-custom-presets'),
            filterSavePresetBtn: document.getElementById('filter-save-preset-btn'),
            layerPresetsSection: document.getElementById('layer-presets-section'),
            layerCustomPresets: document.getElementById('layer-custom-presets'),
            layerSavePresetBtn: document.getElementById('layer-save-preset-btn'),
            savePresetModal: document.getElementById('save-preset-modal'),
            presetNameInput: document.getElementById('preset-name-input'),
            presetConfigSummary: document.getElementById('preset-config-summary'),
            closePresetModalBtn: document.getElementById('close-preset-modal-btn'),
            cancelPresetBtn: document.getElementById('cancel-preset-btn'),
            confirmSavePresetBtn: document.getElementById('confirm-save-preset-btn')
        };

        // Batch processing elements
        this.batchElements = {
            queueSection: document.getElementById('batch-queue-section'),
            queueList: document.getElementById('batch-queue-list'),
            addReportBtn: document.getElementById('batch-add-report-btn'),
            clearQueueBtn: document.getElementById('batch-clear-queue-btn'),
            presetSelect: document.getElementById('batch-preset-select'),
            filterEnabled: document.getElementById('batch-filter-enabled'),
            filterValue: document.getElementById('batch-filter-value'),
            layerEnabled: document.getElementById('batch-layer-enabled'),
            layerValue: document.getElementById('batch-layer-value'),
            processBtn: document.getElementById('batch-process-btn'),
            batchStatus: document.getElementById('batch-status'),
            progressSection: document.getElementById('batch-progress-section'),
            progressFill: document.getElementById('batch-progress-fill'),
            progressText: document.getElementById('batch-progress-text'),
            resultsList: document.getElementById('batch-results-list')
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

        // Preset button events (built-in presets)
        document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => this.applyPreset(btn.dataset.preset));
        });

        // Save preset button events
        this.presetElements.filterSavePresetBtn.addEventListener('click', () => this.openSavePresetModal('filter'));
        this.presetElements.layerSavePresetBtn.addEventListener('click', () => this.openSavePresetModal('layer'));

        // Save preset modal events
        this.presetElements.closePresetModalBtn.addEventListener('click', () => this.closeSavePresetModal());
        this.presetElements.cancelPresetBtn.addEventListener('click', () => this.closeSavePresetModal());
        this.presetElements.confirmSavePresetBtn.addEventListener('click', () => this.confirmSavePreset());
        this.presetElements.savePresetModal.addEventListener('click', (e) => {
            if (e.target === this.presetElements.savePresetModal) this.closeSavePresetModal();
        });

        // Batch processing events
        this.batchElements.addReportBtn.addEventListener('click', () => this.addReportToQueue());
        this.batchElements.clearQueueBtn.addEventListener('click', () => this.clearBatchQueue());
        this.batchElements.processBtn.addEventListener('click', () => this.processBatch());

        // Batch preset select
        this.batchElements.presetSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                // Disable manual settings when preset is selected
                this.batchElements.filterEnabled.checked = false;
                this.batchElements.filterValue.disabled = true;
                this.batchElements.layerEnabled.checked = false;
                this.batchElements.layerValue.disabled = true;
            }
            this.updateBatchProcessButton();
        });

        // Batch manual settings checkboxes
        this.batchElements.filterEnabled.addEventListener('change', (e) => {
            this.batchElements.filterValue.disabled = !e.target.checked;
            if (e.target.checked) this.batchElements.presetSelect.value = '';
            this.updateBatchProcessButton();
        });

        this.batchElements.layerEnabled.addEventListener('change', (e) => {
            this.batchElements.layerValue.disabled = !e.target.checked;
            if (e.target.checked) this.batchElements.presetSelect.value = '';
            this.updateBatchProcessButton();
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

        // Hide filter legend and presets
        const filterLegend = document.getElementById('filter-legend-section');
        if (filterLegend) filterLegend.classList.add('hidden');
        this.presetElements.filterPresetsSection.classList.add('hidden');

        // Hide layer tab sections
        this.layerElements.summarySection.classList.add('hidden');
        this.layerElements.actionsSection.classList.add('hidden');
        this.layerElements.tableSection.classList.add('hidden');
        this.layerElements.saveSection.classList.add('hidden');
        this.layerElements.historySection.classList.add('hidden');

        // Hide layer legend and presets
        const layerLegend = document.getElementById('layer-legend-section');
        if (layerLegend) layerLegend.classList.add('hidden');
        this.presetElements.layerPresetsSection.classList.add('hidden');

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

        // Show filter legend and presets
        const filterLegend = document.getElementById('filter-legend-section');
        if (filterLegend) filterLegend.classList.remove('hidden');
        this.presetElements.filterPresetsSection.classList.remove('hidden');

        // Show layer tab sections
        this.layerElements.summarySection.classList.remove('hidden');
        this.layerElements.actionsSection.classList.remove('hidden');
        this.layerElements.tableSection.classList.remove('hidden');
        this.layerElements.saveSection.classList.remove('hidden');
        this.layerElements.historySection.classList.remove('hidden');

        // Show layer legend and presets
        const layerLegend = document.getElementById('layer-legend-section');
        if (layerLegend) layerLegend.classList.remove('hidden');
        this.presetElements.layerPresetsSection.classList.remove('hidden');
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

    // ==================== Preset Methods ====================

    loadCustomPresets() {
        try {
            const stored = localStorage.getItem('pbirVisualManager_customPresets');
            return stored ? JSON.parse(stored) : [];
        } catch (err) {
            console.warn('Failed to load custom presets:', err);
            return [];
        }
    }

    saveCustomPresetsToStorage() {
        try {
            localStorage.setItem('pbirVisualManager_customPresets', JSON.stringify(this.customPresets));
        } catch (err) {
            console.warn('Failed to save custom presets:', err);
        }
    }

    applyPreset(presetId) {
        if (this.visuals.length === 0) {
            this.showToast('Please select a folder first', 'error');
            return;
        }

        const preset = this.builtInPresets.find(p => p.id === presetId) ||
                       this.customPresets.find(p => p.id === presetId);

        if (!preset) {
            this.showToast('Preset not found', 'error');
            return;
        }

        // Select all visuals first
        if (preset.type === 'filter') {
            // Select all visuals
            this.filterSelectedVisuals.clear();
            for (const visual of this.visuals) {
                this.filterSelectedVisuals.add(visual.path);
            }
            // Apply the value
            this.filterBulkSetValue(preset.value);
        } else if (preset.type === 'layer') {
            // Select all visuals
            this.layerSelectedVisuals.clear();
            for (const visual of this.visuals) {
                this.layerSelectedVisuals.add(visual.path);
            }
            // Apply the value
            this.layerBulkSetValue(preset.value);
        }
    }

    openSavePresetModal(type) {
        this.pendingPresetType = type;
        this.presetElements.presetNameInput.value = '';

        // Show config summary
        let summary = '';
        if (type === 'filter') {
            const counts = { hidden: 0, visible: 0, default: 0 };
            for (const visual of this.visuals) {
                for (const filter of visual.filters) {
                    if (filter.isHiddenInViewMode === true) counts.hidden++;
                    else if (filter.isHiddenInViewMode === false) counts.visible++;
                    else counts.default++;
                }
            }
            summary = `<strong>Filter settings:</strong> ${counts.hidden} hidden, ${counts.visible} visible, ${counts.default} default`;
        } else {
            const counts = { enabled: 0, disabled: 0, notSet: 0 };
            for (const visual of this.visuals) {
                if (visual.keepLayerOrder === true) counts.enabled++;
                else if (visual.keepLayerOrder === false) counts.disabled++;
                else counts.notSet++;
            }
            summary = `<strong>Layer settings:</strong> ${counts.enabled} enabled, ${counts.disabled} disabled, ${counts.notSet} not set`;
        }
        this.presetElements.presetConfigSummary.innerHTML = summary;

        this.presetElements.savePresetModal.classList.remove('hidden');
        this.presetElements.presetNameInput.focus();
    }

    closeSavePresetModal() {
        this.presetElements.savePresetModal.classList.add('hidden');
        this.pendingPresetType = null;
    }

    confirmSavePreset() {
        const name = this.presetElements.presetNameInput.value.trim();
        if (!name) {
            this.showToast('Please enter a preset name', 'error');
            return;
        }

        const preset = {
            id: 'custom-' + Date.now(),
            name: name,
            type: this.pendingPresetType,
            createdAt: new Date().toISOString()
        };

        // Store current settings
        if (this.pendingPresetType === 'filter') {
            preset.filterSettings = this.visuals.map(v => ({
                path: v.path,
                filters: v.filters.map(f => ({ isHiddenInViewMode: f.isHiddenInViewMode }))
            }));
        } else {
            preset.layerSettings = this.visuals.map(v => ({
                path: v.path,
                keepLayerOrder: v.keepLayerOrder
            }));
        }

        this.customPresets.push(preset);
        this.saveCustomPresetsToStorage();
        this.renderCustomPresets();
        this.closeSavePresetModal();
        this.showToast(`Preset "${name}" saved`, 'success');
    }

    deleteCustomPreset(presetId) {
        const index = this.customPresets.findIndex(p => p.id === presetId);
        if (index !== -1) {
            const preset = this.customPresets[index];
            this.customPresets.splice(index, 1);
            this.saveCustomPresetsToStorage();
            this.renderCustomPresets();
            this.showToast(`Preset "${preset.name}" deleted`, 'success');
        }
    }

    renderCustomPresets() {
        const filterPresets = this.customPresets.filter(p => p.type === 'filter');
        const layerPresets = this.customPresets.filter(p => p.type === 'layer');

        // Render filter custom presets
        this.presetElements.filterCustomPresets.innerHTML = filterPresets.map(preset => `
            <div class="custom-preset-btn" data-preset="${preset.id}" title="${preset.name}">
                <span>${this.escapeHtml(preset.name)}</span>
                <button class="custom-preset-delete" data-delete="${preset.id}" title="Delete preset">&times;</button>
            </div>
        `).join('');

        // Render layer custom presets
        this.presetElements.layerCustomPresets.innerHTML = layerPresets.map(preset => `
            <div class="custom-preset-btn" data-preset="${preset.id}" title="${preset.name}">
                <span>${this.escapeHtml(preset.name)}</span>
                <button class="custom-preset-delete" data-delete="${preset.id}" title="Delete preset">&times;</button>
            </div>
        `).join('');

        // Bind click events for custom presets
        document.querySelectorAll('.custom-preset-btn[data-preset]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!e.target.classList.contains('custom-preset-delete')) {
                    this.applyCustomPreset(btn.dataset.preset);
                }
            });
        });

        // Bind delete events
        document.querySelectorAll('.custom-preset-delete[data-delete]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCustomPreset(btn.dataset.delete);
            });
        });
    }

    applyCustomPreset(presetId) {
        const preset = this.customPresets.find(p => p.id === presetId);
        if (!preset) return;

        if (this.visuals.length === 0) {
            this.showToast('Please select a folder first', 'error');
            return;
        }

        let appliedCount = 0;

        if (preset.type === 'filter' && preset.filterSettings) {
            for (const setting of preset.filterSettings) {
                const visual = this.visuals.find(v => v.path === setting.path);
                if (visual && setting.filters) {
                    for (let i = 0; i < Math.min(visual.filters.length, setting.filters.length); i++) {
                        if (visual.filters[i].isHiddenInViewMode !== setting.filters[i].isHiddenInViewMode) {
                            visual.filters[i].isHiddenInViewMode = setting.filters[i].isHiddenInViewMode;
                            appliedCount++;
                        }
                    }
                    this.applyFilterToJson(visual);
                    visual.filterModified = true;
                }
            }
            this.updateFilterSummary();
            this.updateFilterModifiedStatus();
            this.renderFilterTable();
        } else if (preset.type === 'layer' && preset.layerSettings) {
            for (const setting of preset.layerSettings) {
                const visual = this.visuals.find(v => v.path === setting.path);
                if (visual && visual.keepLayerOrder !== setting.keepLayerOrder) {
                    visual.keepLayerOrder = setting.keepLayerOrder;
                    this.applyKeepLayerOrderToJson(visual, setting.keepLayerOrder);
                    visual.layerModified = true;
                    appliedCount++;
                }
            }
            this.updateLayerSummary();
            this.updateLayerModifiedStatus();
            this.renderLayerTable();
        }

        this.showToast(`Applied preset "${preset.name}"`, 'success');
    }

    // ==================== Batch Processing Methods ====================

    async addReportToQueue() {
        try {
            const handle = await window.showDirectoryPicker();

            // Check if already in queue
            if (this.batchQueue.some(r => r.name === handle.name)) {
                this.showToast('This folder is already in the queue', 'error');
                return;
            }

            // Scan for visual count
            const visualCount = await this.countVisualsInFolder(handle);

            const report = {
                handle: handle,
                name: handle.name,
                visualCount: visualCount,
                status: 'ready',
                updatedCount: 0,
                error: null
            };

            this.batchQueue.push(report);
            this.renderBatchQueue();
            this.updateBatchProcessButton();
            this.showToast(`Added "${handle.name}" to queue`, 'success');
        } catch (err) {
            if (err.name !== 'AbortError') {
                this.showToast('Error selecting folder: ' + err.message, 'error');
            }
        }
    }

    async countVisualsInFolder(dirHandle, depth = 0) {
        const MAX_DEPTH = 50;
        if (depth >= MAX_DEPTH) return 0;

        let count = 0;
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'directory') {
                count += await this.countVisualsInFolder(entry, depth + 1);
            } else if (entry.kind === 'file' && entry.name === 'visual.json') {
                count++;
            }
        }
        return count;
    }

    removeReportFromQueue(index) {
        if (index >= 0 && index < this.batchQueue.length) {
            const report = this.batchQueue[index];
            this.batchQueue.splice(index, 1);
            this.renderBatchQueue();
            this.updateBatchProcessButton();
            this.showToast(`Removed "${report.name}" from queue`, 'success');
        }
    }

    clearBatchQueue() {
        this.batchQueue = [];
        this.renderBatchQueue();
        this.updateBatchProcessButton();
        this.batchElements.progressSection.classList.add('hidden');
        this.showToast('Queue cleared', 'success');
    }

    renderBatchQueue() {
        if (this.batchQueue.length === 0) {
            this.batchElements.queueList.innerHTML = '<div class="batch-queue-empty">No reports added. Click "Add Report" to start.</div>';
            this.batchElements.clearQueueBtn.disabled = true;
            return;
        }

        this.batchElements.clearQueueBtn.disabled = false;
        this.batchElements.queueList.innerHTML = this.batchQueue.map((report, index) => {
            const statusClass = report.status;
            const statusText = report.status === 'ready' ? 'Ready' :
                              report.status === 'processing' ? 'Processing...' :
                              report.status === 'done' ? `Done (${report.updatedCount} updated)` :
                              `Error: ${report.error}`;

            return `
                <div class="batch-queue-item">
                    <span class="batch-queue-icon">&#128193;</span>
                    <div class="batch-queue-info">
                        <div class="batch-queue-name">${this.escapeHtml(report.name)}</div>
                        <div class="batch-queue-details">${report.visualCount} visuals</div>
                    </div>
                    <span class="batch-queue-status ${statusClass}">${statusText}</span>
                    <button class="batch-queue-remove" data-index="${index}" title="Remove">&times;</button>
                </div>
            `;
        }).join('');

        // Bind remove buttons
        this.batchElements.queueList.querySelectorAll('.batch-queue-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.removeReportFromQueue(index);
            });
        });
    }

    updateBatchProcessButton() {
        const hasQueue = this.batchQueue.length > 0;
        const hasSettings = this.batchElements.presetSelect.value ||
                          this.batchElements.filterEnabled.checked ||
                          this.batchElements.layerEnabled.checked;

        this.batchElements.processBtn.disabled = !hasQueue || !hasSettings || this.batchProcessing;

        if (!hasQueue) {
            this.batchElements.batchStatus.textContent = 'Add reports to the queue first';
        } else if (!hasSettings) {
            this.batchElements.batchStatus.textContent = 'Select a preset or configure settings';
        } else {
            this.batchElements.batchStatus.textContent = `Ready to process ${this.batchQueue.length} report(s)`;
        }
    }

    async processBatch() {
        if (this.batchQueue.length === 0 || this.batchProcessing) return;

        this.batchProcessing = true;
        this.batchElements.processBtn.disabled = true;
        this.batchElements.progressSection.classList.remove('hidden');
        this.batchElements.resultsList.innerHTML = '';

        // Get settings to apply
        const settings = this.getBatchSettings();

        let processed = 0;
        const total = this.batchQueue.length;

        for (const report of this.batchQueue) {
            report.status = 'processing';
            this.renderBatchQueue();
            this.updateBatchProgress(processed, total);

            try {
                const result = await this.processReportFolder(report.handle, settings);
                report.status = 'done';
                report.updatedCount = result.updatedCount;

                this.addBatchResult(report.name, 'done', result.updatedCount);
            } catch (err) {
                report.status = 'error';
                report.error = err.message;
                this.addBatchResult(report.name, 'error', 0, err.message);
            }

            processed++;
            this.updateBatchProgress(processed, total);
            this.renderBatchQueue();
        }

        this.batchProcessing = false;
        this.updateBatchProcessButton();
        this.showToast(`Batch processing complete: ${processed} report(s) processed`, 'success');
    }

    getBatchSettings() {
        const settings = {
            filterEnabled: false,
            filterValue: undefined,
            layerEnabled: false,
            layerValue: undefined
        };

        // Check if preset is selected
        const presetId = this.batchElements.presetSelect.value;
        if (presetId) {
            const preset = this.builtInPresets.find(p => p.id === presetId);
            if (preset) {
                if (preset.type === 'filter') {
                    settings.filterEnabled = true;
                    settings.filterValue = preset.value;
                } else if (preset.type === 'layer') {
                    settings.layerEnabled = true;
                    settings.layerValue = preset.value;
                }
            }
        } else {
            // Use manual settings
            if (this.batchElements.filterEnabled.checked) {
                settings.filterEnabled = true;
                const val = this.batchElements.filterValue.value;
                settings.filterValue = val === 'true' ? true : (val === 'false' ? false : undefined);
            }
            if (this.batchElements.layerEnabled.checked) {
                settings.layerEnabled = true;
                const val = this.batchElements.layerValue.value;
                settings.layerValue = val === 'true' ? true : (val === 'false' ? false : undefined);
            }
        }

        return settings;
    }

    async processReportFolder(dirHandle, settings) {
        const visuals = [];
        await this.collectVisualsFromFolder(dirHandle, '', visuals);

        let updatedCount = 0;

        for (const visual of visuals) {
            let modified = false;

            // Apply filter settings
            if (settings.filterEnabled && visual.filters.length > 0) {
                for (const filter of visual.filters) {
                    if (filter.isHiddenInViewMode !== settings.filterValue) {
                        filter.isHiddenInViewMode = settings.filterValue;
                        modified = true;
                    }
                }
                if (modified) {
                    this.applyFilterToJsonBatch(visual, settings.filterValue);
                }
            }

            // Apply layer settings
            if (settings.layerEnabled) {
                if (visual.keepLayerOrder !== settings.layerValue) {
                    visual.keepLayerOrder = settings.layerValue;
                    this.applyKeepLayerOrderToJsonBatch(visual, settings.layerValue);
                    modified = true;
                }
            }

            // Save if modified
            if (modified) {
                const writable = await visual.fileHandle.createWritable();
                const content = JSON.stringify(visual.json, null, 2);
                await writable.write(content);
                await writable.close();
                updatedCount++;
            }
        }

        return { updatedCount };
    }

    async collectVisualsFromFolder(dirHandle, currentPath, visuals, depth = 0) {
        const MAX_DEPTH = 50;
        if (depth >= MAX_DEPTH) return;

        for await (const entry of dirHandle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            if (entry.kind === 'directory') {
                await this.collectVisualsFromFolder(entry, entryPath, visuals, depth + 1);
            } else if (entry.kind === 'file' && entry.name === 'visual.json') {
                try {
                    const file = await entry.getFile();
                    const content = await file.text();
                    const json = JSON.parse(content);

                    visuals.push({
                        path: entryPath,
                        fileHandle: entry,
                        json: json,
                        filters: this.extractFilters(json),
                        keepLayerOrder: this.extractKeepLayerOrder(json)
                    });
                } catch (err) {
                    console.warn(`Skipped invalid file: ${entryPath}`, err);
                }
            }
        }
    }

    applyFilterToJsonBatch(visual, value) {
        if (visual.json.filterConfig && Array.isArray(visual.json.filterConfig.filters)) {
            for (const filter of visual.json.filterConfig.filters) {
                if (value === undefined) {
                    delete filter.isHiddenInViewMode;
                } else {
                    filter.isHiddenInViewMode = value;
                }
            }
        }
        if (Array.isArray(visual.json.filters)) {
            for (const filter of visual.json.filters) {
                if (value === undefined) {
                    delete filter.isHiddenInViewMode;
                } else {
                    filter.isHiddenInViewMode = value;
                }
            }
        }
    }

    applyKeepLayerOrderToJsonBatch(visual, value) {
        if (!visual.json.visual) visual.json.visual = {};
        if (!visual.json.visual.visualContainerObjects) {
            visual.json.visual.visualContainerObjects = {};
        }

        const vco = visual.json.visual.visualContainerObjects;

        if (value === undefined) {
            if (vco.general?.[0]?.properties?.keepLayerOrder) {
                delete vco.general[0].properties.keepLayerOrder;
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
            if (!vco.general) vco.general = [];
            if (vco.general.length === 0) vco.general.push({});
            if (!vco.general[0].properties) vco.general[0].properties = {};

            vco.general[0].properties.keepLayerOrder = {
                expr: { Literal: { Value: value.toString() } }
            };
        }
    }

    updateBatchProgress(current, total) {
        const percent = total > 0 ? (current / total) * 100 : 0;
        this.batchElements.progressFill.style.width = `${percent}%`;
        this.batchElements.progressText.textContent = `${current} / ${total} reports processed`;
    }

    addBatchResult(name, status, count, error = null) {
        const icon = status === 'done' ? '&#9989;' : '&#10060;';
        const detail = status === 'done' ? `${count} visuals updated` : error;

        const resultHtml = `
            <div class="batch-result-item">
                <span class="batch-result-icon">${icon}</span>
                <span class="batch-result-name">${this.escapeHtml(name)}</span>
                <span class="batch-result-count">${this.escapeHtml(detail)}</span>
            </div>
        `;
        this.batchElements.resultsList.innerHTML += resultHtml;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PBIRVisualManager();
});
