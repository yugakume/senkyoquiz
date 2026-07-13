/*
 * api.ts — Quiz engine using embedded election data
 * Design: Election Broadcast Dashboard
 *
 * This is a fully self-contained quiz engine that works without a backend.
 * All 289 districts' election results are embedded in election_data.ts.
 * If a FastAPI backend is available, it will be used instead.
 */

import type {
  Prefecture,
  Block,
  QuizQuestion,
  AnswerResult,
  Choice,
  ResultRow,
} from "./types";
import { ELECTION_DATA, type DistrictData } from "./election_data";
import { getCandidatePhoto } from "./candidate_photos";

// ============================================================
// Master data
// ============================================================

const PREFECTURES: Prefecture[] = [
  { id: 1, name_ja: "北海道" }, { id: 2, name_ja: "青森県" },
  { id: 3, name_ja: "岩手県" }, { id: 4, name_ja: "宮城県" },
  { id: 5, name_ja: "秋田県" }, { id: 6, name_ja: "山形県" },
  { id: 7, name_ja: "福島県" }, { id: 8, name_ja: "茨城県" },
  { id: 9, name_ja: "栃木県" }, { id: 10, name_ja: "群馬県" },
  { id: 11, name_ja: "埼玉県" }, { id: 12, name_ja: "千葉県" },
  { id: 13, name_ja: "東京都" }, { id: 14, name_ja: "神奈川県" },
  { id: 15, name_ja: "新潟県" }, { id: 16, name_ja: "富山県" },
  { id: 17, name_ja: "石川県" }, { id: 18, name_ja: "福井県" },
  { id: 19, name_ja: "山梨県" }, { id: 20, name_ja: "長野県" },
  { id: 21, name_ja: "岐阜県" }, { id: 22, name_ja: "静岡県" },
  { id: 23, name_ja: "愛知県" }, { id: 24, name_ja: "三重県" },
  { id: 25, name_ja: "滋賀県" }, { id: 26, name_ja: "京都府" },
  { id: 27, name_ja: "大阪府" }, { id: 28, name_ja: "兵庫県" },
  { id: 29, name_ja: "奈良県" }, { id: 30, name_ja: "和歌山県" },
  { id: 31, name_ja: "鳥取県" }, { id: 32, name_ja: "島根県" },
  { id: 33, name_ja: "岡山県" }, { id: 34, name_ja: "広島県" },
  { id: 35, name_ja: "山口県" }, { id: 36, name_ja: "徳島県" },
  { id: 37, name_ja: "香川県" }, { id: 38, name_ja: "愛媛県" },
  { id: 39, name_ja: "高知県" }, { id: 40, name_ja: "福岡県" },
  { id: 41, name_ja: "佐賀県" }, { id: 42, name_ja: "長崎県" },
  { id: 43, name_ja: "熊本県" }, { id: 44, name_ja: "大分県" },
  { id: 45, name_ja: "宮崎県" }, { id: 46, name_ja: "鹿児島県" },
  { id: 47, name_ja: "沖縄県" },
];

const BLOCKS: Block[] = [
  { id: "hokkaido", name_ja: "北海道", sort_order: 1 },
  { id: "tohoku", name_ja: "東北", sort_order: 2 },
  { id: "kita_kanto", name_ja: "北関東", sort_order: 3 },
  { id: "minami_kanto", name_ja: "南関東", sort_order: 4 },
  { id: "hokuriku_shinetsu", name_ja: "北陸信越", sort_order: 5 },
  { id: "tokai", name_ja: "東海", sort_order: 6 },
  { id: "kinki", name_ja: "近畿", sort_order: 7 },
  { id: "chugoku", name_ja: "中国", sort_order: 8 },
  { id: "shikoku", name_ja: "四国", sort_order: 9 },
  { id: "kyushu", name_ja: "九州", sort_order: 10 },
];

