# tab-coach

[![CI](https://github.com/tabisurushosai/tab-coach/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/tabisurushosai/tab-coach/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/tabisurushosai/tab-coach?include_prereleases&sort=semver)](https://github.com/tabisurushosai/tab-coach/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)](manifest.json)
[![Fully Offline](https://img.shields.io/badge/Privacy-Fully%20Offline-2ea44f)](legal/PRIVACY_ja.md)

タブが10個を超えたら整理を促す Chrome 拡張。

## 機能
- タブ数バッジ (灰/黄/赤)
- 30分未アクティブタブ検出
- 同ドメイン重複検出
- 読了タブ検出
- ワンクリック整理 + 30秒アンドゥ
- ホワイトリスト・カスタム閾値・アーカイブ
- 完全オフライン (外部送信なし)

## 技術
Manifest V3, TypeScript, Vite, chrome.storage.local, chrome.i18n

## ドキュメント
- 仕様 / Spec: [SPEC.md](SPEC.md)
- 変更履歴 / Changelog: [CHANGELOG.md](CHANGELOG.md)
- プライバシー / Privacy: [legal/PRIVACY_ja.md](legal/PRIVACY_ja.md) · [legal/PRIVACY_en.md](legal/PRIVACY_en.md)
- 利用規約 / Terms: [legal/TERMS_ja.md](legal/TERMS_ja.md) · [legal/TERMS_en.md](legal/TERMS_en.md)
- セキュリティ / Security: [SECURITY.md](SECURITY.md)
- 依存ライセンス / Dependency licenses: [LICENSES.md](LICENSES.md)
- 公開手順 / Release: [docs/release.md](docs/release.md) · [docs/release_final.md](docs/release_final.md)
- アーキテクチャ / Architecture: [docs/architecture.md](docs/architecture.md)

## ライセンス
[MIT License](LICENSE) © 2026 tabisurushosai
