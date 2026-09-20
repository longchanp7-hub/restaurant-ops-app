# 作業記録 — 飲食店運営アプリ

記録時刻：2026-09-20 02:49 JST。最初に `docs/NEXT-AI-RUNBOOK.md` と併せて読むこと。


## 2026-09-20 継続作業アップデート

- Google Driveを実検索したが、restaurant-ops-app の作業書はDrive上に見つからなかった。過去の記録どおり、Driveアップロードは認証スコープ不足で完了していない。今回の再開はこのGitHubブランチ上の原本 `docs/WORK-LOG.md` / `docs/NEXT-AI-RUNBOOK.md` を使用した。
- 旧 `tests/home-state.test.cjs` を新しい `home-state.js` 直接テストへ更新。ローカルNode 22で **8件すべて成功**。
- 欠けていた `icon-candidates.html` を追加し、A〜Hの8案を実SVGとして `icons/` に追加。ホーム／設定からのリンク切れを解消した。
- `manifest.webmanifest` の背景色・テーマ色を新UI（白・深緑・くすみ色）に合わせた。現在の `app-icon.svg` は候補選定前なので変更していない。
- `.github/workflows/ui-checks.yml` を追加。構文チェック、状態テスト、静的必須ファイルの存在確認をpush/PRで実行する。作成直後の確認時点ではWorkflow Runはまだ取得できていないため、CI成功とは未報告。
- 実ブラウザでの見た目・Pointer Events操作・モーダル操作はまだ未検証。したがってmainには未マージ。


### CI・実表示確認の追記

- Draft PR #1 を作成: https://github.com/longchanp7-hub/restaurant-ops-app/pull/1
- GitHub Actions `UI checks` run #4（ID 35461189786）は **completed / success**。構文チェック、8件の状態テスト、必須静的ファイル確認が通過した。
- 実ブラウザ確認をローカルHTTP・file URL・代替HTTPS経路で試したが、この実行環境ではすべて `net::ERR_BLOCKED_BY_ADMINISTRATOR` でナビゲーション自体が拒否された。表示・タッチ操作・モーダル操作は未検証のまま。
- 上記理由によりPRはDraftのまま、mainには未マージ。ブラウザ確認ができる環境での検証後にReady化・main反映を判断する。

## 最重要：完成部分と途中部分

| 対象 | 状態 |
|---|---|
| GitHub | `longchanp7-hub/restaurant-ops-app`、Private、既定ブランチ `main` |
| 確認済みmain | `bab1aa275ea44ae1c89c3a786c0b2cf0a040a0fc`。従来UI＋保存・非表示の修正。回帰テスト5件成功 |
| この引継ぎブランチ | `work/ui-refresh-handoff-20260920`。新UIの途中コード＋本記録＋再開手順。完成版ではない |
| 新UI | HTML/CSS/JSを書き直した草稿。構文チェック成功。実ブラウザの表示・操作は未検証 |
| 新UIのテスト | 既存テストを実行すると5件失敗。最初の原因は `ReferenceError: HomeState is not defined`。テストが旧構造のまま |
| アイコン候補 | 8案の比較を提案済みだが、候補画像・比較ページはまだ未作成 |
| 公開デプロイ | 未完了。Production URL未発行。GitHub連携・自動デプロイも未確認 |

**mainを途中コードで上書きしない。先にこのブランチを完成・検証する。**

## ユーザーの目的と最新の許可

- 飲食店の経営・現場管理を統合するアプリ。現段階はホームUIに集中。
- スマートフォンのホーム画面のようにブロックを追加・非表示・並べ替えできる。
- 各業務機能の詳細設計は後で行う。POS・会計・勤怠連携などを勝手に作り込まない。
- 当初は「Vercel接続のみ・コード変更禁止」だったが、その後「コードを変更してもいい」と明示的に許可された。
- 最新のUI依頼：「他にできることも全部やっといて。ダサい UI を見直して、アプリアイコンも全部候補を出して。」
- 直近依頼：「次の AI が迷わないように、作業記録と作業手順書を大至急書いて。」これを優先して本引継ぎを作成。
- 元の公開要件はVercel新規Project Import、Production公開、今後のGitHub pushで自動再デプロイ。
- 公開先を別のサービスに無断変更しない。GitHub自体をPublicに変更する必要もない。

## mainまでに完了した作業

