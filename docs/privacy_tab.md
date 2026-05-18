# tab-coach — Chrome Web Store「プライバシー慣行 (Privacy practices)」タブ 設定 SSOT

本書は Chrome Web Store Developer Console の **「プライバシー慣行 / Privacy practices」タブ** に入力する全項目を確定するための Single Source of Truth (SSOT) です。Web UI 操作の遷移手順は `docs/store_listing.md` §5.4、ストア掲載文の整合は `docs/store_listing_ja.md` / `docs/store_listing_en.md`、原典は `legal/PRIVACY_ja.md` / `legal/PRIVACY_en.md`。本書の内容を更新したら、上記関連ファイルへ必ず追従させること。

> Console URL: `https://chrome.google.com/webstore/devconsole/`
> 対象バージョン: v1.0.0
> 最終更新日: 2026-05-18

---

## 1. 単一用途宣言 (Single purpose)

Developer Console の「単一用途」フィールドへ、以下を **日英 1 行ずつ** または英文 1 行のみを貼り付ける。`docs/store_listing.md` §1 「単一用途宣言」と **完全一致** させること。

```
Tab management — visualise open-tab pressure and tidy tabs in one click.
タブ管理 — タブの開きすぎを可視化し、ワンクリックで整理する。
```

### 補足説明 (Console「Justification」欄に貼付可)

```
tab-coach は「ブラウザの開きすぎたタブを可視化し、利用者の意思でまとめて整理する」ことを単一用途とします。ニュースリーダー、検索、認証、課金、SNS、ファイルマネージャ、AI チャット等の他用途は提供しません。整理・アーカイブ・ホワイトリスト・月次レポート等の機能はすべて、この単一用途を実現するための補助機能です。
```

```
tab-coach has a single purpose: to surface open-tab pressure and let the user tidy tabs in one click. It does not offer secondary purposes such as news reading, search, authentication, payments, social networking, file management, or AI chat. Sorting, archive, whitelist, and monthly reports all exist solely to serve this single purpose.
```

---

## 2. 権限の正当化 (Permission justification)

Console は `manifest.json` で宣言した権限ごとに個別の理由欄を表示する。本拡張機能は `permissions: ["activeTab", "tabs", "storage"]` の 3 権限のみを要求し、`host_permissions` は要求しない。各欄に以下のテキストを **完全一致** で貼り付ける (日英いずれも記入)。

### 2.1 `activeTab`

| 言語 | 貼り付けテキスト |
| --- | --- |
| ja | 利用者がツールバーアイコン押下・ショートカット (Ctrl/Cmd+Shift+T) 押下時に、現在アクティブなタブの URL / タイトルを取得し、整理 / アーカイブ対象として表示するために使用します。バックグラウンドで他のタブの内容を読み取る用途では使用しません。 |
| en | Used to read the URL and title of the currently active tab when the user clicks the toolbar icon or presses the shortcut (Ctrl/Cmd+Shift+T), so the tab can be shown as a cleanup/archive candidate. Never used to silently inspect other tabs in the background. |

### 2.2 `tabs`

| 言語 | 貼り付けテキスト |
| --- | --- |
| ja | タブ数バッジ (灰 / 黄 / 赤) の算出、「未アクティブ」「重複」「読了」カテゴリ分類、整理・アンドゥ・アーカイブ実行のために、開いているタブの ID / URL / タイトル / 最終アクティブ時刻を取得します。取得した情報は端末ローカル (`chrome.storage.local`) でのみ使用し、外部送信しません。 |
| en | Used to compute the tab-count badge (grey / yellow / red), to classify tabs into "Inactive" / "Duplicates" / "Read", and to perform cleanup, undo, and archive operations. Reads tab ID / URL / title / last-active time only. The data stays in `chrome.storage.local` and is never transmitted externally. |

### 2.3 `storage`

| 言語 | 貼り付けテキスト |
| --- | --- |
| ja | ユーザー設定 (バッジ閾値・未アクティブ判定分数・ダークモード等)、ホワイトリスト、アーカイブ済タブ、整理履歴、アンドゥ用スナップショット、読了判定キャッシュを `chrome.storage.local` にのみ保存するために使用します。`chrome.storage.sync` (クラウド同期) は使用せず、端末から外には出ません。 |
| en | Used to persist user preferences (badge thresholds, inactivity minutes, dark mode, etc.), whitelist entries, archived tabs, cleanup history, undo snapshots, and read-state cache to `chrome.storage.local` only. `chrome.storage.sync` (cloud sync) is not used; data never leaves the device. |

### 2.4 `host_permissions`

**要求しない (Not requested)**。Console の `host_permissions` 欄には何も表示されないため、追加入力不要。仮に審査側から「`content_scripts.matches: ["<all_urls>"]` の正当化」を求められた場合は §3.1 の説明文を流用すること。

---

## 3. content script の挙動 (Content scripts disclosure)

Console に専用フィールドはないが、`matches: ["<all_urls>"]` を宣言しているため、Console コメント欄もしくは審査返信時に以下を提示できるよう SSOT として明文化する。

