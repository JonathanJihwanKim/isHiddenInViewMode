// isHiddenInViewMode Manager - Main Application

class IsHiddenInViewModeManager {
    constructor() {
        this.folderHandle = null;
        this.visuals = [];
        this.history = [];
        this.selectedVisuals = new Set();
        this.currentFilter = 'all';
        this.pageDisplayNames = new Map(); // pageId -> displayName

        this.initElements();
        this.checkBrowserSupport();
        this.bindEvents();
    }

    initElements() {
        // Buttons
        this.selectFolderBtn = document.getElementById('select-folder-btn');
        this.selectAllBtn = document.getElementById('select-all-btn');
        this.selectNoneBtn = document.getElementById('select-none-btn');
        this.setTrueBtn = document.getElementById('set-true-btn');
        this.setFalseBtn = document.getElementById('set-false-btn');
        this.removePropBtn = document.getElementById('remove-prop-btn');
        this.saveBtn = document.getElementById('save-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.undoAllBtn = document.getElementById('undo-all-btn');
        this.exportCsvBtn = document.getElementById('export-csv-btn');
        this.exportJsonBtn = document.getElementById('export-json-btn');
        this.headerCheckbox = document.getElementById('header-checkbox');
        this.statusFilter = document.getElementById('status-filter');

        // Sections
        this.summarySection = document.getElementById('summary-section');
        this.actionsSection = document.getElementById('actions-section');
        this.tableSection = document.getElementById('table-section');
        this.saveSection = document.getElementById('save-section');
        this.historySection = document.getElementById('history-section');
        this.emptyState = document.getElementById('empty-state');
        this.browserWarning = document.getElementById('browser-warning');

        // Display elements
        this.folderPath = document.getElementById('folder-path');
        this.visualsTbody = document.getElementById('visuals-tbody');
        this.modifiedStatus = document.getElementById('modified-status');
        this.historyStatus = document.getElementById('history-status');

        // Summary elements
        this.totalVisuals = document.getElementById('total-visuals');
        this.totalFilters = document.getElementById('total-filters');
        this.hiddenFilters = document.getElementById('hidden-filters');
        this.visibleFilters = document.getElementById('visible-filters');
        this.defaultFilters = document.getElementById('default-filters');
    }

    checkBrowserSupport() {
        if (!('showDirectoryPicker' in window)) {
            this.browserWarning.classList.remove('hidden');
            this.selectFolderBtn.disabled = true;
        }
    }

    bindEvents() {
        this.selectFolderBtn.addEventListener('click', () => this.selectFolder());
        this.selectAllBtn.addEventListener('click', () => this.selectAll());
        this.selectNoneBtn.addEventListener('click', () => this.selectNone());
        this.setTrueBtn.addEventListener('click', () => this.bulkSetValue(true));
        this.setFalseBtn.addEventListener('click', () => this.bulkSetValue(false));
        this.removePropBtn.addEventListener('click', () => this.bulkSetValue(undefined));
        this.saveBtn.addEventListener('click', () => this.saveChanges());
        this.undoBtn.addEventListener('click', () => this.undo());
        this.undoAllBtn.addEventListener('click', () => this.undoAll());
        this.exportCsvBtn.addEventListener('click', () => this.exportReport('csv'));
        this.exportJsonBtn.addEventListener('click', () => this.exportReport('json'));
        this.headerCheckbox.addEventListener('change', (e) => this.toggleAllVisible(e.target.checked));
        this.statusFilter.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderTable();
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
        this.history = [];
        this.selectedVisuals.clear();
        this.pageDisplayNames.clear();

        try {
            // Pass 1: Collect all page display names first
            await this.collectPageDisplayNames(this.folderHandle, '');

            // Pass 2: Process visual.json files (display names now available)
            await this.scanForVisuals(this.folderHandle, '');

            if (this.visuals.length === 0) {
                this.showEmptyState();
            } else {
                this.showContent();
                this.updateSummary();
                this.renderTable();
            }
        } catch (err) {
            this.showToast('Error scanning folder: ' + err.message, 'error');
        }
    }

    async collectPageDisplayNames(dirHandle, currentPath) {
        for await (const entry of dirHandle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            if (entry.kind === 'directory') {
                await this.collectPageDisplayNames(entry, entryPath);
            } else if (entry.kind === 'file' && entry.name === 'page.json') {
                await this.readPageDisplayName(entry, currentPath);
            }
        }
    }

    async scanForVisuals(dirHandle, currentPath) {
        for await (const entry of dirHandle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            if (entry.kind === 'directory') {
                await this.scanForVisuals(entry, entryPath);
            } else if (entry.kind === 'file' && entry.name === 'visual.json') {
                await this.processJsonFile(entry, entryPath, currentPath);
            }
        }
    }

    async readPageDisplayName(fileHandle, folderPath) {
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            const json = JSON.parse(content);

            if (json.displayName) {
                // Extract pageId from path (last folder name)
                const pathParts = folderPath.split('/');
                const pageId = pathParts[pathParts.length - 1];
                this.pageDisplayNames.set(pageId, json.displayName);
            }
        } catch (err) {
            console.log(`Could not read page.json at ${folderPath}: ${err.message}`);
        }
    }

