/*
 * SmdMap.tsx — 小選挙区マップ（当選党で塗り分け＋タップで開票結果）
 * Design: Election Broadcast Dashboard
 * 境界データ: gtfs-gis.jp/senkyoku（令和4年改訂289区, CC0 / 原典 東京大学 西沢明）
 */

import { useMemo, useState } from "react";
import BroadcastHeader from "@/components/BroadcastHeader";
import { DISTRICT_SHAPES, MAP_VIEWBOX, OKINAWA_INSET } from "@/lib/district_map";
import { getPartyColor } from "@/lib/types";
import { ELECTION_DATA, type DistrictData } from "@/lib/election_data";
import { DISTRICT_AREAS } from "@/lib/district_areas";
import { getCandidatePhoto } from "@/lib/candidate_photos";
import { isRevivalCandidate } from "@/lib/revival_data";

const DISTRICT_BY_ID = new Map<string, DistrictData>(
  ELECTION_DATA.map((d) => [d.id, d]),
);

// 凡例（当選議席数の多い順）
const LEGEND = (() => {
  const counts: Record<string, number> = {};
  for (const s of DISTRICT_SHAPES) counts[s.party] = (counts[s.party] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
})();

export default function SmdMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeParty, setActiveParty] = useState<string | null>(null);

  const selected = selectedId ? DISTRICT_BY_ID.get(selectedId) : null;

  // 選択中の区を最後に描画（枠を前面に）
  const ordered = useMemo(() => {
    if (!selectedId) return DISTRICT_SHAPES;
    return [...DISTRICT_SHAPES].sort((a, b) =>
      a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0,
    );
  }, [selectedId]);

  return (
    <div className="min-h-screen flex flex-col bg-background broadcast-grid">
      <BroadcastHeader
        title="小選挙区マップ"
        subtitle="当選党で塗り分け"
        showBack
      />

      <main className="flex-1 container max-w-2xl py-5">
        {/* 凡例 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {LEGEND.map(([party, n]) => {
            const on = activeParty === party;
            return (
              <button
                key={party}
                onClick={() => setActiveParty(on ? null : party)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  on ? "border-white/60 bg-white/10" : "border-white/10 bg-card/60"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: getPartyColor(party) }}
                />
                <span className="font-medium">{party}</span>
                <span className="tabular-nums text-muted-foreground">{n}</span>
              </button>
            );
          })}
        </div>

        {/* 地図 */}
        <div className="rounded-xl border border-border bg-card/40 p-2">
          <svg
            viewBox={MAP_VIEWBOX}
            className="w-full h-auto select-none"
            role="img"
            aria-label="全国289小選挙区の当選党マップ"
            onClick={() => setSelectedId(null)}
          >
            {ordered.map((s) => {
              const isSel = s.id === selectedId;
              const dim = activeParty != null && s.party !== activeParty;
              return (
                <path
                  key={s.id}
                  d={s.d}
                  fill={getPartyColor(s.party)}
                  fillOpacity={dim ? 0.12 : 1}
                  stroke={isSel ? "#ffffff" : "rgba(10,22,40,0.55)"}
                  strokeWidth={isSel ? 3 : 0.5}
                  className="cursor-pointer transition-[fill-opacity]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(s.id);
                  }}
                >
                  <title>{`${s.name}（${s.party}）`}</title>
                </path>
              );
            })}

            {/* 沖縄インセット枠 */}
            <rect
              x={OKINAWA_INSET.x}
              y={OKINAWA_INSET.y}
              width={OKINAWA_INSET.w}
              height={OKINAWA_INSET.h}
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1}
              rx={6}
            />
            <text
              x={OKINAWA_INSET.x + 6}
              y={OKINAWA_INSET.y + 16}
              fontSize={13}
              fill="rgba(255,255,255,0.6)"
            >
              沖縄
            </text>
          </svg>
        </div>

        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          区をタップで開票結果を表示・凡例で政党を絞り込み
          <br />
          境界データ: gtfs-gis.jp（令和4年区割り, CC0 / 原典 東京大学 西沢明）
        </p>

        {/* 選択区の詳細 */}
        {selected && <DistrictDetail district={selected} />}
      </main>
    </div>
  );
}

function DistrictDetail({ district }: { district: DistrictData }) {
  const winner = district.c.find((c) => c.w) || district.c[0];
  const area = DISTRICT_AREAS[district.id] || "";
  const photo = getCandidatePhoto(district.id);
  const maxVotes = Math.max(...district.c.map((c) => c.v || 0), 1);

  return (
    <div className="mt-4 rounded-lg border-2 border-border bg-card/70 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-start gap-3 p-3 border-b border-border">
        {photo && (
          <img
            src={photo}
            alt={winner.n}
            className="w-14 h-18 object-cover object-top rounded-md border border-border shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-black tracking-tight">{district.n}</h3>
          {area && <p className="text-[11px] text-muted-foreground line-clamp-2">{area}</p>}
          <p className="text-sm mt-1">
            当選：<span className="font-bold">{winner.n}</span>
            <span className="ml-2 text-xs" style={{ color: getPartyColor(winner.t) }}>
              {winner.t}
            </span>
          </p>
        </div>
      </div>

      {/* 開票結果 */}
      <div className="divide-y divide-border">
        {district.c.map((row) => {
          const revival = isRevivalCandidate(district.id, row.n);
          const barPct = maxVotes > 0 ? Math.round((row.v / maxVotes) * 100) : 0;
          const barColor = row.w ? "#e74c3c" : revival ? "#f39c12" : getPartyColor(row.t);
          return (
            <div key={row.r} className={`px-3 py-2 ${row.w ? "bg-correct/5" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="w-4 text-xs font-mono text-muted-foreground text-right shrink-0">{row.r}</span>
                {row.w && <span className="px-1 py-0.5 bg-[#e74c3c] rounded text-[10px] font-black shrink-0">当</span>}
                {revival && <span className="px-1 py-0.5 bg-[#f39c12] text-white rounded text-[10px] font-black shrink-0">比当</span>}
                {!row.w && !revival && <span className="w-[26px] shrink-0" />}
                <span className="font-medium text-sm flex-1 min-w-0 truncate">{row.n}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded shrink-0"
                  style={{ color: getPartyColor(row.t), backgroundColor: getPartyColor(row.t) + "15" }}
                >
                  {row.t}
                </span>
                <span className="font-mono text-xs text-muted-foreground w-16 text-right shrink-0">
                  {row.v.toLocaleString()}
                </span>
              </div>
              {row.v > 0 && (
                <div className="mt-1 ml-[52px] flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${barPct}%`, backgroundColor: barColor, opacity: row.w ? 1 : 0.55 }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-9 text-right shrink-0">
                    {row.s != null ? `${row.s.toFixed(1)}%` : `${barPct}%`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {district.u && (
        <div className="px-3 py-1.5 bg-card/40 border-t border-border">
          <a href={district.u} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">
            Wikipedia で詳細を見る →
          </a>
        </div>
      )}
    </div>
  );
}
