# PBIR Visual Manager - Agent Review Findings

**Review Date:** 2026-01-27
**Reviewers:** 3 AI Agents (Code Quality, UX/Beginner, Enterprise Features)
**Total Findings:** 30 (10 per agent)

---

## Summary by Priority

| Priority | Count | Categories |
|----------|-------|------------|
| Critical/Must-Have | 8 | Bugs, Security, Core Features |
| High/Should-Have | 12 | Error Handling, UX, Scalability |
| Medium/Nice-to-Have | 10 | Polish, Advanced Features |

---

# CODE QUALITY FINDINGS (Agent 1)

## [BUG] #1: Unsafe Array Index Access Without Bounds Checking
**Severity:** High
**Labels:** `bug`
**Location:** app.js, lines 555, 582, 596, 722-723, 729-730, 1088

**Description:**
Code accesses `visual.filters[filterIndex]` and `entry.changes[...]` without validating the index is within bounds. If a filter is deleted externally or history becomes corrupted, accessing an invalid index will return `undefined`, causing silent failures or crashes.

**Suggested Fix:**
Add bounds checking before array access:
```javascript
if (filterIndex >= 0 && filterIndex < visual.filters.length) {
    const oldValue = visual.filters[filterIndex].isHiddenInViewMode;
}
```

---

## [BUG] #2: Missing JSON.parse Error Feedback to Users
**Severity:** High
**Labels:** `bug`
**Location:** app.js, lines 244 & 260, catch blocks 251-253, 310-312

**Description:**
`JSON.parse()` errors are caught but only logged to console. Users won't know which files failed to parse or why. Malformed JSON files are silently skipped.

**Suggested Fix:**
Use `this.showToast()` to alert users of parse failures with the filename and error message.

---

## [SECURITY] #3: XSS Risk via innerHTML with User Data
**Severity:** High
**Labels:** `bug`, `security`
**Location:** app.js, lines 442-459, 515-532, 922-932

**Description:**
While `escapeHtml()` is used, `innerHTML` assignments include data-attributes with user-controlled file paths. If `escapeHtml()` is bypassed or incorrectly implemented, this creates XSS risk.

**Suggested Fix:**
Use `document.createElement()` and `setAttribute()` instead of `innerHTML` string concatenation.

---

## [BUG] #4: Missing Permission/Access Error Differentiation
**Severity:** High
**Labels:** `bug`
**Location:** app.js, lines 1250-1260

**Description:**
`saveChanges()` shows generic "Error saving files" for all errors. Users can't distinguish between permission denied, disk full, or file locked issues.

**Suggested Fix:**
Check `err.name` for specific error types:
- 'NotAllowedError' → "Permission denied - please grant folder access"
- 'QuotaExceededError' → "Disk full"

---

## [BUG] #5: Race Condition in History Entry Structure
**Severity:** High
**Labels:** `bug`
**Location:** app.js, lines 719-733 vs 1085-1092

**Description:**
`filterUndo()` handles both 'bulk' and 'single' entry types, but `layerUndo()` only handles 'bulk'. Neither validates that `entry.changes` exists or is an array before iterating.

**Suggested Fix:**
Add validation: `if (!entry.changes || !Array.isArray(entry.changes)) return;`

---

## [EDGE-CASE] #6: Unbounded Directory Recursion
**Severity:** Medium
**Labels:** `bug`
**Location:** app.js, lines 216-226, 228-238

**Description:**
`collectPageDisplayNames()` and `scanForVisuals()` recursively traverse directories without depth limit. Symlinks or circular references could cause stack overflow.

**Suggested Fix:**
Add depth limit parameter: `maxDepth = 50` and return if exceeded.

---

## [BUG] #7: Memory Leak in File Downloads
**Severity:** Medium
**Labels:** `bug`
**Location:** app.js, lines 1278-1286

**Description:**
`downloadFile()` creates Blob URLs that may not be revoked if download is cancelled or errors occur, causing memory leaks.

**Suggested Fix:**
Wrap in try-finally: `try { a.click(); } finally { URL.revokeObjectURL(url); }`

---

## [EDGE-CASE] #8: Missing Path Parsing Safety
**Severity:** Medium
**Labels:** `bug`
**Location:** app.js, lines 267-284

**Description:**
Path parsing assumes certain array lengths without checking if `pathParts` is empty or has enough elements.

