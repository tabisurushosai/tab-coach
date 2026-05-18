# 秘書ダッシュボード登録 (T100) — 適用手順

`~/Documents/secretary_v1_0.sh` の `PROJECTS` リストに `tab-coach` を追加する。
本ファイルはエージェント権限外 (このディレクトリ外への書き込み禁止) のため、社長または秘書が手動で適用する。

## 対象ファイル

`~/Documents/secretary_v1_0.sh` の Python ヒアドキュメント内、行 37-40。

## Before (現状)

```python
PROJECTS = ("rogue-night parent-news toikake youtube-safe kosodate-bot "
            "focus-timer read-aloud-easy calm-screen task-breaker sentence-simplifier "
            "emotion-checkin anti-distraction homework-scanner schedule-visualizer "
            "reading-tracker emoji-soko").split()
```

## After (適用後)

```python
PROJECTS = ("rogue-night parent-news toikake youtube-safe kosodate-bot "
            "focus-timer read-aloud-easy calm-screen task-breaker sentence-simplifier "
            "emotion-checkin anti-distraction homework-scanner schedule-visualizer "
            "reading-tracker emoji-soko tab-coach").split()
```

差分: 末尾に ` tab-coach` を追記 (スペース区切りの文字列なので 1 トークン追加のみ)。

## 適用コマンド (社長手動実行)

```bash
# バックアップ
cp ~/Documents/secretary_v1_0.sh ~/Documents/secretary_v1_0.sh.bak_$(date +%Y%m%d_%H%M%S)

# 1行置換 (BSD sed / macOS デフォルト)
sed -i '' 's/reading-tracker emoji-soko"/reading-tracker emoji-soko tab-coach"/' ~/Documents/secretary_v1_0.sh

# 確認
grep -n "tab-coach" ~/Documents/secretary_v1_0.sh
# 期待出力例: 40:            "reading-tracker emoji-soko tab-coach").split()
```

## 適用後の確認

1. 次回の LaunchAgent 起動 (5 分以内) で `~/.supervisor/secretary_state.json` の `projects` 配列に `tab-coach` エントリが追加される。
2. 即時確認したい場合:
   ```bash
   bash ~/Documents/secretary_v1_0.sh
   python3 -c "import json; d=json.load(open('$HOME/.supervisor/secretary_state.json')); print([p['name'] for p in d['projects']])"
   ```
   出力に `tab-coach` が含まれていれば成功。

## 期待される秘書動作

- `~/Documents/tab-coach/TODO.md` の残タスク数 (`- [ ]` の行数) を 5 分毎にスナップショット。
- `release/tab-coach.zip` の存在を検知 (T091 で生成済 47159 bytes)。
- Chrome Web Store `item_map.json` に `tab-coach` の itemId が登録され次第、未申請プロジェクトの自動 upload 対象に入る (T094 の手動アップロード完了後)。

## 関連

- T094: Chrome Web Store 手動アップロード (社長 or 秘書)
- T098: GitHub Release v1.0.0 (公開済)
- T099: SNS 告知文 (Web Store URL 待ち)
