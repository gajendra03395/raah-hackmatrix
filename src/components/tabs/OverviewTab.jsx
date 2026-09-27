// Overview tab — the "what's happening and what do I do" landing view. A subtle
// 3D water hero sets the tone; below it, the live situation, the top priorities,
// and deployment readiness give a non-expert an immediate picture, with one-tap
// jumps into the working tabs.

import { motion } from "framer-motion";
import {
  Map as MapIcon,
  ListOrdered,
  Users,
  Bell,
  ArrowRight,
  Ban,
  Waves,
  Timer,
} from "lucide-react";
import FloodHero from "../three/FloodHero.jsx";
import { RISK, Pill, ScoreBar, CountUp } from "../ui/primitives.jsx";

export default function OverviewTab({ kpis, plan, coverage, routingMode, onGoTab, onSelect }) {
  const top = plan.slice(0, 3);
  const cutOff = plan.filter((r) => !r.priority.reachable);
  const covPct = Math.round(coverage.totals.coverage * 100);

  const jumps = [
    { id: "map", icon: MapIcon, label: "Map & routing", sub: "Reroute around closures" },
    { id: "plan", icon: ListOrdered, label: "Priority plan", sub: "Who gets help first" },
    { id: "teams", icon: Users, label: "Teams", sub: "Deploy & override" },
    { id: "alerts", icon: Bell, label: "Alerts", sub: "Evidence & confidence" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
      {/* hero */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-[#12151B] shadow-panel">
        <FloodHero className="absolute inset-0 h-full w-full opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#12151B]/90 via-[#12151B]/55 to-transparent" />
        <div className="relative flex flex-col gap-3 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-bold tracking-tight text-white">RAAH</h1>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10.5px] font-medium text-white/90">
                Pimpri-Chinchwad · flood response
              </span>
            </div>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-white/80">
              A live console that ranks who needs help first, finds the safest open route from the
              rescue base, and deploys the right teams — updating the instant conditions change.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <HeroStat icon={Waves} tone="#F1B0AD" value={kpis.atRisk} label="people at risk" />
            <HeroStat icon={Ban} tone="#F1C79A" value={kpis.cutOff} label="cut off" />
            <HeroStat icon={Timer} tone="#AEC6F5" value={kpis.avgReach} label="min avg reach" />
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/12 px-2.5 py-1.5 text-[11px] font-medium text-white/90">
              {routingMode === "live" ? "Live routing" : "Offline routing"}
            </span>
          </div>
        </div>
      </div>

      {/* quick jumps */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {jumps.map((j) => (
          <motion.button
            key={j.id}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onGoTab(j.id)}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-paper-panel px-3 py-2.5 text-left shadow-subtle transition-colors hover:bg-paper-sunken"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <j.icon size={15} strokeWidth={2.1} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-ink-900">{j.label}</span>
              <span className="block truncate text-[10.5px] text-ink-400">{j.sub}</span>
            </span>
          </motion.button>
        ))}
      </div>

      {/* two columns */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_1fr]">
        <PriorityPreview top={top} cutOff={cutOff} onSelect={onSelect} onGoTab={onGoTab} />
        <ReadinessCard covPct={covPct} coverage={coverage} onGoTab={onGoTab} />
      </div>
    </div>
  );
}

function HeroStat({ icon: Icon, value, label, tone }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-white/12 px-2.5 py-1.5 text-white backdrop-blur-sm">
      <Icon size={14} style={{ color: tone }} />
      <span className="text-[14px] font-semibold tabular">
        <CountUp value={value} />
      </span>
      <span className="text-[10.5px] text-white/75">{label}</span>
    </span>
  );
}

function PriorityPreview({ top, cutOff, onSelect, onGoTab }) {
  return (
    <section className="flex flex-col rounded-2xl border border-line bg-paper-panel shadow-subtle">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-ink-900">Needs attention now</h2>
          <p className="mt-0.5 text-[11px] text-ink-400">Top of the live priority ranking</p>
        </div>
        <button
          type="button"
          onClick={() => onGoTab("plan")}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-accent hover:text-accent-ink"
        >
          Full plan <ArrowRight size={13} />
        </button>
      </header>
      <div className="flex flex-col gap-1.5 p-2.5">
        {cutOff.length > 0 && (
          <div className="mb-0.5 flex items-center gap-1.5 rounded-lg bg-risk-critical/10 px-2.5 py-1.5 text-[11.5px] font-medium text-risk-critical">
            <Ban size={12} /> {cutOff.length} settlement{cutOff.length > 1 ? "s" : ""} cut off — boat / air support required
          </div>
        )}
        {top.map((row) => {
          const rk = RISK[row.risk.level];
          const cut = !row.priority.reachable;
          return (
            <button
              key={row.settlement.id}
              type="button"
              onClick={() => {
                onSelect(row.settlement.id);
                onGoTab("plan");
              }}
              className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 text-left transition-colors hover:bg-paper-sunken"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-paper-sunken text-[12px] font-semibold text-ink-700 tabular">
                {row.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[12.5px] font-semibold text-ink-900">{row.settlement.label}</span>
                  <Pill className={rk.chip}>{rk.label}</Pill>
                </div>
                <div className="mt-1">
                  <ScoreBar value={row.priority.score} color={rk.hex} height={5} />
                </div>
              </div>
              <span className="shrink-0 text-[11px] font-medium text-ink-500 tabular">
                {cut ? "no route" : `${row.priority.travelMin} min`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ReadinessCard({ covPct, coverage, onGoTab }) {
  const tone = covPct >= 100 ? "#4F9A78" : covPct >= 60 ? "#DB8A3A" : "#D2544F";
  return (
    <section className="flex flex-col rounded-2xl border border-line bg-paper-panel shadow-subtle">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-ink-900">Deployment readiness</h2>
          <p className="mt-0.5 text-[11px] text-ink-400">Responders assigned vs required</p>
        </div>
        <button
          type="button"
          onClick={() => onGoTab("teams")}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-accent hover:text-accent-ink"
        >
          Manage <ArrowRight size={13} />
        </button>
      </header>
      <div className="flex flex-1 flex-col justify-center gap-3 p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[30px] font-bold leading-none tabular" style={{ color: tone }}>
              {covPct}%
            </div>
            <div className="mt-1 text-[11px] text-ink-400">of required responders assigned</div>
          </div>
          <div className="text-right text-[12px] text-ink-500">
            <div>
              <b className="text-ink-900 tabular">{coverage.totals.assignedMembers}</b> /{" "}
              {coverage.totals.requiredMembers} members
            </div>
            <div className="mt-0.5">
              <b className="text-ink-900 tabular">{coverage.totals.unassignedCount}</b> units spare
            </div>
          </div>
        </div>
        <ScoreBar value={coverage.totals.coverage} color={tone} height={8} />
      </div>
    </section>
  );
}
