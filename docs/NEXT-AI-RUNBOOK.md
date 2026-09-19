# 次のAI用 作業手順書

対象：`longchanp7-hub/restaurant-ops-app`。記録：2026-09-20 02:49 JST。


## 現在の更新状態

- 状態ロジックのテストは新構造へ更新済みで、ローカル実行は8/8成功。
- `icon-candidates.html` と8個のSVG候補は作成済み。リンク切れは解消済み。
- manifestのテーマ色は新UIへ整合済み。
- GitHub Actionsの `UI checks` を追加済み。ただし作成直後の時点では実Run未確認。
- 次の最優先は**実ブラウザでの表示・操作確認**。これが済むまでmainへマージしない。


### 追加確認結果

- Draft PR #1: https://github.com/longchanp7-hub/restaurant-ops-app/pull/1
- GitHub Actions `UI checks` run #4 は completed / success。
- この実行環境のブラウザはローカルHTTP・file URL等への遷移が `ERR_BLOCKED_BY_ADMINISTRATOR` で拒否され、実表示テストは継続不能だった。次のブラウザ確認可能な環境で、390px前後を最優先に実画面とPointer Eventsを検証する。
- 実表示確認前なのでPRはDraftのまま。mainへはまだマージしない。

## 0. 最初の5分で行うこと

1. このブランチ `work/ui-refresh-handoff-20260920` の `docs/WORK-LOG.md` を読む。
2. GitHubの最新mainとこのブランチを確認。記録時のmainは `bab1aa275ea44ae1c89c3a786c0b2cf0a040a0fc`。他のAIの更新があれば保持する。
3. 作業開始時に日本時間を確認。進捗は実際の結果だけを短く伝える。
4. 新UIは途中コードだと認識し、先にテストとリンク切れを修正する。公開前に実表示を確認する。

## 1. コード取得

認証済みの開発環境で実行する例：

```bash
git clone https://github.com/longchanp7-hub/restaurant-ops-app.git
cd restaurant-ops-app
git switch work/ui-refresh-handoff-20260920
git status --short
```

既存作業ツリーがある場合は無理に切り替えず、未コミット変更を保護して別worktreeを使う。破壊的なresetやforce pushは禁止。
WorkからはGitHubアプリの読み取り・Git Trees/Commit/Ref更新でも再開可能。権限が無い場合は認証を迂回しない。

## 2. テストを新構造に合わせる（最優先）

`tests/home-state.test.cjs` は新しい `home-state.js` 直接テストへ更新済み。ローカルNode 22では8件すべて成功。今後はこの8件を維持し、UI操作は実ブラウザで別途確認する。

- `const HomeState = require('../home-state.js')` を使って、状態ロジックのテストを独立させる。
- UI操作は実ブラウザのテストで確認する。DOMモックに不足APIを足すだけで「表示確認済み」としない。
- 次の回帰項目を維持する：重複ID除去、未知ID除去、壊れたJSON、旧v1へのフォールバック、保存拒否、並べ替えと非表示状態の保持。
- 既存mainで成功したテストの目的を残し、単に失敗するテストを削除しない。

```bash
node --check app.js
node --check icons.js
node --check home-state.js
node --test tests/home-state.test.cjs
```

## 3. UIを完成・確認

- 白・深緑・くすみ色の草稿を基準に、余白と文字の読みやすさを調整。
- 既存9機能とブロックの追加・非表示・並べ替えを維持。
- 現在の9機能：売上、シフト、在庫、会計、スタッフ、タスク、レポート、AI、通知。
- スマホ幅320/390/430px、タブレット768px、PC1280pxで横スクロール・重なり・切れを確認。
- 下部ナビと安全領域がカードを隠さないことを確認。
- 長押し→編集、ドラッグ→移動、pointercancel、矢印移動、全件非表示→再追加、リセット確認、リロード後保持を確認。
- モーダルの閉じる／背景タップ／Escape／Tab循環／フォーカス復帰を確認。
- タッチドラッグは実際にPointer Eventsを発生させて確認。ソースを読んだだけで合格にしない。
- 準備中機能を完成済みのように見せない。売上や店舗名など実在しない数値を捏造しない。

ローカルHTTPプレビューの例（その環境で許可されたブラウザを利用）：

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

現在のWorkクラウドブラウザではfile://が禁止。ポリシー拒否を別の経路で回避しない。通常のHTTPプレビューが利用できなければ、未検証範囲を明記する。

## 4. アプリアイコン候補（8案作成済み・未選定）

ユーザーは候補を実際に見たい。説明文だけで終えない。

