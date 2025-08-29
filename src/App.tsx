import React from "react";
import { HashRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Kalendarz from "./pages/Kalendarz";

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Nie znaleziono strony</h2>
      <p>
        Przejdź do{" "}
        <Link to="/app/kalendarz" style={{ color: "#2563eb" }}>
          kalendarza
        </Link>
        .
      </p>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* start */}
        <Route path="/" element={<Navigate to="/app/kalendarz" replace />} />
        <Route path="/app" element={<Navigate to="/app/kalendarz" replace />} />

        {/* kalendarz */}
        <Route path="/app/kalendarz" element={<Kalendarz />} />

        {/* fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
