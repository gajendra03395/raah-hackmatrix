import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { EDGES, SETTLEMENTS, SETTLEMENT_IDS, NODES, TEAMS } from "../data/network.js";
import { computeRoutes } from "../engine/routing.js";
import { buildPlan } from "../engine/scoring.js";
import { buildRequirements, autoAllocate, computeCoverage } from "../engine/teams.js";
import { fetchLiveRoutes } from "../services/orsRouting.js";

function readOrsKey() {
  try {
    return (import.meta.env && import.meta.env.VITE_ORS_API_KEY) || localStorage.getItem("raah_ors_key") || "";
  } catch {
    return "";
  }
}

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
let seq = 0;
const uid = (p = "e") => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

function initialState() {
  return {
    settlements: structuredClone(SETTLEMENTS),
    closedEdges: [],
    events: [], // newest first
  };
}

function adjacentEdges(nodeId) {
  return EDGES.filter((e) => e.a === nodeId || e.b === nodeId);
}

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_ROAD": {
      const isClosed = state.closedEdges.includes(action.edgeId);
      const closedEdges = isClosed
        ? state.closedEdges.filter((id) => id !== action.edgeId)
        : [...state.closedEdges, action.edgeId];
      const edge = EDGES.find((e) => e.id === action.edgeId);
      const from = NODES[edge.a].label;
      const to = NODES[edge.b].label;
      const ev = {
        id: uid(),
        type: "closure",
        at: Date.now(),
        edgeId: action.edgeId,
        severity: isClosed ? "info" : "high",
        title: isClosed ? "Road reopened" : "Road closed",
        detail: `${from} ↔ ${to}`,
        confidence: 0.97,
        evidence: [
          isClosed ? "Closure cleared by operator" : "Closure reported by operator",
          "Routes recalculated across the network",
        ],
      };
      return { ...state, closedEdges, events: [ev, ...state.events] };
    }

    case "SIGNATURE": {
      const edgeId = "e7";
      if (state.closedEdges.includes(edgeId)) return state;
      const ev = {
        id: uid(),
        type: "closure",
        at: Date.now(),
        edgeId,
        severity: "high",
        title: "Ravet Bridge closed",
        detail: "Ravet Bridge over the Pavana submerged",
        confidence: 0.94,
        evidence: [
          "Field report: bridge deck under water",
          "Pavana gauge above deck level",
          "Route to Ravet recalculated via the riverside road automatically",
        ],
      };
      return { ...state, closedEdges: [...state.closedEdges, edgeId], events: [ev, ...state.events] };
    }

    case "RAINFALL": {
      const settlements = structuredClone(state.settlements);
      for (const id of SETTLEMENT_IDS) {
        const s = settlements[id];
        const exposureBias = clamp(1 - s.elevation / 40);
        s.waterLevel = Math.round(s.waterLevel + 22 + exposureBias * 34);
        s.hazard = clamp(s.hazard + 0.08 + exposureBias * 0.1);
      }
      // a low-lying road washes out under the downpour
      const washout = "e9";
      const closedEdges = state.closedEdges.includes(washout)
        ? state.closedEdges
        : [...state.closedEdges, washout];
      const ev = {
        id: uid(),
        type: "hazard",
        at: Date.now(),
        severity: "critical",
        title: "Rainfall surge across the district",
        detail: "+82mm in 3h · gauges rising",
        confidence: 0.88,
        evidence: [
          "GPM precipitation: 82mm / 3h",
          "River gauges climbing basin-wide",
          "Pavana Riverside Rd (Ravet–Kiwale) flagged washed-out",
        ],
      };
      return { ...state, settlements, closedEdges, events: [ev, ...state.events] };
    }

    case "FIELD_REPORT": {
      const { settlementId, kind } = action;
      const settlements = structuredClone(state.settlements);
      const s = settlements[settlementId];
      let closedEdges = state.closedEdges;
      let ev;

      if (kind === "rising") {
        s.waterLevel = Math.round(s.waterLevel + 30);
        s.hazard = clamp(s.hazard + 0.12);
        s.reportAgeMin = 1;
        ev = {
          id: uid(),
          type: "report",
          at: Date.now(),
          settlementId,
          severity: "high",
          title: `Water rising fast — ${s.label}`,
          detail: "Confirmed by ground team",
          confidence: 0.9,
          evidence: [`Gauge now ${s.waterLevel}cm`, "Two corroborating reports", "Fresh (<2 min)"],
        };
      } else if (kind === "washout") {
        const adj = adjacentEdges(settlementId);
        const target =
          adj.find((e) => e.closable && !closedEdges.includes(e.id)) ||
          adj.find((e) => !closedEdges.includes(e.id));
        if (target) closedEdges = [...closedEdges, target.id];
        s.reportAgeMin = 1;
        ev = {
          id: uid(),
          type: "report",
          at: Date.now(),
          settlementId,
          edgeId: target ? target.id : undefined,
          severity: "high",
          title: `Road washed out near ${s.label}`,
          detail: target ? "Access road cut — rerouting" : "No further roads to cut",
          confidence: 0.86,
          evidence: ["Reported by relief driver", "Photo attached", "Route recalculated"],
        };
      } else if (kind === "clear") {
        s.waterLevel = Math.max(20, Math.round(s.waterLevel - 34));
        s.hazard = clamp(s.hazard - 0.16);
        s.reportAgeMin = 1;
        ev = {
          id: uid(),
          type: "report",
          at: Date.now(),
          settlementId,
          severity: "info",
          title: `Water receding — ${s.label}`,
          detail: "Conditions improving",
          confidence: 0.82,
          evidence: [`Gauge down to ${s.waterLevel}cm`, "Confirmed by ground team"],
        };
      } else {
        // unconfirmed: RAAH flags uncertainty rather than inventing certainty
        ev = {
          id: uid(),
          type: "report",
          at: Date.now(),
          settlementId,
          severity: "info",
          stale: true,
          title: `Unverified report — ${s.label}`,
          detail: "Single unconfirmed source",
          confidence: 0.35,
          evidence: ["1 uncorroborated message", "No sensor agreement", "Flagged — not acted on"],
        };
      }
      return { ...state, settlements, closedEdges, events: [ev, ...state.events] };
    }

    case "RESET":
      return initialState();

    default:
      return state;
  }
}

