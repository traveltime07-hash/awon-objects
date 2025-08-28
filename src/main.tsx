import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.tsx"; // to jest Twoja obecna aplikacja (obiekty/role)
import Landing from "./pages/Landing.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Landing jako strona główna */}
        <Route path="/" element={<Landing />} />
        {/* Dotychczasowa aplikacja */}
        <Route path="/app" element={<App />} />
        {/* Fallback na / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