    async processJsonFile(fileHandle, filePath, folderPath) {
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            const json = JSON.parse(content);

            // Extract page name and visual id from path
            // Expected patterns:
            // - pages/PageName/visuals/VisualId/visual.json
            // - PageName/visuals/VisualId/visual.json
            // - Or any other structure - we'll extract what we can
            const pathParts = filePath.split('/');

            let pageName = '';
            let visualId = '';

            // Try to find page and visual from path
            const pagesIndex = pathParts.indexOf('pages');
            const visualsIndex = pathParts.indexOf('visuals');

            if (pagesIndex !== -1 && pagesIndex + 1 < pathParts.length) {
                pageName = pathParts[pagesIndex + 1];
            }

            if (visualsIndex !== -1 && visualsIndex + 1 < pathParts.length) {
                visualId = pathParts[visualsIndex + 1];
            }

            // Fallback: use folder structure
            if (!pageName && pathParts.length >= 2) {
                // Try to use grandparent folder as page name if we're in a nested structure
                pageName = pathParts.length >= 4 ? pathParts[pathParts.length - 4] : pathParts[0];
            }

            if (!visualId && pathParts.length >= 2) {
                // Use parent folder as visual id
                visualId = pathParts[pathParts.length - 2];
            }

            // If visualId is still empty, use the filename without extension
            if (!visualId) {
                visualId = fileHandle.name.replace('.json', '');
            }

            // Look up the display name for this page
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
                fileHandle: fileHandle,
                originalJson: JSON.parse(content), // Deep copy for undo
                currentJson: json,
                modified: false
            };

