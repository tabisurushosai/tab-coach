# Privacy Policy (tab-coach)

Last updated: 2026-05-17

## 1. Information We Collect

tab-coach **does not collect any personal information**.

The extension does not communicate with any external server, and no analytics, tracking, or advertising tools are included.

## 2. Locally Stored Data

The following data is stored only within the user's browser (`chrome.storage.local`).
It is never transmitted to any external party over the network.

- User settings (badge thresholds, inactivity minutes, dark mode, etc.)
- Whitelist (URL patterns excluded from cleanup)
- Archived tab information (title, URL, favicon URL, timestamp)
- Cleanup history (count, category, timestamp)
- Most recent cleanup snapshot (for undo, deleted after 30 seconds)
- Read-completed cache (URL to read-completed timestamp)

All such data is removed by Chrome when the extension is uninstalled.

## 3. Extension Permissions

This extension requests only the minimum permissions required.

- `activeTab`: Operate on the active tab (during cleanup)
- `tabs`: Query, update, and remove tabs (the core feature)
- `storage`: Persist the local data described above

No host permissions (`host_permissions`) are requested.

## 4. Sharing with Third Parties

Because no data is collected, no data is shared with third parties.

## 5. Children's Personal Information

The extension does not collect personal information from any user, including children.

## 6. Changes to This Policy

Any changes to this policy will be announced in this file and in the CHANGELOG of the GitHub repository.

## 7. Contact

GitHub Issues: https://github.com/tabisurushosai/tab-coach/issues
