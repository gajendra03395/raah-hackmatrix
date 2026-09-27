/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      // Themeable tokens resolve to CSS variables (space-separated RGB channels)
      // so Tailwind's /opacity modifiers keep working and light/dark can swap by
      // flipping data-theme on <html>. Risk colours stay fixed (semantic hazard
      // hues, also referenced by literal hex in JS) so they read on both themes.
      colors: {
        ink: {
          900: "rgb(var(--ink-900) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
          400: "rgb(var(--ink-400) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--paper) / <alpha-value>)",
          panel: "rgb(var(--paper-panel) / <alpha-value>)",
          sunken: "rgb(var(--paper-sunken) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          strong: "rgb(var(--line-strong) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
          ink: "rgb(var(--accent-ink) / <alpha-value>)",
          strong: "rgb(var(--accent-strong) / <alpha-value>)",
        },
        risk: {
          critical: "#D2544F",
          high: "#DB8A3A",
          moderate: "#C9A227",
          low: "#4F9A78",
        },
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(21, 24, 30, 0.04), 0 1px 3px rgba(21, 24, 30, 0.06)",
        panel: "0 1px 2px rgba(21, 24, 30, 0.03), 0 6px 20px rgba(21, 24, 30, 0.05)",
        lift: "0 8px 30px rgba(21, 24, 30, 0.10)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
    },
  },
  plugins: [],
};