**Suggested Fix:**
Add guards: `if (!pathParts || pathParts.length === 0) { pageName = 'Unknown'; }`

---

## [EDGE-CASE] #9: Deep Clone Limitations
**Severity:** Medium
**Labels:** `bug`
**Location:** app.js, lines 748, 1108

**Description:**
`JSON.parse(JSON.stringify(...))` for cloning fails silently with circular references or non-serializable objects.

**Suggested Fix:**
Use `structuredClone()` for modern browsers or validate structure first.

---

## [BUG] #10: Inconsistent Optional Chaining
**Severity:** Medium
**Labels:** `bug`
**Location:** app.js, lines 329-342, 375-381

**Description:**
Code uses optional chaining (`?.`) inconsistently, making null-safety hard to reason about.

**Suggested Fix:**
Standardize on optional chaining throughout or add explicit checks.

---

# UX/USABILITY FINDINGS (Agent 2 - Beginner Persona)

## [FEEDBACK] #11: Cryptic Technical Terminology
**Severity:** High
**Labels:** `feedback`
**Location:** Table headers, tab names, button labels

**Description:**
"isHiddenInViewMode" and "keepLayerOrder" appear everywhere without explanation. Beginners don't know what these mean or why they matter.

**Suggested Fix:**
- Replace "keepLayerOrder" header with "Layer Order Behavior"
- Add tooltip icons (?) next to technical terms
- Explain in plain language: "Controls whether visuals stay in their original stacking order"

---

## [FEEDBACK] #12: No Folder Selection Guidance
**Severity:** High
**Labels:** `feedback`
**Location:** Select Folder button area

**Description:**
Users don't know which folder to select. No guidance on PBIR folder structure or where to find their report files.

**Suggested Fix:**
- Add inline help: "Select the root folder of your PBIR report (containing 'pages' or 'definition' subdirectories)"
- Add visual folder structure diagram in documentation
- Show example paths

---

## [FEEDBACK] #13: Empty State Message Too Technical
**Severity:** High
**Labels:** `feedback`
**Location:** index.html lines 207-208

**Description:**
Error message "No visual.json files found" doesn't help users understand what went wrong or how to fix it.

**Suggested Fix:**
```
"No filters or layer settings found.

This usually means:
1. You selected the wrong folder
2. Your report has no filters to manage

Try selecting the parent folder of your PBIR report."
```

---

## [FEEDBACK] #14: Status Badges Not Explained at Load
**Severity:** Medium
**Labels:** `feedback`
**Location:** Main table area

**Description:**
Colored status badges (red, green, gray, orange) have no visible legend until users open the documentation modal.

**Suggested Fix:**
- Show collapsible legend card after summary statistics
- Add tooltips to each badge on hover

---

## [FEEDBACK] #15: No Save Confirmation or Next Steps
**Severity:** Medium
**Labels:** `feedback`
**Location:** Save button area

**Description:**
After saving, users don't know if changes were applied correctly or what to do next (reload in Power BI Desktop).

**Suggested Fix:**
- Add confirmation dialog before saving
- Show expanded success message: "Saved 3 files. Reload your report in Power BI Desktop to see changes."

---

## [FEEDBACK] #16: Disabled Buttons Without Explanation
**Severity:** Medium
**Labels:** `feedback`
**Location:** Action buttons

**Description:**
Action buttons are grayed out with no explanation why. Users might think the feature is broken.

**Suggested Fix:**
- Add tooltip on disabled buttons: "Select visuals first using checkboxes"
- Add inline help text below buttons

---

## [FEEDBACK] #17: Tab Content Not Differentiated
**Severity:** Low
**Labels:** `feedback`
**Location:** Tab navigation

**Description:**
Filter Visibility and Layer Order tabs look nearly identical. Users might not realize which tab they're on.

**Suggested Fix:**
- Add icons to each tab
- Add brief description under active tab
- Use subtle color accents per tab

---

## [FEEDBACK] #18: No Keyboard Navigation Hints
**Severity:** Low
**Labels:** `feedback`, `accessibility`
**Location:** Throughout app

**Description:**
No indication that keyboard shortcuts might work. Power users expect Ctrl+Z, Ctrl+S, etc.

**Suggested Fix:**
- Document keyboard shortcuts in manual
- Show shortcuts in button tooltips

---

## [FEEDBACK] #19: Color Contrast Issues
**Severity:** Low
**Labels:** `feedback`, `accessibility`
**Location:** styles.css - muted text color

