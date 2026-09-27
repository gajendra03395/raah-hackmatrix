import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Home, X, Navigation, MapPin } from "lucide-react";
import { NODES, EDGES, edgeMinutes } from "../data/network.js";
import { RISK } from "./ui/primitives.jsx";

const W = 1000;
const H = 620;
const px = (v) => (v / W) * 100;
const py = (v) => (v / H) * 100;

export default function MapPanel({ plan, selectedId, closedSet, onToggleRoad, onSelect }) {
  const [hoverEdge, setHoverEdge] = useState(null);

  const byId = useMemo(() => Object.fromEntries(plan.map((r) => [r.settlement.id, r])), [plan]);
  const selected = byId[selectedId];
  const activeEdges = useMemo(
    () => new Set(selected?.route?.edges || []),
    [selected]
  );

  const routePoints = useMemo(() => {
    if (!selected?.route) return null;
    return selected.route.nodes.map((id) => `${NODES[id].x},${NODES[id].y}`).join(" ");
  }, [selected]);

  const routeKey = `${selectedId}:${[...closedSet].sort().join(",")}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative mx-auto w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          style={{ overflow: "visible" }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EEF0F3" strokeWidth="1" />
            </pattern>
            <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#DCE7F5" />
              <stop offset="100%" stopColor="#CBDDF0" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={W} height={H} fill="url(#grid)" opacity="0.7" />

          {/* stylised river band winding through the district */}
          <path
            d="M 560,-20 C 520,140 700,200 640,320 C 590,430 760,470 720,640"
            fill="none"
            stroke="url(#river)"
            strokeWidth="46"
            strokeLinecap="round"
            opacity="0.55"
          />

          {/* roads */}
          {EDGES.map((e) => {
            const a = NODES[e.a];
            const b = NODES[e.b];
            const closed = closedSet.has(e.id);
            const active = activeEdges.has(e.id);
            const stroke = closed ? "#D2544F" : active ? "#3B6FE0" : "#C4CAD4";
            const width = active ? 5 : 3;
            return (
              <g key={e.id}>
                {/* wide invisible hit target */}
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="transparent"
                  strokeWidth="18"
                  className="cursor-pointer"
                  onClick={() => onToggleRoad(e.id)}
                  onMouseEnter={() => setHoverEdge(e.id)}
                  onMouseLeave={() => setHoverEdge((h) => (h === e.id ? null : h))}
                />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={stroke}
                  strokeWidth={width}
                  strokeLinecap="round"
                  strokeDasharray={closed ? "2 10" : undefined}
                  className="pointer-events-none transition-[stroke,stroke-width] duration-300"
                  opacity={closed ? 0.85 : hoverEdge === e.id ? 1 : 0.9}
                />
              </g>
            );
          })}

          {/* animated recommended route, drawn on top. Keyed so a change of
              selection or closure remounts it and replays the draw-in. */}
          {routePoints && (
            <g key={routeKey}>
              <motion.polyline
                points={routePoints}
                fill="none"
                stroke="#3B6FE0"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ pathLength: { duration: 0.9, ease: "easeInOut" }, opacity: { duration: 0.2 } }}
              />
              <polyline
                points={routePoints}
                fill="none"
                stroke="#93B4F0"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1 22"
                className="route-flow pointer-events-none"
                opacity="0.9"
              />
            </g>
          )}

          {/* closure X markers */}
          {EDGES.filter((e) => closedSet.has(e.id)).map((e) => {
            const a = NODES[e.a];
            const b = NODES[e.b];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <motion.g
                key={`x-${e.id}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                style={{ transformOrigin: `${mx}px ${my}px` }}
              >
                <circle cx={mx} cy={my} r="12" fill="#fff" stroke="#D2544F" strokeWidth="2" />
                <path
                  d={`M ${mx - 4},${my - 4} L ${mx + 4},${my + 4} M ${mx + 4},${my - 4} L ${mx - 4},${my + 4}`}
                  stroke="#D2544F"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </motion.g>
            );
          })}
        </svg>

        {/* node overlay (crisp icons + labels) */}
        {Object.values(NODES).map((n) => (
          <NodeMarker
            key={n.id}
            node={n}
            row={byId[n.id]}
            selected={selectedId === n.id}
            onSelect={onSelect}
          />
        ))}

        {/* hover road tooltip */}
        <EdgeTooltip edgeId={hoverEdge} closedSet={closedSet} />
      </div>

      <MapLegend />
    </div>
  );
}

