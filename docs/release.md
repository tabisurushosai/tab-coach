# tab-coach リリース手順

本書は tab-coach を Chrome Web Store および GitHub Release で公開する際の標準手順を定める。

## 前提

- Node.js 20+ / npm 10+
- `gh` CLI (GitHub 認証済)
- Chrome Web Store Developer 登録済アカウント
- リポジトリ: `tabisurushosai/tab-coach`
- リリースブランチ: `main`

## 1. バージョン更新

`package.json` と `manifest.json` の `version` を Semantic Versioning に従って同期させる。

- MAJOR: 互換性のない変更 (StorageSchema 破壊的変更等)
- MINOR: 機能追加 (後方互換)
- PATCH: バグ修正のみ

```bash
# 例: 1.0.0 → 1.0.1
npm version patch --no-git-tag-version
# manifest.json も手動で同じ値に更新
```

## 2. CHANGELOG 更新

`CHANGELOG.md` の `[Unreleased]` セクションを当該バージョンに昇格させ、リリース日 (YYYY-MM-DD) を付記する。

```markdown
## [1.0.1] - 2026-05-17
### Fixed
- バッジ更新時のレース条件を修正
```

## 3. ローカル検証

```bash
npm ci
npm run lint        # tsc --noEmit + eslint
npm run test        # vitest
npm run build       # vite build → dist/
bash build_zip.sh   # release/tab-coach.zip 生成
```

全て 0 エラーで通ること。

## 4. 手動動作確認

`chrome://extensions/` → デベロッパーモード ON → 「パッケージ化されていない拡張機能を読み込む」で `dist/` を読み込み、以下を確認:

- [ ] バッジ表示 (タブ数に応じて灰/黄/赤)
- [ ] popup: 全タブ一覧 / 分類タブ (未アクティブ/重複/読了)
- [ ] ワンクリック整理 + 30秒アンドゥ
- [ ] options: ホワイトリスト追加・削除
- [ ] options: 閾値変更が即反映
- [ ] ja/en 切替 (Chrome 言語設定変更で UI 言語が追従)
- [ ] ダークモード自動 / 手動切替

## 5. Git tag & push

```bash
git add -A
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

## 6. GitHub Release 作成

```bash
gh release create v1.0.1 \
  --title "v1.0.1" \
  --notes-file CHANGELOG.md \
  release/tab-coach.zip
```

CHANGELOG から該当バージョンの抜粋を `--notes` に貼り直すのが望ましい。

## 7. Chrome Web Store アップロード

1. https://chrome.google.com/webstore/devconsole にログイン
2. tab-coach のアイテムを開く
3. 「パッケージ」→「新しいパッケージをアップロード」で `release/tab-coach.zip` を選択
4. ストア掲載情報 (説明・スクリーンショット・カテゴリ) を確認
5. プライバシータブで以下にチェック:
   - 単一用途: タブ整理
   - permissions の根拠 (tabs/storage) を記入
   - リモートコードを使用しない
   - 個人情報を扱わない
6. 「審査のために送信」

審査は通常 1-3 営業日。`docs/release_final.md` (T097) も参照。

## 8. リリース後

- `CHANGELOG.md` に新規 `[Unreleased]` 見出しを追加
- 重大不具合発覚時は Web Store コンソールから即時アンパブリッシュ可能
- `docs/store_listing_ja.md` / `store_listing_en.md` を必要に応じて更新

## ロールバック

Chrome Web Store は旧バージョンへの巻き戻しに「前回パッケージ再アップロード」が必要。`release/` ディレクトリには直近 3 バージョンの zip を保管しておく。

## チェックリスト (まとめ)

- [ ] version 同期 (package.json / manifest.json)
- [ ] CHANGELOG 更新
- [ ] lint / test / build / zip 全通過
- [ ] 手動動作確認 完了
- [ ] git tag + push
- [ ] gh release create
- [ ] Chrome Web Store アップロード + 審査送信