const BLOCK_PREFECTURES: Record<string, number[]> = {
  hokkaido: [1],
  tohoku: [2, 3, 4, 5, 6, 7],
  kita_kanto: [8, 9, 10, 11],
  minami_kanto: [12, 13, 14],
  hokuriku_shinetsu: [15, 16, 17, 18, 19, 20],
  tokai: [21, 22, 23, 24],
  kinki: [25, 26, 27, 28, 29, 30],
  chugoku: [31, 32, 33, 34, 35],
  shikoku: [36, 37, 38, 39],
  kyushu: [40, 41, 42, 43, 44, 45, 46, 47],
};

// ============================================================
// Helpers
// ============================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWinner(d: DistrictData) {
  return d.c.find((c) => c.w) || d.c[0];
}

// ============================================================
// Quiz question store (in-memory, like the FastAPI backend)
// ============================================================

interface StoredQuestion {
  districtData: DistrictData;
  correctCandidateName: string;
}

const questionStore = new Map<string, StoredQuestion>();

let questionCounter = 0;

function generateQuestionId(): string {
  questionCounter++;
  return `q-${Date.now()}-${questionCounter}`;
}

// ============================================================
// 4-choice generation logic
// Rules:
//   - Always include at least 1 losing candidate from the same district
//     (2nd or 3rd place, different party from winner) to mislead the user
//   - Fill remaining wrong choices with same-prefecture winners
//     → same-party winners → random winners
// ============================================================

function generateChoices(district: DistrictData): Choice[] {
  const winner = getWinner(district);
  const correctChoice: Choice = {
    candidate_id: `correct-${district.id}`,
    name_ja: winner.n,
  };

  const usedNames = new Set([winner.n]);
  const wrongChoices: Choice[] = [];

  // --- Step A: Guarantee at least 1 losing candidate from THIS district ---
  // Pick the highest-ranked loser with a different party (most confusing)
  const losers = district.c
    .filter((c) => !c.w && c.n && c.t !== winner.t)
    .sort((a, b) => a.r - b.r);
  const loserFallback = district.c
    .filter((c) => !c.w && c.n)
    .sort((a, b) => a.r - b.r);
  const guaranteedLoser = losers[0] || loserFallback[0];
  if (guaranteedLoser && !usedNames.has(guaranteedLoser.n)) {
    usedNames.add(guaranteedLoser.n);
    wrongChoices.push({
      candidate_id: `loser-${district.id}-${guaranteedLoser.r}`,
      name_ja: guaranteedLoser.n,
    });
  }

  // --- Step B: Fill up to 3 wrong choices ---

  // Priority 1: Same prefecture, different district winners
  const samePrefDistricts = ELECTION_DATA.filter(
    (d) => d.p === district.p && d.id !== district.id
  );
  for (const d of shuffle(samePrefDistricts)) {
    if (wrongChoices.length >= 3) break;
    const w = getWinner(d);
    if (!usedNames.has(w.n)) {
      usedNames.add(w.n);
      wrongChoices.push({ candidate_id: `wrong-${d.id}`, name_ja: w.n });
    }
  }

  // Priority 2: Same party, different district winners
  if (wrongChoices.length < 3) {
    const samePartyDistricts = ELECTION_DATA.filter(
      (d) => d.id !== district.id && getWinner(d).t === winner.t
    );
    for (const d of shuffle(samePartyDistricts)) {
      if (wrongChoices.length >= 3) break;
      const w = getWinner(d);
      if (!usedNames.has(w.n)) {
        usedNames.add(w.n);
        wrongChoices.push({ candidate_id: `wrong-${d.id}`, name_ja: w.n });
      }
    }
  }

  // Priority 3: Other losers in this district
  if (wrongChoices.length < 3) {
    for (const c of loserFallback) {
      if (wrongChoices.length >= 3) break;
      if (!usedNames.has(c.n)) {
        usedNames.add(c.n);
        wrongChoices.push({
          candidate_id: `loser2-${district.id}-${c.r}`,
          name_ja: c.n,
        });
      }
    }
  }

  // Priority 4: Random winners from anywhere
  if (wrongChoices.length < 3) {
    const allDistricts = shuffle(ELECTION_DATA.filter((d) => d.id !== district.id));
    for (const d of allDistricts) {
      if (wrongChoices.length >= 3) break;
      const w = getWinner(d);
      if (!usedNames.has(w.n)) {
        usedNames.add(w.n);
        wrongChoices.push({ candidate_id: `random-${d.id}`, name_ja: w.n });
      }
    }
  }

  return shuffle([correctChoice, ...wrongChoices]);
}

