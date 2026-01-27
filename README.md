# PBIR Visual Manager

**[Launch the App](https://jonathanjihwankim.github.io/isHiddenInViewMode/)**

Free, open-source tool to bulk-manage filter visibility and layer order in Power BI PBIR reports.

## Features

- Manage `isHiddenInViewMode` for all filters at once
- Control `keepLayerOrder` across visuals
- Export settings to CSV/JSON
- Undo/redo changes before saving
- Works directly in your browser (no installation)

## Quick Actions

### Filter Visibility Tab
| Button | Action |
|--------|--------|
| Hide All | Sets all filters to hidden (isHiddenInViewMode = true) |
| Show All | Sets all filters to visible (isHiddenInViewMode = false) |
| Reset All | Removes the property, using Power BI defaults |
| Save Preset | Saves current configuration for reuse |

### Layer Order Tab
| Button | Action |
|--------|--------|
| Lock All | Keeps visuals in their layer position (keepLayerOrder = true) |
| Unlock All | Allows visuals to move to front on interaction (keepLayerOrder = false) |
| Reset All | Removes the property, using Power BI defaults |
| Save Preset | Saves current configuration for reuse |

## Batch Processing

Process multiple PBIR reports simultaneously:

1. Switch to the **Batch Processing** tab
2. Click **Add Report Folder** to queue multiple reports
3. Select a preset or configure manual settings
4. Click **Apply to All Reports**

Ideal for standardizing settings across multiple reports in your organization.

## Quick Start

1. Open the app in Chrome, Edge, or Opera
2. Click **Select Folder** and choose your PBIR report folder
3. Select visuals and apply changes
4. Click **Save Changes**

> **Need help?** Click the manual icon in the app header for detailed documentation.

## Requirements

- **Browser:** Chrome, Edge, or Opera (requires File System Access API)
- **Report Format:** Power BI PBIR format (.pbip)

### How to Enable PBIR Format

1. Open Power BI Desktop
2. Go to **File > Options and settings > Options**
3. Select **Preview features**
4. Enable **Power BI Project (.pbip) save option**
5. Save your report as a `.pbip` file

## Status Meanings

### Filter Visibility
| Status | Meaning |
|--------|---------|
| Hidden | `isHiddenInViewMode = true` |
| Visible | `isHiddenInViewMode = false` |
| Default | Property not set |
| Mixed | Filters have different settings |

### Layer Order
| Status | Meaning |
|--------|---------|
| Enabled | `keepLayerOrder = true` (maintains position) |
| Disabled | `keepLayerOrder = false` (may move on interaction) |
| Not Set | Uses Power BI default behavior |

## Tips

- Use **Undo** or **Undo All** to revert changes before saving
- Use **Export CSV/JSON** to document your settings
- Expand visual rows in Filter Visibility tab to control individual filters
- Filter by status using the dropdown to find specific visuals

## About the Creator

**Jihwan Kim** - Power BI Developer & Data Model Architect

- [LinkedIn](https://www.linkedin.com/in/jihwankim1975/)
- [GitHub](https://github.com/JonathanJihwanKim)

## License

MIT License - Free to use, modify, and distribute.

## Sponsors

Interested in sponsoring this project? [Contact me on LinkedIn](https://www.linkedin.com/in/jihwankim1975/)

## Contributing

Found a bug or have a feature idea? Please [open an issue](https://github.com/JonathanJihwanKim/isHiddenInViewMode/issues/new).
