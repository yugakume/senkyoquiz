/*
 * PrefectureSelect.tsx — Prefecture selection screen
 * Design: Election Broadcast Dashboard — grouped by region
 * - Sound effects on button clicks
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import BroadcastHeader from "@/components/BroadcastHeader";
import { fetchPrefectures } from "@/lib/api";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import type { Prefecture } from "@/lib/types";

const REGIONS: { name: string; prefIds: number[] }[] = [
  { name: "北海道・東北", prefIds: [1, 2, 3, 4, 5, 6, 7] },
  { name: "関東", prefIds: [8, 9, 10, 11, 12, 13, 14] },
  { name: "中部", prefIds: [15, 16, 17, 18, 19, 20, 21, 22, 23] },
  { name: "近畿", prefIds: [24, 25, 26, 27, 28, 29, 30] },
  { name: "中国・四国", prefIds: [31, 32, 33, 34, 35, 36, 37, 38, 39] },
  { name: "九州・沖縄", prefIds: [40, 41, 42, 43, 44, 45, 46, 47] },
];

export default function PrefectureSelect() {
  const [, navigate] = useLocation();
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const { playClick } = useSoundEffects();

  useEffect(() => {
    fetchPrefectures().then(setPrefectures);
  }, []);

  const getPrefName = (id: number) =>
    prefectures.find((p) => p.id === id)?.name_ja || `都道府県${id}`;

  const handleSelect = (pid: number) => {
    playClick();
    navigate(`/quiz?mode=prefecture&id=${pid}&name=${encodeURIComponent(getPrefName(pid))}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background broadcast-grid">
      <BroadcastHeader
        title="衆議院議員当選者クイズ"
        subtitle="都道府県を選択"
        showBack
      />

      <main className="flex-1 container py-6 pb-20">
        <motion.div
          className="max-w-2xl mx-auto space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight telop-slide-in">
              都道府県を選択
            </h2>
            <p className="text-sm text-muted-foreground">
              出題する都道府県を選んでください
            </p>
          </div>

          {REGIONS.map((region, ri) => (
            <motion.div
              key={region.name}
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ri * 0.08 }}
            >
              {/* Region label — broadcast telop style */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase px-2">
                  {region.name}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {region.prefIds.map((pid) => (
                  <button
                    key={pid}
                    className="relative group px-3 py-2.5 rounded-md border border-border bg-card/60 hover:bg-card hover:border-primary/50 transition-all text-sm font-medium text-center active:scale-95"
                    onClick={() => handleSelect(pid)}
                  >
                    <span className="relative z-10">{getPrefName(pid)}</span>
                    <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