// ============================================================
// Public API
// ============================================================

export async function fetchPrefectures(): Promise<Prefecture[]> {
  return PREFECTURES;
}

export async function fetchBlocks(): Promise<Block[]> {
  return BLOCKS;
}

export function getBlockPrefectures(blockId: string): number[] {
  return BLOCK_PREFECTURES[blockId] || [];
}

export async function fetchQuizQuestions(
  mode: string,
  id?: string,
  limit: number = 10,
  opts: { photoOnly?: boolean } = {}
): Promise<QuizQuestion[]> {
  let pool: DistrictData[];

  switch (mode) {
    case "prefecture": {
      const prefId = parseInt(id || "0");
      pool = ELECTION_DATA.filter((d) => d.p === prefId);
      break;
    }
    case "block": {
      const prefIds = BLOCK_PREFECTURES[id || ""] || [];
      pool = ELECTION_DATA.filter((d) => prefIds.includes(d.p));
      break;
    }
    case "review": {
      const districtIds = id ? id.split(",") : [];
      pool = ELECTION_DATA.filter((d) => districtIds.includes(d.id));
      break;
    }
    case "knockout":
      // 289本ノック: all 289 districts in shuffled order, no limit
      pool = shuffle([...ELECTION_DATA]);
      break;
    case "national":
    default:
      pool = [...ELECTION_DATA];
      break;
  }

  // 顔写真クイズ: 当選者の顔写真がある選挙区のみに限定
  if (opts.photoOnly) {
    pool = pool.filter((d) => getCandidatePhoto(d.id));
  }

  const selected = mode === "knockout" ? pool : shuffle(pool).slice(0, limit);

  return selected.map((district) => {
    const qid = generateQuestionId();
    const winner = getWinner(district);

    // Store for answer validation
    questionStore.set(qid, {
      districtData: district,
      correctCandidateName: winner.n,
    });

    const choices = generateChoices(district);

    return {
      question_id: qid,
      election_id: 51,
      district: {
        id: district.id,
        name_ja: district.n,
        prefecture_id: district.p,
      },
      choices,
    };
  });
}

export async function submitAnswer(
  questionId: string,
  selectedCandidateId: string
): Promise<AnswerResult | null> {
  const stored = questionStore.get(questionId);
  if (!stored) return null;

  const { districtData, correctCandidateName } = stored;
  const winner = getWinner(districtData);

  // Find the selected candidate name from the choices
  // The selectedCandidateId contains the district info
  const isCorrectId = selectedCandidateId.startsWith("correct-");

  // Also check by looking up the name
  const selectedName = isCorrectId ? winner.n : null;

  const rows: ResultRow[] = districtData.c.map((c) => ({
    rank: c.r,
    name_ja: c.n,
    party: c.t,
    votes: c.v,
    vote_share: c.s,
    is_winner: c.w,
  }));

  return {
    is_correct: isCorrectId,
    correct_candidate: {
      candidate_id: `correct-${districtData.id}`,
      name_ja: winner.n,
      party: winner.t,
      votes: winner.v,
      vote_share: winner.s,
    },
    result: {
      district: {
        id: districtData.id,
        name_ja: districtData.n,
        prefecture_id: districtData.p,
      },
      election_id: 51,
      source_url: districtData.u,
      rows,
    },
  };
}
