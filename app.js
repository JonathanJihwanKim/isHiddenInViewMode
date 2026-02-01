// PBIR Visual Manager - Main Application

// Visual interaction capabilities based on Power BI's official behavior
const VISUAL_CAPABILITIES = {
    // Visuals that can ONLY be filtered (no highlighting)
    'lineChart': { canFilter: true, canHighlight: false, canBeFilterTarget: true, canBeHighlightTarget: false },
    'scatterChart': { canFilter: true, canHighlight: false, canBeFilterTarget: true, canBeHighlightTarget: false },
    'map': { canFilter: true, canHighlight: false, canBeFilterTarget: true, canBeHighlightTarget: false },
    'filledMap': { canFilter: true, canHighlight: false, canBeFilterTarget: true, canBeHighlightTarget: false },
    'shape': { canFilter: true, canHighlight: false, canBeFilterTarget: true, canBeHighlightTarget: false },

    // Slicers - filter only, cannot be highlighted
    'slicer': { canFilter: true, canHighlight: false, canBeFilterTarget: false, canBeHighlightTarget: false },

    // Non-data visuals (no interactions)
    'textbox': { canFilter: false, canHighlight: false, canBeFilterTarget: false, canBeHighlightTarget: false },
    'image': { canFilter: false, canHighlight: false, canBeFilterTarget: false, canBeHighlightTarget: false },

    // Default for all other visuals (both filter and highlight)
    'default': { canFilter: true, canHighlight: true, canBeFilterTarget: true, canBeHighlightTarget: true }
};

class PBIRVisualManager {
    constructor() {
        this.folderHandle = null;
        this.visuals = [];
        this.pageDisplayNames = new Map();
        this.reportSettings = null;          // Stores parsed report.json settings
        this.reportFileHandle = null;        // File handle for future enhancements

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

        // Visual Interactions tab state
        this.pages = [];                              // Page objects with interactions
        this.interactionsHistory = [];                // Undo history
        this.interactionsSelectedCells = new Set();   // Selected matrix cells (format: "sourceId|targetId")
        this.interactionsCurrentFilter = 'all';       // Status filter
        this.currentPageId = null;                    // Currently selected page
        this.interactionsViewMode = 'matrix';         // 'matrix' or 'list'

        // Pro features state
        this.isProUser = false; // Will be set based on license validation

        // Presets state
        this.customPresets = this.loadCustomPresets();
        this.builtInPresets = [
            { id: 'hide-all-filters', name: 'Hide All Filters', type: 'filter', value: true, description: 'Hides filter panes from report viewers. Filters still apply to data but are not visible or interactive.' },
            { id: 'show-all-filters', name: 'Show All Filters', type: 'filter', value: false, description: 'Makes all filter panes visible. Viewers can see and interact with filters.' },
            { id: 'reset-all-filters', name: 'Reset All Filters', type: 'filter', value: undefined, description: 'Removes the isHiddenInViewMode property. Restores Power BI default behavior.' },
            { id: 'lock-all-layers', name: 'Lock All Layers', type: 'layer', value: true, description: 'Visuals stay in their defined z-order. Clicking a visual won\'t bring it to front.' },
            { id: 'unlock-all-layers', name: 'Unlock All Layers', type: 'layer', value: false, description: 'Visuals can move to front when clicked. Allows dynamic layering during interaction.' },
            { id: 'reset-all-layers', name: 'Reset All Layers', type: 'layer', value: undefined, description: 'Removes the keepLayerOrder property. Restores Power BI default behavior.' },
            { id: 'disable-all-interactions', name: 'Disable All Interactions', type: 'interactions', value: 'NoFilter', description: 'Clicking one visual won\'t affect others. No cross-filtering or highlighting between visuals.' },
            { id: 'enable-all-interactions', name: 'Enable All (Default)', type: 'interactions', value: null, description: 'Removes explicit settings. Power BI determines how visuals interact with each other.' },
            { id: 'filter-all-interactions', name: 'Set All to Filter', type: 'interactions', value: 'DataFilter', description: 'Clicking a visual filters data in other visuals. Shows only matching data points.' },
            { id: 'highlight-all-interactions', name: 'Set All to Highlight', type: 'interactions', value: 'HighlightFilter', description: 'Clicking a visual highlights related data in other visuals. Non-matching data is dimmed but visible.' }
        ];
        this.pendingPresetType = null; // Track which tab preset is being saved from

        // Batch processing state
        this.batchQueue = [];
        this.batchProcessing = false;

        this.initElements();
        this.checkBrowserSupport();
        this.bindEvents();
        this.renderCustomPresets();
        this.initTheme();
    }

    initElements() {
        // Global buttons
        this.selectFolderBtn = document.getElementById('select-folder-btn');
        this.refreshBtn = document.getElementById('refresh-btn');
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

        // Sidebar elements
        this.leftSidebar = document.getElementById('left-sidebar');
        this.sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.quickActionsList = document.getElementById('quick-actions-list');
        this.reportTreeContent = document.getElementById('report-tree-content');
        this.sidebarReportTree = document.getElementById('sidebar-report-tree');

        // Welcome dashboard
        this.welcomeDashboard = document.getElementById('welcome-dashboard');
        this.welcomeSelectFolderBtn = document.getElementById('welcome-select-folder');

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
            defaultFilters: document.getElementById('default-filters'),
            namingAlert: document.getElementById('filter-naming-alert'),
            unnamedCount: document.getElementById('filter-unnamed-count'),
            unnamedList: document.getElementById('filter-unnamed-list')
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
            notSet: document.getElementById('layer-not-set'),
            namingAlert: document.getElementById('layer-naming-alert'),
            unnamedCount: document.getElementById('layer-unnamed-count'),
            unnamedList: document.getElementById('layer-unnamed-list')
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
            presetDescription: document.getElementById('batch-preset-description'),
            filterEnabled: document.getElementById('batch-filter-enabled'),
            filterValue: document.getElementById('batch-filter-value'),
            layerEnabled: document.getElementById('batch-layer-enabled'),
            layerValue: document.getElementById('batch-layer-value'),
            interactionsEnabled: document.getElementById('batch-interactions-enabled'),
            interactionsValue: document.getElementById('batch-interactions-value'),
            processBtn: document.getElementById('batch-process-btn'),
            batchStatus: document.getElementById('batch-status'),
            progressSection: document.getElementById('batch-progress-section'),
            progressFill: document.getElementById('batch-progress-fill'),
            progressText: document.getElementById('batch-progress-text'),
            resultsList: document.getElementById('batch-results-list')
        };

