import { motion, AnimatePresence } from "framer-motion";
import { Info, ArrowRight, Ban, MousePointerClick } from "lucide-react";

/**
 * A plain-language strip under the header. It answers, in one human sentence,
 * "what am I looking at and what should I do?" — and updates live as the
 * situation changes. This is the first thing a non-expert reads.
 */
export default function SituationBanner({ kpis, plan, onSelect }) {
  const top = plan[0];
  const cutOff = plan.filter((r) => !r.priority.reachable);
  const lead = cutOff[0] || top;
  if (!lead) return null;

  const isCut = !lead.priority.reachable;
  const key = `${lead.settlement.id}-${isCut ? "cut" : "ok"}-${kpis.roadsClosed}`;

  return (
    <div className="border-b border-line bg-paper-sunken/70 px-5 py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink-500">
          <Info size={13} className="text-accent" />
          Right now
        </span>

        <AnimatePresence mode="wait">
          <motion.span
            key={key}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.22 }}
            className="text-ink-700"
          >
            {isCut ? (
              <>
                <span className="font-semibold text-risk-critical">
                  {lead.settlement.label} is cut off
                </span>{" "}
                — no open road from the base.
                {cutOff.length > 1 && ` ${cutOff.length} villages have no route.`}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onSelect(lead.settlement.id)}
                  className="font-semibold text-ink-900 underline decoration-line-strong underline-offset-2 hover:decoration-accent"
                >
                  {lead.settlement.label}
                </button>{" "}
                needs help first — reachable in{" "}
                <span className="font-semibold text-ink-900 tabular">
                  {lead.priority.travelMin} min
                </span>{" "}
                from the rescue base.
              </>
            )}
          </motion.span>
        </AnimatePresence>

        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-paper-panel px-2.5 py-1 text-[11px] font-medium text-ink-500 ring-1 ring-line">
          {kpis.roadsClosed > 0 ? (
            <>
              <Ban size={11} className="text-risk-high" />
              {kpis.roadsClosed} road{kpis.roadsClosed > 1 ? "s" : ""} closed
            </>
          ) : (
            <>
              <MousePointerClick size={11} className="text-accent" />
              Click a road or a scenario to see the plan adapt
              <ArrowRight size={11} />
            </>
          )}
        </span>
      </div>
    </div>
  );
}
