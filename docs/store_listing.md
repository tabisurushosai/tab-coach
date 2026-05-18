# tab-coach — Chrome Web Store Listing SSOT (確定版)

本書は Chrome Web Store Developer Console に登録するカテゴリ・ストア検索キーワード (タグ相当)・**Web UI 設定手順** の確定方針を、日英ストア掲載文 (`store_listing_ja.md` / `store_listing_en.md`) の上位 SSOT (Single Source of Truth) として定義します。新規キーワードを追加する場合は、本書 → 両言語の掲載文の順で更新してください。

> Web UI からの実際の入力手順は §5 を参照。プライバシー関連タブの細目は `docs/privacy_tab.md` (T096)、販売地域・審査送信は `docs/release_final.md` (T097) を参照。

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

---

## 5. Chrome Web Store Developer Console Web UI 設定手順

本セクションは v1.0.0 を Chrome Web Store に **新規登録** する際の Web UI 操作を、画面遷移単位で完備します。アカウントは `tabisurushosai` 名義の Chrome Web Store Developer 登録済アカウント (登録料 $5 USD 一括払済) を前提とします。`chrome_publish.sh` (CLI / OAuth 経由) を使う場合の手順は T094 SKIP 注記を参照。

### 5.1 事前準備チェック

| # | 確認項目 | 確認元ファイル / コマンド |
| --- | --- | --- |
| 1 | バージョンが 1.0.0 で揃っている | `package.json` / `manifest.json` / `package-lock.json` (T092) |
| 2 | `release/tab-coach.zip` が最新ビルドで生成済 | `bash build_zip.sh` (T091、47159 bytes 目安) |
| 3 | ZIP に sourcemap が含まれていない | `unzip -l release/tab-coach.zip \| grep -v '\.map'` |
| 4 | 日英 i18n が完全に対応 | `_locales/ja/messages.json` / `_locales/en/messages.json` |
| 5 | プロモアセットが解像度通り | `icons/128.png` (128x128) / `assets/screenshots/01_popup.png` / `02_options.png` / `03_badge_warning.png` (1280x800) / `assets/promo_small.png` (440x280) / `assets/promo_marquee.png` (1400x560) |
| 6 | 法務ドキュメントの URL が公開されている | `legal/PRIVACY_ja.md` / `PRIVACY_en.md` (GitHub raw 等で公開) |

### 5.2 アクセスから新規アイテム作成まで

1. `https://chrome.google.com/webstore/devconsole/` を Chrome で開く。
2. デベロッパー アカウント (tabisurushosai) でサインイン。
3. 上部右の「**+ 新しいアイテム / New item**」をクリック。
4. 「ファイルを選択 / Choose file」で `release/tab-coach.zip` を選択しアップロード。
5. アップロード完了後、自動的に「Store listing / ストア掲載情報」タブに遷移する。

### 5.3 Store listing タブ (ストア掲載情報) 入力

> 入力値はすべて `docs/store_listing_ja.md` / `docs/store_listing_en.md` をコピー & ペーストで貼り付ける。手入力での書き換えは禁止 (SSOT 維持)。

| フィールド | 言語 | 値の参照元 |
| --- | --- | --- |
| 商品名 / Product name | 既定 (英語) | `store_listing_en.md` §タイトル (`tab-coach`) |
| 概要 / Summary (132 字以内) | ja / en 両方 | 各 `store_listing_*.md` の「概要」セクション (1 行) |
| 詳細 / Description (16,000 字以内) | ja / en 両方 | 各 `store_listing_*.md` の「詳細」セクション全体 |
| カテゴリ / Category | — | **Productivity** (§1 参照) |
| 言語 / Language | — | 日本語 / 英語 (両方追加) |
| アイコン (128x128 PNG) | — | `icons/128.png` |
| スクリーンショット (1280x800 PNG, 1〜5 枚) | — | `assets/screenshots/01_popup.png` / `02_options.png` / `03_badge_warning.png` (計 3 枚) |
| 小プロモタイル (440x280 PNG) | — | `assets/promo_small.png` |
| 大プロモタイル (1400x560 PNG, 任意) | — | `assets/promo_marquee.png` |
| 公式サイト URL (任意) | — | `https://github.com/tabisurushosai/tab-coach` |
| サポート URL | — | `https://github.com/tabisurushosai/tab-coach/issues` |

入力の流れ:

