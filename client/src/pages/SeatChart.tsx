/*
 * SeatChart.tsx — 議席数ビジュアルページ
 * Design: Election Broadcast Dashboard
 * - 政党別議席数（小選挙区・比例代表・合計）を視覚的に表示
 * - 半円型の議席配置図（議会スタイル）
 * - 棒グラフ・数値一覧
 */

import { useState } from "react";
import { motion } from "framer-motion";
import BroadcastHeader from "@/components/BroadcastHeader";
import { PARTY_COLORS, getPartyColor } from "@/lib/types";

// 第51回衆議院議員総選挙 政党別議席数
const SEAT_DATA = [
  { party: "自由民主党",     single: 248, proportional: 67,  total: 315 },
  { party: "中道改革連合",   single: 7,   proportional: 42,  total: 49  },
  { party: "日本維新の会",   single: 20,  proportional: 16,  total: 36  },
  { party: "国民民主党",     single: 8,   proportional: 20,  total: 28  },
  { party: "参政党",         single: 0,   proportional: 15,  total: 15  },
  { party: "チームみらい",   single: 0,   proportional: 11,  total: 11  },
  { party: "日本共産党",     single: 0,   proportional: 4,   total: 4   },
  { party: "無所属",         single: 5,   proportional: 0,   total: 5   },
  { party: "減税日本・ゆうこく連合", single: 1, proportional: 0, total: 1 },
];

const TOTAL_SEATS = 464; // 289 + 175
const MAJORITY = Math.floor(TOTAL_SEATS / 2) + 1; // 233

type ViewMode = "total" | "single" | "proportional";

// 半円議席配置図を生成
function HemicycleChart({ data, viewMode }: { data: typeof SEAT_DATA; viewMode: ViewMode }) {
  const totalSeats = data.reduce((s, d) => s + (viewMode === "total" ? d.total : viewMode === "single" ? d.single : d.proportional), 0);
  
  // 各政党のシート数を計算
  const parties = data
    .map(d => ({
      party: d.party,
      seats: viewMode === "total" ? d.total : viewMode === "single" ? d.single : d.proportional,
      color: getPartyColor(d.party),
    }))
    .filter(d => d.seats > 0);

  // 半円に配置するドット
  const ROWS = 6;
  const dots: { x: number; y: number; color: string; party: string }[] = [];

  // 利用可能なドット数を計算
  let totalDots = 0;
  for (let row = 0; row < ROWS; row++) {
    const radius = 45 + row * 8;
    totalDots += Math.round(Math.PI * radius / 6);
  }

  // 各政党の比率に応じてドット数を割り当て（端数はラウンド処理）
  const totalSeatsAll = parties.reduce((s, p) => s + p.seats, 0);
  let allocated = 0;
  const partyDots: { color: string; party: string }[] = [];
  parties.forEach((p, idx) => {
    const count = idx === parties.length - 1
      ? totalDots - allocated
      : Math.round((p.seats / totalSeatsAll) * totalDots);
    allocated += count;
    for (let i = 0; i < count; i++) {
      partyDots.push({ color: p.color, party: p.party });
    }
  });

  // ドットを半円上に配置
  let seatIdx = 0;
  for (let row = 0; row < ROWS; row++) {
    const radius = 45 + row * 8;
    const seatsInRow = Math.round(Math.PI * radius / 6);
    for (let i = 0; i < seatsInRow && seatIdx < partyDots.length; i++, seatIdx++) {
      const angle = Math.PI * (i / Math.max(seatsInRow - 1, 1));
      const x = 50 + radius * Math.cos(Math.PI - angle);
      const y = 85 - radius * Math.sin(Math.PI - angle);
      dots.push({ x, y, color: partyDots[seatIdx].color, party: partyDots[seatIdx].party });
    }
  }

  const majorityParty = parties[0];
  const majoritySeats = majorityParty?.seats || 0;
  const hasMajority = majoritySeats >= MAJORITY;

  return (
    <div className="relative w-full" style={{ paddingBottom: '55%' }}>
      <svg
        viewBox="0 0 100 90"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* 過半数ライン */}
        <line x1="50" y1="5" x2="50" y2="88" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" strokeDasharray="1,1" />
        <text x="51" y="10" fontSize="2.5" fill="rgba(255,255,255,0.4)" fontFamily="monospace">過半数 {MAJORITY}</text>

        {/* ドット */}
        {dots.map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r="1.8"
            fill={dot.color}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.002 }}
          />
        ))}

        {/* 中央の議席数表示 */}
        <text x="50" y="78" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" fontFamily="monospace">
          {totalSeats}
        </text>
        <text x="50" y="83" textAnchor="middle" fontSize="2.5" fill="rgba(255,255,255,0.6)" fontFamily="sans-serif">
          議席
        </text>
      </svg>
    </div>
  );
}