        // Visual Interactions tab elements
        this.interactionsElements = {
            pageSection: document.getElementById('interactions-page-section'),
            pageSelect: document.getElementById('interactions-page-select'),
            summarySection: document.getElementById('interactions-summary-section'),
            namingAlert: document.getElementById('interactions-naming-alert'),
            unnamedCount: document.getElementById('interactions-unnamed-count'),
            unnamedList: document.getElementById('interactions-unnamed-list'),
            legendSection: document.getElementById('interactions-legend-section'),
            presetsSection: document.getElementById('interactions-presets-section'),
            capabilitiesSection: document.getElementById('interactions-capabilities-section'),
            viewSection: document.getElementById('interactions-view-section'),
            viewMatrixBtn: document.getElementById('interactions-view-matrix-btn'),
            viewListBtn: document.getElementById('interactions-view-list-btn'),
            viewHint: document.getElementById('interactions-view-hint'),
            actionsSection: document.getElementById('interactions-actions-section'),
            selectAllBtn: document.getElementById('interactions-select-all-btn'),
            selectNoneBtn: document.getElementById('interactions-select-none-btn'),
            setNoneBtn: document.getElementById('interactions-set-none-btn'),
            setFilterBtn: document.getElementById('interactions-set-filter-btn'),
            setHighlightBtn: document.getElementById('interactions-set-highlight-btn'),
            resetBtn: document.getElementById('interactions-reset-btn'),
            actionHint: document.getElementById('interactions-action-hint'),
            bulkActionBtns: document.querySelectorAll('.interactions-bulk-btn'),
            matrixSection: document.getElementById('interactions-matrix-section'),
            matrixContainer: document.getElementById('interactions-matrix-container'),
            listContainer: document.getElementById('interactions-list-container'),
            saveSection: document.getElementById('interactions-save-section'),
            saveBtn: document.getElementById('interactions-save-btn'),
            modifiedStatus: document.getElementById('interactions-modified-status'),
            historySection: document.getElementById('interactions-history-section'),
            undoBtn: document.getElementById('interactions-undo-btn'),
            undoAllBtn: document.getElementById('interactions-undo-all-btn'),
            exportCsvBtn: document.getElementById('interactions-export-csv-btn'),
            exportJsonBtn: document.getElementById('interactions-export-json-btn'),
            historyStatus: document.getElementById('interactions-history-status'),
            // Summary values
            totalInteractions: document.getElementById('interactions-total'),
            explicitOverrides: document.getElementById('interactions-explicit'),
            defaultInteractions: document.getElementById('interactions-default'),
            noFilterCount: document.getElementById('interactions-nofilter'),
            dataFilterCount: document.getElementById('interactions-datafilter'),
            highlightFilterCount: document.getElementById('interactions-highlightfilter'),
            // Report-level defaults
            reportDefaultInfo: document.getElementById('interactions-report-default'),
            reportDefaultNote: document.getElementById('interactions-report-default-note'),
            reportDefaultType: document.getElementById('interactions-report-default-type')
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
        this.refreshBtn.addEventListener('click', () => this.refreshData());

        // Welcome dashboard select folder button
        if (this.welcomeSelectFolderBtn) {
            this.welcomeSelectFolderBtn.addEventListener('click', () => this.selectFolder());
        }

        // Sidebar collapse toggle
        if (this.sidebarCollapseBtn) {
            this.sidebarCollapseBtn.addEventListener('click', () => this.toggleSidebar());
        }

        // Mobile menu toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileSidebar());
        }

