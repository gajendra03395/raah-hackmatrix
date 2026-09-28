# RAAH — Risk-Aware Aid & Access Hub

A working prototype of the **Local Disaster Warning & Response Coordination Platform**
(HackMatrix 5.0 · Team UnScripted).

> When every minute matters, every route matters.

RAAH turns fragmented flood information — hazard warnings, settlement vulnerability,
road accessibility and field reports — into a single, coordinated, **evidence-backed
rescue plan** that recalculates the moment conditions change. It is set in **Pimpri-Chinchwad
(PCMC), Pune**, along the Pavana, Mula and Indrayani rivers, and runs over a **real
OpenStreetMap** view of the city.

## Run it

```bash
cd raah-prototype
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).
Build for production with `npm run build` and preview with `npm run preview`.

> Requires Node 18+ and internet access — for the initial `npm install`, and at runtime
> for the OpenStreetMap map tiles (and optional live routing, below).

## The five tabs

RAAH is organised as five working views, with smooth animated transitions between them:

1. **Overview** — the "what's happening and what do I do" landing view. A subtle
   Three.js water hero sets the scene above live KPIs (people at risk, cut off, average
   reach time), one-tap jumps into every tab, the top-priority settlements, and a
   deployment-readiness gauge.
2. **Map & Routing** — a real OpenStreetMap view of Pimpri-Chinchwad with the road
   network drawn on top. Click any road to close it; the recommended route to the
   selected settlement redraws immediately. Close enough roads and a settlement is
   flagged **cut off**.
3. **Priority Plan** — settlements ranked by a transparent score blending current risk,
   access urgency and population. The list re-orders with animation as conditions change,
   and every row expands to show *why* it ranks where it does.
4. **Teams** — RAAH works out how many rescuers, boats and medics each settlement needs,
   then auto-allocates the available units in priority order. Reassign anyone — coverage,
   shortfall and spare capacity update live.
5. **Alerts** — every alert carries its **confidence, timestamp and the evidence behind
   it**. Unverified single-source tips are flagged rather than acted on.

## What the prototype demonstrates

- **Real map + live rerouting** — the Map & Routing tab renders actual OSM tiles for
  PCMC. Roads (with river bridges as the interesting chokepoints) are drawn as clickable
  lines; closing one reroutes the selected settlement's path or flags it cut off. Routing
  runs in two layers: a deterministic **offline Dijkstra** shortest-path that always works,
  optionally enhanced by a **live road-following route** from OpenRouteService (see below).
- **Teams & deployment** — a per-settlement requirement (rescuers / boats / medics /
  total members) is derived from population, water level, hazard and cut-off status. A
  greedy priority-order **auto-allocation** seeds the roster; the coordinator can override
  any unit, and required-vs-assigned coverage and spare capacity recompute live.
- **Prioritized response plan** — the transparent risk + priority score re-orders the
  plan with animation, and each row shows its factor breakdown and weights.
- **Evidence-backed alerts** — confidence, timestamp and supporting evidence on every
  alert; unverified tips flagged, not acted on ("flag uncertainty, don't invent certainty").
- **Simulation & field reports** — inject a rainfall surge, close the Ravet Bridge, or
  file a field report (water rising, road washed out, water receding, unverified tip) for
  any settlement and watch the plan, routes, teams and alerts adapt.

## Live routing (optional)

By default RAAH uses its built-in offline routing engine — no key, no network needed for
routing, and the demo never breaks. To make routes follow **real roads** and reroute
around closures using live data, supply an [OpenRouteService](https://openrouteservice.org)
API key one of two ways:

- set `VITE_ORS_API_KEY` in a `.env` file before `npm run dev`, or
- paste it into the small key field on the Map & Routing tab (stored only in your
  browser's `localStorage`).

With a key present, the map badge switches to **Live routing**; the offline engine remains
the fallback for any route the service can't return. Without one, everything still works
in **Offline routing** mode.

## Suggested demo flow

1. Take the 60-second guided tour on load (or re-open it via **How it works** in the header).
2. On **Map & Routing**, click **Close Ravet Bridge** (the signature scenario over the
   Pavana) → the route to Ravet redraws along a longer riverside alternate, and a
   bridge-closure alert appears with its evidence.
3. Hit **Rainfall surge** in Simulation → gauges rise basin-wide, risk scores climb, a
   floodplain road washes out and the priority order shifts.
4. File a **Road washed out** report on a settlement until it becomes **cut off** — it
   jumps to the top of the plan and is flagged for boat/air support.
5. Open **Teams** → watch auto-allocation cover the top priorities, then reassign a unit
   and see coverage and shortfall update live. Use **Auto-allocate** to re-seed.
6. Hit **Reset** to return to the baseline.

## How it works

```
src/
  data/network.js         Real PCMC geo: base + junctions + 7 settlements + road/bridge
                          graph (lat/lng), plus the deployable teams roster
  engine/routing.js       Offline Dijkstra shortest-path honouring closed edges
  engine/scoring.js       Explainable risk + priority scoring
  engine/teams.js         Per-settlement requirement + auto-allocation + coverage/shortfall
  services/orsRouting.js  Live OpenRouteService routing (avoid_polygons around closures)
  hooks/useEngine.js      Central state: closures, reports, live/offline routes, teams,
                          derived plan / alerts / KPIs / coverage
  components/
    tabs/OverviewTab.jsx  Landing view + Three.js hero
    tabs/MapTab.jsx       Leaflet + OSM tiles, clickable closures, live/offline route
    tabs/TeamsTab.jsx     Requirement-by-settlement + roster with auto/manual allocation
    three/FloodHero.jsx   Subtle animated low-poly water plane (respects reduced-motion)
    Header, SituationBanner, SettlementsPanel, AlertsPanel, SimulationPanel, Tour,
    ui/primitives
  App.jsx                 Five-tab shell with animated transitions + guided tour
```

The decision engine mirrors the four-layer approach from the deck — **Sense** (field
reports & simulated hazards), **Understand** (risk estimation), **Decide** (routing,
priority + team allocation), **Coordinate** (the ranked plan, deployment and alerts).

## Design & tech

Minimal, neutral UI: white surfaces, a single calm accent, thin borders, generous
whitespace — no heavy gradients or pastel "AI card" look. Risk is the only place colour
is used, and sparingly.

Built with **Vite + React**, **Framer Motion** (animated tab transitions, list
re-ordering, count-ups, spring interactions), **Leaflet / react-leaflet** (real OSM map),
**Three.js** (the subtle Overview water hero) and **lucide-react** icons, styled with
**Tailwind CSS**. The routing, scoring and teams engines are dependency-free and
deterministic; live routing via OpenRouteService is a progressive enhancement.

*All figures are illustrative demo data — this prototype supports human responders and
does not replace official warnings or emergency decision-makers.*
# raah-hackmatrix
