# tab-coach — Chrome Web Store Listing (English)

This document holds the finalized text and metadata that will be pasted into the Chrome Web Store Developer Console. Each section header maps to a Developer Console field.

---

## Name

```
tab-coach
```

- Limit: 75 characters
- Current: 9 characters

## Short description

Chrome Web Store "Summary" field (max 132 characters). Shown on search result cards, extension lists, and the top of the store page.

```
Visualize tab overload and tidy up with one click. 30-second undo, whitelist, archive. Fully offline, ad-free, minimal permissions.
```

- Length: 131 characters / 132 limit
- Expands `_locales/en/messages.json` `extension_description` (95 chars) by surfacing the three flagship behaviors (undo, whitelist, archive) without exceeding the 132 char cap.

## Detailed description

Chrome Web Store "Detailed description" field (max 16,000 characters). Markdown is not rendered; only line breaks are preserved. Paste as plain text.

```
tab-coach is a Chrome extension that visualizes tab overload and tidies it up with one click. It runs fully offline — no external server requests, no ads, no tracking.

Who is it for?
- You frequently end up with 30+ tabs open without realizing it.
- Your "read later" tabs keep piling up and never go away.
- You open the same site multiple times by accident.
- Your browser feels sluggish.
- You hesitate every time before closing a tab.

Key features
1. Tab count badge
The toolbar icon shows the current tab count. Gray below 10, yellow from 10 to 19, red at 20 or more. Thresholds are customizable from the options page.

2. One-click cleanup
From the popup, filter tabs by category (Inactive, Duplicate, Read, All) and bulk close every matching tab in a single click.

3. 30-second undo
For 30 seconds after a cleanup an undo button is shown. Restore all closed tabs in one shot if you change your mind.

4. Archive
Instead of closing tabs you can archive them. Archived tabs can be restored from the options page later, and exported / imported as JSON.

5. Whitelist
Register URL patterns (e.g. https://*.github.com/*) to exclude them from cleanup.

6. Monthly report
Per-month totals of cleanup runs and an estimated time saved (15 seconds per closed tab as a heuristic).

7. Accessibility
Dark mode (auto / light / dark), font scale (80% to 150%), high-contrast palette, and keyboard shortcuts (Ctrl/Cmd+Shift+T to open the popup, Ctrl/Cmd+Shift+R to run cleanup).

Privacy
- No data is ever sent to an external server (fully offline).
- No personal data, browsing history, or access logs are collected.
- Data is stored only in chrome.storage.local; it is not synced.
- No account registration or login is required.
- No advertising, tracking, or analytics tags.
- Your data is never sold or shared with third parties.

Required permissions
- activeTab: to fetch the currently focused tab for inclusion in cleanup operations.
- tabs: to enumerate tab title and URL so they can be categorized.
- storage: to persist settings, archive entries, and history on your machine.

No other permissions (host_permissions, identifiers, remote code execution, etc.) are requested.

Environment
- Chrome 114 or later
- Manifest V3 compliant
- Automatic Japanese / English UI based on your Chrome language preference

Open source
The source code is published on GitHub.
https://github.com/tabisurushosai/tab-coach

Support
Please report bugs or feature requests on GitHub Issues.
https://github.com/tabisurushosai/tab-coach/issues

Privacy policy / Terms
- Privacy policy: https://github.com/tabisurushosai/tab-coach/blob/main/legal/PRIVACY_en.md
- Terms of service: https://github.com/tabisurushosai/tab-coach/blob/main/legal/TERMS_en.md
```

- Length (with line breaks): approx. 2,000 characters / 16,000 limit
- ASCII punctuation and URLs paste as-is without issue.

## Category

```
Productivity
```

- Do not set a secondary category.
- Closest related store taxonomies: Tabs / Workflow / Time management. tab-coach's primary value is "save time by tidying tabs," so Productivity is the canonical fit.

## Languages

- Japanese (ja)
- English (en)

Both `_locales/<lang>/messages.json` files ship a complete translation. Chrome switches the UI based on the user's language preference.

## Store search tags / metadata keywords

Chrome Web Store's Developer Console does not have an explicit tag field, but the following keywords are woven into the summary and detail copy to improve in-store search discoverability:

- tab cleanup
- tab manager
- bulk close
- duplicate tabs
- inactive tabs
- read later
- archive
- productivity
- offline
- privacy
- ad-free
- whitelist

## Official site

```
https://github.com/tabisurushosai/tab-coach
```

## Support site

```
https://github.com/tabisurushosai/tab-coach/issues
```

## Contact email

Required Chrome Web Store field. Use the contact address registered on the developer account. Configured in the Developer Console only; never displayed on the public store page.

## Store assets

| Type | Size | Path | Notes |
| --- | --- | --- | --- |
| Icon | 128x128 PNG | `icons/128.png` | Same icon used by the manifest. |
| Screenshot 1 | 1280x800 PNG | `assets/screenshots/01_popup.png` | Popup view. Minimum 1, maximum 5. |
| Screenshot 2 | 1280x800 PNG | `assets/screenshots/02_options.png` | Options page. |
| Screenshot 3 | 1280x800 PNG | `assets/screenshots/03_badge_warning.png` | Badge in red (20+ tab warning state). |
| Small promo tile | 440x280 PNG | `assets/promo_small.png` | Required. |
| Large marquee tile | 1400x560 PNG | `assets/promo_marquee.png` | Used when featured in carousels. |

Screenshots support either 1280x800 or 640x400; this project uses 1280x800 consistently.

## Privacy practices

The Developer Console "Privacy" tab content is defined separately in `docs/privacy_tab.md` (T096). Keep this listing copy aligned with that document.

Key points (recap):

- Single purpose: tab management
- Does not handle personal information
- Does not use remote code
- Does not sell user data to third parties
- Does not collect user data

## Visibility

- Visibility: Public
- Distribution regions: All regions
- Price: Free (current. Even when a Premium tier is introduced later, the extension itself remains free of charge.)

## Release notes

When publishing a new version, copy the matching version excerpt from `CHANGELOG.md` into the "What's new" field. Use the `## [x.y.z] - YYYY-MM-DD` section verbatim.

## Pre-submission checklist

- [ ] Summary is at most 132 characters
- [ ] Detailed description is at most 16,000 characters
- [ ] Three 1280x800 screenshots uploaded
- [ ] 440x280 small promo tile uploaded
- [ ] 128x128 icon uploaded
- [ ] Category set to Productivity
- [ ] Official site / support URL configured
- [ ] All checkboxes in `docs/privacy_tab.md` confirmed
- [ ] Distribution: All regions
- [ ] Price: Free
- [ ] Contact email registered
