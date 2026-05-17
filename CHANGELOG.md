# Changelog

All notable changes to **tab-coach** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 仕様ドキュメント (SPEC.md) とデータフロー Mermaid 図
- 100 タスクの開発計画 (TODO.md)
- ライセンス雛形 (LICENSES.md, MIT)
- 法務ドキュメント (legal/PRIVACY_ja.md, PRIVACY_en.md, TERMS_ja.md, TERMS_en.md)
- CHANGELOG.md (本ファイル)

### Changed
- なし

### Deprecated
- なし

### Removed
- なし

### Fixed
- なし

### Security
- なし

---

## [1.0.0] - TBD

初回公開リリース予定。以下を含む:

### Added
- Manifest V3 ベースの Chrome 拡張機能スケルトン
- タブ数バッジ表示 (灰/黄/赤の閾値カラー)
- popup によるタブ一覧表示・操作 (アクティブ化・クローズ)
- 未アクティブタブ / 同ドメイン重複 / 読了タブの自動分類
- ワンクリック「整理する」ボタン + 30 秒以内のアンドゥ
- ホワイトリスト (URL パターン) によるタブ保護
- アーカイブ機能 (close 代替の保存) + JSON エクスポート / インポート
- 月次レポート (整理回数・推定節約時間)
- ダークモード自動 / 手動切替
- 完全オフライン動作 (外部 API 通信なし)
- chrome.storage.local のみ使用 (sync 不使用)
- 日本語 / 英語の完全 i18n (_locales/ja, _locales/en)
- 最小権限: activeTab + tabs + storage のみ
- アクセシビリティ: ARIA 属性 / キーボードショートカット / フォントサイズ調整

### Security
- 個人情報を一切収集・送信しない (PRIVACY.md 参照)
- host_permissions を一切要求しない

---

[Unreleased]: https://github.com/tabisurushosai/tab-coach/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tabisurushosai/tab-coach/releases/tag/v1.0.0
