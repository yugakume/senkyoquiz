# クイックスタートガイド

このガイドを読めば、5分で最初の投稿案を作れます。

---

## 最初に1回だけやること

```bash
# このリポジトリのディレクトリに移動
cd /path/to/senkyoquiz

# hookスクリプトに実行権限を付与（初回のみ）
chmod +x .claude/hooks/check_draft.sh

# Claude Codeを起動
claude
```

---

## 毎回の基本フロー（5ステップ）

### 1. 活動メモを作る

```bash
# テンプレートをコピーして新しいメモを作る
# 例: 3月28日の保育所視察
cp ideas/TEMPLATE_idea.md ideas/20260328_nursery_visit.md
```

エディタで開いて、以下を記入:
- `date:` 今日の日付
- `category:` 活動の種別
- `## 活動メモ` に何をしたか
- `## 伝えたいこと` に市民へのメッセージ

### 2. 下書きを生成する

Claude Codeのチャットで:

```
/instagram-draft ideas/20260328_nursery_visit.md
```

```
/x-draft ideas/20260328_nursery_visit.md
```

```
/facebook-draft ideas/20260328_nursery_visit.md
```

3つ連続で実行すれば、3プラットフォーム分の下書きが揃います。

### 3. チェック結果を確認する

下書きが保存されると自動チェックが走ります。
各下書きファイルの末尾にある `## チェック結果（自動）` を確認してください。

- `✅ 自動チェック通過` → 問題なし
- `⚠️ WARNING` → 内容を確認して判断
- `❌ ERROR` → 投稿前に必ず修正

### 4. レビューして承認する

```
drafts/instagram/20260328_nursery_visit.md
drafts/x/20260328_nursery_visit.md
drafts/facebook/20260328_nursery_visit.md
```

内容を確認し、問題なければフロントマターの `status: draft` を `status: approved` に変更。

念のために詳細チェックをする場合:

```
/pre-campaign-check drafts/instagram/20260328_nursery_visit.md
```

### 5. 手動で投稿する

承認済みのファイルを開き、本文とハッシュタグを手動でコピー&ペーストして投稿します。

投稿後:
- `status: approved` → `status: posted` に変更
- `posted_at: 2026-03-28 10:30` のように投稿日時を追記

---

## よく使うコマンド一覧

| コマンド | 用途 |
|---------|------|
| `/instagram-draft ideas/FILE.md` | Instagram下書き生成 |
| `/x-draft ideas/FILE.md` | X下書き生成 |
| `/facebook-draft ideas/FILE.md` | Facebook下書き生成 |
| `/weekly-summary` | 今週の投稿状況を確認 |
| `/pre-campaign-check drafts/PLATFORM/FILE.md` | 公選法の詳細チェック |
| `/pre-campaign-check` | 全下書きを一括チェック |

---

## トラブルシューティング

### hookが動かない
```bash
# 実行権限を確認
ls -la .claude/hooks/check_draft.sh
# 権限がなければ
chmod +x .claude/hooks/check_draft.sh
```

### X投稿が140文字を超えている
スキルが自動的にスレッド形式（1/2, 2/2）に分割します。
または、Claude Codeに「140文字に収めて」と依頼してください。

### チェック結果セクションが更新されない
`CLAUDE_TOOL_INPUT` 環境変数が渡っていない可能性があります。
下書きファイルを手動で保存・編集すると再実行されます。

### ハッシュタグが少なすぎると警告が出る
Instagram向けは15〜25個が推奨です。
`templates/hashtag_bank.md` からテーマに合うタグを追加してください。

---

## 現在の選挙モード（2026年3月時点）

```
⚠️ 現在: 事前運動禁止期間（〜2026/4/11）

投票依頼・支持依頼の表現は絶対に使用しないこと。
普段の議員活動報告として自然な内容のみ投稿してください。

4/12（告示日）以降は選挙運動として投票呼びかけが可能になります。
```

---

## ファイルはどこに保存される？

```
senkyoquiz/
├── ideas/          ← 活動メモはここに作る
├── drafts/
│   ├── instagram/  ← Instagram下書きはここに保存される
│   ├── x/          ← X下書きはここに保存される
│   └── facebook/   ← Facebook下書きはここに保存される
├── templates/      ← ハッシュタグ集・フォーマット定義
├── checks/         ← 禁止語リスト（自動チェックで参照）
└── docs/           ← このドキュメント
```
