# PBIR Visual Manager

Bulk-manage filter visibility and layer order across Power BI PBIR reports - no more clicking through every visual one by one.

## What It Does

- **Filter Visibility** - Control whether filters are hidden or visible to report viewers (`isHiddenInViewMode`)
- **Layer Order** - Control whether visuals maintain their z-order during interactions (`keepLayerOrder`)
- **Bulk Operations** - Select multiple visuals and apply changes at once
- **Export** - Export settings to CSV or JSON for documentation

## Quick Start

1. Open `index.html` in Chrome, Edge, or Opera
2. Click **Select Folder** and choose your PBIR report folder
3. Select visuals using checkboxes
4. Apply changes (Hidden/Visible for filters, Enabled/Disabled for layer order)
5. Click **Save Changes**

> **Need help?** Click the manual icon (📖) in the app header for detailed documentation.

## Requirements

- **Browser:** Chrome, Edge, or Opera (requires File System Access API)
- **Report Format:** Your Power BI report MUST be saved in PBIR format (.pbip)

### How to Enable PBIR Format

1. Open Power BI Desktop
2. Go to **File > Options and settings > Options**
3. Select **Preview features**
4. Enable **Power BI Project (.pbip) save option**
5. Save your report as a `.pbip` file

## Beta Testing

We're looking for feedback from Power BI developers! If you find bugs, have feature ideas, or want to share your experience, please submit a GitHub Issue:

- [Report a Bug](../../issues/new?template=bug_report.md)
- [Request a Feature](../../issues/new?template=feature_request.md)
- [Share Feedback](../../issues/new?template=feedback.md)

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

## License

MIT
