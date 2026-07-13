/*
 * ScoreBar.tsx — Live score ticker bar
 * Design: Election Broadcast Dashboard — bottom score bar
 */

import { motion } from "framer-motion";

interface ScoreBarProps {
  current: number;
  total: number;
  score: number;
}

export default function ScoreBar({ current, total, score }: ScoreBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="bg-card/80 backdrop-blur-md border-t border-border">
      <div className="container py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">問題</span>
              <span className="font-mono text-lg font-bold glow-text">
                {current}
              </span>
              <span className="text-xs text-muted-foreground">/ {total}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">正解</span>
            <motion.span
              key={score}
              className="font-mono text-lg font-bold text-correct"
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {score}
            </motion.span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-elect-blue to-elect-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
