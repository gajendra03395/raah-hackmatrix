import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, Info, Radio, FileText, CircleAlert } from "lucide-react";
import { Panel, SEVERITY, Pill } from "./ui/primitives.jsx";

const TYPE_ICON = {
  risk: AlertTriangle,
  access: ShieldAlert,
  closure: CircleAlert,
  hazard: Radio,
  report: FileText,
  info: Info,
};

export default function AlertsPanel({ alerts }) {
  return (
    <Panel
      title="Alerts"
      subtitle="Every alert carries its evidence, confidence & age"
      className="min-h-0 flex-1"
      right={<Pill className="bg-paper-sunken text-ink-500">{alerts.length} active</Pill>}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <motion.ul layout className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </Panel>
  );
}

function AlertCard({ alert }) {
  const sev = SEVERITY[alert.severity] || SEVERITY.info;
  const Icon = TYPE_ICON[alert.type] || Info;
  const conf = Math.round((alert.confidence ?? 0) * 100);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 12, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: -12, height: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    >
      <div className="rounded-xl border border-line bg-paper-panel p-3">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{ background: `${sev.hex}15`, color: sev.hex }}
          >
            <Icon size={13} strokeWidth={2.2} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12.5px] font-semibold leading-snug text-ink-900">
                {alert.title}
              </span>
              <span className="shrink-0 whitespace-nowrap text-[10px] text-ink-400">
                {alert.ageMin <= 0 ? "just now" : `${alert.ageMin} min ago`}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-ink-500">{alert.detail}</p>

            {/* confidence meter */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-medium text-ink-400">confidence</span>
              <div className="h-1 w-16 overflow-hidden rounded-full bg-line">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: alert.stale ? "#DB8A3A" : sev.hex }}
                  initial={{ width: 0 }}
                  animate={{ width: `${conf}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] font-semibold text-ink-700 tabular">{conf}%</span>
              {alert.stale && (
                <Pill className="bg-risk-high/10 text-risk-high">unverified</Pill>
              )}
            </div>

            {/* evidence */}
            {alert.evidence?.length > 0 && (
              <ul className="mt-2 space-y-1 border-l border-line pl-2.5">
                {alert.evidence.map((e, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="text-[10.5px] leading-relaxed text-ink-500"
                  >
                    {e}
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  );
}
