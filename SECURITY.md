# Security Policy

## Supported Versions

tab-coach は最新の 1.0.x 系列のみセキュリティ修正を提供します。古いバージョンを利用している場合は Chrome Web Store 経由で最新版へ更新してください。

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

脆弱性を発見した場合は、**公開 Issue として投稿しないでください**。代わりに GitHub の Private vulnerability reporting を利用してください。

### Private vulnerability reporting (推奨)

1. https://github.com/tabisurushosai/tab-coach/security/advisories/new にアクセス
2. Title / Description / Affected versions / Severity を記入
3. 再現手順・想定影響範囲・PoC があれば添付
4. Submit

### 報告に含めて欲しい情報

- 影響を受けるバージョン (`manifest.json` の `version` を確認)
- 再現手順 (Chrome バージョン、OS、操作手順)
- 影響範囲 (情報漏洩 / 権限昇格 / DoS など)
- 可能であれば修正案

### 対応タイムライン

| ステップ              | 目標期間        |
| --------------------- | --------------- |
| 受領確認              | 3 営業日以内    |
| 影響評価・初動対応    | 7 営業日以内    |
| 修正版リリース        | 30 日以内 (重大度に応じて短縮) |
| Security Advisory 公開 | 修正版リリース後 |

## Threat Model

tab-coach は以下の設計原則によりセキュリティリスクを最小化しています:

- **完全オフライン**: 外部 API 呼び出し・ネットワーク通信を一切行いません (`manifest.json` に `host_permissions` なし)
- **最小権限**: `tabs` + `storage` のみ。`host_permissions` や `scripting` は要求しません
- **個人情報非収集**: タブのタイトル・URL は `chrome.storage.local` にのみ保存され、外部送信されません
- **`chrome.storage.sync` 不使用**: クラウド同期によるデータ漏洩リスクを回避
- **MV3 service worker**: 長時間メモリ常駐を避け、攻撃面を縮小
- **オープンソース**: MIT ライセンスで全コード公開 (https://github.com/tabisurushosai/tab-coach)

## Scope

本ポリシーは tab-coach 拡張本体 (`src/`, `manifest.json`, `dist/`, `release/tab-coach.zip`) を対象とします。

### Out of scope

- Chrome 本体・Chrome Web Store のインフラ脆弱性 (Google へ報告してください)
- 依存パッケージの脆弱性 (Dependabot で自動追跡しています。直接報告先は各 upstream)
- ユーザー環境固有の問題 (他拡張との競合、ブラウザ拡張機能のサンドボックスを超えない動作)

## Security Updates

- セキュリティ修正は `CHANGELOG.md` の `### Security` セクションに記載されます
- GitHub Release Notes でも告知します
- Chrome Web Store の自動更新により、通常はユーザー操作不要で適用されます

---

Last updated: 2026-05-18
