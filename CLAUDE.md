# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PBIR Visual Manager** is a browser-based utility for bulk-managing visual properties in Power BI PBIR format reports. It's a single-page application built with vanilla JavaScript, CSS3, and HTML5 - no frameworks or build system.

- **Live app:** https://jonathanjihwankim.github.io/isHiddenInViewMode/
- **Deployment:** GitHub Pages (automatic from main branch)
- **License:** MIT

## Development

### Running Locally

No build step required. Serve static files with any HTTP server:

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve

# VS Code Live Server extension also works
```

Then open `http://localhost:8000` in Chrome, Edge, or Opera (Firefox/Safari not supported - requires File System Access API).

### No Build/Lint/Test Commands

This project has no:
- Package manager (no npm/yarn, no package.json)
- Build tool (files served as-is)
- Linting (no ESLint)
- Testing framework

Changes to `app.js`, `index.html`, or `styles.css` are immediately live.

## Architecture

### Single-Class Design

The entire application is a single monolithic class: `PBIRVisualManager` (defined in [app.js:23](app.js#L23)).

**State management** is organized by feature tab:
- **Filter Visibility:** `filterHistory[]`, `filterSelectedVisuals`, `filterCurrentFilter`
- **Layer Order:** `layerHistory[]`, `layerSelectedVisuals`, `layerCurrentFilter`
- **Visual Interactions:** `pages[]`, `interactionsHistory[]`, `interactionsSelectedCells`, `currentPageId`, `interactionsViewMode`
- **Batch Processing:** `batchQueue[]`, `batchProcessing`

Each tab maintains independent undo/redo history.

### File Structure (Flat)

```
├── app.js        # Main application logic (~3,700 lines)
├── index.html    # HTML structure
├── styles.css    # Van Gogh-inspired dark/light theme
├── README.md     # User documentation
└── AGENT_REVIEW_FINDINGS.md  # Code review (30 findings with fixes)
```

### Key Data Flow

1. User selects PBIR folder via File System Access API
2. App scans for `pages/*.json` and `definition/` subdirectories
3. Parses visual JSON to extract filters, layer order, interactions
4. Renders tables/matrices for each tab
5. User makes changes → stored in memory
6. Save writes modified JSON back via File System Access API

### Core Methods

- `selectFolder()` - Handles folder selection and triggers scan
- `scanForVisuals()` - Recursively scans PBIR structure (max depth 50)
- `processJsonFile()` - Parses visual.json files
- `saveChanges()` - Writes modifications back to files
- `filterUndo()`/`layerUndo()`/`interactionsUndo()` - Per-tab undo operations

### Browser APIs Used

- **File System Access API** - Reading/writing PBIR files (requires Chrome/Edge/Opera)
- **localStorage** - Theme preference (`pbir-theme`), sidebar state, custom presets

## PBIR Format Reference

Power BI PBIR reports have this structure:
```
ReportFolder/
├── definition/
│   └── ...
├── pages/
│   ├── Page1/
│   │   └── visuals/
│   │       └── Visual1/
│   │           └── visual.json
│   └── Page2/
│       └── ...
└── report.json
```

**Key JSON properties managed:**
- `isHiddenInViewMode` - Filter visibility (true/false)
- `keepLayerOrder` - Layer stacking behavior (true/false)
- `visualInteractions` - Cross-filtering/highlighting settings in page.json

## Known Issues & Review Findings

See [AGENT_REVIEW_FINDINGS.md](AGENT_REVIEW_FINDINGS.md) for 30 documented findings from code review. Most critical/high priority bugs have been fixed as of 2026-02-01.
