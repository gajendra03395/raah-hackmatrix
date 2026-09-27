// Light / dark theme switch — a compact track with a sliding knob. The two
// icons sit behind the knob so the current mode is legible at a glance. State
// lives in App; this is a controlled toggle.

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative inline-flex h-8 w-[58px] shrink-0 items-center rounded-full border border-line bg-paper-sunken px-1 transition-colors hover:border-line-strong"
    >
      <Sun size={13} strokeWidth={2.2} className="absolute left-[8px] text-risk-high" />
      <Moon size={12} strokeWidth={2.2} className="absolute right-[9px] text-accent" />
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-paper-panel shadow-subtle"
        style={{ marginLeft: dark ? 26 : 0 }}
      >
        <motion.span
          key={theme}
          initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="flex items-center justify-center"
        >
          {dark ? (
            <Moon size={12} strokeWidth={2.4} className="text-accent" />
          ) : (
            <Sun size={13} strokeWidth={2.4} className="text-risk-high" />
          )}
        </motion.span>
      </motion.span>
    </button>
  );
}
