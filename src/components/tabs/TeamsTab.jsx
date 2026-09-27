// Teams & Deployment tab — RAAH proposes how many responders each settlement
// needs (from population, water level, access and risk) and auto-allocates the
// available units in priority order. The coordinator can override any
// assignment; required-vs-assigned coverage and spare capacity update live.

import { motion, AnimatePresence } from "framer-motion";
import {
  Ship,
  LifeBuoy,
  HeartPulse,
  Package,
  Users,
  Wand2,
  Eraser,
  X,
  TriangleAlert,
  CircleCheck,
} from "lucide-react";
import { Panel, RISK, Pill, ScoreBar } from "../ui/primitives.jsx";

const TEAM_TYPE = {
  boat: { icon: Ship, color: "#3B6FE0", label: "Water rescue" },
  rescue: { icon: LifeBuoy, color: "#D2544F", label: "Ground SAR" },
  medical: { icon: HeartPulse, color: "#4F9A78", label: "Medical" },
  logistics: { icon: Package, color: "#DB8A3A", label: "Logistics" },
};

export default function TeamsTab({
  plan,
  requirements,
  assignments,
  coverage,
  teams,
  autoMode,
  actions,
  selectedId,
  onSelect,
}) {
  const totals = coverage.totals;
  const covPct = Math.round(totals.coverage * 100);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* control strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper-panel px-4 py-2.5 shadow-subtle">
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-ink-900">Deployment</span>
          <Pill className={autoMode ? "bg-accent-soft text-accent-ink" : "bg-risk-high/10 text-risk-high"}>
            {autoMode ? "Auto-allocated" : "Manual override"}
          </Pill>
        </div>

        <div className="flex items-center gap-4">
          <Metric label="Coverage" value={`${covPct}%`} tone={covPct >= 100 ? "#4F9A78" : "#DB8A3A"} />
          <Metric label="Members" value={`${totals.assignedMembers}/${totals.requiredMembers}`} />
          <Metric label="Unassigned" value={totals.unassignedCount} />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={actions.autoAllocate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent-strong"
            >
              <Wand2 size={13} /> Auto-allocate
            </button>
            <button
              type="button"
              onClick={actions.clearAssignments}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-600 transition-colors hover:bg-paper-sunken"
            >
              <Eraser size={13} /> Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
        {/* by settlement */}
        <Panel title="Requirement by settlement" subtitle="What each location needs vs what is assigned" className="min-h-0">
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <ul className="flex flex-col gap-1.5">
              {plan.map((row) => (
                <SettlementReq
                  key={row.settlement.id}
                  row={row}
                  req={requirements[row.settlement.id]}
                  cov={coverage.bySettlement[row.settlement.id]}
                  selected={selectedId === row.settlement.id}
                  onSelect={onSelect}
                  onRemove={(teamId) => actions.assignTeam(teamId, null)}
                />
              ))}
            </ul>
          </div>
        </Panel>

        {/* roster */}
        <Panel
          title="Rescue units"
          subtitle="Assign or reassign any unit"
          className="min-h-0"
          right={<Pill className="bg-paper-sunken text-ink-500">{teams.length} units</Pill>}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <ul className="flex flex-col gap-1.5">
              {teams.map((t) => (
                <RosterUnit
                  key={t.id}
                  team={t}
                  assignedTo={assignments[t.id] || ""}
                  plan={plan}
                  onAssign={(sid) => actions.assignTeam(t.id, sid || null)}
                />
              ))}
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="text-right leading-tight">
      <div className="text-[15px] font-semibold text-ink-900 tabular" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
      <div className="text-[10px] text-ink-400">{label}</div>
    </div>
  );
}

