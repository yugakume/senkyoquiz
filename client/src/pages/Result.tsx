/*
 * Result.tsx — Quiz result summary screen
 * Design: Election Broadcast Dashboard — final results board
 * - 比例復活「比当」badge in orange for revival candidates
 * - Sound effects on button clicks
 */

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Home, RotateCcw, Share2, Trophy, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import BroadcastHeader from "@/components/BroadcastHeader";
import { getPartyColor } from "@/lib/types";
import { isRevivalCandidate } from "@/lib/revival_data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useBGM } from "@/hooks/useBGM";
import type { AnswerRecord } from "@/lib/types";
import { toast } from "sonner";

const RESULT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287896154/nbjZG3PrxwapekxcosX7Mw/result-bg-bEszzEJDEH2pPwCaKkdU9J.webp";

export default function Result() {
  const [, navigate] = useLocation();
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [modeName, setModeName] = useState("");
  const { playClick } = useSoundEffects();
  const { playResultBGM, stopBGM } = useBGM();

  useEffect(() => {
    const stored = sessionStorage.getItem("senkyo-quiz-answers");
    const storedTotal = sessionStorage.getItem("senkyo-quiz-total");
    const storedModeName = sessionStorage.getItem("senkyo-quiz-mode-name");

    if (stored) {
      try {
        setAnswers(JSON.parse(stored));
      } catch {
        setAnswers([]);
      }
    }
    if (storedTotal) setTotal(parseInt(storedTotal));
    if (storedModeName) setModeName(storedModeName);
  }, []);

  const score = useMemo(() => answers.filter((a) => a.result.is_correct).length, [answers]);

  // Play BGM on mount based on score
  useEffect(() => {
    if (total === 0) return;
    const timer = setTimeout(() => playResultBGM(score, total), 600);
    return () => {
      clearTimeout(timer);
      stopBGM();
    };
  }, [score, total, playResultBGM, stopBGM]);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const getGrade = () => {
    if (percentage === 100) return { label: "完璧！", color: "text-[#f1c40f]", emoji: "🏆" };
    if (percentage >= 80) return { label: "優秀！", color: "text-correct", emoji: "🎉" };
    if (percentage >= 60) return { label: "合格！", color: "text-[#3498db]", emoji: "👍" };
    if (percentage >= 40) return { label: "もう少し！", color: "text-[#f39c12]", emoji: "📚" };
    return { label: "要復習！", color: "text-destructive", emoji: "💪" };
  };

  const grade = getGrade();
  const missedCount = answers.filter((a) => !a.result.is_correct).length;

  const handleShare = () => {
    playClick();
    const text = `衆議院議員当選者クイズ（${modeName}）\n${score}/${total}問正解（${percentage}%）\n${grade.emoji} ${grade.label}`;
    if (navigator.share) {
      navigator.share({ title: "衆議院議員当選者クイズ", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("結果をクリップボードにコピーしました");
    }
  };

  const handleRetry = () => {
    playClick();
    navigate("/mode");
  };

  const handleReview = () => {
    playClick();
    const missedIds = answers
      .filter((a) => !a.result.is_correct)
      .map((a) => a.question.district.id);
    if (missedIds.length > 0) {
      navigate(`/quiz?mode=review&id=${missedIds.join(",")}&name=${encodeURIComponent("復習モード")}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: `url(${RESULT_BG})` }}
      />
      <div className="absolute inset-0 broadcast-grid" />

      <BroadcastHeader
        title="衆議院議員当選者クイズ"
        subtitle="結果発表"
      />

      <main className="relative z-10 flex-1 container py-6 pb-20">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Score card */}
          <motion.div
            className="rounded-xl border-2 border-border bg-card/80 backdrop-blur-md overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header stripe */}
            <div className="h-1 bg-gradient-to-r from-[#e74c3c] via-[#f1c40f] to-[#3498db]" />

            <div className="p-6 text-center space-y-4">
              <motion.div
                className="text-5xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {grade.emoji}
              </motion.div>

              <div>
                <motion.h2
                  className={`text-3xl font-black ${grade.color}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {grade.label}
                </motion.h2>
                <p className="text-sm text-muted-foreground mt-1">{modeName}</p>
              </div>

              {/* Score display */}
              <motion.div
                className="flex items-center justify-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="font-mono text-6xl font-black glow-text">{score}</span>
                <span className="text-2xl text-muted-foreground font-light">/</span>
                <span className="font-mono text-3xl text-muted-foreground">{total}</span>
              </motion.div>

              {/* Percentage bar */}
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      percentage >= 80
                        ? "bg-gradient-to-r from-correct to-[#2ecc71]"
                        : percentage >= 60
                        ? "bg-gradient-to-r from-[#3498db] to-[#2980b9]"
                        : percentage >= 40
                        ? "bg-gradient-to-r from-[#f39c12] to-[#e67e22]"
                        : "bg-gradient-to-r from-destructive to-[#c0392b]"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                  />
                </div>
                <span className="text-sm font-mono text-muted-foreground">{percentage}%</span>
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              variant="outline"
              size="lg"
              className="h-12 bg-card/50"
              onClick={() => { playClick(); navigate("/"); }}
            >
              <Home className="w-4 h-4 mr-2" />
              ホーム
            </Button>
            <Button
              size="lg"
              className="h-12 bg-gradient-to-r from-primary to-elect-blue border-0"
              onClick={handleRetry}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              もう一度
            </Button>
            {missedCount > 0 && (
              <Button
                variant="outline"
                size="lg"
                className="h-12 col-span-2 bg-card/50 border-[#f39c12]/30 text-[#f39c12] hover:bg-[#f39c12]/10"
                onClick={handleReview}
              >
                <XCircle className="w-4 h-4 mr-2" />
                間違えた{missedCount}問を復習
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="h-12 col-span-2 bg-card/50"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              結果をシェア
            </Button>
          </motion.div>

          {/* Answer review list */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <h3 className="text-sm font-bold text-muted-foreground tracking-wider">
              回答一覧
            </h3>
            <div className="space-y-2">
              {answers.map((answer, i) => {
                const districtId = answer.question.district.id;
                const correctName = answer.result.correct_candidate.name_ja;
                const isWinnerRevival = isRevivalCandidate(districtId, correctName);

                return (
                  <motion.div
                    key={i}
                    className={`rounded-lg border ${
                      answer.result.is_correct ? "border-correct/30 bg-correct/5" : "border-destructive/30 bg-destructive/5"
                    } p-3`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + i * 0.05 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                        answer.result.is_correct ? "bg-correct text-white" : "bg-destructive text-white"
                      }`}>
                        {answer.result.is_correct ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">
                          {answer.question.district.name_ja}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>正解: {correctName}</span>
                          <span
                            className="px-1 py-0.5 rounded text-[10px]"
                            style={{
                              color: getPartyColor(answer.result.correct_candidate.party),
                              backgroundColor: getPartyColor(answer.result.correct_candidate.party) + "15",
                            }}
                          >
                            {answer.result.correct_candidate.party}
                          </span>
                          {isWinnerRevival && (
                            <span className="px-1 py-0.5 bg-[#f39c12] text-white rounded text-[10px] font-black">
                              比当
                            </span>
                          )}
                        </div>
                      </div>
                      {answer.result.is_correct && (
                        <Trophy className="w-4 h-4 text-[#f1c40f] shrink-0" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
