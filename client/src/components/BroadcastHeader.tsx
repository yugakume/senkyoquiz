/*
 * BroadcastHeader.tsx — TV broadcast style header bar
 * Design: Election Broadcast Dashboard — top telop bar
 */

import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

interface BroadcastHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
}

export default function BroadcastHeader({
  title = "衆議院議員当選者クイズ",
  subtitle,
  showBack = false,
  rightContent,
}: BroadcastHeaderProps) {
  const [, navigate] = useLocation();

  return (
    <header className="relative z-10">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-[#e74c3c] via-[#f1c40f] to-[#3498db]" />

      {/* Main header bar */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              {/* Broadcast "LIVE" badge */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#e74c3c] rounded text-xs font-bold tracking-wider">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
              <div>
                <motion.h1
                  className="text-sm font-bold tracking-wide"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {title}
                </motion.h1>
                {subtitle && (
                  <p className="text-[10px] text-muted-foreground tracking-wide">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
          {rightContent && <div>{rightContent}</div>}
        </div>
      </div>
    </header>
  );
}