1. 共有履歴とGitHubの実データを照合。別PC上のCodexの内部セッションへ直接アクセスしたわけではない。
2. 既存のホームUI、`vercel.json`、マニフェスト、アイコン、`docs/UI-SCOPE.md`、`DEPLOYMENT.md`を確認。
3. `bab1aa2` で次をmainへ反映し、ref一致を確認した。
   - `[hidden]{display:none!important}` を追加。CSSのdisplay指定で非表示が解除される問題を修正。
   - localStorage書き込み失敗でもUIが動作し、保存できない旨を表示。
   - 保存済みorder/hiddenの重複・未知IDを除去。
   - タッチ移動中の保存を完了時にまとめる。
   - `tests/home-state.test.cjs` の5テスト成功。

## 今回の新UI草稿に入れた変更

デザイン方向はAIの提案であり、ユーザーの最終選択ではない。白・深緑・くすみ色、余白を広めにした業務ホーム。

| ファイル | 今回の状態・役割 |
|---|---|
| `index.html` | 新しいホーム。PCサイド領域／スマホ上部、店舗選択、9カード、下部ナビ、モーダル |
| `styles.css` | 新配色・余白・カード・レスポンシブ・編集・ドラッグ・モーダル。370px以下2列、それ以外3列 |
| `icons.js` | 新規。9機能とナビ用の統一したオリジナル線画SVG |
| `home-state.js` | 新規。状態正規化・旧保存読込・保存失敗処理・移動の独立モジュール。CommonJS対応 |
| `app.js` | 草稿として全面書き直し。長押し、Pointer Eventsのドラッグ、矢印による移動、非表示／再追加、リセット確認、モーダルのEscape／フォーカス制御 |
| `app-icon.svg` | **旧アイコンのまま** |
| `manifest.webmanifest` | **旧内容のまま**。新UIのテーマ色との整合を要確認 |
| `tests/home-state.test.cjs` | **旧テストのまま**。新構造への更新が必要 |

ホームには `icon-candidates.html` へのリンクがあるが、このファイルは未作成。現時点ではリンク切れ。
新しい `index.html` は `icons.js` → `home-state.js` → `app.js` の順で読み込む。
保存キーは引き続き `restaurantOpsHome.v2`、旧 `restaurantOpsHome.v1` も読む。9機能のIDは維持。
各機能は「準備中」と説明するモーダルのみで、実業務データ・店舗DB・認証は未実装。

## 未検証・注意点

- UIのスクリーンショットはまだない。見た目を検証済みと説明しない。
- Pointer Eventsの実機タッチ、クリック抑制、キャンセル時の復元、編集時スクロール、狭い画面を確認する。
- モーダルのinert、Tab循環、Escape、閉じた後のフォーカス復帰を確認する。
- 旧テストは `app.js` だけをVMで実行しているため新しい `HomeState` / `icon` / window等に未対応。
- 新UIの5件失敗はmainの5件成功とは別の結果。混同しない。

## 公開方式の更新

- 公開方式はVercelではなく **GitHub Pages** に変更済み。
- リポジトリはPublic。
- mainに `.github/workflows/deploy-pages.yml` が追加され、GitHub Actions経由でPagesを自動更新する構成。
- 公開URLは `https://longchanp7-hub.github.io/restaurant-ops-app/`。
- 今後は完成分をmainへ反映するとPagesの更新が走る。Vercel認証・Project作成は不要。

## 作業環境

- 作業コピー：`/workspace/scratch/94b30671f5c9/restaurant-ops-app`
- これはGitHub APIで取得したファイルを置いたコピーで、通常のgit clone作業ツリーではない。
- GitHub反映はGit Trees → Commit → Ref更新を利用。`force:false` を使用。
- ローカルコピーにはGitHubの全ファイルが揃っていない。次AIはGitHubブランチを取得するのが確実。
- Node v24.19.0。アプリにnpm依存はない。
- プレビュー用 `python3 -m http.server 8765 --bind 0.0.0.0` を試しに起動したが、表示確認は未実施。引継ぎ時に停止対象。
- クラウドブラウザの `file://` プレビューはポリシーで拒否された。回避操作は行っていない。次AIは自分の環境で許可された通常のローカルHTTPプレビューを使うこと。

## 記録の範囲

上記以外の公開・アカウント作成・自動通知・バックグラウンド作業は完了していない。後で自動的に作業が進む約束もしていない。
