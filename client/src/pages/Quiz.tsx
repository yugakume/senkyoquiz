/*
 * Quiz.tsx — Main quiz gameplay screen
 * Design: Election Broadcast Dashboard
 * - Telop-style district name display with area names (市区町村)
 * - 4-choice buttons with broadcast styling
 * - Win badge flash on correct answer
 * - 比例復活「比当」badge in orange
 * - Sound effects on correct/incorrect/click
 * - Shake animation on wrong answer
 * - Score bar at bottom
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import BroadcastHeader from "@/components/BroadcastHeader";
import ScoreBar from "@/components/ScoreBar";
import { fetchQuizQuestions, submitAnswer } from "@/lib/api";
import { getPartyColor } from "@/lib/types";
import { DISTRICT_AREAS } from "@/lib/district_areas";
import { isRevivalCandidate } from "@/lib/revival_data";
import { getCandidatePhoto } from "@/lib/candidate_photos";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import type { QuizQuestion, AnswerResult, AnswerRecord } from "@/lib/types";

const RESULT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287896154/nbjZG3PrxwapekxcosX7Mw/result-bg-bEszzEJDEH2pPwCaKkdU9J.webp";

export default function Quiz() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const mode = params.get("mode") || "national";
  const modeId = params.get("id") || undefined;
  const modeName = params.get("name") ? decodeURIComponent(params.get("name")!) : undefined;
  // 出題形式: "photo" = 顔写真から当選者を当てる（選挙区名は伏せる）
  const format = params.get("format") === "photo" ? "photo" : "district";
  const isPhoto = format === "photo";

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnswerResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { playCorrect, playIncorrect, playClick, playSelect } = useSoundEffects();

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);

      let id = modeId;
      if (mode === "review") {
        const missed = JSON.parse(localStorage.getItem("senkyo-quiz-missed") || "[]");
        if (missed.length === 0) {
          setError("復習する問題がありません");
          setLoading(false);
          return;
        }
        id = missed.join(",");
      }

      const qs = await fetchQuizQuestions(mode, id, 10, { photoOnly: isPhoto });
      if (qs.length === 0) {
        setError("問題を取得できませんでした。");
      }
      setQuestions(qs);
      setLoading(false);
    };
    loadQuestions();
  }, [mode, modeId, isPhoto]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback(
    async (candidateId: string) => {
      if (answering || !currentQuestion) return;
      setAnswering(true);
      setSelectedId(candidateId);
      playSelect();

      const result = await submitAnswer(currentQuestion.question_id, candidateId);

      if (result) {
        setCurrentResult(result);
        if (result.is_correct) {
          setScore((s) => s + 1);
          // Delay sound slightly for dramatic effect
          setTimeout(() => playCorrect(), 150);
        } else {
          setTimeout(() => playIncorrect(), 150);
        }
        setAnswers((prev) => [
          ...prev,
          { question: currentQuestion, result, selectedCandidateId: candidateId },
        ]);
      } else {
        setCurrentResult(null);
        setAnswering(false);
      }
    },
    [answering, currentQuestion, playCorrect, playIncorrect, playSelect]
  );

  const handleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    playClick();

    if (currentIndex + 1 >= questions.length) {
      // Save missed districts
      const missed = answers
        .filter((a) => !a.result.is_correct)
        .map((a) => a.question.district.id);
      if (currentResult && !currentResult.is_correct && currentQuestion) {
        missed.push(currentQuestion.district.id);
      }
      const existing = JSON.parse(localStorage.getItem("senkyo-quiz-missed") || "[]");
      const combined = Array.from(new Set([...existing, ...missed]));
      localStorage.setItem("senkyo-quiz-missed", JSON.stringify(combined));

      // answers state already contains all answered questions including the current one
      // (added in handleAnswer). Do NOT push again here to avoid double-counting.
      sessionStorage.setItem("senkyo-quiz-answers", JSON.stringify(answers));
      sessionStorage.setItem("senkyo-quiz-score", String(currentResult?.is_correct ? score : score));
      sessionStorage.setItem("senkyo-quiz-total", String(questions.length));
      sessionStorage.setItem("senkyo-quiz-mode-name", modeName || mode);

      navigate("/result");
      return;
    }

    setCurrentIndex((i) => i + 1);
    setCurrentResult(null);
    setSelectedId(null);
    setAnswering(false);
  }, [currentIndex, questions.length, answers, currentResult, currentQuestion, selectedId, score, modeName, mode, navigate, playClick]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background broadcast-grid">
        <BroadcastHeader title="衆議院議員当選者クイズ" subtitle="読み込み中..." showBack />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background broadcast-grid">
        <BroadcastHeader title="衆議院議員当選者クイズ" showBack />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">{error}</p>
            <button
              className="px-4 py-2 bg-card border border-border rounded-md hover:bg-accent transition-colors text-sm"
              onClick={() => navigate("/")}
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col bg-background broadcast-grid">
        <BroadcastHeader title="衆議院議員当選者クイズ" showBack />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">問題がありません</p>
        </div>
      </div>
    );
  }

  // Get area name for current district
  const areaName = DISTRICT_AREAS[currentQuestion.district.id] || "";
  const winnerPhoto = getCandidatePhoto(currentQuestion.district.id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BroadcastHeader
        title="衆議院議員当選者クイズ"
        subtitle={`問題 ${currentIndex + 1} / ${questions.length}`}
        showBack
      />

      <main className="flex-1 flex flex-col relative">
        {/* Background for result display */}
        {currentResult && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${RESULT_BG})` }}
          />
        )}
        <div className="absolute inset-0 broadcast-grid" />

        <div className="relative z-10 flex-1 flex flex-col container max-w-lg py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="flex-1 flex flex-col"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {/* District name — telop style */}
              <div className="mb-8">
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1 bg-[#e74c3c] rounded text-xs font-bold tracking-wider mb-3"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  Q{currentIndex + 1}
                </motion.div>

                {/* 顔写真クイズ: 出題中は写真だけ見せ、選挙区名は伏せる */}
                {isPhoto && !currentResult ? (
                  <motion.div
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                  >
                    {winnerPhoto ? (
                      <img
                        src={winnerPhoto}
                        alt="当選者"
                        className="w-32 h-40 object-cover object-top rounded-lg border-2 border-border shadow-lg"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-32 h-40 rounded-lg border-2 border-border bg-card/60 flex items-center justify-center text-muted-foreground text-xs">
                        写真なし
                      </div>
                    )}
                    <p className="text-lg font-black tracking-tight mt-4">
                      この当選者は誰？
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <motion.h2
                      className="text-2xl md:text-3xl font-black tracking-tight"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {currentQuestion.district.name_ja}
                    </motion.h2>

                    {/* Area name — 市区町村 */}
                    {areaName && (
                      <motion.p
                        className="text-xs text-muted-foreground mt-1.5 leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1.5a5 5 0 0 1 5 5c0 3.5-5 8-5 8s-5-4.5-5-8a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.2" fill="none" />
                            <circle cx="8" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                          </svg>
                          <span className="line-clamp-2">{areaName}</span>
                        </span>
                      </motion.p>
                    )}

                    <motion.p
                      className="text-sm text-muted-foreground mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {isPhoto ? "この選挙区の当選者でした" : "この選挙区の当選者は？"}
                    </motion.p>
                  </>
                )}
              </div>

              {/* Choices */}
              <div className="space-y-3 flex-1">
                {currentQuestion.choices.map((choice, i) => {
                  const isSelected = selectedId === choice.candidate_id;
                  const isCorrect =
                    currentResult &&
                    choice.candidate_id === currentResult.correct_candidate.candidate_id;
                  const isWrong = currentResult && isSelected && !currentResult.is_correct;
                  const showResult = currentResult !== null;

                  let borderColor = "border-border";
                  let bgColor = "bg-card/80";
                  let textColor = "";

                  if (showResult) {
                    if (isCorrect) {
                      borderColor = "border-correct";
                      bgColor = "bg-correct/10";
                      textColor = "text-correct";
                    } else if (isWrong) {
                      borderColor = "border-destructive";
                      bgColor = "bg-destructive/10";
                      textColor = "text-destructive";
                    } else {
                      bgColor = "bg-card/40";
                      textColor = "text-muted-foreground";
                    }
                  }

                  return (
                    <motion.button
                      key={choice.candidate_id}
                      className={`w-full text-left rounded-lg border-2 ${borderColor} ${bgColor} backdrop-blur-sm p-4 transition-all
                        ${!showResult ? "hover:border-primary/50 hover:bg-card active:scale-[0.98]" : ""}
                        ${isWrong ? "shake" : ""}
                      `}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      onClick={() => handleAnswer(choice.candidate_id)}
                      disabled={answering}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            showResult && isCorrect
                              ? "border-correct bg-correct text-white"
                              : showResult && isWrong
                              ? "border-destructive bg-destructive text-white"
                              : "border-border"
                          } text-sm font-bold transition-all`}
                        >
                          {showResult && isCorrect ? "○" : showResult && isWrong ? "×" : String.fromCharCode(65 + i)}
                        </div>
                        <span className={`font-bold text-base ${textColor}`}>
                          {choice.name_ja}
                        </span>

                        {/* Win badge */}
                        {showResult && isCorrect && (
                          <motion.span
                            className="ml-auto px-2 py-0.5 bg-[#e74c3c] rounded text-xs font-black tracking-wider win-flash"
                          >
                            当
                          </motion.span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Result detail */}
              <AnimatePresence>
                {currentResult && (
                  <motion.div
                    className="mt-6 space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    {/* Result banner */}
                    <div
                      className={`rounded-lg p-4 border-2 ${
                        currentResult.is_correct
                          ? "border-correct bg-correct/10"
                          : "border-destructive bg-destructive/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Winner photo */}
                        {(() => {
                          const photoUrl = getCandidatePhoto(currentQuestion.district.id);
                          return photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={currentResult.correct_candidate.name_ja}
                              className="w-16 h-20 object-cover object-top rounded-md border-2 border-border shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : null;
                        })()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`text-2xl font-black ${
                                currentResult.is_correct ? "text-correct" : "text-destructive"
                              }`}
                            >
                              {currentResult.is_correct ? "正解！" : "不正解"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            正解：
                            <span className="font-bold text-foreground">
                              {currentResult.correct_candidate.name_ja}
                            </span>
                            <span className="ml-2 text-xs" style={{ color: getPartyColor(currentResult.correct_candidate.party) }}>
                              {currentResult.correct_candidate.party}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vote results table */}
                    {currentResult.result.rows.length > 0 && (
                      <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
                        <div className="px-3 py-2 bg-card/80 border-b border-border">
                          <span className="text-xs font-bold tracking-wider text-muted-foreground">
                            開票結果
                          </span>
                        </div>
                        <div className="divide-y divide-border">
                          {(() => {
                            const maxVotes = Math.max(...currentResult.result.rows.map(r => r.votes || 0), 1);
                            return currentResult.result.rows.map((row) => {
                              const districtId = currentResult.result.district.id;
                              const isRevival = isRevivalCandidate(districtId, row.name_ja);
                              const barPct = maxVotes > 0 ? Math.round((row.votes / maxVotes) * 100) : 0;
                              const barColor = row.is_winner
                                ? "#e74c3c"
                                : isRevival
                                ? "#f39c12"
                                : getPartyColor(row.party);

                              return (
                                <div
                                  key={row.rank}
                                  className={`px-3 py-2 ${row.is_winner ? "bg-correct/5" : isRevival ? "bg-[#f39c12]/5" : ""}`}
                                >
                                  {/* Top row: rank / badge / name / party / votes */}
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 text-xs font-mono text-muted-foreground text-right shrink-0">
                                      {row.rank}
                                    </span>
                                    {row.is_winner && (
                                      <span className="px-1 py-0.5 bg-[#e74c3c] rounded text-[10px] font-black shrink-0">
                                        当
                                      </span>
                                    )}
                                    {isRevival && (
                                      <span className="px-1 py-0.5 bg-[#f39c12] text-white rounded text-[10px] font-black shrink-0">
                                        比当
                                      </span>
                                    )}
                                    {!row.is_winner && !isRevival && (
                                      <span className="w-[26px] shrink-0" />
                                    )}
                                    <span className="font-medium text-sm flex-1 min-w-0 truncate">{row.name_ja}</span>
                                    <span
                                      className="text-xs px-1.5 py-0.5 rounded shrink-0"
                                      style={{
                                        color: getPartyColor(row.party),
                                        backgroundColor: getPartyColor(row.party) + "15",
                                      }}
                                    >
                                      {row.party}
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground w-20 text-right shrink-0">
                                      {row.votes.toLocaleString()}票
                                    </span>
                                  </div>
                                  {/* Vote share bar */}
                                  {row.votes > 0 && (
                                    <div className="mt-1 ml-[52px] flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-700"
                                          style={{
                                            width: `${barPct}%`,
                                            backgroundColor: barColor,
                                            opacity: row.is_winner ? 1 : 0.55,
                                          }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-mono text-muted-foreground w-9 text-right shrink-0">
                                        {row.vote_share != null ? `${row.vote_share.toFixed(1)}%` : `${barPct}%`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                        {currentResult.result.source_url && (
                          <div className="px-3 py-1.5 bg-card/40 border-t border-border">
                            <a
                              href={currentResult.result.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary hover:underline"
                            >
                              Wikipedia で詳細を見る →
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Next button */}
                    <motion.button
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-elect-blue text-primary-foreground font-bold text-base hover:opacity-90 transition-opacity active:scale-[0.98]"
                      onClick={handleNext}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {currentIndex + 1 >= questions.length ? "結果を見る" : "次の問題 →"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Score bar */}
      <div className="relative z-10">
        <ScoreBar
          current={currentIndex + 1}
          total={questions.length}
          score={score}
        />
      </div>
    </div>
  );
}
