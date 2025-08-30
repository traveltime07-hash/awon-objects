export type Feature = { id: string; name: string; description?: string; paid?: boolean };
export type SiteState = {
  heroTitle: string;
  heroText: string;
  features: Feature[];
};

const KEY = "awon_site_state_v1";

const DEFAULT_STATE: SiteState = {
  heroTitle: "AWON — System rezerwacji obiektów",
  heroText: "Zarządzaj obiektami, kalendarzem i dodatkowymi usługami w jednym miejscu.",
  features: [
    { id: "f1", name: "Sauna", description: "Dostęp do sauny w obiekcie", paid: true },
    { id: "f2", name: "Jacuzzi", description: "Jacuzzi prywatne / wspólne", paid: true },
    { id: "f3", name: "Parking", description: "Miejsce parkingowe przy obiekcie", paid: false },
  ],
};

export function loadSiteState(): SiteState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && typeof s === "object") return s;
    }
  } catch {}
  return DEFAULT_STATE;
}

export function saveSiteState(s: SiteState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent("awon:site-change"));
  } catch {}
}
