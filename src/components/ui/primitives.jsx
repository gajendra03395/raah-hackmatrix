import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export const RISK = {
  critical: { label: "Critical", hex: "#D2544F", text: "text-risk-critical", chip: "bg-risk-critical/10 text-risk-critical" },
  high: { label: "High", hex: "#DB8A3A", text: "text-risk-high", chip: "bg-risk-high/10 text-risk-high" },
  moderate: { label: "Moderate", hex: "#C9A227", text: "text-risk-moderate", chip: "bg-risk-moderate/10 text-risk-moderate" },
  low: { label: "Low", hex: "#4F9A78", text: "text-risk-low", chip: "bg-risk-low/10 text-risk-low" },
};

export const SEVERITY = {
  critical: { hex: "#D2544F", chip: "bg-risk-critical/10 text-risk-critical", dot: "#D2544F" },
  high: { hex: "#DB8A3A", chip: "bg-risk-high/10 text-risk-high", dot: "#DB8A3A" },
  info: { hex: "#3B6FE0", chip: "bg-accent-soft text-accent-ink", dot: "#3B6FE0" },
};

export function CountUp({ value, format = (v) => Math.round(v).toLocaleString(), className }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value]);
  return <motion.span className={className}>{text}</motion.span>;
}

export function ScoreBar({ value, color = "#3B6FE0", height = 6, delay = 0 }) {
  return (
    <div className="w-full rounded-full bg-line" style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
      />
    </div>
  );
}

export function Pill({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function Panel({ title, subtitle, right, children, className = "", id }) {
  return (
    <section
      id={id}
      className={`flex min-h-0 flex-col rounded-2xl border border-line bg-paper-panel shadow-subtle ${className}`}
    >
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            {title && <h2 className="text-[13px] font-semibold text-ink-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11px] text-ink-400">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}