export function useEngine() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const mountedAt = useRef(Date.now());

  const closedSet = useMemo(() => new Set(state.closedEdges), [state.closedEdges]);

  // Deterministic offline routes — always available, never break the demo.
  const offlineRoutes = useMemo(() => computeRoutes(SETTLEMENT_IDS, closedSet), [closedSet]);

  // Live routing (OpenRouteService) as an enhancement, per-settlement fallback.
  const [orsKey, setOrsKeyState] = useState(() => readOrsKey());
  const [liveRoutes, setLiveRoutes] = useState({});
  const [liveStatus, setLiveStatus] = useState("idle"); // idle | loading | ok | error

  useEffect(() => {
    if (!orsKey) {
      setLiveRoutes({});
      setLiveStatus("idle");
      return;
    }
    const ctrl = new AbortController();
    setLiveStatus("loading");
    fetchLiveRoutes(SETTLEMENT_IDS, state.closedEdges, orsKey, ctrl.signal)
      .then(({ routes, failed }) => {
        setLiveRoutes(routes);
        setLiveStatus(failed.length >= SETTLEMENT_IDS.length ? "error" : "ok");
      })
      .catch(() => setLiveStatus("error"));
    return () => ctrl.abort();
  }, [orsKey, state.closedEdges]);

  // Merged routes: prefer a successful live route, else offline for that id.
  const routes = useMemo(() => {
    const out = {};
    for (const id of SETTLEMENT_IDS) out[id] = liveRoutes[id] || offlineRoutes[id];
    return out;
  }, [liveRoutes, offlineRoutes]);

  const routingMode = useMemo(() => {
    if (!orsKey) return "offline";
    return SETTLEMENT_IDS.some((id) => liveRoutes[id]?.mode === "live") ? "live" : "offline";
  }, [orsKey, liveRoutes]);

  const plan = useMemo(
    () => buildPlan(state.settlements, routes),
    [state.settlements, routes]
  );

  // Standing alerts derived from the live plan + event alerts from actions.
  const alerts = useMemo(() => {
    const standing = [];
    for (const row of plan) {
      const s = row.settlement;
      if (!row.priority.reachable) {
        standing.push({
          id: `cut-${s.id}`,
          type: "access",
          severity: "critical",
          title: `${s.label} is cut off`,
          detail: "No open route from the rescue base",
          confidence: 0.99,
          ageMin: 1,
          evidence: ["All access roads closed/flooded", "Air or boat support required"],
        });
      } else if (row.risk.level === "critical" || row.risk.level === "high") {
        const stale = s.reportAgeMin > 45;
        standing.push({
          id: `risk-${s.id}`,
          type: "risk",
          severity: row.risk.level === "critical" ? "critical" : "high",
          title: `${row.risk.level === "critical" ? "Severe" : "Elevated"} flood risk — ${s.label}`,
          detail: `Reach ${row.priority.travelMin} min · ${s.population.toLocaleString()} people`,
          confidence: stale ? 0.5 : clamp(0.55 + row.risk.score * 0.4),
          ageMin: s.reportAgeMin,
          stale,
          evidence: [
            `ML hazard ${(s.hazard * 100).toFixed(0)}%`,
            `Gauge ${s.waterLevel}cm · elev ${s.elevation}m`,
            stale ? `Newest report ${s.reportAgeMin} min old — confidence reduced` : `Report ${s.reportAgeMin} min old`,
          ],
        });
      }
    }

    const eventAlerts = state.events.map((e) => ({
      id: e.id,
      type: e.type,
      severity: e.severity,
      title: e.title,
      detail: e.detail,
      confidence: e.confidence,
      ageMin: Math.max(0, Math.round((Date.now() - e.at) / 60000)),
      at: e.at,
      stale: e.stale,
      evidence: e.evidence || [],
    }));

    // event alerts first (freshest actions), then standing risk alerts
    return [...eventAlerts, ...standing];
  }, [plan, state.events]);

  const kpis = useMemo(() => {
    const atRisk = plan
      .filter((r) => r.risk.level === "critical" || r.risk.level === "high")
      .reduce((a, r) => a + r.settlement.population, 0);
    const cutOff = plan.filter((r) => !r.priority.reachable).length;
    const reachable = plan.filter((r) => r.priority.reachable);
    const avgReach = reachable.length
      ? Math.round(reachable.reduce((a, r) => a + r.priority.travelMin, 0) / reachable.length)
      : 0;
    return {
      atRisk,
      cutOff,
      avgReach,
      roadsClosed: state.closedEdges.length,
      alerts: alerts.length,
    };
  }, [plan, state.closedEdges, alerts]);

  // ---- Teams & deployment --------------------------------------------------
  const requirements = useMemo(() => buildRequirements(plan), [plan]);

  const [assignments, setAssignments] = useState({});
  const [autoMode, setAutoMode] = useState(true);

  // While in auto mode, re-seed the allocation whenever the plan shifts.
  useEffect(() => {
    if (!autoMode) return;
    setAssignments(autoAllocate(plan, requirements, TEAMS));
  }, [autoMode, plan, requirements]);

  const coverage = useMemo(
    () => computeCoverage(assignments, requirements, TEAMS, SETTLEMENT_IDS),
    [assignments, requirements]
  );

  const teamActions = useMemo(
    () => ({
      assignTeam: (teamId, settlementId) => {
        setAutoMode(false);
        setAssignments((prev) => {
          const next = { ...prev };
          if (settlementId) next[teamId] = settlementId;
          else delete next[teamId];
          return next;
        });
      },
      clearAssignments: () => {
        setAutoMode(false);
        setAssignments({});
      },
      autoAllocate: () => setAutoMode(true),
      setOrsKey: (k) => {
        const key = (k || "").trim();
        try {
          if (key) localStorage.setItem("raah_ors_key", key);
          else localStorage.removeItem("raah_ors_key");
        } catch {
          /* ignore */
        }
        setOrsKeyState(key);
      },
    }),
    []
  );

  const actions = useMemo(
    () => ({
      toggleRoad: (edgeId) => dispatch({ type: "TOGGLE_ROAD", edgeId }),
      signature: () => dispatch({ type: "SIGNATURE" }),
      rainfall: () => dispatch({ type: "RAINFALL" }),
      fieldReport: (settlementId, kind) => dispatch({ type: "FIELD_REPORT", settlementId, kind }),
      reset: () => dispatch({ type: "RESET" }),
      ...teamActions,
    }),
    [teamActions]
  );

  return {
    state,
    closedSet,
    routes,
    routingMode,
    orsKey,
    liveStatus,
    plan,
    alerts,
    kpis,
    teams: TEAMS,
    requirements,
    assignments,
    autoMode,
    coverage,
    actions,
    mountedAt: mountedAt.current,
  };
}
