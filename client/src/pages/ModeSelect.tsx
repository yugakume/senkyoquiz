/*
 * ModeSelect.tsx — Quiz mode selection screen
 * Design: Election Broadcast Dashboard — mode selection tiles
 * クイズを「小選挙区」「比例代表」に分離、インプット学習も整理
 */

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Map, Globe, RotateCcw, Swords, List, Percent, BarChart2, UserRound, MapPinned } from "lucide-react";
import BroadcastHeader from "@/components/BroadcastHeader";
import { useSoundEffects } from "@/hooks/useSoundEffects";

// ---- 小選挙区クイズ ----
const SINGLE_MODES = [
  {
    id: "prefecture",
    title: "都道府県別",
    description: "47都道府県から選んで出題",
    icon: MapPin,
    href: "/mode/prefecture",
    color: "from-[#e74c3c] to-[#c0392b]",
    glow: "shadow-[#e74c3c]/20",
  },
  {
    id: "block",
    title: "ブロック別",
    description: "11ブロックから選んで出題",
    icon: Map,
    href: "/mode/block",
    color: "from-[#3498db] to-[#2980b9]",
    glow: "shadow-[#3498db]/20",
  },
  {
    id: "national",
    title: "全国ランダム",
    description: "全289選挙区からランダム出題",
    icon: Globe,
    href: "/quiz?mode=national&name=" + encodeURIComponent("全国ランダム"),
    color: "from-[#2ecc71] to-[#27ae60]",
    glow: "shadow-[#2ecc71]/20",
  },
  {
    id: "photo",
    title: "顔写真クイズ",
    description: "当選者の顔写真を見て名前を当てる。顔と名前を一致させよう",
    icon: UserRound,
    href: "/quiz?mode=national&format=photo&name=" + encodeURIComponent("顔写真クイズ"),
    color: "from-[#f59e0b] to-[#d97706]",
    glow: "shadow-[#f59e0b]/20",
  },
  {
    id: "knockout",
    title: "289本ノック",
    description: "全289選挙区を連続出題。完全制覇を目指せ！",
    icon: Swords,
    href: "/quiz?mode=knockout&name=" + encodeURIComponent("289本ノック"),
    color: "from-[#9b59b6] to-[#8e44ad]",
    glow: "shadow-[#9b59b6]/20",
  },
  {
    id: "review",
    title: "復習モード（小選挙区）",
    description: "間違えた選挙区を再出題",
    icon: RotateCcw,
    href: "/quiz?mode=review&name=" + encodeURIComponent("復習モード"),
    color: "from-[#f1c40f] to-[#f39c12]",
    glow: "shadow-[#f1c40f]/20",
  },
];

// ---- 比例代表クイズ ----
const PROPORTIONAL_MODES = [
  {
    id: "proportional-quiz",
    title: "比例代表クイズ",
    description: "顔写真を見てブロック・政党を当てるクイズ。全175人からランダム出題",
    icon: Percent,
    href: "/quiz/proportional",
    color: "from-[#f97316] to-[#dc2626]",
    glow: "shadow-[#f97316]/20",
  },
  {
    id: "proportional-review",
    title: "比例代表 復習モード",
    description: "間違えた比例代表議員を再出題",
    icon: RotateCcw,
    href: "/quiz/proportional?mode=review",
    color: "from-[#f1c40f] to-[#f39c12]",
    glow: "shadow-[#f1c40f]/20",
  },
];

// ---- インプット学習 ----
const INPUT_MODES = [
  {
    id: "browse",
    title: "小選挙区 当選者一覧",
    description: "全289区の当選者を検索・絞り込みで確認。顔写真・政党・地域名付き",
    icon: List,
    href: "/browse",
    color: "from-[#00b4d8] to-[#0077b6]",
    glow: "shadow-[#00b4d8]/20",
  },
  {
    id: "proportional",
    title: "比例代表 当選者一覧",
    description: "全11ブロック175人の当選者を確認。重複立候補・惜敗率付き",
    icon: List,
    href: "/browse/proportional",
    color: "from-[#f97316] to-[#ea580c]",
    glow: "shadow-[#f97316]/20",
  },
  {
    id: "seats",
    title: "議席数ビジュアル",
    description: "政党別・小選挙区/比例代表の議席数を視覚的に確認",
    icon: BarChart2,
    href: "/seats",
    color: "from-[#6366f1] to-[#4f46e5]",
    glow: "shadow-[#6366f1]/20",
  },
  {
    id: "map",
    title: "小選挙区マップ",
    description: "全289区を当選党の色で塗り分け。区をタップで開票結果",
    icon: MapPinned,
    href: "/map",
    color: "from-[#10b981] to-[#059669]",
    glow: "shadow-[#10b981]/20",
  },
];

