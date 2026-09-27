import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Map as MapIcon, ListOrdered, Users, Bell, Navigation, Ban } from "lucide-react";
import { useEngine } from "./hooks/useEngine.js";
import Header from "./components/Header.jsx";
import SituationBanner from "./components/SituationBanner.jsx";
import SettlementsPanel from "./components/SettlementsPanel.jsx";
import AlertsPanel from "./components/AlertsPanel.jsx";
import SimulationPanel from "./components/SimulationPanel.jsx";
import OverviewTab from "./components/tabs/OverviewTab.jsx";
import MapTab from "./components/tabs/MapTab.jsx";
import TeamsTab from "./components/tabs/TeamsTab.jsx";
import Tour from "./components/Tour.jsx";
import { Panel } from "./components/ui/primitives.jsx";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "map", label: "Map & Routing", icon: MapIcon },
  { id: "plan", label: "Priority Plan", icon: ListOrdered },
  { id: "teams", label: "Teams", icon: Users },
  { id: "alerts", label: "Alerts", icon: Bell },
];

export default function App() {
  const engine = useEngine();
  const { closedSet, plan, alerts, kpis, actions, state, routingMode, orsKey, liveStatus } = engine;
  const { requirements, assignments, coverage, teams, autoMode } = engine;

  const [selectedId, setSelectedId] = useState("RAVET");
  const [activeTab, setActiveTab] = useState("overview");
  const [step, setStep] = useState(0);
  const tourOpen = step >= 0;

  // Theme — initialised from the value the inline head script already applied
  // (saved choice or OS preference), then kept in sync + persisted.
  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem("raah_theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const selected = useMemo(
    () => plan.find((r) => r.settlement.id === selectedId),
    [plan, selectedId]
  );

  const steps = useMemo(
    () => [
      { id: null, title: "Welcome" },
      {
        id: "tour-overview",
        tab: "overview",
        title: "Your situation at a glance",
        body:
          "This is Pimpri-Chinchwad during a flood. RAAH tracks seven riverside settlements and tells you, in plain language, what's happening and what to do next. The tiles below jump straight to each working view.",
      },
      {
        id: "tour-plan",
        tab: "plan",
        title: "Who gets help first",
        body:
          "Every settlement is ranked by a transparent score blending flood risk, how hard it is to reach, and population. Click a row to see exactly why it ranks where it does — the list re-orders itself as conditions change.",
      },
      {
        id: "tour-map",
        tab: "map",
        title: "Try it — close a bridge",
        body:
          "Ravet is reached over the Ravet Bridge across the Pavana. Close it and RAAH instantly finds a longer alternate route — or flags the settlement as cut off. I'll do it for you.",
        actionLabel: "Close Ravet Bridge",
        action: () => {
          setSelectedId("RAVET");
          actions.signature();
        },
      },
      {
        id: "tour-teams",
        tab: "teams",
        title: "Deploy the right teams",
        body:
          "RAAH works out how many rescuers, boats and medics each settlement needs, then auto-allocates your units in priority order. Reassign anyone — coverage and spare capacity update live.",
      },
      {
        id: "tour-alerts",
        tab: "alerts",
        title: "Evidence, not guesses",
        body:
          "Each alert carries its confidence, timestamp and the evidence behind it. Unverified single-source tips are flagged rather than acted on — RAAH flags uncertainty instead of inventing certainty.",
      },
    ],
    [actions]
  );

  // Advancing the tour also switches to the tab that step lives on.
  const goStep = (s) => {
    const t = steps[s]?.tab;
    if (t) setActiveTab(t);
    setStep(s);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper">
      <Header kpis={kpis} onHelp={() => goStep(0)} theme={theme} onToggleTheme={toggleTheme} />
      <SituationBanner kpis={kpis} plan={plan} onSelect={setSelectedId} />
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <main className="relative min-h-0 flex-1 overflow-hidden p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full min-h-0 flex-col"
          >
            {activeTab === "overview" && (
              <div id="tour-overview" className="flex min-h-0 flex-1 flex-col">
                <OverviewTab
                  kpis={kpis}
                  plan={plan}
                  coverage={coverage}
                  routingMode={routingMode}
                  onGoTab={setActiveTab}
                  onSelect={setSelectedId}
                />
              </div>
            )}

            {activeTab === "map" && (
              <div id="tour-map" className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_330px]">
                <div className="flex min-h-[420px] lg:min-h-0">
                  <MapTab
                    plan={plan}
                    selectedId={selectedId}
                    closedSet={closedSet}
                    onToggleRoad={actions.toggleRoad}
                    onSelect={setSelectedId}
                    routingMode={routingMode}
                    orsKey={orsKey}
                    liveStatus={liveStatus}
                    onSetOrsKey={actions.setOrsKey}
                    theme={theme}
                  />
                </div>
                <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
                  <RouteCard selected={selected} />
                  <SimulationPanel plan={plan} actions={actions} closedCount={state.closedEdges.length} />
                </div>
              </div>
            )}

            {activeTab === "plan" && (
              <div id="tour-plan" className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
                <SettlementsPanel plan={plan} selectedId={selectedId} onSelect={setSelectedId} />
              </div>
            )}

            {activeTab === "teams" && (
              <div id="tour-teams" className="flex min-h-0 flex-1 flex-col">
                <TeamsTab
                  plan={plan}
                  requirements={requirements}
                  assignments={assignments}
                  coverage={coverage}
                  teams={teams}
                  autoMode={autoMode}
                  actions={actions}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
            )}

            {activeTab === "alerts" && (
              <div id="tour-alerts" className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col">
                <AlertsPanel alerts={alerts} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {tourOpen && <Tour steps={steps} step={step} setStep={goStep} onClose={() => setStep(-1)} />}
      </AnimatePresence>
    </div>
  );
}

function getInitialTheme() {
  try {
    const set = document.documentElement.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    const saved = localStorage.getItem("raah_theme");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    /* ignore */
  }
  return "light";
}

function TabBar({ tabs, active, onChange }) {
  return (
    <nav className="flex items-stretch gap-1 border-b border-line bg-paper-panel/80 px-3 backdrop-blur">
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-medium transition-colors ${
              on ? "text-ink-900" : "text-ink-400 hover:text-ink-700"
            }`}
          >
            <t.icon size={14} strokeWidth={2.2} />
            {t.label}
            {on && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function RouteCard({ selected }) {
  if (!selected) return null;
  const cut = !selected.priority.reachable;
  const s = selected.settlement;
  return (
    <Panel title="Selected route" subtitle={`Base → ${s.label}`} className="shrink-0">
      <div className="p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.id + (cut ? "-cut" : "-ok")}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
          >
            {cut ? (
              <div className="flex items-center gap-2 rounded-xl bg-risk-critical/10 px-3 py-2.5 text-[12px] font-semibold text-risk-critical">
                <Ban size={14} /> {s.label} — no open route from base
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-accent-soft px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-ink">
                  <Navigation size={14} /> {s.label}
                </span>
                <span className="text-[12px] font-medium text-ink-600 tabular">
                  {selected.route.distanceKm} km · {selected.priority.travelMin} min
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <p className="mt-2.5 text-[11px] leading-relaxed text-ink-500">{s.note}</p>
      </div>
    </Panel>
  );
}
