# tab-coach — Chrome Web Store 販売地域・審査送信 SSOT

本書は Chrome Web Store Developer Console の **「Pricing and distribution / 価格と販売地域」タブ** および **「Submit for review / 審査送信」アクション** に関わる全項目を確定するための Single Source of Truth (SSOT) です。Web UI 操作の上位手順は `docs/store_listing.md` §5.5 / §5.6、プライバシー関連設定は `docs/privacy_tab.md` (T096)、ストア掲載文は `docs/store_listing_ja.md` / `docs/store_listing_en.md`。本書を更新したら関連ファイルへ必ず追従させること。

> Console URL: `https://chrome.google.com/webstore/devconsole/`
> 対象バージョン: v1.0.0
> 最終更新日: 2026-05-18
> 対象 ZIP: `release/tab-coach.zip` (T091 で 47159 bytes 生成済)

---

## 1. 価格 (Pricing)

| Console フィールド | 値 | 根拠 |
| --- | --- | --- |
| 価格モデル | **Free (無料)** | v1.0.0 時点で課金機能・Premium 機能・サブスクリプションいずれも未実装。 |
| アプリ内課金 (In-app purchases) | **なし (None)** | `chrome.payments` 系 API 未使用。 |
| 広告 (Ads) | **なし (None)** | 広告ネットワーク SDK 不採用。`docs/store_listing.md` §2.1/§2.2 のキーワード「広告なし / ad-free」と整合。 |
| 寄付リンク (Donation links) | **なし** | v1.0.0 では設置しない。 |
| 価格変更予定 | なし | v2 以降で Premium 検討時に本書を更新する。 |

### 課金導入時の追記方針 (将来用ガイド)

将来 Premium プランを導入する場合は、本書 §1 に「課金導入バージョン」を追記したうえで、`docs/store_listing.md` §2.3 不採用キーワード一覧から `課金 / premium / paid` を解禁し、`docs/privacy_tab.md` §4.1 の「金融・支払情報」行を再評価する。

---

## 2. 公開地域 (Distribution regions)

### 2.1 既定方針

| Console フィールド | 値 |
| --- | --- |
| 公開地域 | **All regions (すべての地域)** |
| 対応言語 | 日本語 (ja) / 英語 (en) |
| 既定言語 | 日本語 (`manifest.json` の `default_locale` と整合) |
| 公開設定 (Visibility) | **Public (一般公開)** |
| 限定公開 (Unlisted) | 採用しない |
| プライベート (Private) | 採用しない |
| 公開時期 | **手動 (送信ボタン押下時に審査開始 → 通過後即時公開)** |
| 公開のスケジュール (Publish on a schedule) | 採用しない |
| 年齢制限 / レーティング | **なし (一般向け)** |

### 2.2 「All regions」を選ぶ理由

- 拡張機能は完全オフラインで動作し、地域固有の法規制 (例: 暗号資産、ギャンブル、特定国の輸出規制対象技術) に該当しない。
- 取り扱うデータが Web ブラウザのタブメタ情報 (URL/タイトル/最終アクセス時刻) のみで、いずれの国・地域でも個人情報保護法の規制対象外。
- 日英以外の言語ロケールでは `default_locale: ja` が使用されるが、UI 文字列は最小限のため英語話者でも視認可能。
- 一部地域を除外すると逆に審査側から「除外理由は何か」と確認される可能性があり、説明コストが増す。

### 2.3 除外検討候補 (現時点で除外しない)

| 候補地域 | 検討結果 |
| --- | --- |
| 中国本土 | Chrome Web Store 自体が中国本土でアクセス不可なので、Console 上で個別除外する必要なし。 |
| 北朝鮮 / シリア / イラン / クリミア / 等 (米国 OFAC 制裁国) | Google 側で自動的に配信制限されるため、Console での個別除外不要。 |
| EU (GDPR 対象) | データ収集なし (`docs/privacy_tab.md` §4.1) のため対象外。除外不要。 |

---

## 3. アイテム情報の最終確認 (Pre-submit verification)

