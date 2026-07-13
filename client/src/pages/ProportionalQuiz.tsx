/*
 * ProportionalQuiz.tsx — 比例代表クイズ画面
 * Design: Election Broadcast Dashboard
 *
 * 機能:
 *   - 通常モード: 全175人からランダム出題
 *   - 復習モード: LocalStorageの間違いリストから出題 (?mode=review)
 *   - ブロック絞り込み: 出題前にブロックを選択可能
 *
 * 問題形式:
 *   - 写真あり: 顔写真 + 名前 → ブロック or 政党を当てる
 *   - 写真なし: 名前 + ヒント → ブロック or 政党を当てる
 */

import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy, Filter, X } from "lucide-react";
import BroadcastHeader from "@/components/BroadcastHeader";
import {
  PROPORTIONAL_WINNERS,
  PROPORTIONAL_BLOCKS,
  type ProportionalWinner,
} from "@/lib/proportional_data";
import { getPartyColor } from "@/lib/types";

const STORAGE_KEY = "senkyo-quiz-proportional-missed";
type QuizType = "block" | "party";

const PARTIES_IN_DATA = Array.from(new Set(PROPORTIONAL_WINNERS.map(w => w.party)));
const BLOCKS_LIST = [...PROPORTIONAL_BLOCKS];

interface Question {
  winner: ProportionalWinner;
  type: QuizType;
  choices: string[];
  correct: string;
  hasPhoto: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeChoices(correct: string, pool: string[], count = 4): string[] {
  const others = shuffle(pool.filter(x => x !== correct)).slice(0, count - 1);
  return shuffle([correct, ...others]);
}

function generateQuestions(count: number, blockFilter: string | null, isReview: boolean): Question[] {
  let pool = PROPORTIONAL_WINNERS;

  if (isReview) {
    const missed: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    pool = pool.filter(w => missed.includes(w.name));
    if (pool.length === 0) pool = PROPORTIONAL_WINNERS; // フォールバック
  }

  if (blockFilter) {
    pool = pool.filter(w => w.block === blockFilter);
    if (pool.length === 0) pool = PROPORTIONAL_WINNERS;
  }

  const withPhoto = pool.filter(w => w.photo);
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    const type: QuizType = i % 2 === 0 ? "block" : "party";
    const src = withPhoto.length >= 4 ? withPhoto : pool;
    const winner = src[Math.floor(Math.random() * src.length)];
    const hasPhoto = !!winner.photo;

    let correct: string;
    let choices: string[];

    if (type === "block") {
      correct = winner.block;
      choices = makeChoices(correct, BLOCKS_LIST);
    } else {
      correct = winner.party;
      choices = makeChoices(correct, PARTIES_IN_DATA);
    }

    questions.push({ winner, type, choices, correct, hasPhoto });
  }

  return questions;
}

