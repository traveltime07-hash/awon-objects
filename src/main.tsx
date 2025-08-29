import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App"; // Twoja obecna aplikacja (np. /app)
import Auth from "./pages/Auth";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        {/* Domyślnie kierujemy na logowanie */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<Auth defaultTab="login" />} />
        <Route path="/rejestracja" element={<Auth defaultTab="register" />} />

        {/* Twoja aplikacja (to co już masz w App.tsx) */}
        <Route path="/app/*" element={<App />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
