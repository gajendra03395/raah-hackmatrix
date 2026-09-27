// RAAH geographic model — Pimpri-Chinchwad (PCMC), Pune.
// Real localities along the Pavana, Mula and Indrayani rivers, with a road
// network whose river crossings (bridges) are the interesting failure points.
// Coordinates are decimal degrees (lat/lng). Figures are illustrative demo data.

// Rescue base: PCMC Emergency Operations Centre, Pimpri.
export const BASE = { id: "base", kind: "base", label: "PCMC EOC · Pimpri", lat: 18.6285, lng: 73.8008 };

// Land junctions / chowks used to shape realistic routes.
export const JUNCTIONS = {
  nigdi:       { id: "nigdi",       kind: "junction", label: "Nigdi (Bhakti-Shakti)", lat: 18.6510, lng: 73.7690 },
  punawale:    { id: "punawale",    kind: "junction", label: "Punawale",              lat: 18.6470, lng: 73.7500 },
  kalewadi:    { id: "kalewadi",    kind: "junction", label: "Kalewadi Phata",        lat: 18.6190, lng: 73.7920 },
  dange:       { id: "dange",       kind: "junction", label: "Dange Chowk",           lat: 18.6080, lng: 73.7560 },
  nashikphata: { id: "nashikphata", kind: "junction", label: "Kasarwadi / Nashik Phata", lat: 18.6060, lng: 73.8180 },
  kasarwadi:   { id: "kasarwadi",   kind: "junction", label: "Sangvi Approach",       lat: 18.5980, lng: 73.8250 },
  bhosari:     { id: "bhosari",     kind: "junction", label: "Bhosari",               lat: 18.6320, lng: 73.8460 },
};

// Settlement attributes drive the risk + priority scoring.
// elevation: metres above the river datum (lower = more exposed).
// hazard: flood-probability estimate (0..1).  waterLevel: gauge in cm (dynamic).
// reportAgeMin: minutes since the freshest trustworthy field report.
export const SETTLEMENTS = {
  RAVET: { id: "RAVET", kind: "settlement", label: "Ravet", river: "Pavana", lat: 18.6523, lng: 73.7419,
    population: 3200, households: 720, elevation: 4, hazard: 0.74, waterLevel: 128, reportAgeMin: 8,
    note: "Riverside colonies by the Ravet bund — first to flood when the Pavana is in spate." },
  KIWALE: { id: "KIWALE", kind: "settlement", label: "Kiwale", river: "Pavana", lat: 18.6640, lng: 73.7350,
    population: 1800, households: 410, elevation: 6, hazard: 0.62, waterLevel: 104, reportAgeMin: 14,
    note: "Where the Pavana enters PCMC limits; low-lying stretch evacuated in 2024." },
  CHINCHWAD: { id: "CHINCHWAD", kind: "settlement", label: "Chinchwadgaon", river: "Pavana", lat: 18.6298, lng: 73.7995,
    population: 2600, households: 590, elevation: 9, hazard: 0.55, waterLevel: 92, reportAgeMin: 20,
    note: "Old town ghat on the Pavana bank; two independent approach roads." },
  WAKAD: { id: "WAKAD", kind: "settlement", label: "Wakad (Kaspate Vasti)", river: "Mula", lat: 18.5990, lng: 73.7630,
    population: 2400, households: 560, elevation: 8, hazard: 0.50, waterLevel: 86, reportAgeMin: 26,
    note: "Riverside vasti near the Mula; the crematorium floods when the river swells." },
  SANGVI: { id: "SANGVI", kind: "settlement", label: "New Sangvi", river: "Pavana–Mula", lat: 18.5735, lng: 73.8240,
    population: 2900, households: 680, elevation: 5, hazard: 0.68, waterLevel: 120, reportAgeMin: 10,
    note: "Beside the Pavana–Mula confluence; riverside societies evacuated repeatedly." },
  DAPODI: { id: "DAPODI", kind: "settlement", label: "Dapodi", river: "Mula", lat: 18.5800, lng: 73.8290,
    population: 2000, households: 470, elevation: 5, hazard: 0.60, waterLevel: 112, reportAgeMin: 12,
    note: "Gulabnagar by the Mula; primary access is the Harris Bridge crossing." },
  CHIKHALI: { id: "CHIKHALI", kind: "settlement", label: "Chikhali", river: "Indrayani", lat: 18.6790, lng: 73.8300,
    population: 2200, households: 520, elevation: 7, hazard: 0.64, waterLevel: 116, reportAgeMin: 16,
    note: "Gharkul colony inside the Indrayani flood line; reached by a single river bridge." },
};

export const SETTLEMENT_IDS = Object.keys(SETTLEMENTS);

