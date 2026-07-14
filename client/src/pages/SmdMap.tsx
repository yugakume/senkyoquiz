/*
 * SmdMap.tsx — 小選挙区マップ（当選党で塗り分け＋タップで開票結果）
 * Design: Election Broadcast Dashboard
 * 境界データ: gtfs-gis.jp/senkyoku（令和4年改訂289区, CC0 / 原典 東京大学 西沢明）
 * ピンチ/ホイールで拡大縮小・ドラッグで移動（依存追加なしの自前実装）
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, RotateCcw } from "lucide-react";
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

// viewBox は "0 0 W H"
const [, , VBW, VBH] = MAP_VIEWBOX.split(" ").map(Number);
const MIN_K = 1;
const MAX_K = 9;

interface Transform {
  k: number;
  x: number;
  y: number;
}

// 拡大時に地図が枠外へ飛ばないようクランプ
function clampTf(t: Transform): Transform {
  const k = Math.min(Math.max(t.k, MIN_K), MAX_K);
  const minX = VBW * (1 - k);
  const minY = VBH * (1 - k);
  return {
    k,
    x: Math.min(0, Math.max(minX, t.x)),
    y: Math.min(0, Math.max(minY, t.y)),
  };
}

export default function SmdMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeParty, setActiveParty] = useState<string | null>(null);
  const [tf, setTf] = useState<Transform>({ k: 1, x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDist = useRef<number | null>(null);
  const panned = useRef(false); // 直近ジェスチャで移動したか（タップ選択の抑止用）

  const selected = selectedId ? DISTRICT_BY_ID.get(selectedId) : null;

  // 選択中の区を最後に描画（枠を前面に）
  const ordered = useMemo(() => {
    if (!selectedId) return DISTRICT_SHAPES;
    return [...DISTRICT_SHAPES].sort((a, b) =>
      a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0,
    );
  }, [selectedId]);

  // 画面座標 → SVG(viewBox)座標
  const toSvg = useCallback((cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * VBW, y: ((cy - r.top) / r.height) * VBH };
  }, []);

  // (sx,sy) を固定点として factor 倍ズーム
  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    setTf((t) => {
      const k2 = Math.min(Math.max(t.k * factor, MIN_K), MAX_K);
      const x2 = sx - (sx - t.x) * (k2 / t.k);
      const y2 = sy - (sy - t.y) * (k2 / t.k);
      return clampTf({ k: k2, x: x2, y: y2 });
    });
  }, []);

  // ホイールズーム（passive:false が必要なのでネイティブに登録）
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const p = toSvg(ev.clientX, ev.clientY);
      zoomAt(p.x, p.y, ev.deltaY < 0 ? 1.15 : 1 / 1.15);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [toSvg, zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    svgRef.current?.setPointerCapture(e.pointerId);
    if (pointers.current.size === 0) panned.current = false;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const nx = e.clientX, ny = e.clientY;

    if (pointers.current.size >= 2) {
      pointers.current.set(e.pointerId, { x: nx, y: ny });
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist.current) {
        const mid = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
        zoomAt(mid.x, mid.y, dist / pinchDist.current);
      }
      pinchDist.current = dist;
      panned.current = true;
      return;
    }

    // 1本指: パン
    const dx = nx - prev.x, dy = ny - prev.y;
    pointers.current.set(e.pointerId, { x: nx, y: ny });
    if (Math.abs(dx) + Math.abs(dy) > 2) panned.current = true;
    const r = svgRef.current!.getBoundingClientRect();
    const sdx = (dx / r.width) * VBW;
    const sdy = (dy / r.height) * VBH;
    setTf((t) => clampTf({ ...t, x: t.x + sdx, y: t.y + sdy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
  };

  const zoomButton = (factor: number) => zoomAt(VBW / 2, VBH / 2, factor);
  const reset = () => setTf({ k: 1, x: 0, y: 0 });

  return (
    <div className="min-h-screen flex flex-col bg-background broadcast-grid">
      <BroadcastHeader title="小選挙区マップ" subtitle="当選党で塗り分け" showBack />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-5 lg:max-w-[1600px] lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start">
          {/* 左: 凡例 + 地図 */}
          <div className="min-w-0">
        {/* 凡例 */}
        <div className="flex flex-wrap gap-1.5 mb-3 lg:shrink-0">
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
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getPartyColor(party) }} />
                <span className="font-medium">{party}</span>
                <span className="tabular-nums text-muted-foreground">{n}</span>
              </button>
            );
          })}
        </div>

        {/* 地図 */}
        <div className="relative rounded-xl border border-border bg-card/40 p-2 overflow-hidden lg:h-[calc(100vh-11rem)] lg:flex lg:items-center lg:justify-center">
          {/* ズームコントロール */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
            <ZoomBtn label="拡大" onClick={() => zoomButton(1.5)}><Plus className="w-4 h-4" /></ZoomBtn>
            <ZoomBtn label="縮小" onClick={() => zoomButton(1 / 1.5)}><Minus className="w-4 h-4" /></ZoomBtn>
            <ZoomBtn label="リセット" onClick={reset}><RotateCcw className="w-3.5 h-3.5" /></ZoomBtn>
          </div>

          <svg
            ref={svgRef}
            viewBox={MAP_VIEWBOX}
            className="w-full h-auto lg:h-full lg:w-full select-none touch-none cursor-grab active:cursor-grabbing"
            role="img"
            aria-label="全国289小選挙区の当選党マップ"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={() => {
              if (panned.current) return;
              setSelectedId(null);
            }}
          >
            <g transform={`translate(${tf.x} ${tf.y}) scale(${tf.k})`}>
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
                    vectorEffect="non-scaling-stroke"
                    className="cursor-pointer transition-[fill-opacity]"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (panned.current) return;
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
                vectorEffect="non-scaling-stroke"
                rx={6}
              />
              <text x={OKINAWA_INSET.x + 6} y={OKINAWA_INSET.y + 16} fontSize={13} fill="rgba(255,255,255,0.6)">
                沖縄
              </text>
            </g>
          </svg>
        </div>

            <p className="text-[11px] text-muted-foreground mt-2 text-center lg:shrink-0">
              区をタップで開票結果・ピンチ／ホイールで拡大・ドラッグで移動
              <br />
              境界データ: gtfs-gis.jp（令和4年区割り, CC0 / 原典 東京大学 西沢明）
            </p>
          </div>

          {/* 右(PC): 選択区の詳細サイドバー / モバイルは地図の下に表示 */}
          <aside className="lg:h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-1">
            {selected ? (
              <DistrictDetail district={selected} />
            ) : (
              <div className="hidden lg:flex h-full items-center justify-center rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground text-center px-4">
                区をクリックすると
                <br />
                開票結果が表示されます
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function ZoomBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-md border border-border bg-card/90 backdrop-blur-sm text-foreground hover:bg-card active:scale-95 transition"
    >
      {children}
    </button>
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
