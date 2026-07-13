/*
 * ProportionalBrowse.tsx — 比例代表当選者一覧画面
 * Design: Election Broadcast Dashboard
 * - 顔写真を大きく表示するカードグリッドレイアウト
 * - ブロック・政党・フリーワードで絞り込み可能
 * - 重複立候補マーク・惜敗率付き
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ChevronDown, X, LayoutGrid, List } from "lucide-react";
import BroadcastHeader from "@/components/BroadcastHeader";
import {
  PROPORTIONAL_WINNERS,
  PROPORTIONAL_BLOCKS,
  BLOCK_SEATS,
  type ProportionalWinner,
  type ProportionalBlock,
} from "@/lib/proportional_data";
import { getPartyColor, PARTY_COLORS } from "@/lib/types";

const PARTIES = Object.keys(PARTY_COLORS);

export default function ProportionalBrowse() {
  const [search, setSearch] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<ProportionalBlock | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return PROPORTIONAL_WINNERS.filter((w: ProportionalWinner) => {
      if (selectedBlock && w.block !== selectedBlock) return false;
      if (selectedParty && w.party !== selectedParty) return false;

      if (search.trim()) {
        const q = search.trim();
        const matchName = w.name.includes(q);
        const matchParty = w.party.includes(q);
        const matchBlock = w.block.includes(q);
        const matchDistrict = w.overlap_district?.includes(q) ?? false;
        if (!matchName && !matchParty && !matchBlock && !matchDistrict) return false;
      }

      return true;
    });
  }, [search, selectedBlock, selectedParty]);

  const filterCount = [selectedBlock !== null ? 1 : 0, selectedParty ? 1 : 0].reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background broadcast-grid">
      <BroadcastHeader
        title="衆議院比例代表クイズ"
        subtitle="当選者一覧"
        showBack
      />

      <main className="flex-1 container py-4 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="議員名・政党・ブロック・選挙区で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Block seats summary */}
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
            {PROPORTIONAL_BLOCKS.map((block) => {
              const seats = BLOCK_SEATS[block] ?? 0;
              const winners = PROPORTIONAL_WINNERS.filter(w => w.block === block);
              const isSelected = selectedBlock === block;
              return (
                <button
                  key={block}
                  onClick={() => setSelectedBlock(isSelected ? null : block)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg border text-center transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-[11px] font-bold">{block}</span>
                  <span className={`text-lg font-black leading-none ${isSelected ? '' : 'text-primary'}`}>{seats}</span>
                  <span className="text-[9px] text-muted-foreground">議席</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter toggle + view mode */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter className="w-4 h-4" />
            絞り込み
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            {filterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                {filterCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {filtered.length}件 / 全175人
            </p>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="グリッド表示"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="リスト表示"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3 p-4 rounded-lg bg-card border border-border overflow-hidden"
          >
            {/* Block filter */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">比例ブロック</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedBlock(null)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    selectedBlock === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  全て
                </button>
                {PROPORTIONAL_BLOCKS.map((block) => (
                  <button
                    key={block}
                    onClick={() => setSelectedBlock(selectedBlock === block ? null : block)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      selectedBlock === block
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {block}
                  </button>
                ))}
              </div>
            </div>

            {/* Party filter */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">政党</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedParty(null)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    !selectedParty
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  全て
                </button>
                {PARTIES.map((party: string) => (
                  <button
                    key={party}
                    onClick={() => setSelectedParty(selectedParty === party ? null : party)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      selectedParty === party
                        ? "text-white border-transparent"
                        : "border-border hover:border-primary/50"
                    }`}
                    style={
                      selectedParty === party
                        ? { backgroundColor: getPartyColor(party) }
                        : {}
                    }
                  >
                    {party}
                  </button>
                ))}
              </div>
            </div>

            {filterCount > 0 && (
              <button
                onClick={() => { setSelectedBlock(null); setSelectedParty(null); }}
                className="text-xs text-destructive hover:underline"
              >
                絞り込みをリセット
              </button>
            )}
          </motion.div>
        )}

        {/* Winner cards */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((winner: ProportionalWinner, i: number) => {
              const partyColor = getPartyColor(winner.party);
              const wikiUrl = `https://ja.wikipedia.org/wiki/${encodeURIComponent(winner.name)}`;

              return (
                <motion.div
                  key={`${winner.block}-${winner.rank}-${winner.name}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.015, 0.3) }}
                  className="rounded-xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-colors"
                >
                  {/* Photo area */}
                  <div
                    className="relative w-full aspect-[3/4] overflow-hidden"
                    style={{ borderBottom: `3px solid ${partyColor}` }}
                  >
                    {winner.photo ? (
                      <img
                        src={winner.photo}
                        alt={winner.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.style.backgroundColor = partyColor;
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-black text-4xl opacity-60">${winner.name.charAt(0)}</div>`;
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-black text-4xl opacity-60"
                        style={{ backgroundColor: partyColor }}
                      >
                        {winner.name.charAt(0)}
                      </div>
                    )}

                    {/* Overlap badge */}
                    {winner.is_overlap && (
                      <div className="absolute top-1.5 right-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500 text-white shadow">
                          復活
                        </span>
                      </div>
                    )}

                    {/* Block badge */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white shadow">
                        {winner.block}
                      </span>
                    </div>

                    {/* Party badge */}
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                      style={{ background: `linear-gradient(to top, ${partyColor}dd, transparent)` }}
                    >
                      <span className="text-[10px] font-semibold text-white drop-shadow">
                        {winner.party}
                      </span>
                    </div>
                  </div>

                  {/* Info area */}
                  <div className="p-2.5 space-y-0.5">
                    <a
                      href={wikiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black text-sm leading-tight hover:text-primary transition-colors block"
                    >
                      {winner.name}
                    </a>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      {winner.block}ブロック #{winner.rank}
                    </p>
                    {winner.is_overlap && winner.overlap_district && (
                      <p className="text-[10px] text-orange-400 leading-tight">
                        {winner.overlap_district}
                        {winner.recovery_rate && ` (惜敗率 ${winner.recovery_rate}%)`}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-1.5">
            {filtered.map((winner: ProportionalWinner, i: number) => {
              const partyColor = getPartyColor(winner.party);
              const wikiUrl = `https://ja.wikipedia.org/wiki/${encodeURIComponent(winner.name)}`;

              return (
                <motion.div
                  key={`${winner.block}-${winner.rank}-${winner.name}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: Math.min(i * 0.01, 0.2) }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
                  style={{ borderLeft: `3px solid ${partyColor}` }}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2"
                    style={{ borderColor: partyColor }}
                  >
                    {winner.photo ? (
                      <img
                        src={winner.photo}
                        alt={winner.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.style.backgroundColor = partyColor;
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-sm">${winner.name.charAt(0)}</div>`;
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: partyColor }}
                      >
                        {winner.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={wikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-sm hover:text-primary transition-colors truncate"
                      >
                        {winner.name}
                      </a>
                      {winner.is_overlap && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-orange-500 text-white flex-shrink-0">
                          復活
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-semibold">{winner.block}ブロック #{winner.rank}</span>
                      <span>·</span>
                      <span style={{ color: partyColor }}>{winner.party}</span>
                    </div>
                    {winner.is_overlap && winner.overlap_district && (
                      <p className="text-[10px] text-orange-400 truncate">
                        {winner.overlap_district}
                        {winner.recovery_rate && ` (${winner.recovery_rate}%)`}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">該当する議員が見つかりません</p>
          </div>
        )}
      </main>
    </div>
  );
}
