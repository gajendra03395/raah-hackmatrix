// Risk + priority scoring — the "decision engine" layer.
// Every score returns the factors that produced it, so the UI can show the
// evidence and reasoning behind each recommendation (RAAH's key distinction).

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

export const REFERENCE_MINUTES = 35; // reference reach time for normalisation (urban)

// ---- Risk -------------------------------------------------------------------
// hazard  : ML flood-probability estimate
// exposure: how exposed the settlement is right now (low elevation + high gauge)
// vulnerability: people at stake (population proxy)
export function computeRisk(s) {
  const hazard = clamp(s.hazard);
  // elevation 0m -> fully exposed, 40m -> negligible
  const elevationExposure = clamp(1 - s.elevation / 40);
  // gauge relative to a 150cm danger mark
  const gaugeExposure = clamp(s.waterLevel / 150);
  const exposure = clamp(0.55 * gaugeExposure + 0.45 * elevationExposure);
  const vulnerability = clamp(s.population / 4500);

  const factors = [
    { key: "hazard", label: "Flood hazard (ML)", weight: 0.5, value: hazard },
    { key: "exposure", label: "Terrain & gauge exposure", weight: 0.32, value: exposure },
    { key: "vulnerability", label: "People at stake", weight: 0.18, value: vulnerability },
  ];
  const score = clamp(factors.reduce((a, f) => a + f.weight * f.value, 0));

  return { score, level: riskLevel(score), factors };
}

export function riskLevel(score) {
  if (score >= 0.72) return "critical";
  if (score >= 0.55) return "high";
  if (score >= 0.35) return "moderate";
  return "low";
}

// ---- Priority ---------------------------------------------------------------
// Blends current risk, population and how urgent access is (a cut-off or
// slow-to-reach village is escalated). Returns factor contributions.
export function computePriority(s, risk, route) {
  const reachable = !!route && route.reachable;
  const travelMin = reachable ? route.durationMin : null;

  let accessUrgency;
  if (!reachable) accessUrgency = 1;
  else accessUrgency = clamp(travelMin / REFERENCE_MINUTES) * 0.85;

  const populationPressure = clamp(s.population / 4500);

  const factors = [
    { key: "risk", label: "Current risk", weight: 0.46, value: risk.score },
    { key: "access", label: "Access urgency", weight: 0.3, value: accessUrgency },
    { key: "population", label: "Population pressure", weight: 0.24, value: populationPressure },
  ];
  const score = clamp(factors.reduce((a, f) => a + f.weight * f.value, 0));

  return {
    score,
    reachable,
    travelMin,
    accessUrgency,
    factors,
  };
}

// Build the full ranked plan for the current world state.
export function buildPlan(settlements, routes) {
  const rows = Object.values(settlements).map((s) => {
    const risk = computeRisk(s);
    const route = routes[s.id] || null;
    const priority = computePriority(s, risk, route);
    return { settlement: s, risk, route, priority };
  });

  rows.sort((a, b) => {
    // cut-off villages float to the top within their score band
    if (a.priority.reachable !== b.priority.reachable) {
      return a.priority.reachable ? 1 : -1;
    }
    return b.priority.score - a.priority.score;
  });

  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
