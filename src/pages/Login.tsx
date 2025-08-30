// src/pages/Login.tsx
import React, { useState } from "react";

const ADMIN_EMAIL = "traveltime07@gmail.com";
const ADMIN_PASSWORD = "12345678aA";

function setSession(email: string) {
  try {
    localStorage.setItem(
      "awon_auth",
      JSON.stringify({ email, role: "admin", ts: Date.now() })
    );
  } catch {}
}
function isAuthed() {
  try {
    const raw = localStorage.getItem("awon_auth");
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data?.role === "admin" && typeof data?.email === "string";
  } catch {
    return false;
  }
}

export default function Login() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState(ADMIN_PASSWORD);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setSession(email);
      window.location.href = "/admin";
      return;
    }
    setError("Nieprawidłowy login lub hasło.");
  }

  if (isAuthed()) {
    window.location.replace("/admin");
    return null;
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow
