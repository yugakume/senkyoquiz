/*
 * Browse.tsx — 当選者一覧画面
 * Design: Election Broadcast Dashboard
 * - 顔写真を大きく表示するカードグリッドレイアウト
 * - 都道府県・政党・フリーワードで絞り込み可能
 * - 比例復活マーク・地域名・得票率付き
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ChevronDown, X, LayoutGrid, List } from "lucide-react";
import BroadcastHeader from "@/components/BroadcastHeader";
import { ELECTION_DATA, type DistrictData, type CandidateData } from "@/lib/election_data";
import { getCandidatePhoto } from "@/lib/candidate_photos";
import { DISTRICT_AREAS } from "@/lib/district_areas";
import { isRevivalCandidate } from "@/lib/revival_data";
import { getPartyColor, PARTY_COLORS, type Prefecture } from "@/lib/types";

const PARTIES = Object.keys(PARTY_COLORS);

const PREFECTURES: Prefecture[] = [
  { id: 1, name_ja: "北海道" }, { id: 2, name_ja: "青森県" },
  { id: 3, name_ja: "岩手県" }, { id: 4, name_ja: "宮城県" },
  { id: 5, name_ja: "秋田県" }, { id: 6, name_ja: "山形県" },
  { id: 7, name_ja: "福島県" }, { id: 8, name_ja: "茨城県" },
  { id: 9, name_ja: "栃木県" }, { id: 10, name_ja: "群馬県" },
  { id: 11, name_ja: "埼玉県" }, { id: 12, name_ja: "千葉県" },
  { id: 13, name_ja: "東京都" }, { id: 14, name_ja: "神奈川県" },
  { id: 15, name_ja: "新潟県" }, { id: 16, name_ja: "富山県" },
  { id: 17, name_ja: "石川県" }, { id: 18, name_ja: "福井県" },
  { id: 19, name_ja: "山梨県" }, { id: 20, name_ja: "長野県" },
  { id: 21, name_ja: "岐阜県" }, { id: 22, name_ja: "静岡県" },
  { id: 23, name_ja: "愛知県" }, { id: 24, name_ja: "三重県" },
  { id: 25, name_ja: "滋賀県" }, { id: 26, name_ja: "京都府" },
  { id: 27, name_ja: "大阪府" }, { id: 28, name_ja: "兵庫県" },
  { id: 29, name_ja: "奈良県" }, { id: 30, name_ja: "和歌山県" },
  { id: 31, name_ja: "鳥取県" }, { id: 32, name_ja: "島根県" },
  { id: 33, name_ja: "岡山県" }, { id: 34, name_ja: "広島県" },
  { id: 35, name_ja: "山口県" }, { id: 36, name_ja: "徳島県" },
  { id: 37, name_ja: "香川県" }, { id: 38, name_ja: "愛媛県" },
  { id: 39, name_ja: "高知県" }, { id: 40, name_ja: "福岡県" },
  { id: 41, name_ja: "佐賀県" }, { id: 42, name_ja: "長崎県" },
  { id: 43, name_ja: "熊本県" }, { id: 44, name_ja: "大分県" },
  { id: 45, name_ja: "宮崎県" }, { id: 46, name_ja: "鹿児島県" },
  { id: 47, name_ja: "沖縄県" },
];

export default function Browse() {
  const [search, setSearch] = useState("");
  const [selectedPref, setSelectedPref] = useState<number | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return ELECTION_DATA.filter((d: DistrictData) => {
      const winner = d.c.find((c: CandidateData) => c.w);
      if (!winner) return false;

      if (selectedPref !== null && d.p !== selectedPref) return false;
      if (selectedParty && winner.t !== selectedParty) return false;

      if (search.trim()) {
        const q = search.trim();
        const matchName = winner.n.includes(q);
        const matchDistrict = d.n.includes(q);
        const matchParty = winner.t.includes(q);
        const area = DISTRICT_AREAS[d.id] || "";
        const matchArea = area.includes(q);
        if (!matchName && !matchDistrict && !matchParty && !matchArea) return false;
      }

      return true;
    });
  }, [search, selectedPref, selectedParty]);

  const filterCount = [selectedPref !== null ? 1 : 0, selectedParty ? 1 : 0].reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background broadcast-grid">
      <BroadcastHeader
        title="衆議院議員当選者クイズ"
        subtitle="当選者一覧"
        showBack
      />

      <main className="flex-1 container py-4 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="議員名・選挙区・政党・地域名で検索..."
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

        {/* Filter toggle */}
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
              {filtered.length}件 / 全289区
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
            {/* Prefecture filter */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">都道府県</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedPref(null)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    selectedPref === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  全て
                </button>
                {PREFECTURES.map((pref: Prefecture) => (
                  <button
                    key={pref.id}
                    onClick={() => setSelectedPref(pref.id === selectedPref ? null : pref.id)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      selectedPref === pref.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {pref.name_ja}
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
                onClick={() => { setSelectedPref(null); setSelectedParty(null); }}
                className="text-xs text-destructive hover:underline"
              >
                絞り込みをリセット
              </button>
            )}
          </motion.div>
        )}

        {/* District cards */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((district: DistrictData, i: number) => {
              const winner = district.c.find((c: CandidateData) => c.w);
              if (!winner) return null;
              const photoUrl = getCandidatePhoto(district.id);
              const area = DISTRICT_AREAS[district.id];
              const isRevival = isRevivalCandidate(district.id, winner.n);
              const partyColor = getPartyColor(winner.t);
              const wikiUrl = `https://ja.wikipedia.org/wiki/${encodeURIComponent(winner.n)}`;

              return (
                <motion.div
                  key={district.id}
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
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={winner.n}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.style.backgroundColor = partyColor;
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-black text-4xl opacity-60">${winner.n.charAt(0)}</div>`;
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-black text-4xl opacity-60"
                        style={{ backgroundColor: partyColor }}
                      >
                        {winner.n.charAt(0)}
                      </div>
                    )}

                    {/* Revival badge */}
                    {isRevival && (
                      <div className="absolute top-1.5 right-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500 text-white shadow">
                          比当
                        </span>
                      </div>
                    )}

                    {/* Party badge */}
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                      style={{ background: `linear-gradient(to top, ${partyColor}dd, transparent)` }}
                    >
                      <span className="text-[10px] font-semibold text-white drop-shadow">
                        {winner.t}
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
                      {winner.n}
                    </a>
                    <p className="text-[11px] font-semibold text-muted-foreground">{district.n}</p>
                    {area && (
                      <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                        {area}
                      </p>
                    )}
                    {winner.s != null && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(winner.s, 100)}%`, backgroundColor: partyColor }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{winner.s}%</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-1.5">
            {filtered.map((district: DistrictData, i: number) => {
              const winner = district.c.find((c: CandidateData) => c.w);
              if (!winner) return null;
              const photoUrl = getCandidatePhoto(district.id);
              const area = DISTRICT_AREAS[district.id];
              const isRevival = isRevivalCandidate(district.id, winner.n);
              const partyColor = getPartyColor(winner.t);
              const wikiUrl = `https://ja.wikipedia.org/wiki/${encodeURIComponent(winner.n)}`;

              return (
                <motion.div
                  key={district.id}
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
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={winner.n}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.style.backgroundColor = partyColor;
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-sm">${winner.n.charAt(0)}</div>`;
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: partyColor }}
                      >
                        {winner.n.charAt(0)}
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
                        {winner.n}
                      </a>
                      {isRevival && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-orange-500 text-white flex-shrink-0">
                          比当
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-semibold">{district.n}</span>
                      <span>·</span>
                      <span style={{ color: partyColor }}>{winner.t}</span>
                    </div>
                    {area && (
                      <p className="text-[10px] text-muted-foreground truncate">{area}</p>
                    )}
                  </div>

                  {/* Vote rate */}
                  {winner.s != null && (
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-mono text-muted-foreground">{winner.s}%</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">該当する選挙区が見つかりません</p>
          </div>
        )}
      </main>
    </div>
  );
}
