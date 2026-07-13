/*
 * BlockSelect.tsx — Block (比例ブロック) selection screen
 * Design: Election Broadcast Dashboard
 * - Sound effects on button clicks
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import BroadcastHeader from "@/components/BroadcastHeader";
import { fetchBlocks } from "@/lib/api";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import type { Block } from "@/lib/types";

const BLOCK_COLORS: Record<string, string> = {
  hokkaido: "from-[#3498db] to-[#2980b9]",
  tohoku: "from-[#2ecc71] to-[#27ae60]",
  kita_kanto: "from-[#e74c3c] to-[#c0392b]",
  minami_kanto: "from-[#f39c12] to-[#e67e22]",
  hokuriku_shinetsu: "from-[#9b59b6] to-[#8e44ad]",
  tokai: "from-[#1abc9c] to-[#16a085]",
  kinki: "from-[#e74c3c] to-[#c0392b]",
  chugoku: "from-[#f1c40f] to-[#f39c12]",
  shikoku: "from-[#3498db] to-[#2980b9]",
  kyushu: "from-[#2ecc71] to-[#27ae60]",
};

export default function BlockSelect() {
  const [, navigate] = useLocation();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const { playClick } = useSoundEffects();

  useEffect(() => {
    fetchBlocks().then(setBlocks);
  }, []);

  const handleSelect = (block: Block) => {
    playClick();
    navigate(`/quiz?mode=block&id=${block.id}&name=${encodeURIComponent(block.name_ja + "ブロック")}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background broadcast-grid">
      <BroadcastHeader
        title="衆議院議員当選者クイズ"
        subtitle="ブロックを選択"
        showBack
      />

      <main className="flex-1 container py-6 pb-20">
        <motion.div
          className="max-w-lg mx-auto space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight telop-slide-in">
              ブロックを選択
            </h2>
            <p className="text-sm text-muted-foreground">
              比例代表ブロックから選んでください
            </p>
          </div>

          <div className="space-y-2">
            {blocks.map((block, i) => (
              <motion.button
                key={block.id}
                className="w-full text-left rounded-lg border border-border bg-card/80 backdrop-blur-sm p-4 hover:border-primary/50 hover:bg-card transition-all active:scale-[0.98]"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSelect(block)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${BLOCK_COLORS[block.id] || "from-gray-500 to-gray-600"} flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">
                      {block.sort_order}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{block.name_ja}ブロック</h3>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                    <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