1. 「**言語追加 / Add language**」で **日本語** を追加。
2. 言語切替プルダウンを「日本語」にして、商品名・概要・詳細をペースト。
3. 「English (default)」に切替えて英語版をペースト。
4. カテゴリで **Productivity** を選択。
5. アイコン → スクリーンショット → 小プロモタイル → (任意) 大プロモタイルの順にアップロード。
6. 各画像が `assets/` 配下のファイルと一致することを目視で確認。
7. 「**下書き保存 / Save draft**」を押下 (まだ送信しない)。

### 5.4 Privacy practices タブ (プライバシー慣行)

詳細は `docs/privacy_tab.md` (T096) を参照。本書では UI 遷移のみ示す。

1. 左メニュー「**プライバシー慣行 / Privacy practices**」を選択。
2. **単一用途宣言 (Single purpose)**: §1 の宣言文を貼付。
3. **使用権限の正当化 (Permission justification)**:
   - `activeTab` → 「ユーザー操作時に現在のタブのみを取得し、整理 / アーカイブ対象を特定するため」
   - `tabs` → 「タブ数バッジ表示と分類 (未アクティブ / 重複 / 読了) を計算するため」
   - `storage` → 「ホワイトリスト・設定・アーカイブを端末ローカル (`chrome.storage.local`) のみに保存するため」
   - `host_permissions` → **要求していない**
4. **データ取り扱い (Data usage disclosures)**: 3 つの宣言チェックすべてを ON (詳細 `docs/privacy_tab.md`)。
   - 取り扱う個人情報・ユーザーデータの種類 → **「該当なし / None」**
   - 第三者への販売・移転をしない → **チェック**
   - 単一用途以外に使用しない → **チェック**
   - 信用調査・与信判断・雇用判断に使わない → **チェック**
5. プライバシーポリシー URL を入力 (例 `https://github.com/tabisurushosai/tab-coach/blob/main/legal/PRIVACY_en.md`)。
6. 「**下書き保存 / Save draft**」を押下。

### 5.5 Pricing and distribution タブ (販売地域・配布)

詳細は `docs/release_final.md` (T097) を参照。本書では既定値のみ示す。

| 項目 | 値 |
| --- | --- |
| 価格 | **Free (無料)** |
| 配布 / 公開地域 | **All regions (すべての地域)** |
| 公開設定 | **Public (一般公開)** |
| 公開時期 | **手動 (送信ボタン押下時)** |
| 年齢制限 | なし (一般向け) |

### 5.6 送信 (Submit for review)

1. 上部の「**送信 / Submit for review**」ボタンを押下。
2. 必須項目の未入力がある場合、赤バナーで該当タブが表示される → 戻って修正。
3. 確認ダイアログで内容を再確認し「Submit」。
4. 「審査中 / In review」ステータスに遷移したことを確認。
5. 審査結果はメール (tabisurushosai のデベロッパー登録メール) で通知される。通常 1〜3 営業日。

### 5.7 公開後 (Post-publish)

1. 公開後 `chrome.google.com/webstore/detail/<itemId>` でストア URL を取得。
2. ストア URL を `README.md` の「Install」セクションに追記。
3. `docs/release_final.md` のリリースログ表に公開日時 / itemId を追記。
4. GitHub Release v1.0.0 (T098) のリリースノート末尾にもストア URL を追記。
5. SNS 告知 (T099) を実行。

---

## 6. 送信前チェックリスト (Web UI 全項目)

§4 のチェックに加え、以下を必ず確認すること。

- [ ] `release/tab-coach.zip` が最新 (T091 で生成済) かつ sourcemap 不含
- [ ] アイコン / スクリーンショット / 小プロモタイル / 大プロモタイルの解像度が仕様通り
- [ ] 日本語・英語の **概要** が 132 字以内 (`store_listing_*.md` から貼付)
- [ ] 日本語・英語の **詳細** が 16,000 字以内 (`store_listing_*.md` から貼付)
- [ ] カテゴリ = Productivity / セカンダリなし
- [ ] プライバシー慣行 3 宣言すべてチェック ON (`docs/privacy_tab.md` 準拠)
- [ ] 単一用途宣言 が §1 と完全一致
- [ ] プライバシーポリシー URL が **公開済 (legal/PRIVACY_*.md)** で 200 を返す
- [ ] 価格 = Free / 公開地域 = All regions / 公開設定 = Public
- [ ] 「送信 / Submit for review」前に「Save draft」を実行し下書き保存済
- [ ] CHANGELOG.md / package.json / manifest.json の version が **1.0.0** で揃っている

