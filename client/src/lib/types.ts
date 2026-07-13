/*
 * types.ts — TypeScript types for the Senkyo Quiz API
 * Design: Election Broadcast Dashboard
 */

export interface Prefecture {
  id: number;
  name_ja: string;
}

export interface Block {
  id: string;
  name_ja: string;
  sort_order: number;
}

export interface District {
  id: string;
  name_ja: string;
  prefecture_id: number;
}

export interface Choice {
  candidate_id: string;
  name_ja: string;
}

export interface QuizQuestion {
  question_id: string;
  election_id: number;
  district: District;
  choices: Choice[];
}

export interface CandidateDetail {
  candidate_id: string;
  name_ja: string;
  party: string;
  votes: number;
  vote_share: number | null;
}

export interface ResultRow {
  rank: number;
  name_ja: string;
  party: string;
  votes: number;
  vote_share: number | null;
  is_winner: boolean;
}

export interface ResultDetail {
  district: District;
  election_id: number;
  source_url: string | null;
  rows: ResultRow[];
}

export interface AnswerResult {
  is_correct: boolean;
  correct_candidate: CandidateDetail;
  result: ResultDetail;
}

export type QuizMode = "prefecture" | "block" | "national" | "review";

export interface QuizState {
  mode: QuizMode;
  modeId?: string;
  modeName?: string;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: AnswerRecord[];
  score: number;
}

export interface AnswerRecord {
  question: QuizQuestion;
  result: AnswerResult;
  selectedCandidateId: string;
}

// Party color mapping for the broadcast theme
export const PARTY_COLORS: Record<string, string> = {
  "自由民主党": "#e74c3c",
  "立憲民主党": "#2980b9",
  "日本維新の会": "#2ecc71",
  "公明党": "#9b59b6",
  "国民民主党": "#f39c12",
  "日本共産党": "#c0392b",
  "れいわ新選組": "#e91e63",
  "社会民主党": "#1abc9c",
  "参政党": "#e67e22",
  "中道改革連合": "#3498db",
  "チームみらい": "#00bcd4",
  "無所属": "#95a5a6",
};

export function getPartyColor(party: string): string {
  return PARTY_COLORS[party] || "#64748b";
}
