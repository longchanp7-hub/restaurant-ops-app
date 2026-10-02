# AIを使わない日次運用

公開先: https://longchanp7-hub.github.io/restaurant-ops-app/

日次は毎日05:41 JST頃に `.github/workflows/daily-health.yml` を実行します。GitHub側の都合で開始が遅れることがあります。Nodeの既存33テストと公開ページ/manifestを検査し、失敗はActionsの失敗として残します。個人の売上・従業員・顧客データはブラウザー内だけにあり、GitHubへ送りません。AI、Codex、Work、有料APIを日次処理から呼びません。

- 公開URL・検査項目: `operations.json`
- 検査ロジック: `scripts/ops-health.mjs`（各URL最大3回、各12秒）
- 定期時刻: `.github/workflows/daily-health.yml` のschedule（UTC）
- 原価計算などのアプリ機能: `ops-model.js` / `ops-ui.js`

変更の依頼は、通常のチャットで「店舗運営アプリの○○を△△に変更。既存データを保ち、検証して公開」と伝えれば対象が分かります。変更作業にAIを使う場合はその作業時の枠を使いますが、日々の定期検査はAIの起動に依存しません。

未知の不具合や外部サービス停止は自動修復せず、Actionsのログを確認して修正します。Actions画面のRun workflowで手動再検査できます。停止・再開は該当workflowのDisable/Enableを使います。既存のChatGPT定期タスクの有無・稼働状態は別途確認が必要です（会話履歴だけでは有効スケジュールとは判断しません）。

公開リポジトリの標準Ubuntu runnerを使用します。課金API・larger runner・有料枠への切替はありません。日次ログはActions summaryだけで、新しい日次artifactを蓄積しません。GitHubの現行条件: https://docs.github.com/en/billing/concepts/product-billing/github-actions
