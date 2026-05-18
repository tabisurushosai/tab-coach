# tab-coach TODO (100 tasks)

## Phase 0: 仕様確定・初期化 (T001-T010)
- [x] T001: gh repo create tabisurushosai/tab-coach --public --source=. --remote=origin --push (初回push)
- [x] T002: SPEC.md を拡充 (型詳細・データフロー Mermaid 図追加)
- [x] T003: TODO.md を確認 (100 行存在チェック、本タスクで [x])
- [x] T004: LICENSES.md (MIT、依存ライブラリのライセンス雛形)
- [x] T005: legal/PRIVACY_ja.md / PRIVACY_en.md / TERMS_ja.md / TERMS_en.md
- [x] T006: CHANGELOG.md (Keep a Changelog 準拠)
- [x] T007: .editorconfig / .prettierrc.json / .eslintrc.json
- [x] T008: docs/architecture.md (Mermaid 構成図)
- [x] T009: docs/release.md (リリース手順)
- [x] T010: .github/ISSUE_TEMPLATE/ + pull_request_template.md

## Phase 1: 基盤構築 (T011-T025)
- [x] T011: package.json (TS5.6+ + Vite5+ + @types/chrome + vitest + jsdom + eslint + prettier)
- [x] T012: tsconfig.json (strict, ES2022, paths @/*)
- [x] T013: vite.config.ts (entry: background, popup, options, content)
- [x] T014: manifest.json (Manifest V3, name __MSG__, permissions: activeTab + tabs + storage)
- [x] T015: icons/16.png / 48.png / 128.png (暫定単色文字アイコン)
- [x] T016: _locales/ja/messages.json (extension_name, extension_description のみ)
- [x] T017: _locales/en/messages.json (同上)
- [x] T018: src/lib/storage.ts (型安全 chrome.storage.local ラッパー、get/set/remove/clear)
- [x] T019: src/lib/i18n.ts (chrome.i18n.getMessage ラッパー、型安全)
- [x] T020: src/lib/logger.ts (NODE_ENV === 'development' のみ console.log)
- [x] T021: src/background/index.ts (空 service worker、onInstalled でログのみ)
- [x] T022: src/popup/index.html + src/popup/popup.ts (Hello World 表示)
- [x] T023: src/options/index.html + src/options/options.ts (Hello World 表示)
- [x] T024: build_zip.sh (release/tab-coach.zip 生成、dist/ + manifest.json + _locales + icons をパック)
- [x] T025: npm run build 成功 + bash build_zip.sh 成功確認

## Phase 2: コア機能 (T026-T055)
- [x] T026: chrome.tabs.query() で全タブ取得 (src/lib/tabs.ts)
- [x] T027: chrome.tabs.onCreated / onRemoved リスナー (background)
- [x] T028: chrome.action.setBadgeText でタブ数表示
- [x] T029: バッジ色 (灰/黄/赤、setBadgeBackgroundColor)
- [x] T030: popup でタブ一覧表示 (UL + favicon img + title)
- [x] T031: popup タブクリックで chrome.tabs.update active=true
- [x] T032: popup × ボタンで chrome.tabs.remove
- [x] T033: 未アクティブ時間計算 (Date.now() - lastAccessed)
- [x] T034: 30分以上未アクティブフィルタ
- [x] T035: 同ドメイン重複検出 (new URL(url).hostname 比較)
- [x] T036: content script で document.scrollingElement の scrollTop + window 滞在時間記録
- [x] T037: content → background へ chrome.runtime.sendMessage
- [x] T038: background で read-completion 判定 (scrollPercent ≥ 90% + 滞在 ≥ 60s) → storage 保存
- [x] T039: popup の分類タブ (未アクティブ/重複/読了)
- [x] T040: ワンクリック「整理する」ボタン (該当タブ一括 chrome.tabs.remove)
- [x] T041: アンドゥ機能 (30秒以内 chrome.tabs.create で復元)
- [x] T042: スナップショット (整理直前の TabSnapshot[] を storage)
- [x] T043: ホワイトリスト UI (options で URL パターン入力、追加・削除)
- [x] T044: ホワイトリストにマッチするタブは整理対象外
- [x] T045: カスタム閾値 (options でバッジ色境界 yellow/red 変更)
- [x] T046: カスタム閾値 (未アクティブ判定分数変更)
- [x] T047: popup の検索ボックス (タイトル/URL filter)
- [x] T048: アーカイブ機能 (close 代わりに storage 保存)
- [x] T049: options アーカイブ一覧 (タイトル/URL/日時)
- [x] T050: アーカイブから復元 (chrome.tabs.create)
- [x] T051: アーカイブのエクスポート (JSON ダウンロード)
- [x] T052: アーカイブのインポート (JSON アップロード)
- [x] T053: 月次レポート (整理回数 + 推定節約時間)
- [x] T054: レポートを options に表示 (Canvas 自前描画、Chart.js は使わない)
- [x] T055: タブグループ自動化 (chrome.tabGroups で同ドメインまとめ、Premium 想定)

## Phase 3: 国際化・アクセシビリティ (T056-T070)
- [x] T056: _locales/ja/messages.json 完全版 (全 UI 文字列)
- [x] T057: _locales/en/messages.json 完全版
- [x] T058: popup の全文字列を chrome.i18n.getMessage に置換
- [x] T059: options の全文字列を i18n 化
- [x] T060: manifest.json name/description を __MSG_*__ 形式
- [x] T061: ダークモード自動 (prefers-color-scheme)
- [x] T062: ダークモード手動切替 (options で固定可)
- [x] T063: ARIA: popup UL に role="list"、LI に role="listitem"
- [x] T064: ARIA: ボタンに aria-label
- [x] T065: ARIA: aria-live="polite" (フィルタ済リスト)
- [x] T066: フォントサイズ調整 (options スライダー、CSS variable)
- [x] T067: ハイコントラストモード
- [x] T068: キーボードショートカット定義 (manifest commands)
- [x] T069: Ctrl+Shift+T で popup
- [x] T070: Ctrl+Shift+R で整理実行

## Phase 4: テスト・品質 (T071-T080)
- [x] T071: vitest セットアップ (jsdom 環境、vitest.config.ts)
- [x] T072: tests/storage.test.ts (chrome.storage モック)
- [x] T073: tests/i18n.test.ts (chrome.i18n モック)
- [x] T074: tests/tabs.test.ts (分類ロジック)
- [x] T075: tests/whitelist.test.ts (パターンマッチ)
- [x] T076: tests/archive.test.ts (保存・復元)
- [x] T077: tests/snapshot.test.ts (アンドゥ用)
- [ ] T078: tests/performance.test.ts (100タブ整理1秒以内)
- [ ] T079: メモリリークチェック (service worker grow up 監視)
- [ ] T080: ESLint + Prettier + tsc --noEmit 0 エラー

## Phase 5: 法務・公開準備 (T081-T090)
- [ ] T081: legal/PRIVACY_ja.md 充実 (収集データなし、外部送信なし明記)
- [ ] T082: legal/PRIVACY_en.md 充実
- [ ] T083: legal/TERMS_ja.md (利用規約、免責)
- [ ] T084: legal/TERMS_en.md
- [ ] T085: LICENSES.md (依存ライブラリ全列挙、license-checker 等で生成)
- [ ] T086: assets/screenshots/01_popup.png / 02_options.png / 03_badge_warning.png (1280x800)
- [ ] T087: assets/promo_small.png (440x280)
- [ ] T088: assets/promo_marquee.png (1400x560、任意)
- [ ] T089: docs/store_listing_ja.md / store_listing_en.md (説明文 132字 + 詳細)
- [ ] T090: docs/store_listing.md にカテゴリ Productivity + タグ確定

## Phase 6: リリース (T091-T100)
- [ ] T091: build_zip.sh で release/tab-coach.zip 自動生成確認
- [ ] T092: package.json + manifest.json のバージョンを 1.0.0 に
- [ ] T093: CHANGELOG.md に v1.0.0 リリース内容
- [ ] T094: chrome_publish.sh tab-coach upload で Web Store アップロード (社長手動 or 秘書経由)
- [ ] T095: docs/store_listing.md に Web UI 設定手順を完備
- [ ] T096: docs/privacy_tab.md (プライバシータブ設定: 3つチェック等)
- [ ] T097: 販売地域・審査送信の docs/release_final.md
- [ ] T098: GitHub Release v1.0.0 作成 (gh release create)
- [ ] T099: SNS_ANNOUNCE.md (X 告知文 200字 + emoji)
- [ ] T100: 秘書ダッシュボード登録 (~/Documents/secretary_v1_0.sh の projects に tab-coach 追加)