### 3.1 `<all_urls>` への注入理由

| 言語 | 貼り付けテキスト |
| --- | --- |
| ja | 読了判定機能 (読み終わったタブを「読了」カテゴリに自動分類) のため、`document_idle` で軽量 content script を全 URL に注入します。本 script が取得・送信する情報はスクロール率 (数値) と滞在時間 (秒) の 2 つのみで、ページ本文・フォーム入力・パスワード・Cookie・DOM 構造は **一切取得しません**。URL は content script 自身は送信せず、background 側で `chrome.tabs.get` から取得します。 |
| en | A lightweight content script is injected on `<all_urls>` at `document_idle` to support the "Read" auto-classification feature. The script collects only two numbers — scroll ratio and dwell time in seconds — and sends them via `chrome.runtime.sendMessage`. Page body, form input, passwords, cookies, and DOM structure are **never accessed**. The script itself does not transmit URLs; the background page derives them from `chrome.tabs.get`. |

---

## 4. データ取り扱い (Data usage disclosures)

Console の「収集または使用されるユーザーデータ」セクションは大きく 2 層で構成される: **(A) データタイプ別の Collect/Use 申告**、**(B) 3 つの必須証明 (Certification)**。

### 4.1 データタイプ別申告 (Collect / Use checkbox matrix)

本拡張機能は **どのデータタイプも収集しない (Collect = No / Use = No)**。Console の各データタイプ行で「該当なし / None」を選択する。具体的な対象一覧と判定理由は以下:

| Console データタイプ | 申告 | 判定理由 |
| --- | --- | --- |
| 個人を特定できる情報 (Personally identifiable information: 氏名・住所・電話・メール・年齢・身分証等) | 収集しない | 取得経路が存在しない。 |
| ヘルス情報 (Health information) | 収集しない | 同上。 |
| 金融・支払情報 (Financial and payment information) | 収集しない | 課金機能なし。 |
| 認証情報 (Authentication information: パスワード・PIN・トークン等) | 収集しない | アカウント機能なし。`document.forms` の読み取り無し。 |
| 個人通信 (Personal communications: メール本文・チャット・SNS DM 等) | 収集しない | content script が DOM を読み取らない。 |
| 位置情報 (Location) | 収集しない | `geolocation` 権限を要求しない。 |
| ウェブ履歴 (Web history) | 収集しない | `history` 権限を要求しない。整理履歴は件数のみで URL を保持しない。 |
| ユーザー作成コンテンツ (User activity / posts / photos) | 収集しない | 取得経路なし。 |
| ウェブサイトコンテンツ (Website content: テキスト・画像・音声・動画・スクロール率・滞在時間等) | **使用する (Use のみ ON、Collect は OFF)** | 読了判定用にスクロール率 (数値) と滞在時間 (秒) のみを **端末内で使用** し、収集 (外部送信・保存) はしない。Console が「使用するが収集しない」を分けて回答できる場合はそちらを選択。分離できない場合は「収集しない」を選択し、本書 §3.1 を Permission justification 欄に補足転記する。 |

> Console UI は不定期に更新されるため、項目名が本書と異なる場合は最新の Console 表示を優先し、本書を追従更新すること。

### 4.2 3 つの必須証明 (Certification)

Console は以下の 3 文の宣誓に対して **全てチェック ON** を要求する (要求順は Console の表示順に依存)。本拡張機能は 3 条件すべてを満たすため、すべて **チェック ON**。チェックを外す場合は審査リジェクト対象。

