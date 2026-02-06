# PBIR Visual Manager — Review & Improvement Manifest

> **Generated:** 2026-02-06 | **Cycle:** 1 | **Status:** Active
> **Repository:** https://github.com/JonathanJihwanKim/isHiddenInViewMode

This document serves as both the **review findings record** and the **execution task manifest** for improving the PBIR Visual Manager. It is regenerated each time the on-demand review cycle runs.

**How to use this document:**
1. The orchestrator agent generates/updates this file on `main` branch
2. Each task is self-contained — open a new Claude Code context and say: *"Start Task N from AGENT_REVIEW_FINDINGS.md"*
3. Each task creates its own git worktree, implements, merges to main, and cleans up
4. Tasks touching `app.js` must be executed **serially** (one at a time, merge before starting next)

---

## 1. Trend Research Summary

> **This section is populated by the orchestrator agent during each review cycle.**
> When triggering a new cycle, say: *"Run the review and improvement cycle for PBIR Visual Manager"*

### Research Process

The orchestrator agent researches these sources for current Power BI / Microsoft Fabric trends:

| Source | URL | Focus |
|--------|-----|-------|
| Microsoft Power BI Blog | https://powerbi.microsoft.com/blog/ | Official feature announcements, PBIR format changes |
| Microsoft Fabric Blog | https://blog.fabric.microsoft.com/ | Fabric integration, lakehouse, semantic models |
| SQLBI | https://www.sqlbi.com/articles/ | DAX, data modeling best practices (Marco Russo, Alberto Ferrari) |
| Guy in a Cube (YouTube) | https://www.youtube.com/@GuyInACube | Power BI tips, new features walkthroughs |
| SQLBI (YouTube) | https://www.youtube.com/@SQLBI | Advanced analytics, performance tuning |
| Curbal (YouTube) | https://www.youtube.com/@CurbalEN | Power BI tutorials, community trends |
| Reddit r/PowerBI | https://www.reddit.com/r/PowerBI/ | Community pain points, feature requests |
| GitHub PBIR repos | Search: "PBIR format" OR "Power BI enhanced report" | Format spec changes, tooling ecosystem |
| Power BI Community | https://community.powerbi.com/ | User feedback, common issues |

### Research Output Template

When the orchestrator runs research, it fills in:
- **Key trends affecting this tool** (e.g., PBIR format changes, new visual properties)
- **Community pain points** this tool could address
- **New feature opportunities** informed by trends
- **Deprecation risks** (APIs, format changes to watch)

### Current Cycle Research

*To be populated when the review cycle is triggered. The orchestrator will fill this section with findings from the sources above.*

---

## 2. Sub-Agent Definitions

### Orchestrator Agent

- **Role:** Research, document, coordinate, resolve merge conflicts
- **When invoked:**
  - Cycle trigger: Researches trends, audits codebase, writes this manifest
  - Conflict resolution: When a task merge to main fails
- **Scope:** Does NOT write application code. Only writes documentation and resolves git conflicts.
- **Trigger phrase:** *"Run the review and improvement cycle for PBIR Visual Manager"*
- **Conflict trigger:** *"Resolve merge conflict for Task N"*

### Data/Logic Agent

- **Role:** Modify data processing, state management, PBIR format handling
- **Focus areas in `app.js`:**
  - JSON parsing: `processJsonFile()`, `readPageDisplayName()`
  - State management: `filterHistory[]`, `layerHistory[]`, `interactionsHistory[]`
  - PBIR format logic: `extractFilters()`, `getInteractionType()`, `computeDefaultInteractionType()`
  - Save/export: `saveChanges()`, `exportFilterReport()`, `exportLayerReport()`, `exportInteractionsReport()`
  - Validation and error handling
  - Batch processing: `processBatchQueue()`, `getBatchSettings()`
  - File operations: `scanForVisuals()`, `downloadFile()`
- **May also create:** New JS files (e.g., `cli.js` for the CLI tool)

### UI/Presentation Agent

