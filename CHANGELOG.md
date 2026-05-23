# Changelog

All notable changes to **tab-coach** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- なし

### Changed
- なし

### Deprecated
- なし

### Removed
- 未使用の `activeTab` 権限を削除し、Chrome Web Store 申請時の過剰権限リスクを低減。

### Fixed
- なし

### Security
- content script が送信する URL/読了判定データについて、プライバシーポリシーと Chrome Web Store 申請用ドキュメントの説明を実装に合わせて明確化。

---

## [1.0.0] - 2026-05-18

初回公開リリース。Chrome Web Store 申請対象バージョン。

### Added
- Manifest V3 ベースの Chrome 拡張機能 (minimum_chrome_version: 114)
- タブ数バッジ表示 (灰 / 黄 / 赤 の閾値カラー、デフォルト 10 / 20)
- popup によるタブ一覧表示・操作 (アクティブ化・クローズ・検索フィルタ)
- 未アクティブタブ / 同ドメイン重複 / 読了タブ (90% スクロール+滞在) の自動分類
- ワンクリック「整理する」ボタン + 30 秒以内のアンドゥ
- ホワイトリスト (URL / ドメインパターン) によるタブ保護
- アーカイブ機能 (close 代替の保存) + JSON エクスポート / インポート
- 月次レポート (整理回数・推定節約時間・週次トレンド)
- ダークモード自動 (prefers-color-scheme) / 手動切替 (light / dark / auto)
- キーボードショートカット: Ctrl+Shift+T (popup) / Ctrl+Shift+R (cleanup)
- options ページ (閾値・分類ルール・ホワイトリスト・テーマ・プライバシー設定)
- 完全オフライン動作 (外部 API 通信ゼロ、ネットワーク呼び出しなし)
- chrome.storage.local のみ使用 (sync 不使用、デバイスローカル保存)
- 日本語 / 英語の完全 i18n (_locales/ja, _locales/en、chrome.i18n)
- 最小権限: activeTab + tabs + storage のみ (host_permissions なし)
- アクセシビリティ: ARIA 属性 / キーボード操作 / フォントサイズ調整
- 初回起動時のオンボーディング画面 + プライバシー設定オプトイン
- icons (16/48/128 PNG) + Chrome Web Store プロモタイル (440x280, 1400x560)
- ストアリスティング (docs/store_listing_ja.md, store_listing_en.md, store_listing.md)

### Security
- 個人情報・閲覧履歴・タブ URL を一切収集・送信しない (legal/PRIVACY_ja.md, PRIVACY_en.md)
- host_permissions を一切要求しない
- 外部サーバーへの通信ゼロ (CSP / manifest で担保)
- 広告・トラッキング・分析タグなし

---

[Unreleased]: https://github.com/tabisurushosai/tab-coach/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tabisurushosai/tab-coach/releases/tag/v1.0.0