### 3.1 必須タブの完了状態

| タブ | 完了条件 | 参照 SSOT |
| --- | --- | --- |
| Package | `release/tab-coach.zip` (v1.0.0) アップロード済 | `build_zip.sh` (T091) / `docs/store_listing.md` §5.2 |
| Store listing | 商品名・概要・詳細・カテゴリ・アイコン・スクリーンショット・プロモタイル入力済 | `docs/store_listing.md` §5.3 / `store_listing_{ja,en}.md` |
| Privacy practices | 単一用途・権限正当化・データ取り扱い・必須証明・ポリシー URL 入力済 | `docs/privacy_tab.md` |
| Pricing and distribution | §1 / §2 の値で設定済 | **本書** |

各タブが Console 上で「Complete (緑チェック)」になっていることを必ず目視確認する。1 つでも黄色 / 赤の警告があれば「Submit」ボタンが活性化しないため、戻って修正する。

### 3.2 ZIP・アセット最終チェック

```bash
# サイズ
ls -la release/tab-coach.zip
# 期待値: ~47159 bytes (T091 で生成済の値とほぼ一致)

# sourcemap が含まれていないこと
unzip -l release/tab-coach.zip | grep -c '\.map$'
# 期待値: 0

# manifest version が 1.0.0 で揃っていること
unzip -p release/tab-coach.zip manifest.json | grep '"version"'
# 期待値: "version": "1.0.0",
```

### 3.3 プライバシーポリシー URL の生存確認

```bash
curl -I https://github.com/tabisurushosai/tab-coach/blob/main/legal/PRIVACY_ja.md
curl -I https://github.com/tabisurushosai/tab-coach/blob/main/legal/PRIVACY_en.md
# 両方とも HTTP/2 200 が返ること
```

---

## 4. 審査送信 (Submit for review)

### 4.1 送信操作

1. Developer Console で対象アイテム (`tab-coach`) を開く。
2. 全タブが Complete 状態であることを確認 (本書 §3.1)。
3. 画面右上の「**Submit for review / 審査のために送信**」ボタンを押下。
4. 確認ダイアログで以下を再確認:
   - バージョン: `1.0.0`
   - カテゴリ: `Productivity`
   - 公開地域: `All regions`
   - 価格: `Free`
   - 公開設定: `Public`
5. 「Submit」を押下し、ステータスが「**Pending review / 審査待ち**」へ遷移したことを確認。
6. Developer Console の「Status」列を 1 営業日に 1 回チェックする (通常 1〜3 営業日)。

### 4.2 送信後の状態遷移

| Console ステータス | 意味 | 想定所要 |
| --- | --- | --- |
| Pending review / 審査待ち | キュー投入済 | 数時間〜1 営業日 |
| In review / 審査中 | Google 審査担当が確認中 | 1〜3 営業日 |
| Published / 公開済 | 一般公開済 (chrome.google.com/webstore/detail/<itemId> でアクセス可) | — |
| Rejected / リジェクト | 差戻し。理由メールが届く | `docs/privacy_tab.md` §10 を参照して修正 → 再送信 |
| Pending update review | 更新版の審査中 | v1.0.1 以降の更新時のみ |

### 4.3 審査通過メール受領後の即時タスク

1. Console で公開済 URL (`https://chrome.google.com/webstore/detail/<itemId>`) を取得し、本書 §6 リリースログに追記。
2. `README.md` の「Install」セクションへ Web Store URL を追記。
3. GitHub Release v1.0.0 (T098) のリリースノート末尾へ Web Store URL を追記。
4. SNS 告知 (T099) の本文に Web Store URL を埋め込み、投稿を実行。
5. 秘書ダッシュボード登録 (T100) を `tab-coach: live` として確定。

---

## 5. リジェクト時の対応 (Rejection handling)

`docs/privacy_tab.md` §10 と重複しない、**販売地域 / 価格 / 送信フロー** に固有のリジェクト理由のみを記載する。プライバシー慣行関連のリジェクトは `docs/privacy_tab.md` §10 を一次参照とする。