interface ModeCardProps {
  mode: {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    color: string;
    glow: string;
  };
  index: number;
  disabled?: boolean;
  badge?: string;
  onClick: () => void;
}

function ModeCard({ mode, index, disabled, badge, onClick }: ModeCardProps) {
  const Icon = mode.icon;
  return (
    <motion.button
      key={mode.id}
      className={`w-full text-left rounded-lg border border-border bg-card/80 backdrop-blur-sm p-4 transition-all
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary/50 hover:bg-card active:scale-[0.98]"}
      `}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: disabled ? 0.4 : 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-center gap-4">
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${mode.color} shadow-lg ${mode.glow} flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base">{mode.title}</h3>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">{badge}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{mode.description}</p>
        </div>
        <div className="text-muted-foreground flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </motion.button>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="space-y-0.5 mt-6 mb-3">
      <h2 className="text-xl font-black tracking-tight">{title}</h2>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export default function ModeSelect() {
  const [, navigate] = useLocation();
  const { playClick } = useSoundEffects();

  const missedIds = JSON.parse(localStorage.getItem("senkyo-quiz-missed") || "[]");
  const reviewDisabled = missedIds.length === 0;

  const missedProp = JSON.parse(localStorage.getItem("senkyo-quiz-proportional-missed") || "[]");
  const propReviewDisabled = missedProp.length === 0;

  const handleNav = (href: string) => {
    playClick();
    navigate(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background broadcast-grid">
      <BroadcastHeader
        title="衆議院議員当選者クイズ"
        subtitle="モード選択"
        showBack
      />

      <main className="flex-1 container py-6 pb-12">
        <motion.div
          className="max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── インプット学習 ── */}
          <SectionTitle title="インプット学習" sub="まず当選者を確認してからクイズに挑戦しよう" />
          <div className="space-y-3">
            {INPUT_MODES.map((mode, i) => (
              <ModeCard
                key={mode.id}
                mode={mode}
                index={i}
                onClick={() => handleNav(mode.href)}
              />
            ))}
          </div>

          {/* ── 小選挙区クイズ ── */}
          <SectionTitle title="小選挙区クイズ" sub="全289選挙区の当選者を当てよう" />
          <div className="space-y-3">
            {SINGLE_MODES.map((mode, i) => {
              const isReview = mode.id === "review";
              const disabled = isReview && reviewDisabled;
              const badge = isReview && !reviewDisabled ? `${missedIds.length}問` : undefined;
              return (
                <ModeCard
                  key={mode.id}
                  mode={{
                    ...mode,
                    description: isReview && disabled
                      ? "まだ間違えた問題がありません"
                      : isReview && !disabled
                      ? `${missedIds.length}問の復習があります`
                      : mode.description,
                  }}
                  index={i}
                  disabled={disabled}
                  badge={badge}
                  onClick={() => { if (!disabled) handleNav(mode.href); }}
                />
              );
            })}
          </div>

          {/* ── 比例代表クイズ ── */}
          <SectionTitle title="比例代表クイズ" sub="全11ブロック175人の当選者を当てよう" />
          <div className="space-y-3">
            {PROPORTIONAL_MODES.map((mode, i) => {
              const isReview = mode.id === "proportional-review";
              const disabled = isReview && propReviewDisabled;
              const badge = isReview && !propReviewDisabled ? `${missedProp.length}問` : undefined;
              return (
                <ModeCard
                  key={mode.id}
                  mode={{
                    ...mode,
                    description: isReview && disabled
                      ? "まだ間違えた問題がありません"
                      : isReview && !disabled
                      ? `${missedProp.length}問の復習があります`
                      : mode.description,
                  }}
                  index={i}
                  disabled={disabled}
                  badge={badge}
                  onClick={() => { if (!disabled) handleNav(mode.href); }}
                />
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
