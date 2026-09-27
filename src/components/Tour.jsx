import { useLayoutEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X, Check, MousePointerClick } from "lucide-react";
import LogoBeacon from "./three/LogoBeacon.jsx";

const GAP = 14;
const TIP_W = 320;
const EST_H = 190;

export default function Tour({ steps, step, setStep, onClose }) {
  const [rect, setRect] = useState(null);
  const current = steps[step];

  const measure = useCallback(() => {
    if (!current?.id) {
      setRect(null);
      return;
    }
    const el = document.getElementById(current.id);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [current]);

  useLayoutEffect(() => {
    measure();
    // Re-measure a few times: switching tabs animates new content in, so the
    // target element settles into place slightly after the step changes.
    const timers = [80, 300, 560].map((d) => setTimeout(measure, d));
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  if (!current) return null;

  const isWelcome = !current.id || !rect;
  const last = step === steps.length - 1;

  // spotlight box (with padding)
  const pad = 8;
  const box = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // tooltip placement: below if room, else above; clamp horizontally
  let tipStyle = {};
  if (box) {
    const below = box.top + box.height + GAP + EST_H < window.innerHeight;
    const top = below ? box.top + box.height + GAP : Math.max(GAP, box.top - GAP - EST_H);
    let left = box.left + box.width / 2 - TIP_W / 2;
    left = Math.min(Math.max(GAP, left), window.innerWidth - TIP_W - GAP);
    tipStyle = { top, left, width: TIP_W };
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* spotlight or dimmed backdrop */}
      {box ? (
        <motion.div
          className="pointer-events-none absolute rounded-xl"
          initial={false}
          animate={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          style={{
            boxShadow: "0 0 0 9999px rgba(21,24,30,0.55)",
            outline: "2px solid rgba(59,111,224,0.9)",
            outlineOffset: 0,
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "rgba(4,6,10,0.6)" }}
          onClick={onClose}
        />
      )}

      <AnimatePresence mode="wait">
        {isWelcome ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="absolute left-1/2 top-1/2 w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-paper-panel p-6 shadow-lift"
          >
            <div className="flex items-center gap-3">
              <LogoBeacon className="h-14 w-14 shrink-0" />
              <div>
                <h2 className="text-[17px] font-bold tracking-tight text-ink-900">Welcome to RAAH</h2>
                <p className="text-[12px] text-ink-400">Risk-Aware Aid &amp; Access Hub</p>
              </div>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-ink-600">
              This is a live coordination console for flood response. It watches seven
              riverside settlements across Pimpri-Chinchwad, works out{" "}
              <span className="font-semibold text-ink-900">who needs help first</span>,
              and finds the <span className="font-semibold text-ink-900">safest open route</span> from the
              rescue base to each one.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
              When a road floods or a report comes in, everything updates instantly. Take
              the quick tour to see how.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-accent-strong"
              >
                <MousePointerClick size={15} /> Take the 60-second tour
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-line px-4 py-2.5 text-[13px] font-medium text-ink-500 transition-colors hover:bg-paper-sunken"
              >
                Skip
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute rounded-2xl border border-line bg-paper-panel p-4 shadow-lift"
            style={tipStyle}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-ink">
                  {step}
                </span>
                <h3 className="text-[13.5px] font-semibold text-ink-900">{current.title}</h3>
              </div>
              <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700">
                <X size={15} />
              </button>
            </div>

            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-600">{current.body}</p>

            {current.action && (
              <button
                type="button"
                onClick={() => {
                  current.action();
                  setStep(step + 1);
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent-strong"
              >
                {current.actionLabel} <ArrowRight size={13} />
              </button>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {steps.slice(1).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i + 1 === step ? "w-4 bg-accent" : "w-1.5 bg-line-strong"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-600 hover:bg-paper-sunken"
                  >
                    <ArrowLeft size={13} /> Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (last ? onClose() : setStep(step + 1))}
                  className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent-strong"
                >
                  {last ? (
                    <>
                      Done <Check size={13} />
                    </>
                  ) : (
                    <>
                      Next <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
