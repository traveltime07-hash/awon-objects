// src/pages/Obiekty.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

type Objekt = {
  id: string;
  name: string;
  city?: string;
  country?: string;
  checkIn?: string;   // HH:mm
  checkOut?: string;  // HH:mm
};

const LS_KEY = "awon_objects_v1";

function load(): Objekt[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch {}
  // start z przykładowym obiektem (jak na screenie)
  return [
    { id: "obj-1", name: "Apartamenty Słoneczna", city: "Sława", country: "Polska", checkIn: "16:00", checkOut: "10:00" },
  ];
}
function save(v: Objekt[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {}
}

export default function Obiekty() {
  const nav = useNavigate();
  const [items, setItems] = useState<Objekt[]>(load());
  useEffect(() => save(items), [items]);

  // formularz
  const [name, setName]       = useState("");
  const [addr1, setAddr1]     = useState("");
  const [addr2, setAddr2]     = useState("");
  const [city, setCity]       = useState("");
  const [postal, setPostal]   = useState("");
  const [country, setCountry] = useState("Polska");
  const [checkIn, setCheckIn]   = useState("16:00");
  const [checkOut, setCheckOut] = useState("10:00");

  function addObject() {
    const n = name.trim();
    if (!n) return;
    const id = "obj-" + Date.now().toString(36);
    const obj: Objekt = { id, name: n, city: city.trim() || undefined, country, checkIn, checkOut };
    setItems((prev) => [obj, ...prev]);
    // reset minimalny
    setName("");
    setAddr1(""); setAddr2(""); setCity(""); setPostal("");
  }

  function removeObject(id: string) {
    if (!confirm("Usunąć obiekt?")) return;
    setItems((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold">Twoje obiekty</h1>
      <p className="text-sm text-gray-600">Dodaj obiekt, a potem zarządzaj pokojami i zespołem.</p>

      {/* karta: dodaj obiekt */}
      <div className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Dodaj obiekt</div>
          <button onClick={addObject} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Dodaj</button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm">
            <div className="text-gray-600">Nazwa obiektu</div>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm">
              <div className="text-gray-600">Adres – linia 1</div>
              <input value={addr1} onChange={(e)=>setAddr1(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="text-sm">
              <div className="text-gray-600">Adres – linia 2</div>
              <input value={addr2} onChange={(e)=>setAddr2(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm">
              <div className="text-gray-600">Miasto</div>
              <input value={city} onChange={(e)=>setCity(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="text-sm">
              <div className="text-gray-600">Kod pocztowy</div>
              <input value={postal} onChange={(e)=>setPostal(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="text-sm">
              <div className="text-gray-600">Kraj</div>
              <input value={country} onChange={(e)=>setCountry(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm">
              <div className="text-gray-600">Check-in</div>
              <input type="time" value={checkIn} onChange={(e)=>setCheckIn(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="text-sm">
              <div className="text-gray-600">Check-out</div>
              <input type="time" value={checkOut} onChange={(e)=>setCheckOut(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
          </div>
        </div>
      </div>

      {/* lista obiektów */}
      <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 text-lg font-semibold">Lista obiektów</div>
        <div className="space-y-3">
          {items.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">{o.name}</div>
                <div className="text-xs text-gray-600">{[o.city, o.country].filter(Boolean).join(", ")}</div>
              </div>
              <div className="flex gap-2">
                {/* przejście do kalendarza; przekazujemy id obiektu jako query param (opcjonalnie) */}
                <Link
                  to={`/kalendarz?obj=${encodeURIComponent(o.id)}`}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                >
                  Wejdź
                </Link>
                <button
                  onClick={() => removeObject(o.id)}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-gray-500">Brak obiektów — dodaj pierwszy powyżej.</div>}
        </div>
      </div>
    </div>
  );
}
