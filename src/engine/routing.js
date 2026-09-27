// Offline routing engine — Dijkstra shortest-path over the PCMC road graph.
// This is the deterministic fallback that always works (no network needed).
// It honours closed corridors, so cutting a bridge forces a live reroute or
// flags a settlement as cut off. Returns geometry the map can draw directly.

import { NODES, EDGES, edgeKm, edgeMinutes } from "../data/network.js";

function buildAdjacency(closedSet) {
  const adj = {};
  for (const id of Object.keys(NODES)) adj[id] = [];
  for (const e of EDGES) {
    if (closedSet.has(e.id)) continue;
    const w = edgeMinutes(e);
    const km = edgeKm(e);
    adj[e.a].push({ to: e.b, w, km, edge: e });
    adj[e.b].push({ to: e.a, w, km, edge: e });
  }
  return adj;
}

// Dijkstra from `from` to `to`. Returns {durationMin, distanceKm, path:[ids], edges:[ids]} or null.
export function shortestPath(from, to, closedSet = new Set()) {
  const adj = buildAdjacency(closedSet);
  const dist = {};
  const prev = {};
  const prevEdge = {};
  const visited = new Set();
  for (const id of Object.keys(NODES)) dist[id] = Infinity;
  dist[from] = 0;

  // simple array-based priority queue (graph is small)
  while (true) {
    let u = null;
    let best = Infinity;
    for (const id of Object.keys(dist)) {
      if (!visited.has(id) && dist[id] < best) {
        best = dist[id];
        u = id;
      }
    }
    if (u === null) break;
    if (u === to) break;
    visited.add(u);
    for (const { to: v, w } of adj[u]) {
      if (visited.has(v)) continue;
      const nd = dist[u] + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
        prevEdge[v] = null; // filled below
      }
    }
  }

  if (dist[to] === Infinity) return null;

  // reconstruct path
  const path = [];
  let cur = to;
  while (cur !== undefined) {
    path.unshift(cur);
    if (cur === from) break;
    cur = prev[cur];
  }
  if (path[0] !== from) return null;

  // resolve edges + distance along the path
  const edges = [];
  let distanceKm = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const e = EDGES.find(
      (ed) => !closedSet.has(ed.id) && ((ed.a === a && ed.b === b) || (ed.a === b && ed.b === a))
    );
    if (e) {
      edges.push(e.id);
      distanceKm += edgeKm(e);
    }
  }

  return {
    durationMin: dist[to],
    distanceKm,
    path,
    edges,
    coords: path.map((id) => [NODES[id].lat, NODES[id].lng]),
  };
}

// Compute routes from the base to every settlement for the current closures.
export function computeRoutes(settlementIds, closedSet = new Set(), from = "base") {
  const out = {};
  for (const id of settlementIds) {
    const r = shortestPath(from, id, closedSet);
    out[id] = r
      ? {
          reachable: true,
          durationMin: Math.round(r.durationMin),
          distanceKm: Math.round(r.distanceKm * 10) / 10,
          hops: r.path.length - 1,
          path: r.path,
          edges: r.edges,
          coords: r.coords,
          mode: "offline",
        }
      : { reachable: false, durationMin: null, distanceKm: null, hops: 0, path: [], edges: [], coords: [], mode: "offline" };
  }
  return out;
}