- **Role:** Modify UI rendering, styling, UX, accessibility
- **Focus areas:**
  - `styles.css` — Themes, contrast, layout, animations, visual differentiation
  - `index.html` — Structure, semantic markup, accessibility attributes, ARIA labels
  - `app.js` render methods — `renderFilterTable()`, `renderLayerTable()`, `renderInteractionMatrix()`, `renderInteractionList()`, `showToast()`, `showEmptyState()`
  - DOM event handling, keyboard navigation, tooltips
  - Responsive design, mobile layout

---

## 3. Codebase Audit Summary

**Snapshot as of 2026-02-06**

| Metric | Value |
|--------|-------|
| `app.js` | 3,725 lines, ~480 methods, single `PBIRVisualManager` class |
| `index.html` | ~500 lines, 4 tab panels + modals |
| `styles.css` | ~1,800 lines, CSS custom properties, Van Gogh theme |
| Built-in presets | 10 (with descriptions) |
| Browser requirement | Chrome / Edge / Opera (File System Access API) |
| Original findings | 30 (from 2026-01-27 review) |
| Fixed findings | 16 |
| Remaining findings | 14 |

### Architecture Notes

- **Monolithic class:** All logic in one `PBIRVisualManager` class — no module separation
- **No build system:** Vanilla JS, CSS, HTML served as-is
- **No tests:** No testing framework, no unit tests, no integration tests
- **State per tab:** Each tab (Filter, Layer, Interactions, Batch) has independent history and selection state
- **File System Access API:** Core dependency — limits browser support to Chromium-based browsers

### Key Constraint for Task Execution

> **~95% of logic is in `app.js`.** Any two tasks that modify `app.js` will conflict on merge.
> Tasks touching `app.js` MUST be serialized: complete and merge Task N before starting Task N+1.
> Only tasks limited to `styles.css`, `index.html`, or new files can run in parallel.

---

## 4. Task Registry

### Overview

| # | Task | Agent | Files Impacted | Serial/Parallel | Priority | Size | Status |
|---|------|-------|---------------|-----------------|----------|------|--------|
| T1 | Bug fixes: history validation + memory leak | Data/Logic | `app.js` | Serial | Must-Have | S | Pending |
| T2 | UX: disabled button tooltips + export clarity | UI/Presentation | `app.js`, `styles.css` | Serial | Should-Have | S | Pending |
| T3 | Visual: tab differentiation with icons/accents | UI/Presentation | `styles.css`, `index.html` | **Parallel** | Nice-to-Have | S | Pending |
| T4 | Keyboard shortcuts + navigation hints | Both | `app.js`, `index.html` | Serial | Should-Have | M | Pending |
| T5 | Search and advanced filtering | Both | `app.js`, `index.html`, `styles.css` | Serial | Should-Have | L | Pending |
| T6 | Pre-save validation and confirmation dialog | Both | `app.js`, `index.html`, `styles.css` | Serial | Should-Have | M | Pending |
| T7 | Performance: virtual scrolling for large reports | Data/Logic | `app.js`, `styles.css` | Serial | Should-Have | L | Pending |
| T8 | Change audit trail export | Data/Logic | `app.js`, `index.html` | Serial | Should-Have | M | Pending |
| T9 | CLI tool for CI/CD integration | Data/Logic | **New files only** | **Parallel** | Should-Have | L | Pending |
| T10 | Dependency tracking between visuals | Both | `app.js`, `index.html`, `styles.css` | Serial | Nice-to-Have | L | Pending |
| T11 | Role-based access / reviewable changesets | Both | `app.js`, `index.html`, `styles.css` | Serial | Nice-to-Have | L | Pending |

**Size legend:** S = ~30 min, M = ~1-2 hours, L = ~3+ hours (rough scope, not time estimates)

---

### T1: Bug Fixes — History Validation + Memory Leak

**Addresses:** Finding #5 (Race condition), Finding #7 (Memory leak)
**Agent:** Data/Logic
**Files:** `app.js`
**Serialization:** Serial (modifies app.js)
**Priority:** Must-Have

#### Description

Two remaining bugs that could cause data corruption or resource leaks:

