# tab-coach — Chrome Web Store Category & Tags (確定版)

本書は Chrome Web Store Developer Console に登録するカテゴリとストア検索キーワード (タグ相当) の確定方針を、日英ストア掲載文 (`store_listing_ja.md` / `store_listing_en.md`) の上位 SSOT (Single Source of Truth) として定義します。新規キーワードを追加する場合は、本書 → 両言語の掲載文の順で更新してください。

---

## 1. カテゴリ (Category)

| 項目 | 値 |
| --- | --- |
| プライマリ | **Productivity (仕事効率化)** |
| セカンダリ | なし (Chrome Web Store はセカンダリカテゴリ非対応) |
| 公開地域 | すべての地域 (All regions) |
| 価格 | 無料 (Free) |

### 確定理由

- 主目的が「タブ整理による時間節約」であり、Chrome Web Store のカテゴリ分類のうち最も適合するのは Productivity。
- Developer / Communication / Social & Communication / Shopping / Photos / Fun / Accessibility いずれも本拡張の単一用途 (Tab management) と合致しない。
- 競合 (OneTab, Tab Wrangler, The Great Suspender 後継等) も Productivity に分類されており、同カテゴリで検索発見性が最も高い。
- アクセシビリティ機能 (ハイコントラスト・文字サイズ・ダークモード) を持つが、これは付随的機能であり、主目的ではないため Accessibility ではなく Productivity を選択。

### 単一用途宣言 (Single purpose)

```
Tab management — visualise open-tab pressure and tidy tabs in one click.
タブ管理 — タブの開きすぎを可視化し、ワンクリックで整理する。
```

`docs/privacy_tab.md` (T096) の単一用途欄と完全一致させること。

---

## 2. ストア検索キーワード (Tags)

Chrome Web Store の Developer Console には独立した「タグ」フィールドは存在しません。検索ヒット率を高めるため、以下のキーワードを概要 / 詳細欄に自然な形で盛り込みます。

### 2.1 日本語キーワード (12 件)

| # | キーワード | 採用理由 |
| --- | --- | --- |
| 1 | タブ整理 | 主機能。第一想起ワード。 |
| 2 | タブ管理 | 「整理」より広い検索意図をカバー。 |
| 3 | 一括クローズ | 「タブをまとめて閉じる」検索意図に対応。 |
| 4 | 重複タブ | カテゴリ「重複」機能の直接的検索ワード。 |
| 5 | 未アクティブ | カテゴリ「未アクティブ」機能の直接的検索ワード。 |
| 6 | 読了 | カテゴリ「読了」機能の直接的検索ワード。 |
| 7 | アーカイブ | 「閉じずに保管」検索意図に対応。 |
| 8 | 生産性 | カテゴリ Productivity の日本語ラベル。 |
| 9 | オフライン | 非機能要件 (外部送信なし) の差別化キーワード。 |
| 10 | プライバシー | 非機能要件 (個人情報を扱わない) の差別化キーワード。 |
| 11 | 広告なし | 非機能要件 (広告・トラッキングなし) の差別化キーワード。 |
| 12 | ホワイトリスト | URL パターン除外機能の直接的検索ワード。 |

### 2.2 英語キーワード (12 件)

| # | Keyword | Rationale |
| --- | --- | --- |
| 1 | tab cleanup | Primary feature. Top-of-mind search term. |
| 2 | tab manager | Broader intent than cleanup. |
| 3 | bulk close | "Close many tabs at once" intent. |
| 4 | duplicate tabs | Direct match for the "Duplicates" category. |
| 5 | inactive tabs | Direct match for the "Inactive" category. |
| 6 | read later | Direct match for the "Read" category. |
| 7 | archive | "Stash without closing" intent. |
| 8 | productivity | English label for the Productivity category. |
| 9 | offline | Non-functional differentiator (no network calls). |
| 10 | privacy | Non-functional differentiator (no PII). |
| 11 | ad-free | Non-functional differentiator (no ads, no tracking). |
| 12 | whitelist | Direct match for the URL-pattern exclusion feature. |

### 2.3 採用しなかったキーワード

| キーワード | 不採用理由 |
| --- | --- |
| AI / GPT / LLM | 本拡張は AI を一切利用しないため、虚偽記載になる。 |
| 同期 / sync | `chrome.storage.local` のみ使用し、`sync` は使わないため。 |
| クラウド / cloud | 完全オフラインのため。 |
| 課金 / premium / paid | v1.0.0 時点で課金機能なし。将来導入時に再検討。 |
| サスペンド / suspend | 本拡張はタブをサスペンドしない (整理 / 閉じる / アーカイブのみ)。 |
| メモリ削減 / memory | サスペンド非対応のため、直接的なメモリ削減は謳わない。 |

---

## 3. 関連ドキュメントとの整合性

本書を更新したら、以下のファイルの該当箇所を必ず追従させること。

| ファイル | 該当セクション |
| --- | --- |
| `docs/store_listing_ja.md` | 「カテゴリ」「ストアタグ」 |
| `docs/store_listing_en.md` | "Category" / "Store search tags" |
| `docs/privacy_tab.md` (T096) | 単一用途 (Single purpose) |
| `_locales/ja/messages.json` | `extension_description` 内のキーワード |
| `_locales/en/messages.json` | `extension_description` 内のキーワード |
| `README.md` | バッジ / Description 行 |

---

## 4. 送信前チェックリスト (Category & Tags only)

- [ ] Developer Console > Store listing > Category = **Productivity** に設定
- [ ] Secondary category は未設定 (none)
- [ ] 「概要 (Short description)」に日本語キーワード 12 件のうち最低 4 件を含む (`タブ整理` / `アーカイブ` / `オフライン` / `広告なし` 等)
- [ ] 「詳細 (Detailed description)」に日本語キーワード 12 件のうち最低 10 件を含む
- [ ] 英語掲載文 (`store_listing_en.md`) に英語キーワード 12 件のうち最低 10 件を含む
- [ ] 不採用キーワード (AI / sync / cloud 等) を概要・詳細に含めていない
