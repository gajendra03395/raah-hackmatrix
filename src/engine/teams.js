// Teams / deployment engine — how many responders each settlement needs, and
// an explainable auto-allocation of the available units. Every number traces
// back to population, water level, access and household count.

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const BOAT_CREW = 3;

// Requirement for a single settlement, derived from its live plan row.
export function computeRequirement(row) {
  const s = row.settlement;
  const cut = !row.priority.reachable;

  const affectedFrac = clamp(0.2 + 0.55 * s.hazard + (s.waterLevel - 80) / 260);
  const peopleToEvac = Math.round(s.population * affectedFrac);

  const rescuers = Math.max(
    row.risk.level === "critical" ? 3 : row.risk.level === "high" ? 2 : 1,
    Math.ceil(peopleToEvac / 45)
  );
  let boats;
  if (s.waterLevel >= 95 || cut) boats = Math.max(cut ? 2 : 1, Math.ceil(peopleToEvac / 130));
  else boats = s.waterLevel >= 75 ? 1 : 0;
  const medics = Math.max(1, Math.ceil(peopleToEvac / 380));

  const membersRequired = rescuers + boats * BOAT_CREW + medics;

  const drivers = [
    { label: "People to evacuate", detail: `${peopleToEvac.toLocaleString()} of ${s.population.toLocaleString()}` },
    { label: "Water level", detail: `${s.waterLevel} cm${s.waterLevel >= 95 ? " — boats needed" : ""}` },
    { label: "Access", detail: cut ? "cut off — boat/air only" : `${row.priority.travelMin} min by road` },
    { label: "Households", detail: `${s.households.toLocaleString()}` },
  ];

  return {
    id: s.id,
    label: s.label,
    peopleToEvac,
    rescuers,
    boats,
    medics,
    boatCrew: boats * BOAT_CREW,
    membersRequired,
    cut,
    riskLevel: row.risk.level,
    breakdown: [
      { role: "Rescue personnel", count: rescuers, members: rescuers },
      { role: "Boats", count: boats, members: boats * BOAT_CREW },
      { role: "Medics", count: medics, members: medics },
    ],
    drivers,
  };
}

export function buildRequirements(plan) {
  const out = {};
  for (const row of plan) out[row.settlement.id] = computeRequirement(row);
  return out;
}

// Greedy auto-allocation in priority order. Boat units go to flooded / cut-off
// settlements first, then any unit fills remaining headcount.
export function autoAllocate(plan, requirements, teams) {
  const assignments = {};
  const pool = [...teams].sort((a, b) => b.members - a.members);
  const used = new Set();

  for (const row of plan) {
    const id = row.settlement.id;
    const req = requirements[id];
    if (!req) continue;
    let members = 0;
    let boats = 0;

    // 1) satisfy boat need
    while (boats < req.boats) {
      const t = pool.find((x) => !used.has(x.id) && x.type === "boat");
      if (!t) break;
      used.add(t.id);
      assignments[t.id] = id;
      members += t.members;
      boats += 1;
    }
    // 2) fill remaining headcount with any unit (prefer rescue, then medical)
    const order = { rescue: 0, medical: 1, logistics: 2, boat: 3 };
    while (members < req.membersRequired) {
      const candidates = pool
        .filter((x) => !used.has(x.id))
        .sort((a, b) => (order[a.type] - order[b.type]) || b.members - a.members);
      if (!candidates.length) break;
      const t = candidates[0];
      used.add(t.id);
      assignments[t.id] = id;
      members += t.members;
    }
  }
  return assignments;
}

// Derive coverage/shortfall for the current assignments (auto or hand-edited).
export function computeCoverage(assignments, requirements, teams, settlementIds) {
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const bySettlement = {};
  for (const id of settlementIds) {
    const req = requirements[id];
    const assigned = teams.filter((t) => assignments[t.id] === id);
    const members = assigned.reduce((a, t) => a + t.members, 0);
    const boats = assigned.filter((t) => t.type === "boat").length;
    bySettlement[id] = {
      teams: assigned,
      members,
      boats,
      required: req ? req.membersRequired : 0,
      boatsRequired: req ? req.boats : 0,
      coverage: req && req.membersRequired ? clamp(members / req.membersRequired) : 1,
      shortfall: req ? Math.max(0, req.membersRequired - members) : 0,
      boatShortfall: req ? Math.max(0, req.boats - boats) : 0,
    };
  }
  const unassigned = teams.filter((t) => !assignments[t.id]);
  const requiredMembers = settlementIds.reduce((a, id) => a + (requirements[id]?.membersRequired || 0), 0);
  const assignedMembers = teams.reduce((a, t) => a + (assignments[t.id] ? t.members : 0), 0);
  return {
    bySettlement,
    unassigned,
    teamById,
    totals: {
      requiredMembers,
      assignedMembers,
      coverage: requiredMembers ? clamp(assignedMembers / requiredMembers) : 1,
      unassignedCount: unassigned.length,
    },
  };
}