export default function SeatChart() {
  const [viewMode, setViewMode] = useState<ViewMode>("total");

  const viewLabel = viewMode === "total" ? "合計" : viewMode === "single" ? "小選挙区" : "比例代表";
  const totalSeats = SEAT_DATA.reduce((s, d) => s + (viewMode === "total" ? d.total : viewMode === "single" ? d.single : d.proportional), 0);
  const maxSeats = Math.max(...SEAT_DATA.map(d => viewMode === "total" ? d.total : viewMode === "single" ? d.single : d.proportional));

  return (
    <div className="min-h-screen flex flex-col bg-background broadcast-grid">
      <BroadcastHeader
        title="衆議院議員当選者クイズ"
        subtitle="議席数ビジュアル"
        showBack
      />

      <main className="flex-1 container py-6 pb-12 max-w-lg mx-auto w-full">
        {/* タブ切り替え */}
        <div className="flex gap-1 p-1 bg-card rounded-lg border border-border mb-6">
          {(["total", "single", "proportional"] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                viewMode === mode
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "total" ? "合計" : mode === "single" ? "小選挙区" : "比例代表"}
            </button>
          ))}
        </div>

        {/* 半円議席図 */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold">{viewLabel} 議席配置</h2>
            <span className="text-xs text-muted-foreground font-mono">{totalSeats}議席</span>
          </div>
          <HemicycleChart data={SEAT_DATA} viewMode={viewMode} />
          {/* 凡例 */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
            {SEAT_DATA.filter(d => (viewMode === "total" ? d.total : viewMode === "single" ? d.single : d.proportional) > 0).map(d => (
              <div key={d.party} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPartyColor(d.party) }} />
                <span className="text-[10px] text-muted-foreground">{d.party}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 棒グラフ + 数値一覧 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold">政党別議席数</h2>
            <span className="text-xs text-muted-foreground">過半数: {MAJORITY}議席</span>
          </div>
          <div className="divide-y divide-border">
            {SEAT_DATA
              .filter(d => (viewMode === "total" ? d.total : viewMode === "single" ? d.single : d.proportional) > 0)
              .sort((a, b) => {
                const va = viewMode === "total" ? a.total : viewMode === "single" ? a.single : a.proportional;
                const vb = viewMode === "total" ? b.total : viewMode === "single" ? b.single : b.proportional;
                return vb - va;
              })
              .map((d, i) => {
                const seats = viewMode === "total" ? d.total : viewMode === "single" ? d.single : d.proportional;
                const pct = (seats / maxSeats) * 100;
                const color = getPartyColor(d.party);
                return (
                  <motion.div
                    key={d.party}
                    className="px-4 py-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm font-bold flex-1">{d.party}</span>
                      <span className="font-mono text-base font-black" style={{ color }}>{seats}</span>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {((seats / totalSeats) * 100).toFixed(1)}%
                      </span>
                    </div>
                    {/* 棒グラフ */}
                    <div className="h-2 rounded-full bg-muted overflow-hidden ml-5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 + 0.2 }}
                      />
                    </div>
                    {/* 小選挙区/比例の内訳（合計表示時） */}
                    {viewMode === "total" && (
                      <div className="flex gap-3 mt-1 ml-5">
                        <span className="text-[10px] text-muted-foreground">
                          小選挙区 <span className="font-mono font-bold text-foreground/70">{d.single}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          比例 <span className="font-mono font-bold text-foreground/70">{d.proportional}</span>
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </div>
          {/* 過半数ライン表示 */}
          <div className="px-4 py-3 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">自民党は過半数（{MAJORITY}議席）を</span>
              <span className={`font-bold ${SEAT_DATA[0].total >= MAJORITY ? "text-green-400" : "text-red-400"}`}>
                {SEAT_DATA[0].total >= MAJORITY ? `${SEAT_DATA[0].total - MAJORITY + 1}議席上回っている` : "下回っている"}
              </span>
            </div>
          </div>
        </div>

        {/* 注記 */}
        <p className="text-[10px] text-muted-foreground text-center mt-4">
          第51回衆議院議員総選挙（2026年2月8日）確定結果 / 出典: Wikipedia
        </p>
      </main>
    </div>
  );
}
