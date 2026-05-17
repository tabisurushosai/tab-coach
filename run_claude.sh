#!/bin/bash
PROJ_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJ_NAME=$(basename "$PROJ_DIR")
cd "$PROJ_DIR" || exit 1
mkdir -p logs

LOOP_COUNT=0
MAX_LOOPS=200

while [ $LOOP_COUNT -lt $MAX_LOOPS ]; do
  LOOP_COUNT=$((LOOP_COUNT + 1))
  REM=$(grep -c "^- \[ \]" TODO.md 2>/dev/null | head -1)
  REM=${REM:-0}

  if [ "$REM" -le 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$PROJ_NAME] TODO 全消化、終了" | tee -a logs/claude_$(date +%Y%m%d).log
    break
  fi

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$PROJ_NAME Loop $LOOP_COUNT] 残 $REM タスク..." | tee -a logs/claude_$(date +%Y%m%d).log

  PROMPT="あなたは $PROJ_NAME プロジェクトの完全自律開発エージェント。

【最重要原則】
- 絶対にユーザーに質問しない。全部自分で判断して実装。
- 詰まったら30秒以内にスキップ。完璧主義で止まるな。
- 迷ったら SPEC.md の方針、それでも迷ったら一般的なベストプラクティス。

【絶対禁止】
- このディレクトリ外への書き込み・削除
- rm -rf / cd .. による他ディレクトリ操作
- 外部 API 呼び出し (完全オフライン拡張)
- chrome.storage.sync の使用 (.local のみ)
- host_permissions の追加 (permissions は activeTab + tabs + storage のみ)
- 独自判断でリネーム・リファクタ
- ネットワーク経由のファイル送信

【許可】
- このディレクトリ内ファイル全部
- npm install (プロジェクトローカル)
- ローカル git commit + git push origin main
- gh コマンド (リポジトリ作成・PR・Release)

【手順】
1. SPEC.md で仕様確認
2. TODO.md の最初の '- [ ]' を1つ選ぶ
3. 実装。詰まったらスキップ可 (行末に ' [SKIP: 理由]' 追記、'[ ]' のまま残す)
4. TODO.md の該当行を '[x]' に変更
5. 'git add -A && git commit -m \"Txxx: <内容>\"' 実行
6. T001 (GitHub repo 作成タスク) の場合: 'gh repo create tabisurushosai/tab-coach --public --source=. --remote=origin --push' も実行
7. 既に remote 設定済なら 'git push origin main'
8. 1行で完了報告して終了

【技術スタック (固定)】
Manifest V3, TypeScript strict, Vite, chrome.storage.local, chrome.i18n
No external API, no personal data, ads-free, minimum permissions (activeTab + tabs + storage)

今回 1タスクのみ実装して終了。

【自走原則】
- ユーザーに質問しない
- 社長は寝てる前提
- エラー3回で諦めてスキップ"

  gtimeout 900 claude --print --dangerously-skip-permissions "$PROMPT" 2>&1 | tee -a logs/claude_$(date +%Y%m%d).log
  RC=${PIPESTATUS[0]}

  if [ "$RC" -ne 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$PROJ_NAME] Claude エラー (RC=$RC)、3分待機..." | tee -a logs/claude_$(date +%Y%m%d).log
    sleep 180
  else
    sleep 8
  fi
done