function NodeMarker({ node, row, selected, onSelect }) {
  const left = `${px(node.x)}%`;
  const top = `${py(node.y)}%`;

  if (node.kind === "junction" || node.kind === "bridge") {
    return (
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left, top }}
        title={node.label}
      >
        <div
          className={`rounded-full border bg-white ${
            node.kind === "bridge" ? "h-3 w-3 border-ink-400" : "h-2 w-2 border-line-strong"
          }`}
        />
      </div>
    );
  }

  if (node.kind === "base") {
    return (
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left, top }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/40 bg-white text-accent shadow-subtle">
            <Home size={16} strokeWidth={2.2} />
          </div>
          <span className="rounded-md bg-white/80 px-1.5 text-[10px] font-semibold text-ink-700 backdrop-blur">
            Rescue Base
          </span>
        </div>
      </motion.div>
    );
  }

  // settlement
  const level = row?.risk.level || "low";
  const rk = RISK[level];
  const cut = row && !row.priority.reachable;
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(node.id)}
      className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      style={{ left, top }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="relative flex items-center justify-center">
          {(level === "critical" || cut) && (
            <span
              className="absolute inline-flex h-6 w-6 rounded-full"
              style={{ background: cut ? "#D2544F" : rk.hex, animation: "raah-pulse-ring 1.8s ease-out infinite" }}
            />
          )}
          <span
            className={`relative flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white shadow-subtle ${
              selected ? "ring-2 ring-accent ring-offset-2 ring-offset-paper" : ""
            }`}
            style={{ borderColor: cut ? "#D2544F" : rk.hex }}
          >
            {cut ? (
              <X size={12} strokeWidth={3} color="#D2544F" />
            ) : (
              <MapPin size={12} strokeWidth={2.4} color={rk.hex} />
            )}
          </span>
        </span>
        <span
          className={`rounded-md px-1.5 text-[10px] font-semibold backdrop-blur ${
            selected ? "bg-accent text-white" : "bg-white/80 text-ink-700"
          }`}
        >
          {node.label}
        </span>
      </div>
    </motion.button>
  );
}

function EdgeTooltip({ edgeId, closedSet }) {
  if (!edgeId) return null;
  const e = EDGES.find((x) => x.id === edgeId);
  if (!e) return null;
  const a = NODES[e.a];
  const b = NODES[e.b];
  const closed = closedSet.has(edgeId);
  const mx = px((a.x + b.x) / 2);
  const my = py((a.y + b.y) / 2);
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-white px-2 py-1 text-[10px] shadow-panel"
      style={{ left: `${mx}%`, top: `calc(${my}% - 14px)` }}
    >
      <span className="font-semibold text-ink-900">
        {NODES[e.a].label} ↔ {NODES[e.b].label}
      </span>
      <span className="ml-2 text-ink-400">{edgeMinutes(e)} min</span>
      <span className={`ml-2 font-medium ${closed ? "text-risk-critical" : "text-risk-low"}`}>
        {closed ? "Closed — click to reopen" : "Open — click to close"}
      </span>
    </div>
  );
}

function MapLegend() {
  const items = [
    { c: "#3B6FE0", label: "Recommended route" },
    { c: "#C4CAD4", label: "Open road" },
    { c: "#D2544F", label: "Closed / flooded" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-[11px] text-ink-500">
      <span className="inline-flex items-center gap-1 font-medium text-ink-700">
        <Navigation size={12} /> Click any road to close it — routes recompute live
      </span>
      <span className="ml-auto flex items-center gap-3">
        {items.map((it) => (
          <span key={it.label} className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full" style={{ background: it.c }} />
            {it.label}
          </span>
        ))}
      </span>
    </div>
  );
}
