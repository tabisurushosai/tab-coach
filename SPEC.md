# tab-coach SPEC

## ゴール
タブ過多を可視化 + ワンクリック整理 + 完全オフライン

## 機能一覧
1. タブ数バッジ表示 (灰<10, 黄10-19, 赤20+、閾値カスタム可)
2. 30分以上未アクティブなタブ検出 (lastAccessed 基準)
3. 同ドメイン重複タブ検出 (hostname 一致)
4. 読了タブ検出 (content script で scroll 90% + 1分滞在)
5. ワンクリック整理 (該当タブ一括 close)
6. 30秒以内アンドゥ (storage に閉じる前スナップショット)
7. ホワイトリスト (URL パターンマッチで整理対象外)
8. カスタム閾値 (バッジ色境界 + 未アクティブ判定時間)
9. アーカイブ機能 (close 代わりに storage 保存、後で復元可)
10. 月次レポート (整理回数・節約時間推定)

## 技術スタック (固定)
- Manifest V3
- TypeScript strict
- Vite
- chrome.storage.local (sync は使わない)
- chrome.i18n (ja/en)
- vitest + jsdom

## 命名規則
- ファイル: kebab-case
- 関数: camelCase
- 型: PascalCase
- 定数: SCREAMING_SNAKE

## 型設計
- TabSnapshot = { id: number; url: string; title: string; lastAccessed: number }
- WhitelistEntry = { pattern: string; createdAt: number }
- Settings = { tabLimitYellow: number; tabLimitRed: number; inactiveMinutes: number; darkMode: 'auto'|'light'|'dark' }

## ディレクトリ構成
- src/background/ (service worker)
- src/popup/ (popup HTML + TS)
- src/options/ (options HTML + TS)
- src/content/ (content script)
- src/lib/ (storage, i18n, logger, tabs, whitelist)
- src/types/ (共通型)
- _locales/ja/ , _locales/en/
- icons/
- tests/
- docs/
- legal/

## 触ってはいけない
- 外部 API 呼び出し一切なし (完全オフライン)
- host_permissions なし
- permissions は activeTab + tabs + storage のみ
- chrome.storage.sync 禁止 (.local のみ)
- 独自判断で技術スタック変更禁止

## 完了条件 (Phase 6 完了時)
- npm run build OK (vite)
- npm run lint OK (tsc --noEmit + eslint)
- npm run test OK (vitest)
- release/tab-coach.zip 生成済
- Chrome Web Store に申請済 (Pending review or Published)

## 禁止事項
- 仕様の勝手な追加・変更
- ライブラリの勝手な追加 (devDependencies 以外)
- リファクタの暴走
- 「とりあえず動く版、後で直す」発想
