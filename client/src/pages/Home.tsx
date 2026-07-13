/*
 * Home.tsx — Landing page with election broadcast hero
 * Design: Election Broadcast Dashboard
 * - Dark navy background with broadcast grid overlay
 * - Japan map silhouette as visual anchor
 * - Telop-style title animation
 * - Sound effects on button clicks
 */

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Play, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSoundEffects } from "@/hooks/useSoundEffects";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287896154/nbjZG3PrxwapekxcosX7Mw/hero-bg-YZ57tjKQ7KJwjCvkneq5YH.webp";
const JAPAN_MAP = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287896154/nbjZG3PrxwapekxcosX7Mw/japan-map-silhouette-7RszSjBVxGqTazPsZ6Ut3j.webp";

export default function Home() {
  const [, navigate] = useLocation();
  const { playClick } = useSoundEffects();

  const handleNav = (path: string) => {
    playClick();
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      />
      <div className="absolute inset-0 bg-background/70 broadcast-grid" />

      {/* Top accent line */}
      <div className="relative z-10 h-1 bg-gradient-to-r from-[#e74c3c] via-[#f1c40f] to-[#3498db]" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* Japan map background decoration */}
        <motion.img
          src={JAPAN_MAP}
          alt=""
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] md:w-[400px] opacity-10 pointer-events-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        <div className="max-w-lg w-full space-y-8">
          {/* LIVE badge */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#e74c3c] rounded text-xs font-bold tracking-wider">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
            <span className="text-xs text-muted-foreground tracking-widest uppercase">
              第51回衆議院議員総選挙
            </span>
          </motion.div>

          {/* Title — telop style */}
          <div className="space-y-2">
            <motion.div
              className="overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <motion.h1
                className="text-4xl md:text-5xl font-black tracking-tight leading-tight"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                衆議院議員
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498db] to-[#2ecc71]">
                  当選者クイズ
                </span>              </motion.h1>
            </motion.div>

            <motion.p
              className="text-muted-foreground text-sm md:text-base leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              小選挙区289区・比例代表175人の当選者を覚えよう。
              <br />
              都道府県別・ブロック別・全国ランダムで出題。
            </motion.p>
          </div>

          {/* Divider */}
          <motion.div
            className="h-px bg-gradient-to-r from-border via-elect-blue/30 to-transparent"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          />

          {/* Action buttons */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Button
              size="lg"
              className="w-full h-14 text-base font-bold bg-gradient-to-r from-[#e74c3c] to-[#c0392b] hover:from-[#c0392b] hover:to-[#a93226] border-0 shadow-lg shadow-[#e74c3c]/20"
              onClick={() => handleNav("/mode")}
            >
              <Play className="w-5 h-5 mr-2" />
              クイズを始める
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-12 bg-card/50 border-border hover:bg-card hover:border-elect-blue/50 transition-all"
                onClick={() => handleNav("/mode")}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                モード選択
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 bg-card/50 border-border hover:bg-card hover:border-elect-gold/50 transition-all"
                onClick={() => handleNav("/quiz?mode=national&name=" + encodeURIComponent("全国ランダム"))}
              >
                <Zap className="w-4 h-4 mr-2" />
                全国ランダム
              </Button>
            </div>
          </motion.div>

          {/* Stats ticker */}
          <motion.div
            className="flex items-center justify-center gap-6 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <div className="text-center">
              <div className="font-mono text-2xl font-bold glow-text">289</div>
              <div className="text-[10px] text-muted-foreground tracking-wider">小選挙区</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="font-mono text-2xl font-bold glow-text">175</div>
              <div className="text-[10px] text-muted-foreground tracking-wider">比例代表</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="font-mono text-2xl font-bold glow-text">11</div>
              <div className="text-[10px] text-muted-foreground tracking-wider">ブロック</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container py-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground tracking-wider">
            第51回衆議院議員総選挙（2026年2月8日執行）
          </span>
          <span className="text-[10px] text-muted-foreground">
            出典: Wikipedia
          </span>
        </div>
      </div>
    </div>
  );
}
