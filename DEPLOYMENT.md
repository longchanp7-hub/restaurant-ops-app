# Deployment

## Vercel

このリポジトリはビルド不要の静的サイトです。

推奨設定:

- Project name: `restaurant-ops-app`
- Framework Preset: Other / Static
- Root Directory: `./`
- Build Command: 空欄
- Output Directory: 空欄
- Install Command: 空欄
- Production branch: `main`

`index.html` がルートにあるため、そのままProduction Deployできます。

Git Integrationを有効にし、`main` へのpushでProductionを自動再デプロイする構成にします。

## 公開方針

GitHubリポジトリはPrivateのままで構いません。
VercelのProduction URLは公開URLとして利用します。