// All routable nodes keyed by id (base + junctions + settlements).
export const NODES = (() => {
  const n = { [BASE.id]: BASE };
  for (const j of Object.values(JUNCTIONS)) n[j.id] = j;
  for (const s of Object.values(SETTLEMENTS)) n[s.id] = s;
  return n;
})();
// Road corridors. bridge = river crossing (the interesting closures);
// lowlying = sits in the floodplain (auto-flags first in heavy rain);
// signature = the headline demo closure (Ravet Bridge over the Pavana).
export const EDGES = [
  { id: "e1", a: "base", b: "nigdi", name: "Mumbai–Pune Hwy (→ Nigdi)" },
  { id: "e2", a: "base", b: "kalewadi", name: "Kalewadi Main Rd" },
  { id: "e3", a: "base", b: "CHINCHWAD", name: "Chinchwad Link Rd" },
  { id: "e4", a: "base", b: "nashikphata", name: "Old NH-4 (→ Nashik Phata)" },
  { id: "e5", a: "base", b: "bhosari", name: "Spine Rd (→ Bhosari)" },
  { id: "e6", a: "nigdi", b: "punawale", name: "Nigdi–Punawale Rd", closable: true },
  { id: "e7", a: "punawale", b: "RAVET", name: "Ravet Bridge", river: "Pavana", bridge: true, closable: true, signature: true },
  { id: "e8", a: "nigdi", b: "KIWALE", name: "Kiwale Ridge Rd", closable: true },
  { id: "e9", a: "RAVET", b: "KIWALE", name: "Pavana Riverside Rd", river: "Pavana", lowlying: true, closable: true },
  { id: "e10", a: "kalewadi", b: "CHINCHWAD", name: "Chinchwadgaon Rd", closable: true },
  { id: "e11", a: "CHINCHWAD", b: "WAKAD", name: "Chinchwad–Wakad Butterfly Bridge", river: "Pavana", bridge: true, closable: true },
  { id: "e12", a: "kalewadi", b: "dange", name: "Kalewadi–Dange Chowk Rd", closable: true },
  { id: "e13", a: "dange", b: "WAKAD", name: "Dange Chowk–Wakad Rd", closable: true },
  { id: "e14", a: "nigdi", b: "kalewadi", name: "Aundh–Ravet BRT Link", closable: true },
  { id: "e15", a: "nashikphata", b: "kasarwadi", name: "Kasarwadi Rd", closable: true },
  { id: "e16", a: "kasarwadi", b: "SANGVI", name: "New Sangvi Rd", closable: true },
  { id: "e17", a: "kasarwadi", b: "DAPODI", name: "Harris Bridge", river: "Mula", bridge: true, closable: true },
  { id: "e18", a: "SANGVI", b: "DAPODI", name: "Mula Riverside Rd", river: "Mula", lowlying: true, closable: true },
  { id: "e19", a: "WAKAD", b: "SANGVI", name: "Mula-side Connector", closable: true },
  { id: "e20", a: "bhosari", b: "CHIKHALI", name: "Moshi Indrayani Bridge", river: "Indrayani", bridge: true, closable: true },
  { id: "e21", a: "CHINCHWAD", b: "punawale", name: "Pavana Belt Rd", closable: true },
];

// Deployable rescue units (the roster the coordinator allocates).
// type: boat (water rescue), rescue (ground SAR), medical, logistics.
export const TEAMS = [
  { id: "ndrf1", name: "NDRF Alpha", type: "boat", members: 6, note: "Inflatable boats, swift-water rescue" },
  { id: "ndrf2", name: "NDRF Bravo", type: "boat", members: 6, note: "Inflatable boats, swift-water rescue" },
  { id: "sdrf1", name: "SDRF-1", type: "rescue", members: 6, note: "Ground search & evacuation" },
  { id: "fire1", name: "Fire & Rescue 1", type: "rescue", members: 5, note: "PCMC Central Fire station" },
  { id: "fire2", name: "Fire & Rescue 2", type: "rescue", members: 5, note: "Bhosari Fire station" },
  { id: "boatv1", name: "Volunteer Boat Sq.", type: "boat", members: 5, note: "Trained local boat volunteers" },
  { id: "med1", name: "Medical Unit 1", type: "medical", members: 4, note: "Paramedics + ambulance" },
  { id: "med2", name: "Medical Unit 2", type: "medical", members: 4, note: "Paramedics + ambulance" },
  { id: "log1", name: "Logistics 1", type: "logistics", members: 4, note: "Relief supplies & transport" },
  { id: "pol1", name: "Police Response", type: "rescue", members: 5, note: "Crowd control & evacuation" },
];

// ---- geometry helpers -------------------------------------------------------
const R = 6371; // km
const toRad = (d) => (d * Math.PI) / 180;

export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

const SPEED_KMH = 24; // urban arterial average

export function edgeKm(edge, nodes = NODES) {
  return haversineKm(nodes[edge.a], nodes[edge.b]);
}

// Travel minutes, penalised for bridges (chokepoints) and floodplain roads.
export function edgeMinutes(edge, nodes = NODES) {
  const factor = edge.lowlying ? 1.35 : edge.bridge ? 1.15 : 1;
  return Math.max(1, (edgeKm(edge, nodes) / SPEED_KMH) * 60 * factor);
}

export function edgeMidpoint(edge, nodes = NODES) {
  const a = nodes[edge.a];
  const b = nodes[edge.b];
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
}

export function adjacentEdges(nodeId) {
  return EDGES.filter((e) => e.a === nodeId || e.b === nodeId);
}