            this.visuals.push(visual);
        } catch (err) {
            // Skip files that can't be parsed as JSON or don't have the expected structure
            console.log(`Skipping ${filePath}: ${err.message}`);
        }
    }

    getVisualType(json) {
        // Try to extract visual type from various locations
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
        // Check visual.visualContainerObjects for title (nested inside visual!)
        if (json.visual?.visualContainerObjects?.title) {
            const titleProps = json.visual.visualContainerObjects.title[0]?.properties;
            if (titleProps?.text?.expr?.Literal?.Value) {
                // Remove surrounding quotes from the value
                return titleProps.text.expr.Literal.Value.replace(/^'|'$/g, '');
            }
        }

        // Existing fallbacks
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

        // Check filterConfig.filters
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

        // Also check filters at root level
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

    getFilterField(filter) {
        if (filter.field) {
            if (typeof filter.field === 'string') return filter.field;
            if (filter.field.Column) return filter.field.Column.Property || '';
            if (filter.field.Measure) return filter.field.Measure.Property || '';
        }
        return '';
    }

    getVisualStatus(visual) {
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

    getStatusDisplay(status) {
        switch (status) {
            case 'hidden': return { text: 'Hidden', class: 'status-hidden' };
            case 'visible': return { text: 'Visible', class: 'status-visible' };
            case 'default': return { text: 'Default', class: 'status-default' };
            case 'mixed': return { text: 'Mixed', class: 'status-mixed' };
            case 'no-filters': return { text: 'No Filters', class: 'status-no-filters' };
            default: return { text: status, class: 'status-default' };
        }
    }

    showEmptyState() {
        this.summarySection.classList.add('hidden');
        this.actionsSection.classList.add('hidden');
        this.tableSection.classList.add('hidden');
        this.saveSection.classList.add('hidden');
        this.historySection.classList.add('hidden');
        this.emptyState.classList.remove('hidden');
    }

    showContent() {
        this.emptyState.classList.add('hidden');
        this.summarySection.classList.remove('hidden');
        this.actionsSection.classList.remove('hidden');
        this.tableSection.classList.remove('hidden');
        this.saveSection.classList.remove('hidden');
        this.historySection.classList.remove('hidden');
    }

    updateSummary() {
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

        this.totalVisuals.textContent = this.visuals.length;
        this.totalFilters.textContent = totalFilters;
        this.hiddenFilters.textContent = hiddenCount;
        this.visibleFilters.textContent = visibleCount;
        this.defaultFilters.textContent = defaultCount;
    }

    getFilteredVisuals() {
        if (this.currentFilter === 'all') {
            return this.visuals;
        }
        return this.visuals.filter(v => this.getVisualStatus(v) === this.currentFilter);
    }

    renderTable() {
        const filtered = this.getFilteredVisuals();
        this.visualsTbody.innerHTML = '';

        for (const visual of filtered) {
            const status = this.getVisualStatus(visual);
            const statusDisplay = this.getStatusDisplay(status);
            const isSelected = this.selectedVisuals.has(visual.path);

            // Main row
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
                    ${visual.modified ? ' *' : ''}
                </td>
            `;

            this.visualsTbody.appendChild(row);

            // Bind checkbox event
            const checkbox = row.querySelector('.visual-checkbox');
            checkbox.addEventListener('change', (e) => this.toggleSelection(visual.path, e.target.checked));

            // Bind expand button event
            const expandBtn = row.querySelector('.expand-btn');
            if (expandBtn) {
                expandBtn.addEventListener('click', () => this.toggleExpand(visual.path, expandBtn));
            }
        }

        this.updateSelectionButtons();
        this.updateHeaderCheckbox();
    }

    toggleExpand(path, button) {
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

        // Bind select events
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

        const oldValue = visual.filters[filterIndex].isHiddenInViewMode;
        if (oldValue === newValue) return;

        // Record history
        this.pushHistory({
            type: 'single',
            visualPath: path,
            filterIndex: filterIndex,
            filterName: visual.filters[filterIndex].name,
            oldValue: oldValue,
            newValue: newValue
        });

        // Update filter
        visual.filters[filterIndex].isHiddenInViewMode = newValue;
        this.applyFilterToJson(visual);
        visual.modified = true;

        this.updateSummary();
        this.updateModifiedStatus();
        this.updateHistoryStatus();
        this.renderTable();
    }

    applyFilterToJson(visual) {
        // Apply filter changes back to the JSON structure
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

    toggleSelection(path, selected) {
        if (selected) {
            this.selectedVisuals.add(path);
        } else {
            this.selectedVisuals.delete(path);
        }

        // Update row highlight
        const row = this.visualsTbody.querySelector(`tr[data-path="${path}"]`);
        if (row) {
            row.classList.toggle('selected', selected);
        }

        this.updateSelectionButtons();
        this.updateHeaderCheckbox();
    }

    toggleAllVisible(selected) {
        const filtered = this.getFilteredVisuals();
        for (const visual of filtered) {
            if (selected) {
                this.selectedVisuals.add(visual.path);
            } else {
                this.selectedVisuals.delete(visual.path);
            }
        }
        this.renderTable();
    }

    selectAll() {
        const filtered = this.getFilteredVisuals();
        for (const visual of filtered) {
            this.selectedVisuals.add(visual.path);
        }
        this.renderTable();
    }

    selectNone() {
        this.selectedVisuals.clear();
        this.renderTable();
    }

    updateSelectionButtons() {
        const hasSelection = this.selectedVisuals.size > 0;
        this.setTrueBtn.disabled = !hasSelection;
        this.setFalseBtn.disabled = !hasSelection;
        this.removePropBtn.disabled = !hasSelection;
    }

    updateHeaderCheckbox() {
        const filtered = this.getFilteredVisuals();
        const allSelected = filtered.length > 0 && filtered.every(v => this.selectedVisuals.has(v.path));
        const someSelected = filtered.some(v => this.selectedVisuals.has(v.path));

        this.headerCheckbox.checked = allSelected;
        this.headerCheckbox.indeterminate = someSelected && !allSelected;
    }

    bulkSetValue(value) {
        if (this.selectedVisuals.size === 0) return;

        const changes = [];

        for (const path of this.selectedVisuals) {
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
            visual.modified = true;
        }

        // Record bulk change as single history entry
        if (changes.length > 0) {
            this.pushHistory({
                type: 'bulk',
                changes: changes,
                value: value
            });
        }

        this.updateSummary();
        this.updateModifiedStatus();
        this.updateHistoryStatus();
        this.renderTable();

        const valueText = value === true ? 'hidden' : (value === false ? 'visible' : 'default');
        this.showToast(`Set ${changes.length} filter(s) to ${valueText}`, 'success');
    }

    pushHistory(entry) {
        entry.timestamp = new Date();
        this.history.push(entry);
        this.updateHistoryStatus();
    }

    undo() {
        if (this.history.length === 0) return;

        const entry = this.history.pop();

        if (entry.type === 'bulk' && entry.changes) {
            // Undo bulk change
            for (const change of entry.changes) {
                const visual = this.visuals.find(v => v.path === change.visualPath);
                if (visual && visual.filters[change.filterIndex]) {
                    visual.filters[change.filterIndex].isHiddenInViewMode = change.oldValue;
                    this.applyFilterToJson(visual);
                }
            }
        } else if (entry.type === 'single') {
            // Undo single change
            const visual = this.visuals.find(v => v.path === entry.visualPath);
            if (visual && visual.filters[entry.filterIndex]) {
                visual.filters[entry.filterIndex].isHiddenInViewMode = entry.oldValue;
                this.applyFilterToJson(visual);
            }
        }

        // Check if visual still has modifications
        this.checkModifications();
        this.updateSummary();
        this.updateModifiedStatus();
        this.updateHistoryStatus();
        this.renderTable();

        this.showToast('Change undone', 'success');
    }

    undoAll() {
        if (this.history.length === 0) return;

        // Restore all visuals to original state
        for (const visual of this.visuals) {
            visual.currentJson = JSON.parse(JSON.stringify(visual.originalJson));
            visual.filters = this.extractFilters(visual.currentJson);
            visual.modified = false;
        }

        this.history = [];
        this.updateSummary();
        this.updateModifiedStatus();
        this.updateHistoryStatus();
        this.renderTable();

        this.showToast('All changes undone', 'success');
    }

    checkModifications() {
        for (const visual of this.visuals) {
            const originalFilters = this.extractFilters(visual.originalJson);
            let hasChanges = false;

            for (let i = 0; i < visual.filters.length; i++) {
                if (visual.filters[i].isHiddenInViewMode !== originalFilters[i]?.isHiddenInViewMode) {
                    hasChanges = true;
                    break;
                }
            }

            visual.modified = hasChanges;
        }
    }

    updateModifiedStatus() {
        const modifiedCount = this.visuals.filter(v => v.modified).length;

        if (modifiedCount === 0) {
            this.modifiedStatus.textContent = 'No changes';
            this.modifiedStatus.classList.remove('has-changes');
            this.saveBtn.disabled = true;
        } else {
            this.modifiedStatus.textContent = `${modifiedCount} file(s) modified`;
            this.modifiedStatus.classList.add('has-changes');
            this.saveBtn.disabled = false;
        }
    }

    updateHistoryStatus() {
        this.historyStatus.textContent = `History: ${this.history.length} change(s)`;
        this.undoBtn.disabled = this.history.length === 0;
        this.undoAllBtn.disabled = this.history.length === 0;
    }

    async saveChanges() {
        const modifiedVisuals = this.visuals.filter(v => v.modified);
        if (modifiedVisuals.length === 0) return;

        try {
            for (const visual of modifiedVisuals) {
                const writable = await visual.fileHandle.createWritable();
                const content = JSON.stringify(visual.currentJson, null, 2);
                await writable.write(content);
                await writable.close();

                // Update original to current state
                visual.originalJson = JSON.parse(content);
                visual.modified = false;
            }

            this.history = [];
            this.updateModifiedStatus();
            this.updateHistoryStatus();
            this.renderTable();

            this.showToast(`Saved ${modifiedVisuals.length} file(s)`, 'success');
        } catch (err) {
            this.showToast('Error saving files: ' + err.message, 'error');
        }
    }

    exportReport(format) {
        const data = this.visuals.map(v => ({
            path: v.path,
            pageDisplayName: v.pageDisplayName,
            visualId: v.visualId,
            visualName: v.visualName || v.visualId,
            visualType: v.visualType,
            filterCount: v.filters.length,
            status: this.getVisualStatus(v),
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
            filename = 'isHiddenInViewMode-report.csv';
            type = 'text/csv';
        } else {
            content = JSON.stringify(data, null, 2);
            filename = 'isHiddenInViewMode-report.json';
            type = 'application/json';
        }

        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast(`Exported ${format.toUpperCase()} report`, 'success');
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new IsHiddenInViewModeManager();
});
