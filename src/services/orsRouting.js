// Live routing via OpenRouteService (real road-following routes + true
// rerouting around closed roads using avoid_polygons). This is an *enhancement*
// layered on top of the offline engine: if a key is missing or a call fails,
// the caller keeps the deterministic offline route, so the app never breaks.
//
// Get a free key at https://openrouteservice.org/dev/#/signup and either set
// VITE_ORS_API_KEY in a .env file or paste it into the Map tab.

import { BASE, SETTLEMENTS, EDGES, edgeMidpoint } from "../data/network.js";

const ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

// Build a GeoJSON MultiPolygon covering each closed corridor, so ORS routes
// avoid them. Each closed edge becomes a small square around its midpoint.
function buildAvoidPolygons(closedEdgeIds) {
  const d = 0.0016; // ~170 m half-width
  const polys = [];
  for (const id of closedEdgeIds) {
    const edge = EDGES.find((e) => e.id === id);
    if (!edge) continue;
    const m = edgeMidpoint(edge);
    polys.push([
      [
        [m.lng - d, m.lat - d],
        [m.lng + d, m.lat - d],
        [m.lng + d, m.lat + d],
        [m.lng - d, m.lat + d],
        [m.lng - d, m.lat - d],
      ],
    ]);
  }
  if (!polys.length) return null;
  return { type: "MultiPolygon", coordinates: polys };
}

async function fetchOne(settlement, avoid, apiKey, signal) {
  const body = {
    coordinates: [
      [BASE.lng, BASE.lat],
      [settlement.lng, settlement.lat],
    ],
  };
  if (avoid) body.options = { avoid_polygons: avoid };

  const res = await fetch(ORS_URL, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
      Accept: "application/geo+json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    // 404/2010 == no routable path (treat as cut off); other codes == error.
    let code = null;
    try {
      const j = await res.json();
      code = j?.error?.code ?? null;
    } catch {
      /* ignore */
    }
    if (res.status === 404 || code === 2010) {
      return { reachable: false, coords: [], distanceKm: null, durationMin: null, mode: "live" };
    }
    throw new Error(`ORS ${res.status}`);
  }

  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat) throw new Error("ORS empty response");
  const summary = feat.properties?.summary || {};
  return {
    reachable: true,
    coords: feat.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: summary.distance != null ? Math.round((summary.distance / 1000) * 10) / 10 : null,
    durationMin: summary.duration != null ? Math.round(summary.duration / 60) : null,
    mode: "live",
  };
}

// Returns { routes: { [id]: route }, failed: [ids] }. Never throws for a single
// settlement — failures are reported so the caller can fall back per-settlement.
export async function fetchLiveRoutes(settlementIds, closedEdgeIds, apiKey, signal) {
  const avoid = buildAvoidPolygons(closedEdgeIds);
  const routes = {};
  const failed = [];

  const results = await Promise.allSettled(
    settlementIds.map((id) => fetchOne(SETTLEMENTS[id], avoid, apiKey, signal))
  );

  results.forEach((r, i) => {
    const id = settlementIds[i];
    if (r.status === "fulfilled") routes[id] = { ...r.value, hops: null, edges: [], path: [] };
    else failed.push(id);
  });

  return { routes, failed };
}
