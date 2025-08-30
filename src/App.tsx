// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Obiekty from "./pages/Obiekty";
import Kalendarz from "./pages/kalendarz";
import Admin from "./pages/Admin"; // jeśli używasz innego pliku panelu — podmień import

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Landing />} />

        {/* Logowanie */}
        <Route path="/login" element={<Login />} />
        <Route path="/app/login" element={<Login />} />

        {/* Moduły */}
        <Route path="/kalendarz" element={<Kalendarz />} />
        <Route path="/app/kalendarz" element={<Kalendarz />} />

        <Route path="/obiekty" element={<Obiekty />} />
        <Route path="/app/obiekty" element={<Obiekty />} />

        {/* Panel admina systemu */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/app/admin" element={<Admin />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
