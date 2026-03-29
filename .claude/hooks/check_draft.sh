#!/usr/bin/env bash
# check_draft.sh - こぼり良江 SNS下書き自動チェックスクリプト
#
# Claude Code の PostToolUse hook から呼び出される。
# Write / Edit ツール使用後に自動実行され、drafts/ 以下のファイルをチェックする。
#
# 入力: CLAUDE_TOOL_INPUT 環境変数（JSON形式）
# 出力: チェック結果をstdoutに出力（Claude Codeがコンテキストに表示）

set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FORBIDDEN_WORDS="$REPO_DIR/checks/forbidden_words.md"

# ---- ツール入力からファイルパスを取得 ----
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"
if [ -z "$TOOL_INPUT" ]; then
  exit 0
fi

FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('file_path', d.get('path', '')))
except:
    print('')
" 2>/dev/null)

# drafts/ 以下でなければスキップ
if [[ "$FILE_PATH" != *"/drafts/"* ]] && [[ "$FILE_PATH" != "drafts/"* ]]; then
  exit 0
fi

# 絶対パスに正規化
if [[ "$FILE_PATH" != /* ]]; then
  FILE_PATH="$REPO_DIR/$FILE_PATH"
fi

# ファイルが存在しなければスキップ
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# ---- プラットフォーム判定 ----
PLATFORM=""
if [[ "$FILE_PATH" == *"/instagram/"* ]]; then
  PLATFORM="instagram"
elif [[ "$FILE_PATH" == *"/x/"* ]]; then
  PLATFORM="x"
elif [[ "$FILE_PATH" == *"/facebook/"* ]]; then
  PLATFORM="facebook"
fi

# ---- 現在の日付と選挙カレンダー判定 ----
TODAY=$(date +%Y%m%d)
ELECTION_START=20260412   # 告示日
ELECTION_END=20260418     # 投票日前日
ELECTION_DAY=20260419     # 投開票日

if [ "$TODAY" -lt "$ELECTION_START" ]; then
  MODE="pre_campaign"    # 事前運動禁止期間
elif [ "$TODAY" -le "$ELECTION_END" ]; then
  MODE="campaign"        # 選挙運動期間（投票呼びかけOK）
else
  MODE="normal"          # 通常の活動報告期間
fi

# ---- ファイル内容を読み込む ----
CONTENT=$(cat "$FILE_PATH")

# フロントマター以降の本文を抽出（---で区切られた後）
BODY=$(echo "$CONTENT" | awk '/^---/{count++; if(count==2){found=1; next}} found{print}' 2>/dev/null || echo "$CONTENT")

ERRORS=()
WARNINGS=()
INFOS=()

# ---- 1. 名前表記エラーチェック ----
NAME_ERRORS=(
  "こぼりよしえ"
  "小堀よしえ"
  "こぼり良枝"
  "小堀良枝"
  "コボリ良江"
  "コボリよしえ"
  "こぼりヨシエ"
  "小堀ヨシエ"
)

for word in "${NAME_ERRORS[@]}"; do
  if echo "$CONTENT" | grep -q "$word" 2>/dev/null; then
    ERRORS+=("名前表記エラー: 「${word}」が含まれています。正しくは「こぼり良江」または「小堀良江」です。")
  fi
done

# ---- 2. 禁止語チェック（CATEGORY_A: 絶対禁止） ----
FORBIDDEN_A=(
  "投票をお願い"
  "投票してください"
  "ぜひ投票を"
  "投票よろしくお願い"
  "支持をお願い"
  "支持してください"
  "ご支持をお願い"
  "当選させてください"
  "当選をお願い"
  "一票をお願い"
  "一票よろしく"
  "に一票"
)

if [ "$MODE" = "pre_campaign" ] || [ "$MODE" = "normal" ]; then
  for word in "${FORBIDDEN_A[@]}"; do
    if echo "$BODY" | grep -q "$word" 2>/dev/null; then
      ERRORS+=("絶対禁止語（公選法）: 「${word}」は告示前には使用できません。")
    fi
  done
fi

if [ "$MODE" = "campaign" ]; then
  INFOS+=("選挙運動期間中（4/12〜4/18）です。投票呼びかけ表現は合法です。")
fi

# ---- 3. 要注意語チェック（CATEGORY_B: 文脈次第でNG） ----
CAUTION_B=(
  "応援してください"
  "応援よろしくお願い"
  "力添えをお願い"
  "お力添えを"
  "皆さまのご支援を"
  "ご支援をお願い"
  "拡散をお願い"
  "シェアをお願い"
  "フォローをお願い"
  "選挙に向けて"
  "次の選挙では"
  "候補者として"
)

for word in "${CAUTION_B[@]}"; do
  if echo "$BODY" | grep -q "$word" 2>/dev/null; then
    WARNINGS+=("要注意語: 「${word}」が含まれています。文脈が事前運動に見えないか確認してください。")
  fi
done

# ---- 4. 文字数チェック ----
# ## 本文 セクションを抽出
POST_BODY=$(echo "$BODY" | awk '/^## 本文/{found=1; next} /^## /{if(found)exit} found{print}' 2>/dev/null)
CHAR_COUNT=$(echo -n "$POST_BODY" | wc -m 2>/dev/null || echo 0)

case "$PLATFORM" in
  "x")
    if [ "$CHAR_COUNT" -gt 140 ]; then
      ERRORS+=("文字数オーバー: X投稿は140文字以内が必要です。現在約${CHAR_COUNT}文字（ハッシュタグ・空行含む）。")
    elif [ "$CHAR_COUNT" -gt 120 ]; then
      WARNINGS+=("文字数注意: X投稿が${CHAR_COUNT}文字です。URLを含む場合は23文字換算に注意してください。")
    else
      INFOS+=("文字数: ${CHAR_COUNT}文字（X: 140文字以内 OK）")
    fi
    ;;
  "instagram")
    if [ "$CHAR_COUNT" -gt 2200 ]; then
      ERRORS+=("文字数オーバー: Instagram投稿は2200文字以内が必要です。現在約${CHAR_COUNT}文字。")
    elif [ "$CHAR_COUNT" -gt 800 ]; then
      WARNINGS+=("文字数注意: Instagram投稿が${CHAR_COUNT}文字です。モバイルでの読みやすさを確認してください。")
    else
      INFOS+=("文字数: ${CHAR_COUNT}文字（Instagram: 推奨300〜800文字）")
    fi
    ;;
  "facebook")
    if [ "$CHAR_COUNT" -gt 1000 ]; then
      WARNINGS+=("文字数注意: Facebook投稿が${CHAR_COUNT}文字です。長くなりすぎていないか確認してください。")
    else
      INFOS+=("文字数: ${CHAR_COUNT}文字（Facebook: 問題なし）")
    fi
    ;;
esac

# ---- 5. ハッシュタグ数チェック ----
HASHTAG_SECTION=$(echo "$BODY" | awk '/^## ハッシュタグ/{found=1; next} /^## /{if(found)exit} found{print}' 2>/dev/null)
HASHTAG_COUNT=$(echo "$HASHTAG_SECTION" | grep -o '#[^ #]*' | wc -l 2>/dev/null || echo 0)

case "$PLATFORM" in
  "instagram")
    if [ "$HASHTAG_COUNT" -lt 5 ]; then
      WARNINGS+=("ハッシュタグ少なめ: Instagramは5〜25個推奨です（現在${HASHTAG_COUNT}個）。")
    elif [ "$HASHTAG_COUNT" -gt 30 ]; then
      ERRORS+=("ハッシュタグ多すぎ: Instagramの上限は30個です（現在${HASHTAG_COUNT}個）。")
    else
      INFOS+=("ハッシュタグ: ${HASHTAG_COUNT}個（Instagram: 推奨5〜25個 OK）")
    fi
    ;;
  "x")
    if [ "$HASHTAG_COUNT" -gt 3 ]; then
      WARNINGS+=("ハッシュタグ多め: X投稿は1〜3個が推奨です（現在${HASHTAG_COUNT}個）。")
    else
      INFOS+=("ハッシュタグ: ${HASHTAG_COUNT}個（X: 推奨1〜3個）")
    fi
    ;;
  "facebook")
    if [ "$HASHTAG_COUNT" -gt 5 ]; then
      WARNINGS+=("ハッシュタグ多め: Facebookは0〜5個が推奨です（現在${HASHTAG_COUNT}個）。")
    else
      INFOS+=("ハッシュタグ: ${HASHTAG_COUNT}個（Facebook: 推奨0〜5個 OK）")
    fi
    ;;
esac

# ---- 6. 固定ハッシュタグ存在チェック ----
if [ -n "$HASHTAG_SECTION" ]; then
  for required_tag in "#栃木市" "#こぼり良江"; do
    if ! echo "$HASHTAG_SECTION" | grep -q "$required_tag" 2>/dev/null; then
      WARNINGS+=("推奨タグ不足: 「${required_tag}」が含まれていません。")
    fi
  done
fi

# ---- 結果を組み立て ----
NOW=$(date '+%Y-%m-%d %H:%M' 2>/dev/null || echo "unknown")
MODE_LABEL=""
case "$MODE" in
  "pre_campaign") MODE_LABEL="事前運動禁止期間" ;;
  "campaign") MODE_LABEL="選挙運動期間（投票呼びかけOK）" ;;
  "normal") MODE_LABEL="通常活動報告期間" ;;
esac

PLATFORM_LABEL="${PLATFORM:-不明}"

RESULT_BLOCK="## チェック結果（自動 ${NOW}）

- 期間モード: ${MODE_LABEL}
- プラットフォーム: ${PLATFORM_LABEL}"

if [ ${#ERRORS[@]} -gt 0 ]; then
  RESULT_BLOCK+="
- ステータス: ❌ ERROR あり（投稿前に必ず修正してください）

### ❌ エラー"
  for e in "${ERRORS[@]}"; do
    RESULT_BLOCK+="
- $e"
  done
elif [ ${#WARNINGS[@]} -gt 0 ]; then
  RESULT_BLOCK+="
- ステータス: ⚠️ WARNING あり（内容を確認してください）"
else
  RESULT_BLOCK+="
- ステータス: ✅ 自動チェック通過"
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
  RESULT_BLOCK+="

### ⚠️ 警告"
  for w in "${WARNINGS[@]}"; do
    RESULT_BLOCK+="
- $w"
  done
fi

if [ ${#INFOS[@]} -gt 0 ]; then
  RESULT_BLOCK+="

### ℹ️ 情報"
  for i in "${INFOS[@]}"; do
    RESULT_BLOCK+="
- $i"
  done
fi

RESULT_BLOCK+="

> ⚠️ このチェックは自動判定です。公選法の最終判断は必ず人間が行ってください。
> 迷う表現は \`/pre-campaign-check\` でより詳細なチェックを実施してください。"

# ---- チェック結果をファイルに書き込む ----
# 既存の「## チェック結果」セクションを置き換えるか、なければ末尾に追加
TEMP_FILE=$(mktemp)

if grep -q "^## チェック結果" "$FILE_PATH" 2>/dev/null; then
  # 既存セクションを置き換え
  python3 - "$FILE_PATH" "$RESULT_BLOCK" <<'PYEOF'
import sys

file_path = sys.argv[1]
new_section = sys.argv[2]

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# チェック結果セクションを見つけて置き換え
lines = content.split('\n')
start_idx = None
end_idx = len(lines)

for i, line in enumerate(lines):
    if line.startswith('## チェック結果'):
        start_idx = i
    elif start_idx is not None and line.startswith('## ') and i > start_idx:
        end_idx = i
        break

if start_idx is not None:
    new_lines = lines[:start_idx] + new_section.split('\n') + lines[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
PYEOF
else
  # 末尾に追加
  printf '\n\n%s\n' "$RESULT_BLOCK" >> "$FILE_PATH"
fi

rm -f "$TEMP_FILE"

# ---- stdoutに出力（Claude Codeがコンテキストに表示） ----
echo ""
echo "=========================================="
echo "📋 SNS下書きチェック結果: $(basename "$FILE_PATH")"
echo "=========================================="
echo "$RESULT_BLOCK"
echo "=========================================="

exit 0
