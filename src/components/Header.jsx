import { motion } from "framer-motion";
import { Users, Ban, Timer, Split, HelpCircle } from "lucide-react";
import { CountUp } from "./ui/primitives.jsx";
import { LogoMark } from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Header({ kpis, onHelp, theme, onToggleTheme }) {
  const stats = [
    { key: "risk", icon: Users, label: "People at risk", value: kpis.atRisk, tone: "#D2544F" },
    { key: "cut", icon: Ban, label: "Cut off", value: kpis.cutOff, tone: "#DB8A3A", small: true },
    { key: "reach", icon: Timer, label: "Avg reach", value: kpis.avgReach, suffix: " min", tone: "#3B6FE0", small: true },
    { key: "roads", icon: Split, label: "Roads closed", value: kpis.roadsClosed, tone: "#5A6472", small: true },
  ];

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-paper-panel/80 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex items-center justify-center"
        >
          <LogoMark size={38} />
        </motion.div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-bold tracking-tight text-ink-900">RAAH</h1>
            <span className="rounded-full bg-paper-sunken px-2 py-0.5 text-[10px] font-medium text-ink-500">
              Risk-Aware Aid &amp; Access Hub
            </span>
          </div>
          <p className="text-[11px] text-ink-400">When every minute matters, every route matters.</p>
        </div>
      </div>

      <div className="flex items-stretch gap-2">
        {stats.map((s) => (
          <Stat key={s.key} {...s} />
        ))}
        <button
          type="button"
          onClick={onHelp}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper-panel px-3 py-1.5 text-[12px] font-medium text-ink-600 transition-colors hover:bg-paper-sunken"
        >
          <HelpCircle size={14} strokeWidth={2.2} className="text-accent" />
          How it works
        </button>
        <div className="flex items-center">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}

function Stat({ icon: Icon, label, value, tone, suffix = "", small }) {
  return (
    <div className="flex min-w-[92px] items-center gap-2.5 rounded-xl border border-line bg-paper-panel px-3 py-1.5">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ background: `${tone}14`, color: tone }}
      >
        <Icon size={14} strokeWidth={2.2} />
      </span>
      <div className="leading-tight">
        <div className={`font-semibold text-ink-900 tabular ${small ? "text-[15px]" : "text-[16px]"}`}>
          <CountUp value={value} />
          {suffix}
        </div>
        <div className="text-[10px] text-ink-400">{label}</div>
      </div>
    </div>
  );
}