1. **History entry validation (#5):** `filterUndo()` handles both 'bulk' and 'single' entry types, but `layerUndo()` only handles 'bulk'. Neither validates that `entry.changes` exists or is an array before iterating. If history becomes corrupted, this will crash.

2. **Memory leak in downloads (#7):** `downloadFile()` creates Blob URLs via `URL.createObjectURL()` that may not be revoked if the download fails or is cancelled.

#### Acceptance Criteria

- [ ] All undo methods (`filterUndo`, `layerUndo`, `interactionsUndo`) validate `entry.changes` is an array before iterating
- [ ] `layerUndo()` handles both 'bulk' and 'single' entry types (match `filterUndo()` pattern)
- [ ] `downloadFile()` wraps `a.click()` in try-finally to always call `URL.revokeObjectURL(url)`
- [ ] No existing functionality broken

#### Specific Methods to Modify

- `filterUndo()` — Add validation: `if (!entry.changes || !Array.isArray(entry.changes)) return;`
- `layerUndo()` — Add 'single' entry type handling + validation
- `interactionsUndo()` — Add validation if missing
- `downloadFile()` — Wrap in try-finally for URL cleanup

#### Worktree

```bash
git worktree add ../pbir-task-1 -b task/1-bug-fixes-history-memory
# Work in ../pbir-task-1
# When done:
git checkout main && git merge task/1-bug-fixes-history-memory
git worktree remove ../pbir-task-1 && git branch -d task/1-bug-fixes-history-memory
```

---

### T2: UX — Disabled Button Tooltips + Export Clarity

**Addresses:** Finding #16 (Disabled buttons), Finding #20 (Export purpose unclear)
**Agent:** UI/Presentation
**Files:** `app.js`, `styles.css`
**Serialization:** Serial (modifies app.js)
**Priority:** Should-Have

#### Description

Users see grayed-out buttons with no explanation, and don't understand what the export feature does or when to use it.

#### Acceptance Criteria

- [ ] Disabled action buttons show tooltip on hover: "Select visuals first using checkboxes"
- [ ] Export buttons show tooltip explaining the use case (e.g., "Export CSV: Document your filter settings in spreadsheet format")
- [ ] Tooltips are styled consistently with the Van Gogh theme
- [ ] Tooltips work in both dark and light mode

#### Recommended Approach

- Use `title` attribute for simple tooltips, or create a CSS-only tooltip component if richer formatting needed
- Add tooltip text to buttons in the render methods (`renderFilterTable`, `renderLayerTable`, etc.)
- Style tooltips in `styles.css` to match the existing theme

#### Worktree

```bash
git worktree add ../pbir-task-2 -b task/2-ux-tooltips-export-clarity
```

---

### T3: Visual — Tab Differentiation with Icons/Accents

**Addresses:** Finding #17 (Tab content not differentiated)
**Agent:** UI/Presentation
**Files:** `styles.css`, `index.html`
**Serialization:** **Parallel** (no app.js changes)
**Priority:** Nice-to-Have

#### Description

Filter Visibility and Layer Order tabs look nearly identical. Users may not realize which tab they're on.

#### Acceptance Criteria

- [ ] Each tab has a unique color accent (subtle, not overwhelming)
- [ ] Tab icons/emojis are visually distinct
- [ ] Active tab has clear visual indicator beyond the current highlight
- [ ] Changes are CSS/HTML only — no app.js modifications
- [ ] Works in both dark and light themes

#### Recommended Approach

- Add CSS custom properties per tab: `--tab-filter-accent`, `--tab-layer-accent`, `--tab-interactions-accent`, `--tab-batch-accent`
- Use the existing sidebar nav items in `index.html` — add a `data-tab-color` attribute or specific class
- Add a subtle left border or background tint to the active tab's content area
- Consider adding a brief tab description below the tab title when active

#### Worktree

```bash
git worktree add ../pbir-task-3 -b task/3-visual-tab-differentiation
```

---

### T4: Keyboard Shortcuts + Navigation Hints

**Addresses:** Finding #18 (No keyboard navigation hints), Finding #29 (Keyboard shortcuts)
**Agent:** Both (Data/Logic for shortcut logic, UI/Presentation for hints display)
**Files:** `app.js`, `index.html`
**Serialization:** Serial (modifies app.js)
**Priority:** Should-Have

#### Description

All interactions require mouse clicks. Power users expect standard shortcuts. No indication that keyboard navigation is available.

#### Acceptance Criteria

- [ ] `Ctrl+Z` triggers undo on the active tab
- [ ] `Ctrl+S` triggers save (with confirmation if pre-save validation exists)
- [ ] `Ctrl+A` selects all visuals in the active tab
- [ ] `H` sets selected visuals to Hidden (Filter tab) or locked (Layer tab)
- [ ] `V` sets selected visuals to Visible/unlocked
- [ ] `Escape` clears selection
- [ ] Shortcut hints shown in button tooltips (e.g., "Undo (Ctrl+Z)")
- [ ] Keyboard shortcut help accessible via `?` key or help button

#### Specific Methods to Add/Modify

- Add `handleKeyboardShortcuts(event)` method to `PBIRVisualManager`
- Bind in `bindEvents()` with `document.addEventListener('keydown', ...)`
- Route shortcuts based on `this.activeTab` value
- Update button labels/tooltips in render methods to show shortcut hints

#### Worktree

```bash
git worktree add ../pbir-task-4 -b task/4-keyboard-shortcuts
```

---

### T5: Search and Advanced Filtering

**Addresses:** Finding #25 (Search and advanced filtering)
**Agent:** Both (Data/Logic for search logic, UI/Presentation for search UI)
**Files:** `app.js`, `index.html`, `styles.css`
**Serialization:** Serial (modifies app.js)
**Priority:** Should-Have

#### Description

Only status-based filtering exists. Users cannot search by visual name, page, filter name, or visual type.

#### Acceptance Criteria

- [ ] Search input field above each tab's table (or a global search bar)
- [ ] Real-time filtering as user types (debounced, 200ms)
- [ ] Searchable fields: Visual Name, Page Name, Filter Names, Visual Type
- [ ] Filter dropdowns: by status (Hidden/Visible/Default), by page, by visual type
- [ ] Search results count displayed
- [ ] Clear search button
- [ ] Search state does not affect selection state

#### Recommended Approach

- Add search input to each tab section in `index.html`
- Add `filterSearchQuery`, `layerSearchQuery`, `interactionsSearchQuery` state properties
- Create `filterVisuals(visuals, query, filters)` utility method
- Call filter before rendering in `renderFilterTable()`, `renderLayerTable()`, etc.
- Style search bar in `styles.css` consistent with existing inputs

#### Worktree

```bash
git worktree add ../pbir-task-5 -b task/5-search-filtering
```

---

### T6: Pre-Save Validation and Confirmation Dialog

**Addresses:** Finding #26 (Pre-save validation)
**Agent:** Both (Data/Logic for validation logic, UI/Presentation for dialog)
**Files:** `app.js`, `index.html`, `styles.css`
**Serialization:** Serial (modifies app.js)
**Priority:** Should-Have

#### Description

No warnings before saving. Users can accidentally hide all filters on a critical dashboard without understanding the impact.

#### Acceptance Criteria

- [ ] Clicking Save shows a confirmation modal before writing files
- [ ] Modal shows summary: "N files will be modified" with list of changes
- [ ] Warning indicators for potentially risky actions (e.g., "Hiding all filters on 23 visuals")
- [ ] User must click "Confirm Save" to proceed
- [ ] Cancel returns to editing without changes
- [ ] After save, show expanded success message with next steps ("Reload in Power BI Desktop")

#### Recommended Approach

- Create a confirmation modal in `index.html` (similar pattern to existing preset modal)
- Add `buildSavePreview()` method that computes what will change
- Modify `saveChanges()` to show the modal instead of saving directly
- Add `confirmSave()` method that actually performs the write
- Style modal in `styles.css`

#### Worktree

```bash
git worktree add ../pbir-task-6 -b task/6-pre-save-validation
```

---

### T7: Performance — Virtual Scrolling for Large Reports

**Addresses:** Finding #24 (Performance optimization)
**Agent:** Data/Logic
**Files:** `app.js`, `styles.css`
**Serialization:** Serial (modifies app.js)
**Priority:** Should-Have

#### Description

UI renders all rows at once. Reports with 500+ visuals will cause performance issues. Currently auto-switches to list view at 20+ visuals per page, but no row virtualization.

#### Acceptance Criteria

- [ ] Tables with 100+ rows use virtual scrolling (only render visible rows + buffer)
- [ ] Scroll position maintained during re-renders
- [ ] Selection state works correctly with virtual scrolling
- [ ] Expand/collapse details still functions
- [ ] Interaction matrix degrades gracefully for 50+ visuals
- [ ] History operations limited to 100 entries to prevent memory bloat

#### Recommended Approach

- Implement a lightweight virtual scroll: track `scrollTop`, compute visible range, render only those rows
- Add `virtualScrollState` per tab: `{ scrollTop, visibleStart, visibleEnd, rowHeight }`
- Modify render methods to accept a range parameter
- Add scroll event listener that triggers re-render of visible range
- Cap history arrays at 100 entries (drop oldest)

#### Worktree

```bash
git worktree add ../pbir-task-7 -b task/7-performance-virtual-scroll
```

---

### T8: Change Audit Trail Export

**Addresses:** Finding #27 (Change audit trail)
**Agent:** Data/Logic
**Files:** `app.js`, `index.html`
**Serialization:** Serial (modifies app.js)
**Priority:** Should-Have

#### Description

Exports only current state. Cannot generate before/after comparison or change history reports for compliance.

#### Acceptance Criteria

- [ ] "Export Change Log" button in each tab's action area
- [ ] Export contains: Visual Name | Property | Old Value | New Value | Timestamp
- [ ] CSV and JSON export formats
- [ ] Only includes changes made in the current session
- [ ] Includes page name and visual type for context
- [ ] Clear, human-readable format suitable for compliance reporting

#### Recommended Approach

- Add `changeLog[]` array to track all changes with timestamps
- Each modification method (bulk set, single update, undo) pushes to `changeLog`
- Structure: `{ timestamp, tab, visual, page, property, oldValue, newValue }`
- Add `exportChangeLog(format)` method
- Add export button in each tab's action area in `index.html`

#### Worktree

```bash
git worktree add ../pbir-task-8 -b task/8-audit-trail-export
```

---

### T9: CLI Tool for CI/CD Integration

**Addresses:** Finding #23 (CLI for CI/CD)
**Agent:** Data/Logic
**Files:** **New files only** (`cli.js`, `package.json`, `README-CLI.md`)
**Serialization:** **Parallel** (no existing file modifications)
**Priority:** Should-Have

#### Description

GUI-only tool cannot integrate with DevOps pipelines. Need a standalone Node.js CLI for automated compliance checks and bulk operations.

#### Acceptance Criteria

- [ ] Standalone Node.js script (no dependency on browser APIs)
- [ ] Commands:
  - `pbir-manager scan <folder>` — List all visuals with current settings
  - `pbir-manager set-filters <folder> --value hidden|visible|reset`
  - `pbir-manager set-layers <folder> --value locked|unlocked|reset`
  - `pbir-manager set-interactions <folder> --type filter|highlight|none|default`
  - `pbir-manager export <folder> --format csv|json`
  - `pbir-manager validate <folder> --rules <rules.json>` — Check compliance
- [ ] Exit codes: 0 = success, 1 = error, 2 = validation failure
- [ ] JSON output mode for piping to other tools
- [ ] `package.json` with `bin` field for `npx` usage
- [ ] Separate `README-CLI.md` with usage docs

#### Recommended Approach

- Create `cli.js` using Node.js `fs` module (mirrors browser File System Access API logic)
- Extract PBIR parsing logic into shared functions (or duplicate — keep simple)
- Use `process.argv` for argument parsing (no dependencies) or minimal `commander` package
- Add `package.json` with `"bin": { "pbir-manager": "./cli.js" }`

#### Worktree

```bash
git worktree add ../pbir-task-9 -b task/9-cli-tool
```

---

### T10: Dependency Tracking Between Visuals

**Addresses:** Finding #28 (Dependency tracking)
**Agent:** Both
**Files:** `app.js`, `index.html`, `styles.css`
**Serialization:** Serial (modifies app.js)
**Priority:** Nice-to-Have

#### Description

Tool doesn't understand relationships between visuals and filters. Users can't see which visuals share filters or how interactions form dependency chains.

#### Acceptance Criteria

- [ ] Dependency sidebar or panel showing filter relationships
- [ ] Hovering a visual highlights all visuals that share the same filters
- [ ] Visual interaction matrix shows dependency clusters
- [ ] Export dependency graph data (JSON format)

#### Recommended Approach

- Add `buildDependencyGraph()` method analyzing shared filters across visuals
- Store as adjacency list: `{ visualId: [relatedVisualIds] }`
- Add hover event handlers to highlight related visuals in the table
- Add a "Dependencies" section in the sidebar below the report tree
- Style dependency highlights in `styles.css`

#### Worktree

```bash
git worktree add ../pbir-task-10 -b task/10-dependency-tracking
```

---

### T11: Role-Based Access / Reviewable Changesets

**Addresses:** Finding #30 (Role-based access control)
**Agent:** Both
**Files:** `app.js`, `index.html`, `styles.css`
**Serialization:** Serial (modifies app.js)
**Priority:** Nice-to-Have

#### Description

No approval workflow for team collaboration. Enterprise teams need the ability to review changes before they're applied.

#### Acceptance Criteria

- [ ] "Export Changeset" button that creates a reviewable JSON/diff of pending changes
- [ ] Changeset includes: what changed, who changed it (user input), timestamp, rationale field
- [ ] "Import Changeset" button that loads a changeset and shows a preview
- [ ] "Apply Changeset" to execute the imported changes
- [ ] Changeset format is human-readable for code review in PRs

#### Recommended Approach

- This is a client-side approximation of RBAC (no server)
- Changeset = JSON file containing the diff of all pending modifications
- Export: Serialize current modifications to a downloadable `.changeset.json`
- Import: Load a `.changeset.json`, show preview, allow apply/reject
- Integrate with the existing batch processing UI

#### Worktree

```bash
git worktree add ../pbir-task-11 -b task/11-reviewable-changesets
```

---

## 5. Execution Plan

### Recommended Task Order

Tasks are ordered by priority and dependency. Earlier tasks make later ones easier but each is self-contained.

```
Phase A: Bug Fixes (Must-Have)
  T1: History validation + memory leak                    [Serial, S]

Phase B: Core UX Improvements (Should-Have)
  T2: Disabled button tooltips + export clarity           [Serial, S]
  T3: Tab differentiation with icons/accents              [Parallel, S] ← can run alongside T2
  T4: Keyboard shortcuts + navigation hints               [Serial, M]

Phase C: Major Features (Should-Have)
  T5: Search and advanced filtering                       [Serial, L]
  T6: Pre-save validation and confirmation                [Serial, M]

Phase D: Performance & Exports (Should-Have)
  T7: Performance - virtual scrolling                     [Serial, L]
  T8: Change audit trail export                           [Serial, M]
  T9: CLI tool for CI/CD                                  [Parallel, L] ← can run alongside any Serial task

Phase E: Advanced Features (Nice-to-Have)
  T10: Dependency tracking                                [Serial, L]
  T11: Role-based access / reviewable changesets          [Serial, L]
```

### Serialization Map

```
SERIAL (app.js) — must execute one at a time, merge before next:
T1 → T2 → T4 → T5 → T6 → T7 → T8 → T10 → T11

PARALLEL (no app.js) — can run anytime:
T3 (styles.css + index.html only)
T9 (new files only)
```

### Worktree Conventions

| Convention | Value |
|------------|-------|
| Worktree location | `../pbir-task-N` (sibling directory to main repo) |
| Branch naming | `task/N-short-description` |
| Commit message | `task-N: description` |
| Merge strategy | Fast-forward preferred, merge commit if needed |

### Task Execution Protocol

For each task, the executing agent follows this protocol:

```
1. Read this manifest from main branch
2. Create worktree:
   git worktree add ../pbir-task-N -b task/N-short-description
3. Navigate to worktree:
   cd ../pbir-task-N
4. Implement per the task spec above
5. Verify acceptance criteria
6. Commit:
   git add <specific files>
   git commit -m "task-N: description"
7. Switch back and merge:
   cd <main-repo-path>
   git checkout main
   git merge task/N-short-description
8. Clean up:
   git worktree remove ../pbir-task-N
   git branch -d task/N-short-description
9. Update this manifest: set task status to "Completed" with date
```

### Conflict Resolution Protocol

If merge fails:
1. Do NOT force-merge or discard changes
2. Open a new Claude Code context
3. Say: *"Resolve merge conflict for Task N from AGENT_REVIEW_FINDINGS.md"*
4. The orchestrator agent reads both branches, understands intent, and resolves semantically

---

## 6. Previous Findings Archive

The original 30 findings from the 2026-01-27 review, with current statuses.

### Fixed Findings (16)

| # | Title | Category | Fixed Date |
|---|-------|----------|------------|
| 1 | Unsafe array index access | Bug | 2026-02-01 |
| 2 | Missing JSON.parse error feedback | Bug | 2026-02-01 |
| 3 | XSS risk via innerHTML | Security | 2026-02-01 |
| 4 | Missing permission error differentiation | Bug | 2026-02-01 |
| 6 | Unbounded directory recursion | Bug | 2026-02-01 |
| 8 | Missing path parsing safety | Bug | 2026-02-01 |
| 9 | Deep clone limitations | Bug | 2026-02-01 |
| 10 | Inconsistent optional chaining | Bug | 2026-02-01 |
| 11 | Cryptic technical terminology | UX | 2026-01-31 |
| 12 | No folder selection guidance | UX | 2026-01-31 |
| 13 | Empty state message too technical | UX | 2026-01-31 |
| 14 | Status badges not explained | UX | 2026-01-31 |
| 15 | No save confirmation or next steps | UX | 2026-01-31 |
| 19 | Color contrast issues (WCAG AA) | Accessibility | 2026-02-01 |
| 21 | Preset/template system | Feature | 2026-01-31 (partial) |
| 22 | Cross-report batch processing | Feature | 2026-01-31 (partial) |

### Remaining Findings → Task Mapping (14)

| # | Title | Mapped To |
|---|-------|-----------|
| 5 | Race condition in history entry structure | **T1** |
| 7 | Memory leak in file downloads | **T1** |
| 16 | Disabled buttons without explanation | **T2** |
| 17 | Tab content not differentiated | **T3** |
| 18 | No keyboard navigation hints | **T4** |
| 20 | Export feature purpose unclear | **T2** |
| 23 | CLI for CI/CD integration | **T9** |
| 24 | Performance optimization for large reports | **T7** |
| 25 | Search and advanced filtering | **T5** |
| 26 | Pre-save validation and warnings | **T6** |
| 27 | Change audit trail export | **T8** |
| 28 | Dependency tracking | **T10** |
| 29 | Keyboard shortcuts | **T4** |
| 30 | Role-based access control | **T11** |

### Previously Implemented Enhancements

- **Visual Interactions tab** (2026-01-31): Full N×N matrix view, list view, 4 interaction types, bulk operations, undo/redo, export
- **Batch processing integration** (2026-01-31): Visual Interactions added to batch workflow
- **Naming alert detection** (2026-01-31): `hasExplicitTitle()` method, alerts on all tabs
- **Preset descriptions** (2026-01-31): All 10 built-in presets have user-facing descriptions
- **Refresh button** (2026-01-31): Re-scan folder without re-selecting
- **Bug fixes** (2026-02-01): Bounds checking, path parsing, deep clone, optional chaining, WCAG contrast

---

## Appendix: On-Demand Review Cycle Process

### How to Trigger a New Cycle

Open a new Claude Code context and say:

> *"Run the review and improvement cycle for PBIR Visual Manager"*

The orchestrator agent will:

1. **Research** current Power BI / Microsoft Fabric trends (sources listed in Section 1)
2. **Audit** the codebase: check file sizes, method counts, any new issues
3. **Review** this manifest: check completed tasks, carry over remaining ones
4. **Synthesize** trend research into new recommendations
5. **Update** this file on main branch with:
   - Fresh trend research summary
   - Updated codebase audit
   - New tasks (from trends) added to the Task Registry
   - Completed tasks moved to archive
   - Updated execution plan
6. **Commit** to main with message: `review-cycle-N: update manifest with latest findings`

### How to Execute a Task

Open a new Claude Code context and say:

> *"Start Task N from AGENT_REVIEW_FINDINGS.md"*

The agent will read this manifest, create a worktree, implement the task, and merge to main.

### How to Resolve Conflicts

Open a new Claude Code context and say:

> *"Resolve merge conflict for Task N from AGENT_REVIEW_FINDINGS.md"*

The orchestrator will analyze both branches and resolve the conflict.
