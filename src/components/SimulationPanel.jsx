import { useState } from "react";
import { motion } from "framer-motion";
import { Waves, CloudRain, RotateCcw, Send, TriangleAlert, Droplets, CircleCheck, HelpCircle } from "lucide-react";

const REPORT_KINDS = [
  { key: "rising", label: "Water rising", icon: Droplets, tone: "#DB8A3A" },
  { key: "washout", label: "Road washed out", icon: TriangleAlert, tone: "#D2544F" },
  { key: "clear", label: "Water receding", icon: CircleCheck, tone: "#4F9A78" },
  { key: "unverified", label: "Unverified tip", icon: HelpCircle, tone: "#5A6472" },
];

export default function SimulationPanel({ plan, actions, closedCount }) {
  const [target, setTarget] = useState(plan[0]?.settlement.id || "S1");

  return (
    <div id="tour-sim" className="rounded-2xl border border-line bg-paper-panel p-3 shadow-subtle">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-semibold text-ink-900">Simulation & field reports</h2>
          <p className="mt-0.5 text-[11px] text-ink-400">
            Inject conditions — the plan adapts instantly
          </p>
        </div>
        <button
          type="button"
          onClick={actions.reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium text-ink-600 transition-colors hover:bg-paper-sunken"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ScenarioButton
          primary
          id="tour-cta"
          onClick={actions.signature}
          icon={Waves}
          title="Close Ravet Bridge"
          sub="Signature scenario · Pavana"
        />
        <ScenarioButton
          onClick={actions.rainfall}
          icon={CloudRain}
          title="Rainfall surge"
          sub="+82mm / 3h basin-wide"
        />
      </div>

      <div className="mt-3 rounded-xl bg-paper-sunken p-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
          <Send size={11} /> File a field report for
        </div>
        <div className="flex flex-wrap gap-1">
          {plan.map((r) => (
            <button
              key={r.settlement.id}
              type="button"
              onClick={() => setTarget(r.settlement.id)}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                target === r.settlement.id
                  ? "bg-accent text-white"
                  : "bg-paper-panel text-ink-600 hover:bg-line/60"
              }`}
            >
              {r.settlement.label}
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {REPORT_KINDS.map((k) => {
            const Icon = k.icon;
            return (
              <motion.button
                key={k.key}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => actions.fieldReport(target, k.key)}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-paper-panel px-2 py-1.5 text-[11px] font-medium text-ink-700 transition-colors hover:bg-paper-sunken"
              >
                <Icon size={13} style={{ color: k.tone }} />
                {k.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink-400">
        {closedCount > 0
          ? `${closedCount} road${closedCount > 1 ? "s" : ""} currently closed. `
          : ""}
        RAAH supports human responders — it flags uncertainty rather than inventing certainty.
      </p>
    </div>
  );
}

function ScenarioButton({ onClick, icon: Icon, title, sub, primary, id }) {
  return (
    <motion.button
      type="button"
      id={id}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        primary
          ? "border-accent/40 bg-accent text-white hover:bg-accent-strong"
          : "border-line bg-paper-panel text-ink-700 hover:bg-paper-sunken"
      }`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" strokeWidth={2.1} />
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold leading-tight">{title}</span>
        <span className={`block text-[10.5px] ${primary ? "text-white/80" : "text-ink-400"}`}>
          {sub}
        </span>
      </span>
    </motion.button>
  );
}