**Description:**
Muted gray text (#6c757d) may have insufficient contrast for users with low vision.

**Suggested Fix:**
- Check WCAG AA contrast ratios
- Use darker gray for labels

---

## [FEEDBACK] #20: Export Feature Purpose Unclear
**Severity:** Low
**Labels:** `feedback`
**Location:** Export buttons

**Description:**
Users don't know why they'd use Export CSV/JSON or what it contains.

**Suggested Fix:**
- Add tooltips: "Export CSV: Document your filter settings in spreadsheet format"
- Add help text explaining use cases

---

# FEATURE FINDINGS (Agent 3 - Enterprise Persona)

## [FEATURE] #21: Preset/Template System
**Priority:** Must-Have
**Labels:** `feature-request`

**Description:**
No ability to save and apply preset configurations. Enterprise admins need to standardize settings across 50+ reports but must manually repeat selections each time.

**Use Case:**
- Enforce "all filters hidden" policy across all reports
- Apply team-specific standards consistently

**Suggested Implementation:**
- Create "Presets" tab with Save/Load/Manage functionality
- Store presets in localStorage or exportable JSON
- Built-in templates: "Hide All Filters", "Enable All Layer Order"

---

## [FEATURE] #22: Cross-Report Batch Processing
**Priority:** Must-Have
**Labels:** `feature-request`

**Description:**
App only processes one folder at a time. Admins cannot apply settings to multiple reports in a single workflow.

**Use Case:**
- Apply same settings to 15 regional report variants
- Audit all filters across 50 reports at once

**Suggested Implementation:**
- Multi-folder selection or recursive scanning
- Show file tree with folder hierarchy
- Save changes to all folders in one click

---

## [FEATURE] #23: CLI for CI/CD Integration
**Priority:** Should-Have
**Labels:** `feature-request`

**Description:**
GUI-only tool cannot integrate with DevOps pipelines for automated compliance checks.

**Use Case:**
- Enforce filter rules during build verification
- Auto-generate compliance reports in CI/CD

**Suggested Implementation:**
```
pbir-manager --folder <path> --action set-filters --value hidden
pbir-manager --folder <path> --export-report report.json
```

---

## [FEATURE] #24: Performance Optimization for Large Reports
**Priority:** Should-Have
**Labels:** `feature-request`

**Description:**
UI renders all rows at once. Reports with 500+ visuals will cause performance issues.

**Use Case:**
- Large enterprise dashboards with 20+ pages, 100+ visuals per page

**Suggested Implementation:**
- Virtual scrolling (only render visible rows)
- Lazy-load expanded details
- Limit history to 100 operations

---

## [FEATURE] #25: Search and Advanced Filtering
**Priority:** Should-Have
**Labels:** `feature-request`

**Description:**
Only status-based filtering exists. Cannot search by visual name, page, or filter name.

**Use Case:**
- Find all visuals with "Sales" in the name
- Identify all visuals with a specific filter type

**Suggested Implementation:**
- Real-time search across Visual Name, Page, Filter Names
- Filter by visual type, page, modified status
- Regex support for power users

---

## [FEATURE] #26: Pre-Save Validation and Warnings
**Priority:** Should-Have
**Labels:** `feature-request`

**Description:**
No warnings about potential issues before saving (e.g., hiding all filters on a critical dashboard).

**Use Case:**
- Prevent accidental bulk mistakes
- Understand impact before committing

**Suggested Implementation:**
- Pre-save modal showing affected visuals
- Warning: "You're hiding filters on 23 visuals"
- Require confirmation checkbox

---

## [FEATURE] #27: Change Audit Trail Export
**Priority:** Should-Have
**Labels:** `feature-request`

**Description:**
Exports current state only, not change history. Cannot generate compliance reports.

**Use Case:**
- Audit: "Show all filter changes in Q4"
- Before/after comparison for review

**Suggested Implementation:**
- Export change report: Visual | Property | Old | New | Timestamp
- Before/after comparison view
- Diff highlighting

---

## [FEATURE] #28: Dependency Tracking
**Priority:** Nice-to-Have
**Labels:** `feature-request`

**Description:**
Tool doesn't understand relationships between visuals and filters.

**Use Case:**
- Understand which visuals are affected by changing a filter
- See filter dependencies before making changes

**Suggested Implementation:**
- Dependency sidebar showing filter relationships
- Highlight dependent visuals on hover

---

## [FEATURE] #29: Keyboard Shortcuts
**Priority:** Nice-to-Have
**Labels:** `feature-request`

**Description:**
All interactions require clicking. Power users need keyboard shortcuts.

**Suggested Implementation:**
- Ctrl+A = Select All
- H = Set Hidden
- V = Set Visible
- Ctrl+S = Save
- Ctrl+Z = Undo

---

## [FEATURE] #30: Role-Based Access Control
**Priority:** Nice-to-Have
**Labels:** `feature-request`

**Description:**
No approval workflow for team collaboration.

**Use Case:**
- Developer changes need architect approval
- Compliance audit before production

**Suggested Implementation:**
- Export changes as reviewable "changeset"
- Comments and approval workflow

---

# QUICK REFERENCE: Issues to Create

Copy these to GitHub Issues (https://github.com/JonathanJihwanKim/isHiddenInViewMode/issues/new):

## Critical/High Priority (Create First)
| # | Title | Labels |
|---|-------|--------|
| 1 | Unsafe array index access without bounds checking | bug |
| 2 | Missing JSON.parse error feedback to users | bug |
| 3 | XSS risk via innerHTML with user data | bug, security |
| 4 | Missing permission/access error differentiation | bug |
| 11 | Cryptic technical terminology needs explanation | feedback |
| 12 | No folder selection guidance for beginners | feedback |
| 13 | Empty state message too technical | feedback |
| 21 | Add preset/template system for bulk standardization | feature-request |
| 22 | Enable cross-report batch processing | feature-request |

## Medium Priority (Create Second)
| # | Title | Labels |
|---|-------|--------|
| 5 | Race condition in history entry structure | bug |
| 6 | Unbounded directory recursion risk | bug |
| 7 | Memory leak in file downloads | bug |
| 14 | Status badges not explained at load time | feedback |
| 15 | No save confirmation or next steps guidance | feedback |
| 16 | Disabled buttons without explanation | feedback |
| 23 | CLI for CI/CD integration | feature-request |
| 24 | Performance optimization for large reports | feature-request |
| 25 | Search and advanced filtering | feature-request |

## Lower Priority (Create Later)
| # | Title | Labels |
|---|-------|--------|
| 8-10 | Path parsing, clone, optional chaining | bug |
| 17-20 | Tab differentiation, keyboard, contrast, export | feedback |
| 26-30 | Validation, audit, dependencies, shortcuts, RBAC | feature-request |

---

# IMPLEMENTED FIXES & ENHANCEMENTS

**Implementation Date:** 2026-01-31

## ✅ COMPLETED: Visual Interactions Feature (New Tab)

**Addresses:** #21 (Preset System), #22 (Batch Processing), #14 (Status Legend)

Added complete **Visual Interactions** tab to manage `visualInteractions` in `page.json` files:
- Page selector dropdown for multi-page reports
- N×N matrix view showing source→target interaction relationships
- List view for large pages (20+ visuals)
- Auto-switch between views based on visual count
- Four interaction types: Default, Filter, Highlight, None
- Bulk actions: Disable All, Enable All, Set All Filter, Set All Highlight
- Multi-select cells with Ctrl+Click for bulk operations
- Undo/Redo history
- Export to CSV/JSON
- Integration with batch processing

---

## ✅ COMPLETED: Bug Fix 1 - Matrix/List Toggle

**Problem:** Matrix/List view toggle buttons didn't switch the view.
**Root Cause:** `renderInteractionsView()` didn't toggle container visibility.
**Fix:** Added `classList.remove('hidden')` / `classList.add('hidden')` for containers.
**Location:** [app.js](app.js) - `renderInteractionsView()` method

---

## ✅ COMPLETED: Enhancement 2 - Visual Interactions in Batch Processing

**Addresses:** #22 (Batch Processing)

Added Visual Interactions checkbox and dropdown to batch processing manual settings:
- Checkbox: "Set visual interactions to:"
- Dropdown: Disabled (None), Filter, Highlight, Reset to Default
- Integrated with preset selection (disables when preset selected)
- Updates `getBatchSettings()` and `updateBatchProcessButton()`

**Location:** [index.html](index.html) line 339-348, [app.js](app.js) `batchElements`

---

## ✅ COMPLETED: Bug Fix 3 - Naming Alert Detection

**Problem:** Naming alert didn't appear when visuals lacked user-friendly titles.
**Root Cause:** `hasName` checked `visualName` which falls back to auto-generated names.
**Fix:** Created `hasExplicitTitle(json)` method that only checks for explicit user-set titles in `visualContainerObjects.title`.

**Location:** [app.js](app.js) - `hasExplicitTitle()` method, `processJsonFile()`, `buildPagesWithVisuals()`

---

## ✅ COMPLETED: Enhancement 4 - Naming Alerts on All Tabs

**Addresses:** #11 (Cryptic Terminology), #14 (Status Legend)

Added "unnamed visuals" alert banner to Filter Visibility and Layer Order tabs:
- Collapsible warning showing count of visuals without explicit titles
- Expandable list of unnamed visuals with visual type and page name
- Consistent styling across all three tabs

**Location:**
- [index.html](index.html) lines 83-96 (filter), 202-215 (layer)
- [app.js](app.js) - `checkUnnamedVisualsForTab()` method

---

## ✅ COMPLETED: Enhancement 5 - Preset Dropdown Descriptions

**Addresses:** #11 (Cryptic Terminology), #20 (Export Purpose Unclear)

Added description panel below batch processing preset dropdown:
- Shows brief explanation when a preset is selected
- Hides when selection is cleared
- Styled with subtle background and left border accent

**Descriptions added for all 10 presets:**
| Preset | Description |
|--------|-------------|
| Hide All Filters | Hides filter panes from viewers. Filters still apply but are not visible. |
| Show All Filters | Makes all filter panes visible. Viewers can see and interact. |
| Reset All Filters | Removes isHiddenInViewMode property. Restores Power BI default. |
| Lock All Layers | Visuals stay in z-order. Clicking won't bring to front. |
| Unlock All Layers | Visuals can move to front when clicked. |
| Reset All Layers | Removes keepLayerOrder property. Restores default. |
| Disable All Interactions | No cross-filtering or highlighting between visuals. |
| Enable All (Default) | Power BI determines how visuals interact. |
| Set All to Filter | Clicking filters data in other visuals. |
| Set All to Highlight | Clicking highlights related data. Non-matching dimmed. |

**Location:**
- [index.html](index.html) line 325 - `<p id="batch-preset-description">`
- [styles.css](styles.css) lines 1880-1891 - `.preset-description`
- [app.js](app.js) - `builtInPresets` with descriptions, preset change event handler

---

## ✅ COMPLETED: Enhancement 6 - Refresh Button

**Addresses:** #15 (No Save Confirmation/Next Steps)

Added "Refresh" button next to folder selector:
- Hidden by default, appears after folder is selected
- Click to re-scan folder and reload all tab data
- Shows loading state ("Refreshing...") during operation
- Shows success toast when complete
- Hidden again when showing empty state

**Use Case:** After batch processing, users can click Refresh to see updated values without re-selecting the folder.

**Location:**
- [index.html](index.html) line 34 - `<button id="refresh-btn">`
- [styles.css](styles.css) lines 1893-1901 - `#refresh-btn`
- [app.js](app.js) - `refreshData()` method, `selectFolder()`, `showEmptyState()`

---

## REMAINING HIGH PRIORITY ITEMS

**Last Updated:** 2026-01-31

| # | Title | Status |
|---|-------|--------|
| 1 | Unsafe array index access | ✅ Fixed (bounds checking at lines 964-965, 1143-1152) |
| 2 | Missing JSON.parse error feedback | ✅ Fixed (toast notification added in readPageDisplayName) |
| 3 | XSS risk via innerHTML | ✅ Fixed (escapeHtml() applied to data-path attributes) |
| 4 | Missing permission error differentiation | ✅ Fixed (error type handling at lines 1753-1766) |
| 6 | Unbounded directory recursion | ✅ Fixed (MAX_DEPTH = 50 added) |
| 12 | No folder selection guidance | ✅ Fixed (help text added) |
| 13 | Empty state message too technical | ✅ Fixed (user-friendly message in empty-state section) |
| 23 | CLI for CI/CD integration | Not started (Feature request) |

### GitHub Issues Created
- [Issue #19](https://github.com/JonathanJihwanKim/isHiddenInViewMode/issues/19) - Missing JSON.parse error feedback
- [Issue #20](https://github.com/JonathanJihwanKim/isHiddenInViewMode/issues/20) - Minor XSS risk in data-path attributes
