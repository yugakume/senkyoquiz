# 衆議院小選挙区 当選者クイズ

第51回衆議院議員総選挙（2026年2月8日）の当選者を覚える学習クイズPWA。
小選挙区289区・比例代表175名の実データを、都道府県別・ブロック別・全国ランダム・顔写真などで出題します。

🔗 **公開URL: https://senkyoquiz.yugaku.me**

---

## 主な機能

- **小選挙区クイズ** — 都道府県別 / ブロック別 / 全国ランダム / 顔写真クイズ / 289本ノック / 復習
- **比例代表クイズ** — 顔写真からブロック・政党を当てる（175名）/ 復習
- **インプット学習** — 当選者一覧（検索・絞り込み・顔写真・市区町村）、比例一覧、議席数ビジュアル
- **解答時の情報** — 開票結果フルテーブル（得票数・得票率バー）、「当」/「比当」バッジ、顔写真、市区町村、Wikipediaリンク
- **演出** — 選挙特番テーマ、効果音・BGM、PWA（オフライン対応）

---

## 技術スタック

React 19 + Vite 7 + TypeScript / Tailwind CSS v4 + shadcn/ui / wouter / framer-motion / recharts。
パッケージマネージャは **pnpm**。データはすべて `client/src/lib/` に埋め込み（バックエンド不要）。

```
client/   フロントエンド（React アプリ本体）
  src/lib/       election_data / candidate_photos / district_areas / revival_data / proportional_data …
  src/pages/     Home / ModeSelect / Quiz / Result / Browse / SeatChart …
server/   開発・Nodeホスティング用の Express（GitHub Pages では未使用）
shared/   共有定数
```

## 開発

```bash
pnpm install          # 依存インストール（初回は onlyBuiltDependencies を承認）
pnpm dev              # 開発サーバー（http://localhost:3000）
pnpm run check        # 型チェック
pnpm exec vite build  # 本番ビルド → dist/public
```

## ブランチとデプロイ

| ブランチ | 役割 |
|----------|------|
| `main` | **アプリのソースコード**（このリポジトリ本体） |
| `gh-pages` | **本番デプロイ物**。GitHub Pages が配信する静的ビルド |

デプロイは `pnpm exec vite build` の出力（`dist/public`）を `gh-pages` に反映する。
その際、ビルドには含まれない以下の配信用ファイルを必ず維持する:

- `CNAME`（独自ドメイン `senkyoquiz.yugaku.me`）
- `.nojekyll`、`ads.txt`、`privacy.html`
- `index.html` への Google AdSense タグの再注入

> 出典: 選挙データは Wikipedia、顔写真は Wikimedia Commons。
> 初期プロトタイプは [Manus](https://manus.im) で生成し、以降はこのリポジトリで開発。
