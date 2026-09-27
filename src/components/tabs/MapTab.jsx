// Map & Routing tab — a real OpenStreetMap view of Pimpri-Chinchwad with the
// live road network drawn on top. Click any road to close it; the recommended
// route to the selected settlement redraws immediately. When an OpenRouteService
// key is supplied the route follows real roads and reroutes around closures;
// otherwise the deterministic offline engine keeps everything working.

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { Radio, WifiOff, KeyRound, Route as RouteIcon, Ban } from "lucide-react";
import { NODES, EDGES, BASE, edgeMinutes } from "../../data/network.js";
import { RISK } from "../ui/primitives.jsx";

const ll = (id) => [NODES[id].lat, NODES[id].lng];

const baseIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px)">
    <div style="width:30px;height:30px;border-radius:9px;background:#fff;border:1.5px solid rgba(59,111,224,.45);
      box-shadow:0 1px 4px rgba(21,24,30,.18);display:flex;align-items:center;justify-content:center;color:#3B6FE0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>
    <span style="margin-top:3px;background:rgba(255,255,255,.85);border-radius:5px;padding:0 5px;font:600 10px Inter,sans-serif;color:#2B303B">Rescue Base</span>
  </div>`,
  iconSize: [90, 46],
  iconAnchor: [45, 23],
});

const closureIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid #D2544F;
    display:flex;align-items:center;justify-content:center;color:#D2544F;font:700 11px Inter,sans-serif;
    box-shadow:0 1px 3px rgba(21,24,30,.2)">✕</div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    const pts = Object.values(NODES).map((n) => [n.lat, n.lng]);
    map.fitBounds(L.latLngBounds(pts).pad(0.12), { animate: false });
  }, [map]);
  return null;
}

export default function MapTab({
  plan,
  selectedId,
  closedSet,
  onToggleRoad,
  onSelect,
  routingMode,
  orsKey,
  liveStatus,
  onSetOrsKey,
  theme,
}) {
  const byId = useMemo(() => Object.fromEntries(plan.map((r) => [r.settlement.id, r])), [plan]);
  const selected = byId[selectedId];
  const routeCoords = selected?.route?.reachable ? selected.route.coords : null;
  const routeKey = `${selectedId}:${routingMode}:${[...closedSet].sort().join(",")}`;
  const dark = theme === "dark";

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-paper-panel shadow-subtle">
      <MapContainer
        center={[18.626, 73.79]}
        zoom={12}
        zoomControl={false}
        className="absolute inset-0 h-full w-full"
        style={{ background: dark ? "#10141b" : "#EDF1F5" }}
      >
        {dark ? (
          <TileLayer
            key="carto-dark"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            maxZoom={20}
          />
        ) : (
          <TileLayer
            key="osm-light"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
            maxZoom={19}
          />
        )}
        <FitBounds />

        {/* roads */}
        {EDGES.map((e) => {
          const closed = closedSet.has(e.id);
          const onRoute = !!selected?.route?.edges?.includes(e.id);
          const color = closed ? "#D2544F" : onRoute ? "#3B6FE0" : "#8A93A3";
          return (
            <Polyline
              key={e.id}
              positions={[ll(e.a), ll(e.b)]}
              pathOptions={{
                color,
                weight: onRoute ? 6 : closed ? 4 : 3,
                opacity: closed ? 0.9 : onRoute ? 0.95 : 0.6,
                dashArray: closed ? "3 9" : undefined,
                lineCap: "round",
              }}
              eventHandlers={{ click: () => onToggleRoad(e.id) }}
            >
              <Tooltip sticky>
                <span style={{ fontWeight: 600 }}>{e.name}</span>
                <br />
                {Math.round(edgeMinutes(e))} min · {closed ? "Closed — click to reopen" : "Open — click to close"}
              </Tooltip>
            </Polyline>
          );
        })}

        {/* recommended route to the selected settlement (halo + line) */}
        {routeCoords && routeCoords.length > 1 && (
          <>
            <Polyline
              key={`halo-${routeKey}`}
              positions={routeCoords}
              pathOptions={{ color: "#FFFFFF", weight: 9, opacity: 0.9, lineCap: "round" }}
            />
            <Polyline
              key={`line-${routeKey}`}
              positions={routeCoords}
              pathOptions={{ color: "#3B6FE0", weight: 5, opacity: 1, lineCap: "round" }}
            />
          </>
        )}

        {/* closure markers */}
        {EDGES.filter((e) => closedSet.has(e.id)).map((e) => {
          const a = NODES[e.a];
          const b = NODES[e.b];
          return (
            <Marker
              key={`x-${e.id}`}
              position={[(a.lat + b.lat) / 2, (a.lng + b.lng) / 2]}
              icon={closureIcon}
              eventHandlers={{ click: () => onToggleRoad(e.id) }}
            />
          );
        })}

        {/* base */}
        <Marker position={[BASE.lat, BASE.lng]} icon={baseIcon} />

        {/* settlements */}
        {plan.map((row) => {
          const s = row.settlement;
          const rk = RISK[row.risk.level];
          const cut = !row.priority.reachable;
          const isSel = selectedId === s.id;
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={isSel ? 11 : 8}
              pathOptions={{
                color: cut ? "#D2544F" : rk.hex,
                weight: isSel ? 4 : 2.5,
                fillColor: cut ? "#D2544F" : rk.hex,
                fillOpacity: isSel ? 0.85 : 0.55,
              }}
              eventHandlers={{ click: () => onSelect(s.id) }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]} className="raah-map-label">
                {s.label}
              </Tooltip>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "#5A6472", marginBottom: 4 }}>
                    {s.river} river · {s.population.toLocaleString()} people
                  </div>
                  <div style={{ fontSize: 11.5 }}>
                    Risk: <b style={{ color: rk.hex }}>{rk.label}</b>
                    <br />
                    Gauge {s.waterLevel} cm · elev {s.elevation} m
                    <br />
                    {cut ? (
                      <b style={{ color: "#D2544F" }}>Cut off — no open road</b>
                    ) : (
                      <>Reach: {row.priority.travelMin} min from base</>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* overlays */}
      <div className="pointer-events-none absolute inset-0 z-[1000] flex flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-3">
          <RerouteStatus closedCount={closedSet.size} routingMode={routingMode} selected={selected} />
          <OrsControl orsKey={orsKey} liveStatus={liveStatus} routingMode={routingMode} onSetOrsKey={onSetOrsKey} />
        </div>
        <MapLegend />
      </div>
    </div>
  );
}

function RerouteStatus({ closedCount, routingMode, selected }) {
  const cut = selected && !selected.priority.reachable;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-auto max-w-[260px] rounded-xl border border-line bg-paper-panel/95 px-3 py-2 shadow-panel backdrop-blur"
    >
      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-900">
        <RouteIcon size={13} className="text-accent" />
        {closedCount > 0
          ? `${closedCount} road${closedCount > 1 ? "s" : ""} closed — rerouted`
          : "Network clear"}
      </div>
      {selected && (
        <div className="mt-0.5 text-[11px] text-ink-500">
          {cut ? (
            <span className="inline-flex items-center gap-1 font-medium text-risk-critical">
              <Ban size={11} /> {selected.settlement.label} cut off — boat/air only
            </span>
          ) : (
            <>
              {selected.settlement.label}: {selected.route.distanceKm} km ·{" "}
              {selected.priority.travelMin} min
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

function OrsControl({ orsKey, liveStatus, routingMode, onSetOrsKey }) {
  const live = routingMode === "live";
  return (
    <div className="pointer-events-auto w-[210px] rounded-xl border border-line bg-paper-panel/95 p-2.5 shadow-panel backdrop-blur">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-ink-700">
        {live ? (
          <Radio size={12} className="text-risk-low" />
        ) : (
          <WifiOff size={12} className="text-ink-400" />
        )}
        {live ? "Live routing (ORS)" : "Offline routing"}
        {liveStatus === "loading" && <span className="text-[10px] text-ink-400">· syncing…</span>}
        {liveStatus === "error" && <span className="text-[10px] text-risk-high">· key/API issue</span>}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-ink-400">
          <KeyRound size={12} />
        </span>
        <input
          type="password"
          defaultValue={orsKey}
          placeholder="Paste ORS API key"
          onBlur={(e) => onSetOrsKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSetOrsKey(e.currentTarget.value)}
          className="w-full rounded-md border border-line bg-paper-sunken px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accent"
        />
      </div>
      <p className="mt-1 text-[9.5px] leading-tight text-ink-400">
        Optional — real road-following routes. Blank uses the offline engine.
      </p>
    </div>
  );
}

function MapLegend() {
  const items = [
    { c: "#3B6FE0", label: "Recommended route" },
    { c: "#8A93A3", label: "Open road" },
    { c: "#D2544F", label: "Closed / flooded" },
  ];
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-1 self-start rounded-xl border border-line bg-paper-panel/95 px-3 py-1.5 text-[11px] text-ink-500 shadow-panel backdrop-blur">
      <span className="font-medium text-ink-700">Click a road to close it — routes recompute live</span>
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full" style={{ background: it.c }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