| リジェクト分類 | 想定理由 | 対応 |
| --- | --- | --- |
| Pricing mismatch | 課金 API 未使用なのに「In-app purchases = Yes」を選択した等 | 本書 §1 の表に照らして再設定し再送信 |
| Distribution mismatch | 地域を限定したが理由を明示していない | All regions に戻す or 除外理由 (法規制等) を Console コメント欄に記入 |
| Visibility mismatch | Public 申請なのに manifest が `key` を含む等 | `manifest.json` を確認し、不要な `key` フィールドを削除して `bash build_zip.sh` で再生成 |
| Metadata duplication | 商品名 / 概要が既存アイテムと類似 | `store_listing_*.md` で差別化文言を追記し、`docs/store_listing.md` §2.3 不採用キーワードを確認 |
| Version downgrade | ZIP の version が既公開版と同一または以下 | `package.json` / `manifest.json` の version を `npm version patch` 等で繰り上げて再 zip |

---

## 6. リリースログ (Release log)

公開後に本表へ実績を追記する。送信前は空欄で構わない。

| バージョン | 送信日時 (JST) | 公開日時 (JST) | itemId | Web Store URL | 備考 |
| --- | --- | --- | --- | --- | --- |
| 1.0.0 |  |  |  |  | 初回公開。本書 §1〜§5 の手順で送信。 |

> `itemId` は Console 上の URL `https://chrome.google.com/webstore/devconsole/<account>/<itemId>/edit/listing` から取得する。Web Store URL は `https://chrome.google.com/webstore/detail/<itemId>` 形式。

---

## 7. 整合性チェック (Cross-file consistency)

本書を更新したら、以下のファイルの該当箇所を必ず追従させること。

| ファイル | 該当セクション |
| --- | --- |
| `docs/store_listing.md` | §5.5 Pricing and distribution / §5.6 Submit for review / §5.7 公開後 |
| `docs/privacy_tab.md` | §10 リジェクト時の差戻し対応 (差戻し対応の一次参照) |
| `docs/release.md` | §7 Chrome Web Store アップロード / §8 リリース後 / チェックリスト |
| `README.md` | Install セクション (公開後にストア URL 追記) |
| `CHANGELOG.md` | v1.0.0 リリース日 (本書 §6 の公開日時と一致) |
| `package.json` / `manifest.json` | `version` (送信時 1.0.0、以降は同期更新) |

---

## 8. 送信前チェックリスト (Pricing & distribution + Submit)

- [ ] §1 価格 = Free / In-app purchases = None / Ads = None
- [ ] §2.1 公開地域 = All regions
- [ ] §2.1 公開設定 = Public / 公開時期 = 手動
- [ ] §2.1 対応言語 = ja + en、既定言語 = ja
- [ ] §3.1 全 4 タブ (Package / Store listing / Privacy practices / Pricing and distribution) が Complete (緑チェック)
- [ ] §3.2 `release/tab-coach.zip` がバージョン 1.0.0 で sourcemap 不含
- [ ] §3.3 プライバシーポリシー URL (日英両方) が HTTP 200 を返す
- [ ] `docs/privacy_tab.md` §9 のチェックリスト全項目クリア
- [ ] `docs/store_listing.md` §6 のチェックリスト全項目クリア
- [ ] §4.1 の手順で Submit ボタンを押下し、ステータスが Pending review に遷移
- [ ] §6 リリースログのバージョン行が用意されている (公開後に実績を追記する欄)

---

## 9. 送信後チェックリスト (Post-submit)

- [ ] Console の Status を 1 日 1 回確認 (Pending review → In review → Published)
- [ ] リジェクト通知メールが届いた場合、本書 §5 / `docs/privacy_tab.md` §10 を参照して修正
- [ ] 公開済になったら §4.3 の 5 ステップを当日中に完了
- [ ] §6 リリースログに送信日時 / 公開日時 / itemId / Web Store URL を追記
- [ ] T098 GitHub Release / T099 SNS 告知 / T100 秘書ダッシュボード登録 へ進む