提案していた8方向（未承認・まだ画像なし）：

| 案 | モチーフ | 印象 |
|---|---|---|
| A | 4つのホームブロック＋深緑 | 統合管理・落ち着き |
| B | 店舗ののれん／屋根 | 飲食店らしさ |
| C | 丸皿＋グリッド | 食と管理 |
| D | Rのモノグラム | シンプル・ブランド性 |
| E | チェック＋店舗 | 現場の実務 |
| F | 重なるカード | 機能を自由に組み合わせる |
| G | コンパス／中心点 | 経営判断・全体把握 |
| H | 9ドット | ホーム画面の直感性 |

- 8案それぞれのSVGと `icon-candidates.html` は作成済み。大・中・小の見え方を同ページで比較できる。
- 次はユーザーの選定後に最終アイコンへ反映する。選定前は `app-icon.svg` を変更しない。
- 機能別アイコン9個は `icons.js` に草稿がある。こちらも一覧で表示して確認できるようにする。
- 既存のコード用SVGはベクターのまま編集できる。ラスタ画像を新規生成する場合は利用可能な画像生成機能を使う。
- アプリ全体のアイコンは候補選択前に最終確定したと言わない。仮採用なら明記する。
- 最終候補には必要に応じ192/512pxとApple touch iconを用意し、manifest/theme-colorとの整合を確認。
- オフライン機能は現時点で未実装。マニフェストがあるだけで完全なPWAと説明しない。

## 5. GitHubへ完成分を反映

1. 最新mainの差分を確認し、他の変更を保持する。
2. 画面と操作、状態テストが確認できたら、このブランチに完成コミット。
3. 必要なレビュー経路でmainへ反映。未検証の草稿を急いでmainへ入れない。
4. 更新後のref/commitを確認し、最終報告には実際のコミットリンクを付ける。
5. この作業記録を現況に更新する。過去の「成功」と現在の「失敗」を混同しない。

## 6. Vercel公開（認証が整った時だけ）

ユーザーの指定：Vercel新規ProjectとしてImport、Production公開、GitHub pushで自動再デプロイ。

| 設定 | 値 |
|---|---|
| Repository | `longchanp7-hub/restaurant-ops-app` |
| Project name | `restaurant-ops-app` |
| Framework | Other（ビルド不要の静的サイト） |
| Root Directory | リポジトリのルート |
| Build Command | 空欄／不要 |
| Output Directory | 空欄／ルートを配信する既定設定 |
| Install Command | 空欄／不要 |
| Production Branch | `main` |
| 公開範囲 | Production URLは一般公開。GitHubはPrivateのままでよい |

- 最初にVercel接続先を確認。前回のアプリ応答はチーム0件、ブラウザは未ログイン。
- チーム0件だけを根拠にアカウント自体が存在しないと断言しない。
- 認証画面の選択・秘密情報入力にはセキュアな認証機能を使う。チャットにパスワードを求めない。
- ログイン方法を勝手に切り替えない。過去にChatGPT経由、別スレッドではGitHub/Googleを検討した履歴があり、最終確定は未確認。
- 対象未指定の `deploy_to_vercel({})` は以前自動承認レビューに拒否されている。同じ呼び出しは繰り返さない。
- 正しいリポジトリを明示してImportし、Git連携でmainをProductionにする。ローカルの一回限りのアップロードだけで「自動再デプロイ有効」と報告しない。
- Ready、Production割当、GitHub連携、Production branch、ログイン不要のURL表示をそれぞれ確認する。
- デプロイのための空コミットや不要なコード改変は行わない。

## 7. 最終報告

完成したUIの実画像、アイコン全候補の比較、GitHubコミット、テスト結果、未完了の認証／デプロイを簡潔に伝える。
デプロイ完了時はProject名・Production URL・GitHub連携・自動デプロイ・成功／失敗を報告。
未実行を実行中／完了と言わない。返答後も勝手に作業が続く、後で通知するとは約束しない。

## 次のAIに渡す短い依頼文

> `longchanp7-hub/restaurant-ops-app` の `work/ui-refresh-handoff-20260920` を取得し、`docs/WORK-LOG.md` と `docs/NEXT-AI-RUNBOOK.md` を読んで続行してください。mainは保存不具合修正まで完了しテスト5件成功、新UIブランチは草稿で旧テスト5件失敗です。新UIのテスト・操作確認、アプリアイコン8案と比較ページを完成させ、完成分だけmainへ反映してください。Vercel公開も希望していますが認証未完了です。既存変更を保持し、完了／未完了を区別してください。