// ---- ブロック選択画面 ----
function BlockSelector({
  onSelect,
  isReview,
  reviewCount,
}: {
  onSelect: (block: string | null) => void;
  isReview: boolean;
  reviewCount: number;
}) {
  const blockCounts = BLOCKS_LIST.map(b => ({
    block: b,
    count: PROPORTIONAL_WINNERS.filter(w => w.block === b).length,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background broadcast-grid">
      <BroadcastHeader title="比例代表クイズ" subtitle="ブロック選択" showBack />
      <main className="flex-1 container py-6 max-w-lg mx-auto w-full">
        <div className="space-y-4">
          {isReview && reviewCount > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onSelect(null)}
              className="w-full p-4 rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 text-left hover:bg-yellow-500/20 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-yellow-300">復習モード</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{reviewCount}人の間違いを再出題</p>
                </div>
              </div>
            </motion.button>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <Filter className="w-3 h-3" />
              ブロックを絞り込んで出題（タップで選択）
            </p>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => onSelect(null)}
              className="w-full p-4 rounded-xl border-2 border-primary/50 bg-primary/10 text-left hover:bg-primary/20 transition-all active:scale-[0.98] mb-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">全ブロック（ランダム）</span>
                <span className="text-sm text-muted-foreground font-mono">175人</span>
              </div>
            </motion.button>
            <div className="grid grid-cols-2 gap-2">
              {blockCounts.map((b, i) => (
                <motion.button
                  key={b.block}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  onClick={() => onSelect(b.block)}
                  className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all active:scale-[0.98] text-left"
                >
                  <p className="font-bold text-sm">{b.block}</p>
                  <p className="text-xs text-muted-foreground font-mono">{b.count}人</p>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---- メインクイズ画面 ----
export default function ProportionalQuiz() {
  const [, navigate] = useLocation();
  const [location] = useLocation();

  // URLパラメータ確認
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const urlMode = searchParams.get("mode");
  const isReviewMode = urlMode === "review";

  const missedNames: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const reviewCount = missedNames.length;

  // ブロック選択前の状態
  const [selectedBlock, setSelectedBlock] = useState<string | null | "selected">("selected" as any);
  const [blockFilter, setBlockFilter] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [history, setHistory] = useState<{ correct: boolean; winner: ProportionalWinner }[]>([]);

  const handleBlockSelect = useCallback((block: string | null) => {
    setBlockFilter(block);
    setShowSelector(false);
    setQuestions(generateQuestions(15, block, isReviewMode));
  }, [isReviewMode]);

  const current = questions[currentIdx];
  const isAnswered = selected !== null;
  const isCorrect = selected === current?.correct;

  const handleSelect = useCallback((choice: string) => {
    if (isAnswered || !current) return;
    setSelected(choice);
    const correct = choice === current.correct;
    if (correct) setScore(s => s + 1);
    else {
      // 間違えた議員をLocalStorageに保存
      const existing: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!existing.includes(current.winner.name)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, current.winner.name]));
      }
    }
    setHistory(h => [...h, { correct, winner: current.winner }]);
  }, [isAnswered, current]);

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
    }
  }, [currentIdx, questions.length]);

  // ブロック選択画面
  if (showSelector) {
    return (
      <BlockSelector
        onSelect={handleBlockSelect}
        isReview={isReviewMode}
        reviewCount={reviewCount}
      />
    );
  }

  // 結果画面
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen flex flex-col bg-background broadcast-grid">
        <BroadcastHeader title="比例代表クイズ" subtitle="結果発表" showBack />
        <main className="flex-1 container py-8 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="text-center space-y-2">
              <Trophy className="w-12 h-12 mx-auto text-yellow-400" />
              <h2 className="text-3xl font-black">{score} / {questions.length}</h2>
              <p className="text-muted-foreground">正解率 {pct}%</p>
              {blockFilter && (
                <p className="text-xs text-muted-foreground bg-card border border-border px-3 py-1 rounded-full inline-block">
                  {blockFilter}ブロック
                </p>
              )}
            </div>

            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((h, i) => {
                const partyColor = getPartyColor(h.winner.party);
                return (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border ${h.correct ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border" style={{ borderColor: partyColor }}>
                      {h.winner.photo ? (
                        <img src={h.winner.photo} alt={h.winner.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: partyColor }}>
                          {h.winner.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{h.winner.name}</p>
                      <p className="text-xs text-muted-foreground">{h.winner.block}ブロック · {h.winner.party}</p>
                    </div>
                    {h.correct
                      ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    }
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSelector(true);
                  setCurrentIdx(0);
                  setSelected(null);
                  setScore(0);
                  setFinished(false);
                  setHistory([]);
                  setQuestions([]);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-border hover:bg-card transition-colors text-sm font-bold"
              >
                <RotateCcw className="w-4 h-4" />
                もう一度
              </button>
              <button
                onClick={() => navigate("/mode")}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-bold"
              >
                モード選択へ
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!current) return null;

  const partyColor = getPartyColor(current.winner.party);
  const questionLabel = current.type === "block"
    ? "この議員はどの比例ブロックから当選？"
    : "この議員の政党は？";

  return (
    <div className="min-h-screen flex flex-col bg-background broadcast-grid">
      <BroadcastHeader
        title="比例代表クイズ"
        subtitle={`${currentIdx + 1} / ${questions.length}${blockFilter ? ` · ${blockFilter}` : ""}`}
        showBack
      />

      <main className="flex-1 container py-4 flex flex-col max-w-lg mx-auto w-full">
        {/* Progress */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(currentIdx / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4 flex-1"
          >
            {/* Question card */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              {current.hasPhoto ? (
                <div className="relative w-full" style={{ paddingBottom: '65%' }}>
                  <img
                    src={current.winner.photo!}
                    alt="?"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute bottom-0 left-0 right-0 px-4 py-3"
                      style={{ background: `linear-gradient(to top, rgba(0,0,0,0.88), transparent)` }}
                    >
                      <p className="text-white font-black text-xl drop-shadow">{current.winner.name}</p>
                      <p className="text-white/80 text-sm">{current.winner.block}ブロック · {current.winner.party}</p>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div
                  className="p-6 text-center space-y-1"
                  style={{ borderBottom: `3px solid ${partyColor}` }}
                >
                  <p className="text-2xl font-black">{current.winner.name}</p>
                  {current.type === "block" ? (
                    <p className="text-sm font-semibold" style={{ color: partyColor }}>
                      {current.winner.party}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground font-semibold">
                      {current.winner.block}ブロック
                    </p>
                  )}
                </div>
              )}
              <div className="px-4 py-3">
                <p className="text-sm font-bold text-center">{questionLabel}</p>
              </div>
            </div>

            {/* 選択肢 */}
            <div className="grid grid-cols-2 gap-2">
              {current.choices.map((choice) => {
                const choiceColor = current.type === "party" ? getPartyColor(choice) : undefined;
                let btnClass = "w-full py-3 px-3 rounded-lg border text-sm font-bold transition-all text-left";
                if (!isAnswered) {
                  btnClass += " border-border bg-card hover:border-primary/50 hover:bg-card/80 active:scale-[0.98]";
                } else if (choice === current.correct) {
                  btnClass += " border-green-500 bg-green-500/10 text-green-400";
                } else if (choice === selected && choice !== current.correct) {
                  btnClass += " border-red-500 bg-red-500/10 text-red-400";
                } else {
                  btnClass += " border-border bg-card opacity-50";
                }
                return (
                  <button
                    key={choice}
                    className={btnClass}
                    onClick={() => handleSelect(choice)}
                    disabled={isAnswered}
                  >
                    <div className="flex items-center gap-2">
                      {choiceColor && (
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: choiceColor }} />
                      )}
                      <span className="leading-tight">{choice}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 正誤フィードバック */}
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg p-3 flex items-center gap-3 ${
                  isCorrect
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}
              >
                {isCorrect
                  ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                }
                <div className="flex-1 text-sm">
                  {isCorrect ? (
                    <span className="font-bold text-green-400">正解！</span>
                  ) : (
                    <span className="font-bold text-red-400">
                      不正解。正解は「{current.correct}」
                    </span>
                  )}
                  {current.hasPhoto && (
                    <span className="text-muted-foreground ml-1">（{current.winner.name}）</span>
                  )}
                </div>
              </motion.div>
            )}

            {/* スコア + 次へ */}
            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="text-sm text-muted-foreground">
                スコア: <span className="font-black text-primary">{score}</span> / {currentIdx + (isAnswered ? 1 : 0)}
              </div>
              {isAnswered && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                >
                  {currentIdx + 1 >= questions.length ? "結果を見る" : "次の問題"}
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
