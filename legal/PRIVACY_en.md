# Privacy Policy (tab-coach)

Last updated: 2026-05-18
Effective date: 2026-05-18
Maintainer: tabisurushosai (GitHub: https://github.com/tabisurushosai)

This policy governs the handling of information by the Chrome extension "tab-coach" (the "Extension"), including its purpose, scope, retention period, and the rights of users. By installing or using the Extension, you are deemed to have agreed to this policy.

---

## 1. Core Principles

The Extension strictly adheres to the following **three principles**:

1. **No Collection**: Neither the developer nor any third party collects any personally identifiable information, behavioral history, or browsing content.
2. **No Transmission**: No data is transmitted to any external server, analytics service, advertising network, or CDN. The Extension operates fully offline.
3. **No Sync**: Cloud sync features, including `chrome.storage.sync`, are not used. Data never leaves the user's local device.

---

## 2. Information We Collect

The Extension **does not collect any personal information**.

Specifically, none of the following are collected, recorded, or transmitted:

- Name, email address, phone number, postal address, date of birth, or age
- IP address, MAC address, device identifiers, or advertising IDs
- Browsing history, search history, bookmarks, passwords, cookies, or form input
- Page bodies, screenshots, or DOM contents of tabs
- Location data, payment information, contacts, or calendar entries
- Analytics (e.g., Google Analytics), error tracking (e.g., Sentry), A/B testing, or heatmaps

The Extension contains **no** tracking SDKs, fingerprinting code, cryptocurrency miners, or remote-JavaScript execution mechanisms.

---

## 3. Locally Stored Data (Stays on the Device)

To provide its features, the Extension stores the minimum required data only inside the user's browser (`chrome.storage.local`). This data is **never transmitted over the network** and never leaves the user's device.

| Data Type | Content | Storage Location | Retention Period |
|-----------|---------|------------------|------------------|
| User settings | Badge thresholds, inactivity minutes, dark mode, font size, high contrast, etc. | `chrome.storage.local` | Until the user changes or deletes them |
| Whitelist | URL patterns excluded from cleanup (user-entered) | `chrome.storage.local` | Until the user deletes them |
| Archived tab info | Title, URL, favicon URL, timestamp | `chrome.storage.local` | Until the user deletes them |
| Cleanup history | Count, category, timestamp (aggregated values for monthly reports) | `chrome.storage.local` | Last 12 months retained; older entries auto-deleted |
| Cleanup snapshot | Tab ID/URL list for undo | `chrome.storage.local` | Auto-deleted 30 seconds after cleanup |
| Read-completed cache | URL-to-read-time mapping (to suppress duplicate display) | `chrome.storage.local` | Auto-deleted after 30 days |

All such data is fully deleted by Chrome when the Extension is uninstalled. The user may also remove items individually at any time via "Settings → Reset Data."

---

## 4. Extension Permissions

The Extension requests only the **minimum required permissions**. It conforms to Manifest V3 and does not request sensitive permissions such as `host_permissions`, `scripting`, `webRequest`, or `cookies`.

| Permission | Purpose | Necessity |
|------------|---------|-----------|
| `activeTab` | Read URL/title of the currently active tab (for cleanup decisions) | Required |
| `tabs` | Query, update, and remove tabs (core feature) | Required |
| `storage` | Persist the local data above | Required |

Host permissions (e.g., `host_permissions: ["<all_urls>"]`) are **not** requested. The content script is injected only within the scope limited by the manifest, does not read page bodies, and measures only scroll position and dwell time.

---

## 5. Content Script Behavior

For the read-completion feature, a lightweight content script is injected at `document_idle`. Its processing is limited to the following:

- Compute **scroll ratio (a number)** from `window.scrollY` and `document.scrollingElement.scrollHeight`
- Measure page dwell time (in seconds)
- Send only the above two numeric values to the background via `chrome.runtime.sendMessage`

Page bodies, form input, passwords, cookies, DOM structures, and similar information are **never** accessed. Only numeric values are sent; the URL is fetched by the background via `chrome.tabs.get`, so the content script itself does not send the URL.

---

## 6. Sharing with Third Parties

Because no data is collected, the Extension **does not provide, entrust, sell, or share data** with any third party.

If third-party features (analytics, advertising, billing, etc.) are added in the future, this policy will be revised in advance and users will be notified via `CHANGELOG.md` and the Chrome Web Store update notes.

---

## 7. Children's Personal Information

The Extension does not collect personal information from any user, regardless of age. No processing falls within the scope of COPPA (U.S. Children's Online Privacy Protection Act) or GDPR-K (the EU GDPR's child-protection provisions).

---

## 8. User Rights

Because no data is collected, there is no data subject to access, correction, or deletion requests. Locally stored data may be fully deleted by the user at any time via the following means:

1. The "Reset Data" button on the settings page
2. Uninstalling the Extension from `chrome://extensions`
3. Removing extension data from `chrome://settings/cookies`

---

## 9. Security

- The Extension operates entirely locally and performs no external communication, so there is no in-transit leakage risk.
- The source code is published on GitHub under the MIT License and is open to third-party audit.
- Distributed binaries are delivered to users through Chrome Web Store signature verification.

---

## 10. Governing Law and Jurisdiction

This policy shall be interpreted in accordance with the laws of Japan. Any disputes arising from or relating to this policy shall be subject to the exclusive jurisdiction of the Tokyo District Court as the court of first instance.

For users in the EU/EEA and the UK, where GDPR / UK GDPR applies, the data controller is the maintainer listed at the top of this policy. However, as stated above, no personal data is processed, so there are no objects against which a data subject can exercise rights.

For users in California, there is no need to exercise the "right to opt out of sale" or "right to opt out of sharing" under CCPA / CPRA. The Extension does not sell or share personal information.

---

## 11. Changes to This Policy

Any changes to this policy will be announced in this file and in the CHANGELOG of the GitHub repository. Material changes (such as adding collected data or enabling external transmission) will also be disclosed in Chrome Web Store update notes.

---

## 12. Contact

Questions and requests regarding this policy can be sent to the following:

- GitHub Issues: https://github.com/tabisurushosai/tab-coach/issues
- Repository: https://github.com/tabisurushosai/tab-coach

---

Please refer to `PRIVACY_ja.md` for the Japanese version. In case of any discrepancy between the Japanese and English versions, the Japanese version prevails.