        // Sidebar navigation
        document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
                this.updateSidebarNav(btn.dataset.tab);
                // Close mobile sidebar after selection
                if (window.innerWidth <= 992) {
                    this.closeMobileSidebar();
                }
            });
        });

        // Feature cards click to switch tab
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', () => {
                const feature = card.dataset.feature;
                if (feature) {
                    this.switchTab(feature);
                    this.updateSidebarNav(feature);
                }
            });
        });

        // Theme toggle from header
        const themeToggleHeader = document.getElementById('theme-toggle-header');
        if (themeToggleHeader) {
            themeToggleHeader.addEventListener('click', () => this.toggleTheme());
        }

        // Tab switching (legacy horizontal tabs)
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
                this.updateSidebarNav(btn.dataset.tab);
            });
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
            const presetId = e.target.value;
            if (presetId) {
                // Show preset description
                const preset = this.builtInPresets.find(p => p.id === presetId);
                if (preset?.description) {
                    this.batchElements.presetDescription.textContent = preset.description;
                    this.batchElements.presetDescription.classList.remove('hidden');
                }
                // Disable manual settings when preset is selected
                this.batchElements.filterEnabled.checked = false;
                this.batchElements.filterValue.disabled = true;
                this.batchElements.layerEnabled.checked = false;
                this.batchElements.layerValue.disabled = true;
                this.batchElements.interactionsEnabled.checked = false;
                this.batchElements.interactionsValue.disabled = true;
            } else {
                // Hide description when no preset selected
                this.batchElements.presetDescription.classList.add('hidden');
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

        this.batchElements.interactionsEnabled.addEventListener('change', (e) => {
            this.batchElements.interactionsValue.disabled = !e.target.checked;
            if (e.target.checked) this.batchElements.presetSelect.value = '';
            this.updateBatchProcessButton();
        });

        // Visual Interactions tab events
        if (this.interactionsElements.pageSelect) {
            this.interactionsElements.pageSelect.addEventListener('change', (e) => {
                this.onPageSelected(e.target.value);
            });
        }

        if (this.interactionsElements.viewMatrixBtn) {
            this.interactionsElements.viewMatrixBtn.addEventListener('click', () => {
                this.switchInteractionsView('matrix');
            });
        }

        if (this.interactionsElements.viewListBtn) {
            this.interactionsElements.viewListBtn.addEventListener('click', () => {
                this.switchInteractionsView('list');
            });
        }

        if (this.interactionsElements.selectAllBtn) {
            this.interactionsElements.selectAllBtn.addEventListener('click', () => this.interactionsSelectAll());
        }

        if (this.interactionsElements.selectNoneBtn) {
            this.interactionsElements.selectNoneBtn.addEventListener('click', () => this.interactionsSelectNone());
        }

        if (this.interactionsElements.setNoneBtn) {
            this.interactionsElements.setNoneBtn.addEventListener('click', () => this.interactionsBulkSetType('NoFilter'));
        }

        if (this.interactionsElements.setFilterBtn) {
            this.interactionsElements.setFilterBtn.addEventListener('click', () => this.interactionsBulkSetType('DataFilter'));
        }

        if (this.interactionsElements.setHighlightBtn) {
            this.interactionsElements.setHighlightBtn.addEventListener('click', () => this.interactionsBulkSetType('HighlightFilter'));
        }

        if (this.interactionsElements.resetBtn) {
            this.interactionsElements.resetBtn.addEventListener('click', () => this.interactionsBulkSetType(null));
        }

        if (this.interactionsElements.saveBtn) {
            this.interactionsElements.saveBtn.addEventListener('click', () => this.saveInteractionsChanges());
        }

        if (this.interactionsElements.undoBtn) {
            this.interactionsElements.undoBtn.addEventListener('click', () => this.interactionsUndo());
        }

        if (this.interactionsElements.undoAllBtn) {
            this.interactionsElements.undoAllBtn.addEventListener('click', () => this.interactionsUndoAll());
        }

        if (this.interactionsElements.exportCsvBtn) {
            this.interactionsElements.exportCsvBtn.addEventListener('click', () => this.exportInteractionsReport('csv'));
        }

        if (this.interactionsElements.exportJsonBtn) {
            this.interactionsElements.exportJsonBtn.addEventListener('click', () => this.exportInteractionsReport('json'));
        }
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
            this.refreshBtn.classList.remove('hidden');
            await this.scanVisuals();
        } catch (err) {
            if (err.name !== 'AbortError') {
                this.showToast('Error selecting folder: ' + err.message, 'error');
            }
        }
    }

    async refreshData() {
        if (!this.folderHandle) return;

        this.refreshBtn.disabled = true;
        const originalText = this.refreshBtn.innerHTML;
        this.refreshBtn.innerHTML = '&#8635; Refreshing...';

        try {
            await this.scanVisuals();
            this.showToast('Data refreshed successfully', 'success');
        } catch (err) {
            this.showToast('Error refreshing data: ' + err.message, 'error');
        } finally {
            this.refreshBtn.disabled = false;
            this.refreshBtn.innerHTML = originalText;
        }
    }

    async scanVisuals() {
        this.visuals = [];
        this.filterHistory = [];
        this.layerHistory = [];
        this.filterSelectedVisuals.clear();
        this.layerSelectedVisuals.clear();
        this.pageDisplayNames.clear();

        // Reset interactions state
        this.pages = [];
        this.interactionsHistory = [];
        this.interactionsSelectedCells.clear();
        this.currentPageId = null;

        try {
            // Pass 1: Collect all page display names and interactions first
            await this.collectPageDisplayNames(this.folderHandle, '');

            // Pass 1.5: Read report-level settings from definition/report.json
            await this.findAndReadReportSettings(this.folderHandle);

            // Pass 2: Process visual.json files
            await this.scanForVisuals(this.folderHandle, '');

            // Pass 3: Build page objects with visuals for interactions tab
            await this.buildPagesWithVisuals();

            if (this.visuals.length === 0) {
                this.showEmptyState();
            } else {
                this.showContent();
                this.updateFilterSummary();
                this.updateLayerSummary();
                this.checkUnnamedVisualsForTab(this.filterElements);
                this.checkUnnamedVisualsForTab(this.layerElements);
                this.renderFilterTable();
                this.renderLayerTable();
                this.updateInteractionsPageSelector();
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

            const pathParts = folderPath.split('/').filter(p => p.length > 0);
            const pageId = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'unknown-page';

            if (json.displayName) {
                this.pageDisplayNames.set(pageId, json.displayName);
            }

            // Store page data for interactions tab (will be enriched with visuals later)
            this.pages.push({
                path: folderPath,
                pageId: pageId,
                displayName: json.displayName || pageId,
                fileHandle: fileHandle,
                originalJson: JSON.parse(content),
                currentJson: json,
                visuals: [],  // Will be populated in buildPagesWithVisuals
                visualInteractions: json.visualInteractions || [],
                modified: false
            });
        } catch (err) {
            // Log to console for debugging
            console.warn(`Could not read page.json at ${folderPath}: ${err.message}`);
            // Show user feedback for JSON parse errors (malformed files)
            if (err instanceof SyntaxError) {
                const folderName = folderPath.split('/').pop() || folderPath;
                this.showToast(`Invalid JSON in page.json: ${folderName}`, 'error');
            }
        }
    }

    async findAndReadReportSettings(rootHandle) {
        try {
            // Try to access definition folder
            const definitionDir = await rootHandle.getDirectoryHandle('definition');

            // Try to access report.json
            const reportFileHandle = await definitionDir.getFileHandle('report.json');

            // Store handle for potential future use
            this.reportFileHandle = reportFileHandle;

            // Read and parse the file
            await this.readReportSettings(reportFileHandle);

            console.log('Report settings loaded:', this.reportSettings);
        } catch (err) {
            // This is expected for reports without report.json
            // Not an error condition
            this.reportSettings = null;
            this.reportFileHandle = null;
            console.log('No report.json found (this is normal for many reports)');
        }
    }

    async readReportSettings(fileHandle) {
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            const json = JSON.parse(content);

            // Extract settings object
            const settings = json.settings || {};

            // Store relevant settings
            this.reportSettings = {
                // Core interaction settings
                defaultFilterActionIsDataFilter: settings.defaultFilterActionIsDataFilter,
                defaultDrillFilterOtherVisuals: settings.defaultDrillFilterOtherVisuals,
                allowChangeFilterTypes: settings.allowChangeFilterTypes,

                // Other useful settings for potential future use
                useEnhancedTooltips: settings.useEnhancedTooltips,
                exportDataMode: settings.exportDataMode,

                // Store full settings for reference
                _rawSettings: settings,

                // Compute the effective default interaction type
                computedDefaultInteractionType: this.computeDefaultInteractionType(settings)
            };

        } catch (err) {
            console.warn('Could not parse report.json:', err.message);

            // Show user feedback for JSON parse errors
            if (err instanceof SyntaxError) {
                this.showToast('Invalid JSON in report.json. Using default behavior.', 'warning');
            }

            this.reportSettings = null;
        }
    }

    computeDefaultInteractionType(settings) {
        // Based on Power BI documentation:
        // defaultFilterActionIsDataFilter determines the default interaction

        if (typeof settings.defaultFilterActionIsDataFilter === 'boolean') {
            return settings.defaultFilterActionIsDataFilter ? 'DataFilter' : 'HighlightFilter';
        }

        // Setting not present or invalid - cannot determine
        return null;
    }

    getReportDefaultInteractionType() {
        return this.reportSettings?.computedDefaultInteractionType || null;
    }

    async processJsonFile(fileHandle, filePath) {
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            const json = JSON.parse(content);

            const pathParts = filePath.split('/').filter(p => p.length > 0);

            let pageName = 'Unknown';
            let visualId = '';

            // Guard against empty path
            if (pathParts.length === 0) {
                visualId = fileHandle.name.replace('.json', '');
            } else {
                const pagesIndex = pathParts.indexOf('pages');
                const visualsIndex = pathParts.indexOf('visuals');

                if (pagesIndex !== -1 && pagesIndex + 1 < pathParts.length) {
                    pageName = pathParts[pagesIndex + 1];
                }

                if (visualsIndex !== -1 && visualsIndex + 1 < pathParts.length) {
                    visualId = pathParts[visualsIndex + 1];
                }

                if (pageName === 'Unknown' && pathParts.length >= 2) {
                    pageName = pathParts.length >= 4 ? pathParts[pathParts.length - 4] : pathParts[0];
                }

                if (!visualId && pathParts.length >= 2) {
                    visualId = pathParts[pathParts.length - 2];
                }

                if (!visualId) {
                    visualId = fileHandle.name.replace('.json', '');
                }
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
                hasExplicitTitle: this.hasExplicitTitle(json),
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
        if (json.visual?.visualType) {
            return json.visual.visualType;
        }
        if (json.visualType) {
            return json.visualType;
        }
        if (json.singleVisual?.visualType) {
            return json.singleVisual.visualType;
        }
        return 'unknown';
    }

    normalizeVisualType(visualType) {
        // Map Power BI visual type strings to capability keys
        const typeMap = {
            'lineChart': 'lineChart',
            'lineClusteredColumnComboChart': 'lineChart',
            'lineStackedColumnComboChart': 'lineChart',
            'scatterChart': 'scatterChart',
            'map': 'map',
            'filledMap': 'filledMap',
            'shape': 'shape',
            'slicer': 'slicer',
            'textbox': 'textbox',
            'image': 'image'
        };
        return typeMap[visualType] || 'default';
    }

    getVisualCapabilities(visualType) {
        const normalized = this.normalizeVisualType(visualType);
        return VISUAL_CAPABILITIES[normalized] || VISUAL_CAPABILITIES.default;
    }

    isValidInteraction(sourceVisualType, targetVisualType, interactionType) {
        if (interactionType === null || interactionType === 'NoFilter') {
            return true; // Default and None are always valid
        }

        const sourceCaps = this.getVisualCapabilities(sourceVisualType);
        const targetCaps = this.getVisualCapabilities(targetVisualType);

        if (interactionType === 'DataFilter') {
            return sourceCaps.canFilter && targetCaps.canBeFilterTarget;
        }

        if (interactionType === 'HighlightFilter') {
            return sourceCaps.canHighlight && targetCaps.canBeHighlightTarget;
        }

        return false;
    }

    getInteractionFallback(sourceType, targetType, requestedType) {
        // If highlight was requested but not valid, try filter
        if (requestedType === 'HighlightFilter') {
            if (this.isValidInteraction(sourceType, targetType, 'DataFilter')) {
                return 'DataFilter';
            }
        }
        // If filter was requested but not valid, use None
        if (requestedType === 'DataFilter') {
            return 'NoFilter';
        }
        return 'NoFilter'; // Default fallback
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
        if (json.visual?.name) {
            return json.visual.name;
        }
        return '';
    }

    hasExplicitTitle(json) {
        // Only check for explicit title in visualContainerObjects (user-set title)
        // Do NOT fall back to json.name which is auto-generated by Power BI
        if (json.visual?.visualContainerObjects?.title) {
            const titleProps = json.visual.visualContainerObjects.title[0]?.properties;
            if (titleProps?.text?.expr?.Literal?.Value) {
                const title = titleProps.text.expr.Literal.Value.replace(/^'|'$/g, '');
                return title && title.trim().length > 0;
            }
        }
        return false;
    }

    extractFilters(json) {
        const filters = [];

        if (Array.isArray(json.filterConfig?.filters)) {
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

    // ==================== Visual Interactions Data Methods ====================

    async buildPagesWithVisuals() {
        // Group visuals by page and attach to page objects
        for (const page of this.pages) {
            const pageVisuals = this.visuals.filter(v => v.pageName === page.pageId);

            page.visuals = pageVisuals.map(v => ({
                visualId: v.visualId,
                visualName: v.visualName,
                visualType: v.visualType,
                hasName: v.hasExplicitTitle
            }));
        }

        // Set initial page if we have pages
        if (this.pages.length > 0) {
            this.currentPageId = this.pages[0].pageId;
        }
    }

    getVisualDisplayName(visual) {
        if (visual.visualName && visual.visualName.trim()) {
            return visual.visualName;
        }
        // Fallback: visualType + shortened ID
        const shortId = visual.visualId.length > 8
            ? visual.visualId.substring(0, 8) + '...'
            : visual.visualId;
        return `${visual.visualType} (${shortId})`;
    }

    getCurrentPage() {
        return this.pages.find(p => p.pageId === this.currentPageId);
    }

    getInteractionType(page, sourceId, targetId) {
        const interaction = page.visualInteractions.find(
            i => i.source === sourceId && i.target === targetId
        );
        return interaction ? interaction.type : 'Default';
    }

    buildInteractionMatrix(page) {
        const matrix = [];
        const visuals = page.visuals;

        for (const source of visuals) {
            for (const target of visuals) {
                if (source.visualId === target.visualId) continue; // Skip self-interactions

                const type = this.getInteractionType(page, source.visualId, target.visualId);

                matrix.push({
                    source: source.visualId,
                    target: target.visualId,
                    sourceName: this.getVisualDisplayName(source),
                    targetName: this.getVisualDisplayName(target),
                    sourceHasName: source.hasName,
                    targetHasName: target.hasName,
                    type: type,
                    isDefault: type === 'Default',
                    isExplicit: type !== 'Default'
                });
            }
        }
        return matrix;
    }

    countUnnamedVisuals(page) {
        return page.visuals.filter(v => !v.hasName).length;
    }

    getInteractionTypeDisplay(type) {
        switch (type) {
            case 'Default': return { text: 'Default', class: 'interaction-default', icon: '&#9898;' };
            case 'DataFilter': return { text: 'Filter', class: 'interaction-filter', icon: '&#128269;' };
            case 'HighlightFilter': return { text: 'Highlight', class: 'interaction-highlight', icon: '&#128161;' };
            case 'NoFilter': return { text: 'None', class: 'interaction-none', icon: '&#10060;' };
            default: return { text: type, class: 'interaction-default', icon: '&#9898;' };
        }
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
                    <input type="checkbox" class="visual-checkbox" data-path="${this.escapeHtml(visual.path)}" ${isSelected ? 'checked' : ''}>
                </td>
                <td class="col-expand">
                    ${visual.filters.length > 0 ?
                        `<button class="expand-btn" data-path="${this.escapeHtml(visual.path)}">&#9654;</button>` :
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
                        <select class="filter-status-select" data-path="${this.escapeHtml(path)}" data-index="${i}">
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
        if (Array.isArray(visual.currentJson.filterConfig?.filters)) {
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
            visual.currentJson = structuredClone(visual.originalJson);
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
                    <input type="checkbox" class="layer-checkbox" data-path="${this.escapeHtml(visual.path)}" ${isSelected ? 'checked' : ''}>
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
            visual.currentJson = structuredClone(visual.originalJson);
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
        this.refreshBtn.classList.add('hidden');

        // Show welcome dashboard, hide report tree
        this.showWelcomeDashboard();
        if (this.sidebarReportTree) {
            this.sidebarReportTree.classList.add('hidden');
        }

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

        // Hide interactions tab sections
        if (this.interactionsElements) {
            this.interactionsElements.pageSection?.classList.add('hidden');
            this.interactionsElements.summarySection?.classList.add('hidden');
            this.interactionsElements.namingAlert?.classList.add('hidden');
            this.interactionsElements.legendSection?.classList.add('hidden');
            this.interactionsElements.presetsSection?.classList.add('hidden');
            this.interactionsElements.capabilitiesSection?.classList.add('hidden');
            this.interactionsElements.viewSection?.classList.add('hidden');
            this.interactionsElements.actionsSection?.classList.add('hidden');
            this.interactionsElements.matrixSection?.classList.add('hidden');
            this.interactionsElements.saveSection?.classList.add('hidden');
            this.interactionsElements.historySection?.classList.add('hidden');
        }

        this.emptyState.classList.remove('hidden');
    }

    showContent() {
        this.emptyState.classList.add('hidden');
        this.tabNavigation.classList.remove('hidden');

        // Hide welcome dashboard, show report tree
        this.hideWelcomeDashboard();
        this.renderReportTree();

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

        // Show interactions tab sections
        if (this.interactionsElements) {
            this.interactionsElements.pageSection?.classList.remove('hidden');
            this.interactionsElements.summarySection?.classList.remove('hidden');
            // namingAlert is shown conditionally by checkUnnamedVisuals
            this.interactionsElements.legendSection?.classList.remove('hidden');
            this.interactionsElements.presetsSection?.classList.remove('hidden');
            this.interactionsElements.capabilitiesSection?.classList.remove('hidden');
            this.interactionsElements.viewSection?.classList.remove('hidden');
            this.interactionsElements.actionsSection?.classList.remove('hidden');
            this.interactionsElements.matrixSection?.classList.remove('hidden');
            this.interactionsElements.saveSection?.classList.remove('hidden');
            this.interactionsElements.historySection?.classList.remove('hidden');
        }
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
        try {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
        } finally {
            URL.revokeObjectURL(url);
        }
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
        } else if (preset.type === 'interactions') {
            // Apply to all interactions on current page
            this.interactionsSelectedCells.clear();
            this.interactionsBulkSetType(preset.value);
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
                          this.batchElements.layerEnabled.checked ||
                          this.batchElements.interactionsEnabled.checked;

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
            layerValue: undefined,
            interactionsEnabled: false,
            interactionsValue: undefined
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
                } else if (preset.type === 'interactions') {
                    settings.interactionsEnabled = true;
                    settings.interactionsValue = preset.value;
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
            if (this.batchElements.interactionsEnabled.checked) {
                settings.interactionsEnabled = true;
                const val = this.batchElements.interactionsValue.value;
                settings.interactionsValue = val === 'null' ? null : val;
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

        // Apply interactions settings (process page.json files)
        if (settings.interactionsEnabled) {
            const pagesUpdated = await this.processInteractionsBatch(dirHandle, settings.interactionsValue);
            updatedCount += pagesUpdated;
        }

        return { updatedCount };
    }

    async processInteractionsBatch(dirHandle, interactionType, currentPath = '', depth = 0) {
        const MAX_DEPTH = 50;
        if (depth >= MAX_DEPTH) return 0;

        let updatedCount = 0;

        for await (const entry of dirHandle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            if (entry.kind === 'directory') {
                updatedCount += await this.processInteractionsBatch(entry, interactionType, entryPath, depth + 1);
            } else if (entry.kind === 'file' && entry.name === 'page.json') {
                try {
                    const file = await entry.getFile();
                    const content = await file.text();
                    const json = JSON.parse(content);

                    // Get all visuals on this page
                    const pageDir = await this.getParentDirectory(dirHandle, currentPath);
                    if (!pageDir) continue;

                    const visualIds = await this.collectVisualIdsFromPage(pageDir);

                    // Build new interactions array
                    let modified = false;

                    if (interactionType === null) {
                        // Reset to default - remove visualInteractions
                        if (json.visualInteractions && json.visualInteractions.length > 0) {
                            delete json.visualInteractions;
                            modified = true;
                        }
                    } else {
                        // Set all interactions to specified type
                        const newInteractions = [];
                        for (const sourceId of visualIds) {
                            for (const targetId of visualIds) {
                                if (sourceId !== targetId) {
                                    newInteractions.push({
                                        source: sourceId,
                                        target: targetId,
                                        type: interactionType
                                    });
                                }
                            }
                        }

                        // Check if changed
                        const oldInteractionsStr = JSON.stringify(json.visualInteractions || []);
                        const newInteractionsStr = JSON.stringify(newInteractions);
                        if (oldInteractionsStr !== newInteractionsStr) {
                            json.visualInteractions = newInteractions;
                            modified = true;
                        }
                    }

                    if (modified) {
                        const writable = await entry.createWritable();
                        await writable.write(JSON.stringify(json, null, 2));
                        await writable.close();
                        updatedCount++;
                    }
                } catch (err) {
                    console.warn(`Could not process page.json at ${entryPath}:`, err);
                }
            }
        }

        return updatedCount;
    }

    async getParentDirectory(rootHandle, path) {
        if (!path) return rootHandle;

        const parts = path.split('/');
        let currentHandle = rootHandle;

        for (const part of parts) {
            try {
                currentHandle = await currentHandle.getDirectoryHandle(part);
            } catch {
                return null;
            }
        }

        return currentHandle;
    }

    async collectVisualIdsFromPage(pageHandle) {
        const visualIds = [];

        try {
            const visualsDir = await pageHandle.getDirectoryHandle('visuals');

            for await (const entry of visualsDir.values()) {
                if (entry.kind === 'directory') {
                    visualIds.push(entry.name);
                }
            }
        } catch {
            // No visuals directory
        }

        return visualIds;
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
        if (Array.isArray(visual.json.filterConfig?.filters)) {
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

    // ==================== Visual Interactions Methods ====================

    updateInteractionsPageSelector() {
        if (!this.interactionsElements?.pageSelect) return;

        this.interactionsElements.pageSelect.innerHTML = this.pages.map(page => {
            const visualCount = page.visuals.length;
            return `<option value="${page.pageId}">${this.escapeHtml(page.displayName)} (${visualCount} visuals)</option>`;
        }).join('');

        if (this.pages.length > 0 && !this.currentPageId) {
            this.currentPageId = this.pages[0].pageId;
        }

        if (this.currentPageId) {
            this.interactionsElements.pageSelect.value = this.currentPageId;
            this.onPageSelected(this.currentPageId);
        }
    }

    onPageSelected(pageId) {
        this.currentPageId = pageId;
        const page = this.getCurrentPage();
        if (!page) return;

        // Determine default view based on visual count
        const visualCount = page.visuals.length;
        if (visualCount >= 20 && this.interactionsViewMode === 'matrix') {
            // Auto-switch to list view for large pages (but user can toggle back)
            this.interactionsViewMode = 'list';
        } else if (visualCount < 20) {
            this.interactionsViewMode = 'matrix';
        }

        this.interactionsSelectedCells.clear();
        this.updateInteractionsViewToggle();
        this.updateInteractionsSummary();
        this.checkUnnamedVisuals(page);
        this.renderInteractionsView();
        this.updateInteractionsSelectionButtons();
    }

    updateInteractionsViewToggle() {
        if (!this.interactionsElements?.viewMatrixBtn || !this.interactionsElements?.viewListBtn) return;

        this.interactionsElements.viewMatrixBtn.classList.toggle('active', this.interactionsViewMode === 'matrix');
        this.interactionsElements.viewListBtn.classList.toggle('active', this.interactionsViewMode === 'list');

        const page = this.getCurrentPage();
        if (page && this.interactionsElements.viewHint) {
            const visualCount = page.visuals.length;
            this.interactionsElements.viewHint.textContent = visualCount >= 20
                ? '(20+ visuals: List recommended)'
                : '';
        }
    }

    switchInteractionsView(view) {
        this.interactionsViewMode = view;
        this.updateInteractionsViewToggle();
        this.renderInteractionsView();
    }

    updateInteractionsSummary() {
        if (!this.interactionsElements?.totalInteractions) return;

        const page = this.getCurrentPage();
        if (!page) return;

        const visualCount = page.visuals.length;
        const totalPossible = visualCount * (visualCount - 1); // N × (N-1) interactions
        const explicitCount = page.visualInteractions.length;
        const defaultCount = totalPossible - explicitCount;

        // Count by type
        const typeCounts = { NoFilter: 0, DataFilter: 0, HighlightFilter: 0 };
        for (const interaction of page.visualInteractions) {
            if (typeCounts[interaction.type] !== undefined) {
                typeCounts[interaction.type]++;
            }
        }

        this.interactionsElements.totalInteractions.textContent = totalPossible;
        this.interactionsElements.explicitOverrides.textContent = explicitCount;
        this.interactionsElements.defaultInteractions.textContent = defaultCount;
        this.interactionsElements.noFilterCount.textContent = typeCounts.NoFilter;
        this.interactionsElements.dataFilterCount.textContent = typeCounts.DataFilter;
        this.interactionsElements.highlightFilterCount.textContent = typeCounts.HighlightFilter;

        // Show report-level default info if available
        if (this.reportSettings && this.reportSettings.computedDefaultInteractionType) {
            this.interactionsElements.reportDefaultInfo.textContent =
                `Report Default: ${this.reportSettings.computedDefaultInteractionType}`;
            this.interactionsElements.reportDefaultInfo.classList.remove('hidden');

            // Update legend note
            if (this.interactionsElements.reportDefaultNote && this.interactionsElements.reportDefaultType) {
                this.interactionsElements.reportDefaultType.textContent = this.reportSettings.computedDefaultInteractionType;
                this.interactionsElements.reportDefaultNote.classList.remove('hidden');
            }
        } else {
            this.interactionsElements.reportDefaultInfo.classList.add('hidden');
            if (this.interactionsElements.reportDefaultNote) {
                this.interactionsElements.reportDefaultNote.classList.add('hidden');
            }
        }
    }

    checkUnnamedVisuals(page) {
        if (!this.interactionsElements?.namingAlert) return;

        const unnamedVisuals = page.visuals.filter(v => !v.hasName);

        if (unnamedVisuals.length > 0) {
            this.interactionsElements.namingAlert.classList.remove('hidden');
            this.interactionsElements.unnamedCount.textContent = unnamedVisuals.length;

            // Populate unnamed list
            this.interactionsElements.unnamedList.innerHTML = unnamedVisuals.map(v => {
                const displayName = this.getVisualDisplayName(v);
                return `<li><em>${this.escapeHtml(displayName)}</em></li>`;
            }).join('');
        } else {
            this.interactionsElements.namingAlert.classList.add('hidden');
        }
    }

    checkUnnamedVisualsForTab(elements) {
        if (!elements?.namingAlert) return;

        const unnamedVisuals = this.visuals.filter(v => !v.hasExplicitTitle);

        if (unnamedVisuals.length > 0) {
            elements.namingAlert.classList.remove('hidden');
            elements.unnamedCount.textContent = unnamedVisuals.length;
            elements.unnamedList.innerHTML = unnamedVisuals.map(v => {
                const displayName = v.visualName || `${v.visualType} (${v.visualId.substring(0, 8)}...)`;
                return `<li><em>${this.escapeHtml(displayName)}</em> - ${this.escapeHtml(v.pageDisplayName)}</li>`;
            }).join('');
        } else {
            elements.namingAlert.classList.add('hidden');
        }
    }

    renderInteractionsView() {
        if (this.interactionsViewMode === 'matrix') {
            this.interactionsElements.matrixContainer.classList.remove('hidden');
            this.interactionsElements.listContainer.classList.add('hidden');
            this.renderInteractionMatrix();
        } else {
            this.interactionsElements.matrixContainer.classList.add('hidden');
            this.interactionsElements.listContainer.classList.remove('hidden');
            this.renderInteractionList();
        }
    }

    renderInteractionMatrix() {
        const page = this.getCurrentPage();
        if (!page || !this.interactionsElements?.matrixContainer) return;

        const visuals = page.visuals;
        if (visuals.length === 0) {
            this.interactionsElements.matrixContainer.innerHTML = '<p class="no-visuals">No visuals on this page</p>';
            return;
        }

        // Build matrix table HTML
        let html = '<table class="interaction-matrix">';

        // Header row with target visuals
        html += '<thead><tr><th class="corner-cell"></th>';
        for (const target of visuals) {
            const displayName = this.getVisualDisplayName(target);
            const nameClass = target.hasName ? '' : 'unnamed-visual';
            html += `<th class="target-header ${nameClass}" title="${this.escapeHtml(target.visualId)}">${this.escapeHtml(displayName)}</th>`;
        }
        html += '</tr></thead>';

        // Body rows with source visuals
        html += '<tbody>';
        for (const source of visuals) {
            const sourceDisplayName = this.getVisualDisplayName(source);
            const sourceNameClass = source.hasName ? '' : 'unnamed-visual';

            html += '<tr>';
            html += `<th class="source-header ${sourceNameClass}" title="${this.escapeHtml(source.visualId)}">${this.escapeHtml(sourceDisplayName)}</th>`;

            for (const target of visuals) {
                if (source.visualId === target.visualId) {
                    // Diagonal cell - self interaction (disabled)
                    html += '<td class="interaction-cell interaction-cell-disabled">—</td>';
                } else {
                    const type = this.getInteractionType(page, source.visualId, target.visualId);
                    const typeDisplay = this.getInteractionTypeDisplay(type);
                    const cellKey = `${source.visualId}|${target.visualId}`;
                    const isSelected = this.interactionsSelectedCells.has(cellKey);

                    // Determine allowed interaction types based on visual capabilities
                    const sourceCaps = this.getVisualCapabilities(source.visualType);
                    const targetCaps = this.getVisualCapabilities(target.visualType);

                    const allowedTypes = [];
                    if (sourceCaps.canFilter && targetCaps.canBeFilterTarget) {
                        allowedTypes.push('DataFilter');
                    }
                    if (sourceCaps.canHighlight && targetCaps.canBeHighlightTarget) {
                        allowedTypes.push('HighlightFilter');
                    }
                    allowedTypes.push('NoFilter', null); // None and Default always allowed

                    const isRestricted = allowedTypes.length === 2; // Only None and Default available

                    // Build tooltip with report default context if applicable
                    let tooltipText = `${this.escapeHtml(sourceDisplayName)} → ${this.escapeHtml(this.getVisualDisplayName(target))}: ${typeDisplay.text}`;
                    if (type === 'Default' && this.reportSettings?.computedDefaultInteractionType) {
                        tooltipText += ` (Report default: ${this.reportSettings.computedDefaultInteractionType})`;
                    }
                    if (isRestricted) {
                        tooltipText += ` [Limited: ${source.visualType} ↔ ${target.visualType}]`;
                    }

                    html += `<td class="interaction-cell ${typeDisplay.class} ${isSelected ? 'selected' : ''} ${isRestricted ? 'interaction-restricted' : ''}"
                                data-source="${source.visualId}"
                                data-target="${target.visualId}"
                                data-source-type="${this.escapeHtml(source.visualType)}"
                                data-target-type="${this.escapeHtml(target.visualType)}"
                                data-allowed-types='${JSON.stringify(allowedTypes)}'
                                title="${tooltipText}">
                                <span class="interaction-icon">${typeDisplay.icon}</span>
                            </td>`;
                }
            }
            html += '</tr>';
        }
        html += '</tbody></table>';

        this.interactionsElements.matrixContainer.innerHTML = html;

        // Bind cell click events
        this.interactionsElements.matrixContainer.querySelectorAll('.interaction-cell:not(.interaction-cell-disabled)').forEach(cell => {
            cell.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    // Multi-select with Ctrl/Cmd
                    this.toggleCellSelection(cell.dataset.source, cell.dataset.target);
                } else {
                    // Single click - open type selector
                    this.showInteractionTypeSelector(cell, cell.dataset.source, cell.dataset.target);
                }
            });
        });
    }

    renderInteractionList() {
        const page = this.getCurrentPage();
        if (!page || !this.interactionsElements?.listContainer) return;

        // Show only explicit (non-default) interactions
        const interactions = page.visualInteractions;

        if (interactions.length === 0) {
            this.interactionsElements.listContainer.innerHTML = '<p class="no-interactions">No explicit interaction overrides. All interactions use default behavior.</p>';
            return;
        }

        let html = '<table class="interaction-list-table">';
        html += '<thead><tr><th>Source Visual</th><th>Target Visual</th><th>Type</th><th>Actions</th></tr></thead>';
        html += '<tbody>';

        for (const interaction of interactions) {
            const sourceVisual = page.visuals.find(v => v.visualId === interaction.source);
            const targetVisual = page.visuals.find(v => v.visualId === interaction.target);

            const sourceName = sourceVisual ? this.getVisualDisplayName(sourceVisual) : interaction.source;
            const targetName = targetVisual ? this.getVisualDisplayName(targetVisual) : interaction.target;
            const typeDisplay = this.getInteractionTypeDisplay(interaction.type);

            // Build tooltip with report default context if applicable
            let badgeTooltip = '';
            if (interaction.type === 'Default' && this.reportSettings?.computedDefaultInteractionType) {
                badgeTooltip = ` title="Report default: ${this.reportSettings.computedDefaultInteractionType}"`;
            }

            html += `<tr data-source="${interaction.source}" data-target="${interaction.target}">
                <td class="${sourceVisual?.hasName ? '' : 'unnamed-visual'}">${this.escapeHtml(sourceName)}</td>
                <td class="${targetVisual?.hasName ? '' : 'unnamed-visual'}">${this.escapeHtml(targetName)}</td>
                <td><span class="interaction-type-badge ${typeDisplay.class}"${badgeTooltip}>${typeDisplay.icon} ${typeDisplay.text}</span></td>
                <td>
                    <button class="btn btn-sm btn-action edit-interaction-btn" data-source="${interaction.source}" data-target="${interaction.target}">Edit</button>
                    <button class="btn btn-sm btn-secondary reset-interaction-btn" data-source="${interaction.source}" data-target="${interaction.target}">Reset</button>
                </td>
            </tr>`;
        }

        html += '</tbody></table>';

        this.interactionsElements.listContainer.innerHTML = html;

        // Bind edit/reset buttons
        this.interactionsElements.listContainer.querySelectorAll('.edit-interaction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showInteractionTypeSelector(btn, btn.dataset.source, btn.dataset.target);
            });
        });

        this.interactionsElements.listContainer.querySelectorAll('.reset-interaction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setInteractionType(this.currentPageId, btn.dataset.source, btn.dataset.target, null);
            });
        });
    }

    toggleCellSelection(sourceId, targetId) {
        const cellKey = `${sourceId}|${targetId}`;
        if (this.interactionsSelectedCells.has(cellKey)) {
            this.interactionsSelectedCells.delete(cellKey);
        } else {
            this.interactionsSelectedCells.add(cellKey);
        }
        this.renderInteractionsView();
        this.updateInteractionsSelectionButtons();
    }

    showInteractionTypeSelector(element, sourceId, targetId) {
        // Remove any existing selector
        const existingSelector = document.querySelector('.interaction-type-selector');
        if (existingSelector) existingSelector.remove();

        const page = this.getCurrentPage();
        if (!page) return;

        const currentType = this.getInteractionType(page, sourceId, targetId);

        // Get allowed types from element data attribute (if available from matrix cell)
        let allowedTypes = null;
        if (element.dataset && element.dataset.allowedTypes) {
            try {
                allowedTypes = JSON.parse(element.dataset.allowedTypes);
            } catch (e) {
                // If parsing fails, allow all types
                allowedTypes = null;
            }
        }

        // Define interaction options with their properties
        const options = [
            { value: null, label: 'Default', icon: '&#9898;', type: null },
            { value: 'DataFilter', label: 'Filter', icon: '&#128269;', type: 'DataFilter' },
            { value: 'HighlightFilter', label: 'Highlight', icon: '&#128161;', type: 'HighlightFilter' },
            { value: 'NoFilter', label: 'None', icon: '&#10060;', type: 'NoFilter' }
        ];

        // Build selector HTML with conditional disabling
        const selector = document.createElement('div');
        selector.className = 'interaction-type-selector';

        let buttonsHTML = '';
        for (const opt of options) {
            const isActive = currentType === opt.type;
            const isEnabled = !allowedTypes || allowedTypes.includes(opt.type);
            const disabledAttr = isEnabled ? '' : ' disabled';
            const disabledClass = isEnabled ? '' : ' disabled';
            const title = isEnabled ? '' : ` title="Not supported for this visual combination"`;

            buttonsHTML += `<button class="type-option ${isActive ? 'active' : ''}${disabledClass}" data-type="${opt.value}"${disabledAttr}${title}>${opt.icon} ${opt.label}</button>`;
        }

        selector.innerHTML = buttonsHTML;

        // Position selector near element
        const rect = element.getBoundingClientRect();
        selector.style.position = 'fixed';
        selector.style.left = `${rect.left}px`;
        selector.style.top = `${rect.bottom + 5}px`;
        selector.style.zIndex = '1000';

        document.body.appendChild(selector);

        // Bind type selection
        selector.querySelectorAll('.type-option:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const newType = btn.dataset.type === 'null' ? null : btn.dataset.type;
                this.setInteractionType(this.currentPageId, sourceId, targetId, newType);
                selector.remove();
            });
        });

        // Close on click outside
        const closeHandler = (e) => {
            if (!selector.contains(e.target) && e.target !== element) {
                selector.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }

    setInteractionType(pageId, sourceId, targetId, newType) {
        const page = this.pages.find(p => p.pageId === pageId);
        if (!page) return;

        // Find existing interaction
        const existingIndex = page.visualInteractions.findIndex(
            i => i.source === sourceId && i.target === targetId
        );
        const oldType = existingIndex >= 0 ? page.visualInteractions[existingIndex].type : null;

        // Don't record if no change
        if ((oldType === null && newType === null) || oldType === newType) return;

        // Record history
        this.interactionsHistory.push({
            type: 'single',
            pageId: pageId,
            changes: [{
                source: sourceId,
                target: targetId,
                oldType: oldType,
                newType: newType
            }],
            timestamp: new Date()
        });

        // Apply change
        if (newType === null) {
            // Remove entry (reset to default)
            if (existingIndex >= 0) {
                page.visualInteractions.splice(existingIndex, 1);
            }
        } else if (existingIndex >= 0) {
            // Update existing entry
            page.visualInteractions[existingIndex].type = newType;
        } else {
            // Add new entry
            page.visualInteractions.push({ source: sourceId, target: targetId, type: newType });
        }

        // Sync to JSON
        page.currentJson.visualInteractions = page.visualInteractions.length > 0
            ? [...page.visualInteractions]
            : undefined;
        if (page.currentJson.visualInteractions === undefined) {
            delete page.currentJson.visualInteractions;
        }
        page.modified = true;

        // Update UI
        this.updateInteractionsSummary();
        this.updateInteractionsModifiedStatus();
        this.updateInteractionsHistoryStatus();
        this.renderInteractionsView();

        const typeText = newType === null ? 'default' : newType;
        this.showToast(`Set interaction to ${typeText}`, 'success');
    }

    interactionsBulkSetType(type) {
        const page = this.getCurrentPage();
        if (!page) return;

        const changes = [];
        let targets;

        if (this.interactionsSelectedCells.size > 0) {
            // Apply to selected cells
            targets = Array.from(this.interactionsSelectedCells).map(key => {
                const [source, target] = key.split('|');
                return { source, target };
            });
        } else {
            // Apply to all cells
            targets = [];
            for (const source of page.visuals) {
                for (const target of page.visuals) {
                    if (source.visualId !== target.visualId) {
                        targets.push({ source: source.visualId, target: target.visualId });
                    }
                }
            }
        }

        let skippedCount = 0;

        for (const { source, target } of targets) {
            const existingIndex = page.visualInteractions.findIndex(
                i => i.source === source && i.target === target
            );
            const oldType = existingIndex >= 0 ? page.visualInteractions[existingIndex].type : null;

            // Get source and target visual objects for capability checking
            const sourceVisual = page.visuals.find(v => v.visualId === source);
            const targetVisual = page.visuals.find(v => v.visualId === target);

            if (!sourceVisual || !targetVisual) continue;

            // Determine the actual type to apply (with fallback if needed)
            let typeToApply = type;

            if (type !== null && type !== 'NoFilter') {
                // Validate if this interaction type is valid for these visual types
                const isValid = this.isValidInteraction(
                    sourceVisual.visualType,
                    targetVisual.visualType,
                    type
                );

                if (!isValid) {
                    // Use fallback type
                    typeToApply = this.getInteractionFallback(
                        sourceVisual.visualType,
                        targetVisual.visualType,
                        type
                    );
                    skippedCount++;
                }
            }

            if (oldType !== typeToApply) {
                changes.push({ source, target, oldType, newType: typeToApply });

                if (typeToApply === null) {
                    if (existingIndex >= 0) {
                        page.visualInteractions.splice(existingIndex, 1);
                    }
                } else if (existingIndex >= 0) {
                    page.visualInteractions[existingIndex].type = typeToApply;
                } else {
                    page.visualInteractions.push({ source, target, type: typeToApply });
                }
            }
        }

        if (changes.length > 0) {
            this.interactionsHistory.push({
                type: 'bulk',
                pageId: this.currentPageId,
                changes: changes,
                timestamp: new Date()
            });

            // Sync to JSON
            page.currentJson.visualInteractions = page.visualInteractions.length > 0
                ? [...page.visualInteractions]
                : undefined;
            if (page.currentJson.visualInteractions === undefined) {
                delete page.currentJson.visualInteractions;
            }
            page.modified = true;
        }

        this.interactionsSelectedCells.clear();
        this.updateInteractionsSummary();
        this.updateInteractionsModifiedStatus();
        this.updateInteractionsHistoryStatus();
        this.renderInteractionsView();
        this.updateInteractionsSelectionButtons();

        const typeText = type === null ? 'default' : type;
        if (skippedCount > 0) {
            this.showToast(
                `Set ${changes.length} interaction(s) to ${typeText} (${skippedCount} used fallbacks due to visual restrictions)`,
                'warning'
            );
        } else {
            this.showToast(`Set ${changes.length} interaction(s) to ${typeText}`, 'success');
        }
    }

    interactionsUndo() {
        if (this.interactionsHistory.length === 0) return;

        const entry = this.interactionsHistory.pop();
        const page = this.pages.find(p => p.pageId === entry.pageId);
        if (!page) return;

        for (const change of entry.changes) {
            const existingIndex = page.visualInteractions.findIndex(
                i => i.source === change.source && i.target === change.target
            );

            if (change.oldType === null) {
                // Was default, remove the entry we added
                if (existingIndex >= 0) {
                    page.visualInteractions.splice(existingIndex, 1);
                }
            } else if (existingIndex >= 0) {
                // Update back to old type
                page.visualInteractions[existingIndex].type = change.oldType;
            } else {
                // Re-add with old type
                page.visualInteractions.push({
                    source: change.source,
                    target: change.target,
                    type: change.oldType
                });
            }
        }

        // Sync to JSON
        page.currentJson.visualInteractions = page.visualInteractions.length > 0
            ? [...page.visualInteractions]
            : undefined;
        if (page.currentJson.visualInteractions === undefined) {
            delete page.currentJson.visualInteractions;
        }

        this.checkInteractionsModifications();
        this.updateInteractionsSummary();
        this.updateInteractionsModifiedStatus();
        this.updateInteractionsHistoryStatus();
        this.renderInteractionsView();

        this.showToast('Change undone', 'success');
    }

    interactionsUndoAll() {
        if (this.interactionsHistory.length === 0) return;

        // Restore all pages to original state
        for (const page of this.pages) {
            page.currentJson = structuredClone(page.originalJson);
            page.visualInteractions = page.currentJson.visualInteractions || [];
            page.modified = false;
        }

        this.interactionsHistory = [];
        this.updateInteractionsSummary();
        this.updateInteractionsModifiedStatus();
        this.updateInteractionsHistoryStatus();
        this.renderInteractionsView();

        this.showToast('All interaction changes undone', 'success');
    }

    checkInteractionsModifications() {
        for (const page of this.pages) {
            const originalInteractions = page.originalJson.visualInteractions || [];
            const currentInteractions = page.visualInteractions;

            // Simple comparison - check if arrays are equal
            const hasChanges = JSON.stringify(originalInteractions) !== JSON.stringify(currentInteractions);
            page.modified = hasChanges;
        }
    }

    updateInteractionsModifiedStatus() {
        if (!this.interactionsElements?.modifiedStatus || !this.interactionsElements?.saveBtn) return;

        const modifiedCount = this.pages.filter(p => p.modified).length;

        if (modifiedCount === 0) {
            this.interactionsElements.modifiedStatus.textContent = 'No changes';
            this.interactionsElements.modifiedStatus.classList.remove('has-changes');
            this.interactionsElements.saveBtn.disabled = true;
        } else {
            this.interactionsElements.modifiedStatus.textContent = `${modifiedCount} page(s) modified`;
            this.interactionsElements.modifiedStatus.classList.add('has-changes');
            this.interactionsElements.saveBtn.disabled = false;
        }
    }

    updateInteractionsHistoryStatus() {
        if (!this.interactionsElements?.historyStatus) return;

        this.interactionsElements.historyStatus.textContent = `History: ${this.interactionsHistory.length} change(s)`;
        this.interactionsElements.undoBtn.disabled = this.interactionsHistory.length === 0;
        this.interactionsElements.undoAllBtn.disabled = this.interactionsHistory.length === 0;
    }

    updateInteractionsSelectionButtons() {
        if (!this.interactionsElements?.bulkActionBtns) return;

        const hasSelection = this.interactionsSelectedCells.size > 0;

        // Enable/disable bulk action buttons
        this.interactionsElements.bulkActionBtns.forEach(btn => {
            btn.disabled = !hasSelection;
        });

        // Update action hint
        if (this.interactionsElements.actionHint) {
            this.interactionsElements.actionHint.style.display = hasSelection ? 'none' : 'block';
        }
    }

    async saveInteractionsChanges() {
        const modifiedPages = this.pages.filter(p => p.modified);
        if (modifiedPages.length === 0) return;

        try {
            for (const page of modifiedPages) {
                const writable = await page.fileHandle.createWritable();
                const content = JSON.stringify(page.currentJson, null, 2);
                await writable.write(content);
                await writable.close();

                page.originalJson = JSON.parse(content);
                page.modified = false;
            }

            this.interactionsHistory = [];
            this.updateInteractionsModifiedStatus();
            this.updateInteractionsHistoryStatus();
            this.renderInteractionsView();

            this.showToast(`Saved ${modifiedPages.length} page(s). Reload your report in Power BI Desktop to see changes.`, 'success');
        } catch (err) {
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

    exportInteractionsReport(format) {
        const data = this.pages.map(page => ({
            pageId: page.pageId,
            displayName: page.displayName,
            visualCount: page.visuals.length,
            interactionCount: page.visualInteractions.length,
            visuals: page.visuals.map(v => ({
                visualId: v.visualId,
                visualName: v.visualName || v.visualId,
                visualType: v.visualType,
                hasName: v.hasName
            })),
            interactions: page.visualInteractions.map(i => ({
                source: i.source,
                target: i.target,
                type: i.type
            }))
        }));

        let content, filename, type;

        if (format === 'csv') {
            const rows = [['Page', 'Source Visual', 'Target Visual', 'Interaction Type']];

            for (const page of data) {
                for (const interaction of page.interactions) {
                    const sourceVisual = page.visuals.find(v => v.visualId === interaction.source);
                    const targetVisual = page.visuals.find(v => v.visualId === interaction.target);

                    rows.push([
                        page.displayName,
                        sourceVisual ? sourceVisual.visualName : interaction.source,
                        targetVisual ? targetVisual.visualName : interaction.target,
                        interaction.type
                    ]);
                }
            }

            content = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
            filename = 'visual-interactions-report.csv';
            type = 'text/csv';
        } else {
            content = JSON.stringify(data, null, 2);
            filename = 'visual-interactions-report.json';
            type = 'application/json';
        }

        this.downloadFile(content, filename, type);
        this.showToast(`Exported ${format.toUpperCase()} report`, 'success');
    }

    interactionsSelectAll() {
        const page = this.getCurrentPage();
        if (!page) return;

        this.interactionsSelectedCells.clear();
        for (const source of page.visuals) {
            for (const target of page.visuals) {
                if (source.visualId !== target.visualId) {
                    this.interactionsSelectedCells.add(`${source.visualId}|${target.visualId}`);
                }
            }
        }
        this.renderInteractionsView();
        this.updateInteractionsSelectionButtons();
    }

    interactionsSelectNone() {
        this.interactionsSelectedCells.clear();
        this.renderInteractionsView();
        this.updateInteractionsSelectionButtons();
    }

    // ==================== Sidebar Management ====================

    toggleSidebar() {
        const sidebar = this.leftSidebar;
        const isCollapsed = sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed', isCollapsed);
        localStorage.setItem('pbir-sidebar-collapsed', isCollapsed);
    }

    toggleMobileSidebar() {
        this.leftSidebar.classList.toggle('open');
    }

    closeMobileSidebar() {
        this.leftSidebar.classList.remove('open');
    }

    updateSidebarNav(tabId) {
        // Update active state in sidebar nav
        document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update quick actions based on active tab
        this.updateQuickActions(tabId);
    }

    updateQuickActions(tabId) {
        const quickActionsMap = {
            'filter-visibility': [
                { icon: '👁️‍🗨️', label: 'Hide All', preset: 'hide-all-filters' },
                { icon: '👁️', label: 'Show All', preset: 'show-all-filters' },
                { icon: '↩️', label: 'Reset All', preset: 'reset-all-filters' }
            ],
            'layer-order': [
                { icon: '🔒', label: 'Lock All', preset: 'lock-all-layers' },
                { icon: '🔓', label: 'Unlock All', preset: 'unlock-all-layers' },
                { icon: '↩️', label: 'Reset All', preset: 'reset-all-layers' }
            ],
            'visual-interactions': [
                { icon: '🚫', label: 'Disable All', preset: 'disable-all-interactions' },
                { icon: '✅', label: 'Enable All', preset: 'enable-all-interactions' },
                { icon: '🔍', label: 'All Filter', preset: 'filter-all-interactions' },
                { icon: '💡', label: 'All Highlight', preset: 'highlight-all-interactions' }
            ],
            'batch-processing': []
        };

        const actions = quickActionsMap[tabId] || [];

        if (!this.quickActionsList) return;

        if (actions.length === 0) {
            this.quickActionsList.innerHTML = '<div class="quick-actions-empty">No quick actions for this tab</div>';
            return;
        }

        this.quickActionsList.innerHTML = actions.map(action => `
            <button class="quick-action-btn" data-preset="${action.preset}" title="${action.label}">
                <span class="quick-action-icon">${action.icon}</span>
                <span class="quick-action-label">${action.label}</span>
            </button>
        `).join('');

        // Bind click events
        this.quickActionsList.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => this.applyPreset(btn.dataset.preset));
        });
    }

    renderReportTree() {
        if (!this.reportTreeContent || !this.sidebarReportTree) return;

        if (!this.folderHandle || this.pages.length === 0) {
            this.sidebarReportTree.classList.add('hidden');
            return;
        }

        this.sidebarReportTree.classList.remove('hidden');

        // Group visuals by page
        const pageMap = new Map();
        this.visuals.forEach(v => {
            const pageKey = v.pagePath || 'Unknown';
            const pageName = this.pageDisplayNames.get(pageKey) || pageKey;
            if (!pageMap.has(pageName)) {
                pageMap.set(pageName, []);
            }
            pageMap.get(pageName).push(v);
        });

        let treeHtml = '';
        pageMap.forEach((visuals, pageName) => {
            const visualCount = visuals.length;
            treeHtml += `
                <div class="tree-node tree-page" data-page="${pageName}">
                    <span class="tree-node-icon">📄</span>
                    ${pageName}
                    <span class="tree-count">(${visualCount})</span>
                </div>
            `;
        });

        this.reportTreeContent.innerHTML = treeHtml || '<div class="tree-empty">No pages found</div>';

        // Add click handlers for tree nodes
        this.reportTreeContent.querySelectorAll('.tree-page').forEach(node => {
            node.addEventListener('click', () => {
                // Could filter to show only this page's visuals
                document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active'));
                node.classList.add('active');
            });
        });
    }

    showWelcomeDashboard() {
        if (this.welcomeDashboard) {
            this.welcomeDashboard.classList.remove('hidden');
        }
    }

    hideWelcomeDashboard() {
        if (this.welcomeDashboard) {
            this.welcomeDashboard.classList.add('hidden');
        }
    }

    // ==================== Theme Management ====================

    initTheme() {
        // Get saved theme or default to dark
        const savedTheme = localStorage.getItem('pbir-theme') || 'dark';
        this.setTheme(savedTheme);

        // Restore sidebar collapsed state
        const sidebarCollapsed = localStorage.getItem('pbir-sidebar-collapsed') === 'true';
        if (sidebarCollapsed && this.leftSidebar) {
            this.leftSidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
        }

        // Set up sidebar theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Initialize quick actions for default tab
        this.updateQuickActions(this.activeTab);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('pbir-theme', theme);

        // Update all theme toggle buttons
        const themeToggles = [
            document.getElementById('theme-toggle'),
            document.getElementById('theme-toggle-header')
        ];

        themeToggles.forEach(toggle => {
            if (toggle) {
                const icon = toggle.querySelector('.theme-icon');
                if (icon) {
                    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
                }
                const label = toggle.querySelector('.theme-label');
                if (label) {
                    label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
                }
                toggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
            }
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PBIRVisualManager();
});