function SettlementReq({ row, req, cov, selected, onSelect, onRemove }) {
  if (!req || !cov) return null;
  const rk = RISK[row.risk.level];
  const covered = cov.members >= req.membersRequired && cov.boatShortfall === 0;
  const barColor = covered ? "#4F9A78" : cov.coverage >= 0.5 ? "#DB8A3A" : "#D2544F";

  const chips = [
    { icon: Users, label: `${req.rescuers} rescue`, on: req.rescuers > 0 },
    { icon: Ship, label: `${req.boats} boat${req.boats !== 1 ? "s" : ""}`, on: req.boats > 0 },
    { icon: HeartPulse, label: `${req.medics} medic${req.medics !== 1 ? "s" : ""}`, on: req.medics > 0 },
  ].filter((c) => c.on);

  return (
    <li>
      <div
        className={`rounded-xl border px-3 py-2.5 transition-colors ${
          selected ? "border-accent/40 bg-accent-soft" : "border-line bg-paper-panel"
        }`}
      >
        <button type="button" onClick={() => onSelect(row.settlement.id)} className="w-full text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-paper-sunken text-[12px] font-semibold text-ink-700 tabular">
              {row.rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-ink-900">{row.settlement.label}</span>
                <Pill className={rk.chip}>{rk.label}</Pill>
                {req.cut && (
                  <Pill className="bg-risk-critical/10 text-risk-critical">
                    <TriangleAlert size={10} /> Cut off
                  </Pill>
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-ink-400">
                {req.peopleToEvac.toLocaleString()} to evacuate · needs {req.membersRequired} responders
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[13px] font-semibold tabular" style={{ color: barColor }}>
                {cov.members}/{req.membersRequired}
              </div>
              <div className="text-[10px] text-ink-400">assigned</div>
            </div>
          </div>
        </button>

        <div className="mt-2">
          <ScoreBar value={cov.coverage} color={barColor} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1 rounded-md bg-paper-sunken px-1.5 py-0.5 text-[10.5px] font-medium text-ink-600"
            >
              <c.icon size={11} /> {c.label}
            </span>
          ))}
          {cov.teams.length > 0 && <span className="mx-0.5 text-ink-400">·</span>}
          <AnimatePresence initial={false}>
            {cov.teams.map((t) => {
              const tt = TEAM_TYPE[t.type];
              return (
                <motion.span
                  key={t.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium"
                  style={{ borderColor: `${tt.color}55`, color: tt.color, background: `${tt.color}10` }}
                >
                  {t.name}
                  <button type="button" onClick={() => onRemove(t.id)} className="opacity-60 hover:opacity-100">
                    <X size={10} />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>

        {(cov.shortfall > 0 || cov.boatShortfall > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cov.shortfall > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-risk-critical/10 px-1.5 py-0.5 text-[10.5px] font-medium text-risk-critical">
                <TriangleAlert size={10} /> short {cov.shortfall} responders
              </span>
            )}
            {cov.boatShortfall > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-risk-high/10 px-1.5 py-0.5 text-[10.5px] font-medium text-risk-high">
                <Ship size={10} /> needs {cov.boatShortfall} more boat{cov.boatShortfall > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function RosterUnit({ team, assignedTo, plan, onAssign }) {
  const tt = TEAM_TYPE[team.type];
  const Icon = tt.icon;
  const assigned = !!assignedTo;
  return (
    <li
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors ${
        assigned ? "border-line bg-paper-panel" : "border-dashed border-line-strong bg-paper-sunken/60"
      }`}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${tt.color}14`, color: tt.color }}
      >
        <Icon size={15} strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[12.5px] font-semibold text-ink-900">{team.name}</span>
          <span className="text-[10.5px] text-ink-400">{team.members} pax</span>
        </div>
        <div className="truncate text-[10.5px] text-ink-400">{tt.label} · {team.note}</div>
      </div>
      <select
        value={assignedTo}
        onChange={(e) => onAssign(e.target.value)}
        className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-medium outline-none focus:border-accent ${
          assigned ? "border-line bg-paper-panel text-ink-900" : "border-line-strong bg-paper-panel text-ink-500"
        }`}
      >
        <option value="">Unassigned</option>
        {plan.map((r) => (
          <option key={r.settlement.id} value={r.settlement.id}>
            {r.settlement.label}
          </option>
        ))}
      </select>
    </li>
  );
}
