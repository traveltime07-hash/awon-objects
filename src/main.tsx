// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Render helper
function mount(el: HTMLElement, node: React.ReactNode) {
  const root = createRoot(el);
  root.render(<React.StrictMode>{node}</React.StrictMode>);
}

const el = document.getElementById("root")!;
const path = window.location.pathname;

// ─────────────────────────────────────────────────────────────
// Jeżeli URL zaczyna się od /app → renderujemy SPA (panel)
// W przeciwnym razie → renderujemy stronę główną (Landing)
// ─────────────────────────────────────────────────────────────
if (path.startsWith("/app")) {
  // importujemy lazily, żeby nie ładować SPA na stronie głównej
  import("./App").then(({ default: App }) => {
    mount(el, <App />);
  });
} else {
  // tu wstaw swój komponent strony głównej
  // jeśli używasz innej nazwy/pliku, zamień import na właściwy
  import("./pages/Home").then(({ default: Home }) => {
    mount(el, <Home />);
  });
}
