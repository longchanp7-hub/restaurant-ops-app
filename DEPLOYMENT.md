# Deployment

## GitHub Pages

このリポジトリはビルド不要の静的サイトです。
公開先は **GitHub Pages** を使用します。Vercelは不要です。

### 構成

- Repository: `longchanp7-hub/restaurant-ops-app`
- Production branch: `main`
- Pages source: **GitHub Actions**
- Workflow: `.github/workflows/deploy-pages.yml`
- 公開URL: `https://longchanp7-hub.github.io/restaurant-ops-app/`

### 自動更新

`main` へのpushをトリガーに `Deploy GitHub Pages` workflow が実行され、
リポジトリ直下の静的ファイルをPagesへ公開します。

そのため今後は、完成・確認済みの変更をmainへ反映すれば自動で公開更新されます。

### 注意

- 作業途中のブランチは直接Productionへ出さない。
- UI・テストが確認できた変更だけをmainへ反映する。
- GitHub Pages以外のホスティングへ変更する場合は、別途方針を決める。
