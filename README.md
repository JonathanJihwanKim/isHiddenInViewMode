# PBIR Visual Manager

[![GitHub stars](https://img.shields.io/github/stars/JonathanJihwanKim/isHiddenInViewMode?style=social)](https://github.com/JonathanJihwanKim/isHiddenInViewMode/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/JonathanJihwanKim/isHiddenInViewMode?style=social)](https://github.com/JonathanJihwanKim/isHiddenInViewMode/network/members)
![Visitors](https://visitor-badge.laobi.icu/badge?page_id=JonathanJihwanKim.isHiddenInViewMode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[Launch the App](https://jonathanjihwankim.github.io/isHiddenInViewMode/)**

Free, browser-based tool to bulk-manage visual properties in Power BI PBIR reports — no installation required.

---

## Why Use This Tool?

Managing Power BI report properties can be tedious and error-prone. This tool solves common pain points:

| Problem | Solution |
|---------|----------|
| **Manual JSON editing** | Change settings visually without touching raw config files |
| **Time-consuming bulk changes** | Configure hundreds of visuals in seconds, not minutes |
| **Inconsistent report settings** | Apply standardized configurations across your entire organization |
| **Complex visual interactions** | Manage source-to-target relationships with an intuitive matrix view |
| **Software installation barriers** | Works directly in your browser (Chrome, Edge, Opera) |
| **No documentation trail** | Export settings to CSV/JSON for audits and compliance |
| **Hard-to-find configuration issues** | Alerts for unnamed visuals help identify problems |

---

## Quick Start

1. Open the app in **Chrome**, **Edge**, or **Opera**
2. Click **Select Folder** and choose your PBIR report folder
   *(the folder containing `pages` or `definition` subdirectories)*
3. Use the tabs to manage filters, layers, or visual interactions
4. Make your changes and click **Save Changes**

> **New to PBIR format?** See [How to Enable PBIR Format](#how-to-enable-pbir-format) below.

---

## Features

### Filter Visibility

Control whether filter panes are visible or hidden from report viewers. Filters still apply to your data — this only affects what viewers can see.

| Button | What Happens |
|--------|--------------|
| Hide All | Filters apply but are invisible to viewers |
| Show All | Viewers can see and interact with all filters |
| Reset All | Restore Power BI default behavior |
| Save Preset | Save your configuration for reuse |

**Tip:** Expand visual rows to control individual filters within a visual.

---

### Layer Order

Control whether visuals maintain their stacking position when clicked. Useful for preventing dashboard layouts from shifting during user interaction.

| Button | What Happens |
|--------|--------------|
| Lock All | Visuals stay in position when clicked |
| Unlock All | Visuals can move to front on interaction |
| Reset All | Restore Power BI default behavior |
| Save Preset | Save your configuration for reuse |

---

### Visual Interactions

Control how selecting data in one visual affects other visuals. Fine-tune cross-filtering and highlighting behavior between specific visual pairs.

**Two View Modes:**
- **Matrix View** — N×N grid for pages with fewer than 20 visuals (recommended)
- **List View** — Table of explicit overrides for pages with 20+ visuals (auto-switches for performance)

**Interaction Types:**

| Type | Behavior |
|------|----------|
| Default | Power BI determines automatically |
| Filter | Selection filters data in the target visual |
| Highlight | Selection highlights related data, dims unrelated |
| None | Selection has no effect on the target visual |

**Multi-select:** Use `Ctrl+Click` to select multiple cells, then apply bulk changes.

**Quick Actions:**
- Disable All Interactions
- Enable All (Default)
- Set All to Filter
- Set All to Highlight

---

### Batch Processing

Apply settings to multiple reports at once — ideal for standardizing configurations across your organization.

**How to use:**
1. Switch to the **Batch Processing** tab
2. Click **Add Report Folder** to queue multiple reports
3. Select a preset or configure manual settings
4. Click **Apply to All Reports**

**10 Built-in Presets:**

| Category | Presets |
|----------|---------|
| Filter Visibility | Hide All Filters, Show All Filters, Reset All Filters |
| Layer Order | Lock All Layers, Unlock All Layers, Reset All Layers |
| Visual Interactions | Disable All, Enable All (Default), Set All to Filter, Set All to Highlight |

---

## Additional Features

- **Custom Presets** — Save your own configurations in browser storage for repeated use
- **Export to CSV/JSON** — Document current settings for audits, reviews, or backup
- **Undo/Redo** — Independent history per tab; revert changes before saving
- **Refresh Button** — Re-scan folder after batch processing to see updated values
- **Unnamed Visual Alerts** — Warnings when visuals lack titles (helps identify configuration issues)

---

## Requirements

- **Browser:** Chrome, Edge, or Opera (requires File System Access API)
- **Report Format:** Power BI PBIR format (.pbip)

---

## How to Enable PBIR Format

1. Open **Power BI Desktop**
2. Go to **File > Options and settings > Options**
3. Select **Preview features**
4. Enable **Power BI Project (.pbip) save option**
5. Save your report as a `.pbip` file

---

## Tips & Best Practices

- Use **Undo** or **Undo All** before saving to revert mistakes
- Use **Export CSV/JSON** to document settings for compliance
- Filter by status using dropdowns to find specific visuals quickly
- Click **Refresh** after batch processing to see updated values
- Add titles to your visuals in Power BI Desktop to make them easier to identify

> **Need help?** Click the manual icon in the app header for detailed documentation.

---

## Technical Reference

### Filter Visibility Status

| Status | Meaning |
|--------|---------|
| Hidden | `isHiddenInViewMode = true` |
| Visible | `isHiddenInViewMode = false` |
| Default | Property not set (uses Power BI default) |
| Mixed | Individual filters have different settings |

### Layer Order Status

| Status | Meaning |
|--------|---------|
| Enabled | `keepLayerOrder = true` (maintains position) |
| Disabled | `keepLayerOrder = false` (may move on interaction) |
| Not Set | Property not defined |

### Visual Interaction Types

| Type | Technical Value |
|------|-----------------|
| Default | No override (automatic) |
| Filter | `DataFilter` |
| Highlight | `HighlightFilter` |
| None | `NoFilter` |

---

## About the Creator

**Jihwan Kim** — Power BI Developer & Data Model Architect

- [LinkedIn](https://www.linkedin.com/in/jihwankim1975/)
- [GitHub](https://github.com/JonathanJihwanKim)

---

## Contributing

Found a bug or have a feature idea? Please [open an issue](https://github.com/JonathanJihwanKim/isHiddenInViewMode/issues/new).

---

## License

MIT License — Free to use, modify, and distribute.

---

## Sponsors

Interested in sponsoring this project? [Contact me on LinkedIn](https://www.linkedin.com/in/jihwankim1975/)
