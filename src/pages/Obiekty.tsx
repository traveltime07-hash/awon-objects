// src/pages/Obiekty.tsx
import { useEffect, useState } from "react";
import { Plus, Pencil, X, Trash2, Check } from "lucide-react";
import { Link } from "react-router-dom";

/** Klucze i domyślne wartości współdzielone z kalendarzem */
const ROOMS_STORAGE_KEY = "awon_rooms";
const DEFAULT_ROOMS = ["Ap. 1", "Ap. 2", "Ap. 3", "Ap. 4"];

/** Helpers: odczyt/zapis pokoi do localStorage + event dla kalendarza */
function loadRooms(): string[] {
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr.slice(0, 50).map(String);
    }
  } catch {}
  return DEFAULT_ROOMS.slice();
}
function saveRooms(next: string[]) {
  try {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("awon:rooms-change")); // nasłuchiwane przez kalendarz
  } catch {}
}

export default function Obiekty() {
  const [rooms, setRooms] = useState<string[]>(loadRooms());
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ idx: number; value: string } | null>(null);

  // nasłuch zmian z innych zakładek/okien
  useEffect(() => {
    const h = () => setRooms(loadRooms());
    window.addEventListener("storage", h as any);
    window.addEventListener("awon:rooms-change", h as any);
    return () => {
      window.removeEventListener("storage", h as any);
      window.removeEventListener("awon:rooms-change", h as any);
    };
  }, []);

  const addRoom = () => {
    const v = newName.trim();
    if (!v) return;
    if (rooms.includes(v)) {
      alert("Taka nazwa już istnieje.");
      return;
    }
    const next = [v, ...rooms];
    setRooms(next);
    saveRooms(next);
    setNewName("");
  };

  const removeRoom = (idx: number) => {
    const name = rooms[idx];
    if (!confirm(`Usunąć obiekt „${name}”?`)) return;
    const next = rooms.filter((_, i) => i !== idx);
    setRooms(next);
    saveRooms(next);
  };

  const startEdit = (idx: number) => setEditing({ idx, value: rooms[idx] });
  const cancelEdit = () => setEditing(null);
  const confirmEdit = () => {
    if (!editing) return;
    const v = editing.value.trim();
    if (!v) return;
    if (rooms.some((r, i) => i !== editing.idx && r === v)) {
      alert("Taka nazwa już istnieje.");
      return;
    }
    const next = rooms.map((r, i) => (i === editing.idx ? v : r));
    setRooms(next);
    saveRooms(next);
    setEditing(null);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= rooms.length) return;
    const next = rooms.slice();
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    setRooms(next);
    saveRooms(next);
  };

  const resetDefaults = () => {
    if (!confirm("Przywrócić domyślne obiekty?")) return;
    setRooms(DEFAULT_ROOMS.slice());
    saveRooms(DEFAULT_ROOMS.slice());
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Twoje obiekty</h1>
        <Link
          to="/kalendarz"
          className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700"
        >
          Przejdź do kalendarza
        </Link>
      </header>

      {/* Dodawanie nowego */}
      <div className="mb-4 flex flex-col gap-2 rounded-2xl border p-3 sm:flex-row sm:items-center">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nazwa nowego obiektu, np. „Ap. 5”"
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button
          onClick={addRoom}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Dodaj obiekt
        </button>
      </div>

      {/* Lista obiektów */}
      <div className="rounded-2xl border">
        {rooms.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Brak obiektów — dodaj pierwszy powyżej.</div>
        ) : (
          <ul className="divide-y">
            {rooms.map((name, idx) => {
              const isEditing = editing?.idx === idx;
              return (
                <li key={name + "|" + idx} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        value={editing!.value}
                        onChange={(e) => setEditing({ idx, value: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        autoFocus
                      />
                    ) : (
                      <div className="text-sm">
                        <span className="mr-2 inline-flex min-w-[64px] items-center justify-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          #{idx + 1}
                        </span>
                        {name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      title="W górę"
                      onClick={() => move(idx, -1)}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                      disabled={idx === 0}
                    >
                      ↑
                    </button>
                    <button
                      title="W dół"
                      onClick={() => move(idx, 1)}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                      disabled={idx === rooms.length - 1}
                    >
                      ↓
                    </button>

                    {isEditing ? (
                      <>
                        <button
                          onClick={confirmEdit}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Zapisz
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Anuluj
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(idx)}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edytuj
                        </button>
                        <button
                          onClick={() => removeRoom(idx)}
                          className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Usuń
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={resetDefaults}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Przywróć domyślne
        </button>
        <Link
          to="/kalendarz"
          className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700"
        >
          Otwórz kalendarz
        </Link>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Zmiany zapisują się w przeglądarce (localStorage) i są widoczne w kalendarzu.
      </p>
    </div>
  );
}
