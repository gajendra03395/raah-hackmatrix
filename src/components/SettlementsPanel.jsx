import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Users, Clock, Ban } from "lucide-react";
import { Panel, RISK, ScoreBar, Pill, CountUp } from "./ui/primitives.jsx";

export default function SettlementsPanel({ plan, selectedId, onSelect }) {
  return (
    <Panel
      title="Prioritized response plan"
      subtitle="Ranked by live risk, access urgency & population"
      className="min-h-0 flex-1"
      right={<Pill className="bg-paper-sunken text-ink-500">{plan.length} settlements</Pill>}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <motion.ul layout className="flex flex-col gap-1.5">
          <AnimatePresence>
            {plan.map((row) => (
              <SettlementRow
                key={row.settlement.id}
                row={row}
                selected={selectedId === row.settlement.id}
                onSelect={onSelect}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </Panel>
  );
}

function SettlementRow({ row, selected, onSelect }) {
  const { settlement: s, risk, priority, rank } = row;
  const rk = RISK[risk.level];
  const cut = !priority.reachable;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ layout: { type: "spring", stiffness: 420, damping: 34 }, duration: 0.25 }}
    >
      <button
        type="button"
        onClick={() => onSelect(s.id)}
        className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
          selected
            ? "border-accent/40 bg-accent-soft"
            : "border-line bg-paper-panel hover:bg-paper-sunken"
        }`}
      >
        <div className="flex items-center gap-3">
          <motion.span
            layout
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-paper-sunken text-[12px] font-semibold text-ink-700 tabular"
          >
            {rank}
          </motion.span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[13px] font-semibold text-ink-900">{s.label}</span>
              <Pill className={rk.chip}>{rk.label}</Pill>
              {cut && (
                <Pill className="bg-risk-critical/10 text-risk-critical">
                  <Ban size={10} /> Cut off
                </Pill>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-400">
              <span className="inline-flex items-center gap-1">
                <Users size={11} /> {s.population.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={11} />
                {cut ? "no route" : `${priority.travelMin} min`}
              </span>
            </div>
          </div>

          <div className="w-24 shrink-0 text-right">
            <div className="text-[11px] font-medium text-ink-400">priority</div>
            <div className="text-[15px] font-semibold text-ink-900 tabular">
              <CountUp value={priority.score * 100} format={(v) => Math.round(v)} />
            </div>
          </div>

          <ChevronRight
            size={16}
            className={`shrink-0 text-ink-400 transition-transform ${selected ? "rotate-90" : ""}`}
          />
        </div>

        <div className="mt-2">
          <ScoreBar value={priority.score} color={rk.hex} />
        </div>

        <AnimatePresence initial={false}>
          {selected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-lg bg-paper-sunken p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Why this rank
                </div>
                <div className="grid gap-2">
                  {priority.factors.map((f, i) => (
                    <FactorRow key={f.key} factor={f} delay={i * 0.05} />
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-ink-500">{s.note}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.li>
  );
}

function FactorRow({ factor, delay }) {
  const contribution = factor.weight * factor.value;
  return (
    <div className="flex items-center gap-2">
      <span className="w-32 shrink-0 text-[11px] text-ink-600">{factor.label}</span>
      <div className="flex-1">
        <ScoreBar value={factor.value} color="#5A6472" height={5} delay={delay} />
      </div>
      <span className="w-10 shrink-0 text-right text-[11px] font-medium text-ink-700 tabular">
        {Math.round(factor.value * 100)}
      </span>
      <span className="w-14 shrink-0 text-right text-[10px] text-ink-400 tabular">
        w{factor.weight.toFixed(2)}
      </span>
    </div>
  );
}