| # | 宣誓文 (Console 表示) | 本拡張機能の状態 | チェック |
| --- | --- | --- | --- |
| 1 | 承認されたユースケース以外でユーザーデータを使用または転送しない (I do not sell or transfer user data to third parties, outside of the approved use cases.) | 第三者への販売・転送なし。広告ネットワーク・解析 SDK 一切不採用。 | ✅ ON |
| 2 | アイテムの単一用途と関係のない目的でユーザーデータを使用または転送しない (I do not use or transfer user data for purposes that are unrelated to my item's single purpose.) | 単一用途 (タブ整理) 以外の機能なし。 | ✅ ON |
| 3 | ユーザーデータを使用または転送して、信用力の判定または融資目的に利用しない (I do not use or transfer user data to determine creditworthiness or for lending purposes.) | 与信・融資・スコアリング目的の処理なし。 | ✅ ON |

### 4.3 アカウント機能・ログイン (Account / Sign-in)

| Console フィールド | 値 |
| --- | --- |
| アカウント機能の有無 | **なし (None)** |
| サードパーティ認証 (OAuth 等) | 使用しない |
| サインインリンク URL | 入力不要 |

---

## 5. リモートコード (Remote code)

| Console フィールド | 値 | 根拠 |
| --- | --- | --- |
| リモートコードを使用するか | **使用しない (No)** | バンドルは Vite で静的ビルドし、`dist/` 配下の JS のみで動作。`eval` / `new Function()` / 動的 `<script>` 挿入・`fetch` で取得した JS の実行は一切なし。CSP (`script-src 'self'`) を厳格に遵守。 |

### 補足 (審査側からの追加質問対応用テンプレート)

```
The extension bundles all JavaScript at build time via Vite and ships it in dist/. It does not execute any remotely fetched code. There is no eval(), no new Function(), no dynamic <script> injection, and no JS fetched at runtime. CSP is strictly 'script-src self'.
```

---

## 6. プライバシーポリシー URL (Privacy policy URL)

Console の「プライバシーポリシー URL」フィールドは v1.0.0 リリース時点で必須。日本語版を既定とし、英語ストアロケールでは英語版 URL を併記する。

| 言語 | 値 |
| --- | --- |
| 既定 (Default / Console URL 欄) | `https://github.com/tabisurushosai/tab-coach/blob/main/legal/PRIVACY_ja.md` |
| English ロケール | `https://github.com/tabisurushosai/tab-coach/blob/main/legal/PRIVACY_en.md` |

URL が HTTP 200 を返すこと、`Content-Type: text/html` または `text/plain` として閲覧可能であることを送信前に確認。GitHub の blob ページは Markdown レンダリング済で要件を満たす。

---

## 7. 連絡先 (Contact email)

Developer Console の必須項目。tabisurushosai 名義のデベロッパー登録メールを使用する (公開ストア画面には表示されない)。本書では実メールは記載せず、登録時に Console 上で入力する。

---

## 8. 整合性チェック (Cross-file consistency)

本書を更新したら、以下のファイルの該当箇所を必ず追従させること。

| ファイル | 該当セクション |
| --- | --- |
| `docs/store_listing.md` | §1 単一用途宣言、§5.4 Privacy practices タブ手順 |
| `docs/store_listing_ja.md` | プライバシーセクション |
| `docs/store_listing_en.md` | Privacy section |
| `legal/PRIVACY_ja.md` | §1 基本方針、§4 拡張機能の権限、§5 content script の挙動 |
| `legal/PRIVACY_en.md` | §1 Principles, §4 Permissions, §5 Content script behaviour |
| `manifest.json` | `permissions` (3 件以上に増えていないこと)、`host_permissions` (未宣言であること) |
| `_locales/ja/messages.json` | `extension_description` |
| `_locales/en/messages.json` | `extension_description` |

---

## 9. 送信前チェックリスト (Privacy practices tab only)

- [ ] §1 単一用途宣言 を Console フィールドへ貼付 (日英完全一致)
- [ ] §2.1 `activeTab` 正当化文を貼付 (日英)
- [ ] §2.2 `tabs` 正当化文を貼付 (日英)
- [ ] §2.3 `storage` 正当化文を貼付 (日英)
- [ ] §2.4 `host_permissions` が未要求であることを Console 上で確認 (該当欄が表示されない)
- [ ] §4.1 全データタイプを「収集しない (None)」で申告
- [ ] §4.2 必須証明 3 つすべて ✅ ON
- [ ] §4.3 アカウント機能 = なし
- [ ] §5 リモートコード = 使用しない (No)
- [ ] §6 プライバシーポリシー URL が HTTP 200 で取得可能 (`curl -I` で確認)
- [ ] §7 連絡先メールが Developer Console に登録済
- [ ] `docs/store_listing.md` §1 と本書 §1 の単一用途宣言が完全一致
- [ ] `manifest.json` の `permissions` が `["activeTab", "tabs", "storage"]` のままで、`host_permissions` が未宣言
- [ ] `legal/PRIVACY_*.md` の内容と本書に矛盾がない

---

## 10. リジェクト時の差戻し対応 (Rejection playbook)

| よくあるリジェクト理由 | 確認・対応 |
| --- | --- |
| Limited Use 違反 (用途外利用の疑い) | §1 単一用途宣言と §4.2 #2 のチェック状態を再確認。`docs/store_listing_*.md` の詳細説明に単一用途と無関係な機能 (例: AI / 同期 / 課金) が紛れ込んでいないか確認。 |
| Permission の正当化不足 | §2 の各正当化文をそのまま貼付。文字数不足や省略形は不可、本書の文をフルで使う。 |
| `host_permissions` の理由要求 | `host_permissions` は要求していない旨を回答。`<all_urls>` は `content_scripts.matches` のみで宣言しているため、§3.1 を提示。 |
| プライバシーポリシー URL が 404 / リダイレクト | `legal/PRIVACY_*.md` の GitHub blob URL を再確認し、`curl -I` で 200 を確認した URL を再入力。`raw.githubusercontent.com` への切替も可。 |
| データ取り扱い宣告と manifest の不一致 | `manifest.json` の `permissions` 差分を `git diff main -- manifest.json` で確認。新規権限追加時は §2 / §4 を更新後に再送信。 |

修正後は `bash build_zip.sh` で zip を再生成し、`docs/store_listing.md` §5.7 → §5.8 の手順で再アップロード・再送信する。
