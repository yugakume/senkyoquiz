# 衆議院小選挙区 当選者クイズ

第51回衆議院議員総選挙の小選挙区当選者を覚えるためのクイズPWA。
全289選挙区を都道府県別・ブロック別・全国ランダムで出題します。

🔗 **公開URL: https://senkyoquiz.yugaku.me**

---

## リポジトリ構成（ブランチの役割）

| ブランチ | 役割 |
|----------|------|
| `main` | このドキュメントを含むハブ。リポジトリの入口・説明用。 |
| `gh-pages` | **本番デプロイ物**。GitHub Pages がこのブランチを配信している。ビルド済みの静的ファイル一式（`index.html` / `assets/` / `manifest.json` / `sw.js` など）。 |

> **配信の仕組み**: `senkyoquiz.yugaku.me`（`CNAME`）→ GitHub Pages（`gh-pages` ブランチ）。
> `.nojekyll` で Jekyll 処理を無効化し、静的ファイルをそのまま配信しています。

---

## アプリ本体について

このリポジトリに含まれるのは **ビルド済みの成果物のみ** です（React 製・[Manus](https://manus.im) で生成）。
`index.html` には React ランタイムがインライン展開され、`assets/index-*.js` にアプリ本体がミニファイされて含まれています。

そのため、**問題データの追加・UI 変更などアプリ本体の改修には元ソース（Manus プロジェクト）が必要**です。
このリポジトリ側だけで編集できるのは、以下のような「ソース不要」の範囲です。

- `index.html` の `<head>` 内のメタ情報（SEO / OGP / Twitter カードなど）
- `manifest.json`（PWA 設定）
- `sw.js`（Service Worker / キャッシュ戦略）
- `ads.txt`（Google AdSense）

---

## 本番ファイル一覧（`gh-pages`）

| ファイル | 内容 |
|----------|------|
| `index.html` | エントリポイント（React ランタイム＋メタ情報を含む） |
| `assets/index-*.js` | アプリ本体（ミニファイ済みバンドル） |
| `assets/index-*.css` | スタイル |
| `manifest.json` | PWA マニフェスト |
| `sw.js` | Service Worker（静的アセットのキャッシュ） |
| `privacy.html` | プライバシーポリシー |
| `ads.txt` | Google AdSense 認証 |
| `CNAME` | カスタムドメイン設定（`senkyoquiz.yugaku.me`） |
| `.nojekyll` | GitHub Pages の Jekyll 処理を無効化 |

---

## メモ

- 以前このリポジトリには、無関係な「こぼり良江 SNS運用支援システム」が誤って混在していました（`claude/setup-sns-management-*` ブランチ）。整理時に別プロジェクトとして切り出し、本リポジトリからは除去しています。
