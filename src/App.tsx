/* -- CAŁOŚĆ DO WKLEJENIA -- */
import React, { useMemo, useState } from "react";

/* =========================================================
   AWON — Obiekty -> Ustawienia / Pokoje / Zespół / Uprawnienia
   Poprawki:
   - USUNIĘTE: emoji w JSX
   - BEZ "Section" (zwykłe <h4> + <div>)
   - deepClone (JSON) zamiast structuredClone
   - Polifill randomUUID, defensywne guardy
   - ErrorBoundary dla modala uprawnieńimport React, { useMemo, useState } from "react";

/**
 * AWON — Obiekty / Pokoje / Zespół / Uprawnienia (demo)
 * - pełny plik z brakującymi komponentami Section i Checkbox
 * - bez emoji (żeby nie było problemów z babel)
 */

/* ========= Typy ========= */

type MemberRoleStd = "Owner" | "Manager" | "Housekeeping" | "Accounting" | "PropertyService";

type Room = { id: string; name: string };

type InvoiceData = {
  name: string;
  email: string;
  nip: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
};

type CalendarPermissions = {
  canViewCalendar: boolean;
  roomScope: "all" | "selected";
  roomIds: string[];
  showReservationDates: boolean;
  showCheckInOutTimes: boolean;
  showGuestCount: boolean;
  showDogs: boolean;
  showGuestName: boolean;
  showContactInfo: boolean;
  showPrices: boolean;
  showPaymentStatus: boolean;
};

type NotesPermissions = {
  canViewOwnerNotes: boolean;
  canAddStaffNotes: boolean;
  canEditOwnNotes: boolean;
  canEditOwnerNotes: boolean;
  canAttachPhotos: boolean;
  canViewDamageReports: boolean;
};

type CleaningPermissions = {
  canViewCleaningTasks: boolean;
  canMarkCleaningDone: boolean;
  canAssignCleaningTasks: boolean;
  canChangeCleaningDate: boolean;
  canSeeCleaningAnnotations: boolean;
};

type OperationPermissions = {
  canExportCalendar: boolean;
  canPrintCalendar: boolean;
  canCommentOnTask: boolean;
};

type Permissions = {
  calendar: CalendarPermissions;
  notes: NotesPermissions;
  cleaning: CleaningPermissions;
  ops: OperationPermissions;
};

type Member = { id: string; name: string; email: string; password?: string; role: string; permissions: Permissions };

type Property = {
  id: string;
  org_id: string;
  name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country: string;
  check_in_time?: string;
  check_out_time?: string;
  invoice: InvoiceData;
  rooms: Room[];
  members: Member[];
};

/* ========= Labels ========= */

const roleLabels: Record<MemberRoleStd, string> = {
  Owner: "Właściciel",
  Manager: "Menadżer",
  Housekeeping: "Sprzątanie",
  Accounting: "Księgowość",
  PropertyService: "Obsługa obiektu",
};

/* ========= Presety uprawnień ========= */

function defaultPermissions(role: string, allRoomIds: string[]): Permissions {
  const all: Permissions = {
    calendar: {
      canViewCalendar: true,
      roomScope: "all",
      roomIds: allRoomIds,
      showReservationDates: true,
      showCheckInOutTimes: true,
      showGuestCount: true,
      showDogs: true,
      showGuestName: true,
      showContactInfo: true,
      showPrices: true,
      showPaymentStatus: true,
    },
    notes: {
      canViewOwnerNotes: true,
      canAddStaffNotes: true,
      canEditOwnNotes: true,
      canEditOwnerNotes: true,
      canAttachPhotos: true,
      canViewDamageReports: true,
    },
    cleaning: {
      canViewCleaningTasks: true,
      canMarkCleaningDone: true,
      canAssignCleaningTasks: true,
      canChangeCleaningDate: true,
      canSeeCleaningAnnotations: true,
    },
    ops: {
      canExportCalendar: true,
      canPrintCalendar: true,
      canCommentOnTask: true,
    },
  };

  const manager: Permissions = { ...all, notes: { ...all.notes, canEditOwnerNotes: false } };

  const housekeeping: Permissions = {
    calendar: {
      canViewCalendar: true,
      roomScope: "all",
      roomIds: allRoomIds,
      showReservationDates: true,
      showCheckInOutTimes: true,
      showGuestCount: true,
      showDogs: true,
      showGuestName: false,
      showContactInfo: false,
      showPrices: false,
      showPaymentStatus: false,
    },
    notes: { canViewOwnerNotes: true, canAddStaffNotes: true, canEditOwnNotes: true, canEditOwnerNotes: false, canAttachPhotos: true, canViewDamageReports: true },
    cleaning: { canViewCleaningTasks: true, canMarkCleaningDone: true, canAssignCleaningTasks: false, canChangeCleaningDate: false, canSeeCleaningAnnotations: true },
    ops: { canExportCalendar: false, canPrintCalendar: true, canCommentOnTask: true },
  };

  const accounting: Permissions = {
    calendar: {
      canViewCalendar: true,
      roomScope: "all",
      roomIds: allRoomIds,
      showReservationDates: true,
      showCheckInOutTimes: true,
      showGuestCount: true,
      showDogs: false,
      showGuestName: true,
      showContactInfo: true,
      showPrices: true,
      showPaymentStatus: true,
    },
    notes: { canViewOwnerNotes: true, canAddStaffNotes: false, canEditOwnNotes: false, canEditOwnerNotes: false, canAttachPhotos: false, canViewDamageReports: true },
    cleaning: { canViewCleaningTasks: false, canMarkCleaningDone: false, canAssignCleaningTasks: false, canChangeCleaningDate: false, canSeeCleaningAnnotations: false },
    ops: { canExportCalendar: true, canPrintCalendar: true, canCommentOnTask: false },
  };

  const service: Permissions = {
    calendar: {
      canViewCalendar: true,
      roomScope: "selected",
      roomIds: allRoomIds.slice(0, 1),
      showReservationDates: true,
      showCheckInOutTimes: true,
      showGuestCount: true,
      showDogs: true,
      showGuestName: false,
      showContactInfo: false,
      showPrices: false,
      showPaymentStatus: false,
    },
    notes: { canViewOwnerNotes: true, canAddStaffNotes: true, canEditOwnNotes: true, canEditOwnerNotes: false, canAttachPhotos: true, canViewDamageReports: true },
    cleaning: { canViewCleaningTasks: true, canMarkCleaningDone: true, canAssignCleaningTasks: false, canChangeCleaningDate: false, canSeeCleaningAnnotations: true },
    ops: { canExportCalendar: false, canPrintCalendar: true, canCommentOnTask: true },
  };

  switch (role) {
    case "Owner": return all;
    case "Manager": return manager;
    case "Housekeeping": return housekeeping;
    case "Accounting": return accounting;
    case "PropertyService": return service;
    default: return housekeeping;
  }
}

/* ========= Fikcyjne „API” ========= */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fakeApi = {
  async addProperty(p: Partial<Property>) { await sleep(200); return { ok: true, id: crypto.randomUUID() } as const; },
  async deleteProperty(id: string) { await sleep(150); return { ok: true } as const; },
  async saveProperty(partial: any) { await sleep(150); return { ok: true } as const; },
  async saveInvoice(payload: any) { await sleep(150); return { ok: true } as const; },
  async addRoom(room: any) { await sleep(120); return { ok: true, id: crypto.randomUUID() } as const; },
  async deleteRoom(id: string) { await sleep(100); return { ok: true } as const; },
  async addMember(m: any) { await sleep(120); return { ok: true, id: crypto.randomUUID() } as const; },
  async updateMember(m: any) { await sleep(120); return { ok: true } as const; },
  async deleteMember(id: string) { await sleep(100); return { ok: true } as const; },
};

/* ========= Root App ========= */

export default function App() {
  const [screen, setScreen] = useState<"home" | "property">("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [properties, setProperties] = useState<Property[]>([
    seedProperty("Apartamenty Słoneczna", "Sława"),
  ]);

  const selected = properties.find((p) => p.id === selectedId) || null;

  const openProperty = (id: string) => { setSelectedId(id); setScreen("property"); };

  const createProperty = async (draft: Partial<Property>) => {
    if (!draft.name?.trim()) return toast("Podaj nazwę obiektu");
    setBusy(true);
    const res = await fakeApi.addProperty(draft);
    const newProp: Property = {
      id: res.id,
      org_id: "org_abc",
      name: draft.name!,
      address_line1: draft.address_line1 ?? "",
      address_line2: draft.address_line2 ?? "",
      city: draft.city ?? "",
      postal_code: draft.postal_code ?? "",
      country: draft.country ?? "Polska",
      check_in_time: draft.check_in_time ?? "16:00",
      check_out_time: draft.check_out_time ?? "10:00",
      invoice: emptyInvoice(),
      rooms: [],
      members: [],
    };
    setProperties((arr) => [newProp, ...arr]);
    setBusy(false);
    toast("Dodano obiekt");
  };

  const removeProperty = async (id: string) => {
    if (!confirm("Usunąć obiekt?")) return;
    setBusy(true);
    await fakeApi.deleteProperty(id);
    setProperties((arr) => arr.filter((p) => p.id !== id));
    if (selectedId === id) { setSelectedId(null); setScreen("home"); }
    setBusy(false);
  };

  const persistProperty = (updated: Property) => { setProperties((arr) => arr.map((p) => (p.id === updated.id ? updated : p))); };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {screen === "home" && (
        <HomeScreen properties={properties} onOpen={openProperty} onCreate={createProperty} onDelete={removeProperty} busy={busy} />
      )}
      {screen === "property" && selected && (
        <PropertyScreen property={selected} onBack={() => setScreen("home")} onPersist={persistProperty} />
      )}
      <ToastHost />
    </div>
  );
}

/* ========= Home ========= */

function HomeScreen({
  properties, onOpen, onCreate, onDelete, busy,
}: { properties: Property[]; onOpen: (id: string) => void; onCreate: (draft: Partial<Property>) => void; onDelete: (id: string) => void; busy: boolean; }) {
  const [draft, setDraft] = useState<Partial<Property>>({ country: "Polska", check_in_time: "16:00", check_out_time: "10:00" });
  return (
    <div>
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-xl md:text-2xl font-semibold">Twoje obiekty</div>
            <div className="text-sm opacity-70">Dodaj obiekt, a potem zarządzaj pokojami i zespołem</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <Card title="Dodaj obiekt" footer={<Button variant="primary" disabled={busy} onClick={() => onCreate(draft)}>Dodaj</Button>}>
          <FormGrid>
            <TextInput label="Nazwa obiektu" value={draft.name ?? ""} onChange={(v) => setDraft((s) => ({ ...s, name: v }))} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput label="Adres – linia 1" value={draft.address_line1 ?? ""} onChange={(v) => setDraft((s) => ({ ...s, address_line1: v }))} />
              <TextInput label="Adres – linia 2" value={draft.address_line2 ?? ""} onChange={(v) => setDraft((s) => ({ ...s, address_line2: v }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextInput label="Miasto" value={draft.city ?? ""} onChange={(v) => setDraft((s) => ({ ...s, city: v }))} />
              <TextInput label="Kod pocztowy" value={draft.postal_code ?? ""} onChange={(v) => setDraft((s) => ({ ...s, postal_code: v }))} />
              <TextInput label="Kraj" value={draft.country ?? "Polska"} onChange={(v) => setDraft((s) => ({ ...s, country: v }))} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TimeInput label="Check-in" value={draft.check_in_time ?? "16:00"} onChange={(v) => setDraft((s) => ({ ...s, check_in_time: v }))} />
              <TimeInput label="Check-out" value={draft.check_out_time ?? "10:00"} onChange={(v) => setDraft((s) => ({ ...s, check_out_time: v }))} />
            </div>
          </FormGrid>
        </Card>

        <Card title="Lista obiektów">
          {properties.length === 0 ? (
            <div className="text-sm opacity-70">Brak obiektów — dodaj pierwszy powyżej.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((p) => (
                <div key={p.id} className="border rounded-2xl p-4 bg-white shadow-sm hover:shadow transition-shadow">
                  <div className="text-lg font-medium">{p.name}</div>
                  <div className="text-sm opacity-70">{[p.city, p.country].filter(Boolean).join(", ")}</div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => onOpen(p.id)}>Wejdź</Button>
                    <Button variant="outline" tone="danger" onClick={() => onDelete(p.id)}>Usuń</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

/* ========= Property ========= */

function PropertyScreen({ property: initialProp, onBack, onPersist }: { property: Property; onBack: () => void; onPersist: (p: Property) => void }) {
  const [tab, setTab] = useState<"ust" | "rooms" | "team">("ust");
  const [busy, setBusy] = useState(false);
  const [property, setProperty] = useState<Property>(initialProp);

  const headerSubtitle = useMemo(() => [property.city, property.country].filter(Boolean).join(", "), [property.city, property.country]);

  const saveBasics = async () => {
    setBusy(true);
    await fakeApi.saveProperty({
      id: property.id,
      name: property.name,
      address_line1: property.address_line1,
      address_line2: property.address_line2,
      city: property.city,
      postal_code: property.postal_code,
      country: property.country,
      check_in_time: property.check_in_time,
      check_out_time: property.check_out_time,
    });
    setBusy(false);
    onPersist(property);
    toast("Zapisano dane obiektu");
  };

  const copyBasicsToInvoice = () => {
    setProperty((p) => ({
      ...p,
      invoice: {
        ...p.invoice,
        address_line1: p.address_line1 || "",
        address_line2: p.address_line2 || "",
        city: p.city || "",
        postal_code: p.postal_code || "",
        country: p.country || "Polska",
      },
    }));
    toast("Skopiowano dane adresowe do faktury");
  };
  const saveInvoice = async () => {
    setBusy(true);
    await fakeApi.saveInvoice({ property_id: property.id, ...property.invoice });
    setBusy(false);
    onPersist(property);
    toast("Zapisano dane do faktury");
  };

  // Pokoje (tylko nazwy)
  const [roomName, setRoomName] = useState("");
  const addRoom = async () => {
    const name = roomName.trim();
    if (!name) return toast("Podaj nazwę pokoju");
    setBusy(true);
    const res = await fakeApi.addRoom({ name, property_id: property.id, org_id: property.org_id });
    const updated: Property = { ...property, rooms: [...property.rooms, { id: res.id, name }] };
    // zaktualizuj roomIds w uprawnieniach jeśli ktoś miał "all"
    updated.members = updated.members.map((m) => ({
      ...m,
      permissions: {
        ...m.permissions,
        calendar: {
          ...m.permissions.calendar,
          roomIds: m.permissions.calendar.roomScope === "all" ? updated.rooms.map((r) => r.id) : m.permissions.calendar.roomIds,
        },
      },
    }));
    setProperty(updated);
    setRoomName("");
    setBusy(false);
    onPersist(updated);
    toast("Dodano pokój");
  };
  const deleteRoom = async (id: string) => {
    if (!confirm("Usunąć pokój?")) return;
    setBusy(true);
    await fakeApi.deleteRoom(id);
    const updated: Property = { ...property, rooms: property.rooms.filter((r) => r.id !== id) };
    updated.members = updated.members.map((m) => ({
      ...m,
      permissions: {
        ...m.permissions,
        calendar: { ...m.permissions.calendar, roomIds: m.permissions.calendar.roomIds.filter((rid) => rid !== id) },
      },
    }));
    setProperty(updated);
    setBusy(false);
    onPersist(updated);
  };

  // Zespół
  const [memberDraft, setMemberDraft] = useState<{ name: string; email: string; password: string; roleSel: string; customRole: string }>({
    name: "",
    email: "",
    password: "",
    roleSel: "Housekeeping",
    customRole: "",
  });

  const addMember = async () => {
    const name = memberDraft.name.trim();
    const email = memberDraft.email.trim();
    const password = memberDraft.password.trim();
    if (!name) return toast("Podaj imię i nazwisko");
    if (!email) return toast("Podaj e-mail");
    if (!password) return toast("Podaj hasło");
    const role = memberDraft.roleSel === "Custom" ? (memberDraft.customRole.trim() || "Rola") : memberDraft.roleSel;
    setBusy(true);
    const res = await fakeApi.addMember({ name, email, password, role, property_id: property.id, org_id: property.org_id });
    const perms = defaultPermissions(role, property.rooms.map((r) => r.id));
    const updated: Property = { ...property, members: [...property.members, { id: res.id, name, email, password, role, permissions: perms }] };
    setProperty(updated);
    setMemberDraft({ name: "", email: "", password: "", roleSel: "Housekeeping", customRole: "" });
    setBusy(false);
    onPersist(updated);
    toast("Dodano członka zespołu");
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; email: string; password: string; roleSel: string; customRole: string }>({
    name: "",
    email: "",
    password: "",
    roleSel: "Housekeeping",
    customRole: "",
  });

  const startEdit = (m: Member) => {
    const isStd = (Object.keys(roleLabels) as string[]).includes(m.role);
    setEditingId(m.id);
    setEditDraft({ name: m.name, email: m.email, password: "", roleSel: isStd ? m.role : "Custom", customRole: isStd ? "" : m.role });
  };
  const cancelEdit = () => { setEditingId(null); };
  const saveEdit = async (id: string) => {
    const role = editDraft.roleSel === "Custom" ? (editDraft.customRole.trim() || "Rola") : editDraft.roleSel;
    setBusy(true);
    await fakeApi.updateMember({ id, ...editDraft, role });
    const updated: Property = {
      ...property,
      members: property.members.map((m) =>
        (m.id === id
          ? { ...m, name: editDraft.name, email: editDraft.email, role, ...(editDraft.password ? { password: editDraft.password } : {}) }
          : m)),
    };
    setProperty(updated);
    setBusy(false);
    onPersist(updated);
    setEditingId(null);
    toast("Zapisano zmiany członka zespołu");
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Usunąć przypisanie?")) return;
    setBusy(true);
    await fakeApi.deleteMember(id);
    const updated: Property = { ...property, members: property.members.filter((m) => m.id !== id) };
    setProperty(updated);
    setBusy(false);
    onPersist(updated);
  };

  // Uprawnienia
  const [permFor, setPermFor] = useState<Member | null>(null);
  const openPermissions = (m: Member) => { setPermFor(m); };
  const closePermissions = () => setPermFor(null);
  const savePermissions = (updatedPerms: Permissions) => {
    if (!permFor) return;
    const updated: Property = { ...property, members: property.members.map((m) => (m.id === permFor.id ? { ...m, permissions: updatedPerms } : m)) };
    setProperty(updated);
    onPersist(updated);
    toast("Zapisano uprawnienia");
  };

  return (
    <div>
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onBack}>← Obiekty</Button>
            <div>
              <div className="text-xl md:text-2xl font-semibold">{property.name}</div>
              <div className="text-sm opacity-70">{headerSubtitle}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <TabButton active={tab === "ust"} onClick={() => setTab("ust")}>Ustawienia</TabButton>
            <TabButton active={tab === "rooms"} onClick={() => setTab("rooms")}>Pokoje</TabButton>
            <TabButton active={tab === "team"} onClick={() => setTab("team")}>Zespół</TabButton>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {tab === "ust" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Dane podstawowe" footer={<Button variant="primary" disabled={busy} onClick={saveBasics}>Zapisz dane</Button>}>
              <FormGrid>
                <TextInput label="Nazwa obiektu" value={property.name} onChange={(v) => setProperty({ ...property, name: v })} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="Adres – linia 1" value={property.address_line1 ?? ""} onChange={(v) => setProperty({ ...property, address_line1: v })} />
                  <TextInput label="Adres – linia 2" value={property.address_line2 ?? ""} onChange={(v) => setProperty({ ...property, address_line2: v })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextInput label="Miasto" value={property.city ?? ""} onChange={(v) => setProperty({ ...property, city: v })} />
                  <TextInput label="Kod pocztowy" value={property.postal_code ?? ""} onChange={(v) => setProperty({ ...property, postal_code: v })} />
                  <TextInput label="Kraj" value={property.country} onChange={(v) => setProperty({ ...property, country: v })} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <TimeInput label="Check-in" value={property.check_in_time ?? ""} onChange={(v) => setProperty({ ...property, check_in_time: v })} />
                  <TimeInput label="Check-out" value={property.check_out_time ?? ""} onChange={(v) => setProperty({ ...property, check_out_time: v })} />
                </div>
              </FormGrid>
            </Card>

            <Card title="Dane do faktury" footer={<Button variant="primary" disabled={busy} onClick={saveInvoice}>Zapisz dane do faktury</Button>}>
              <div className="flex justify-end">
                <Button variant="outline" onClick={copyBasicsToInvoice}>Takie same jak dane podstawowe</Button>
              </div>
              <FormGrid>
                <TextInput label="Nazwa firmy / Imię i nazwisko" value={property.invoice.name} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, name: v } }))} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="Adres – linia 1" value={property.invoice.address_line1} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, address_line1: v } }))} />
                  <TextInput label="Adres – linia 2" value={property.invoice.address_line2} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, address_line2: v } }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextInput label="Miasto" value={property.invoice.city} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, city: v } }))} />
                  <TextInput label="Kod pocztowy" value={property.invoice.postal_code} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, postal_code: v } }))} />
                  <TextInput label="Kraj" value={property.invoice.country} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, country: v } }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="E-mail" value={property.invoice.email} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, email: v } }))} />
                  <TextInput label="NIP" value={property.invoice.nip} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, nip: v } }))} />
                </div>
              </FormGrid>
            </Card>
          </div>
        )}

        {tab === "rooms" && (
          <div className="space-y-6">
            <Card title="Dodaj pokój">
              <div className="grid md:grid-cols-4 gap-4 items-end">
                <TextInput label="Nazwa pokoju" value={roomName} onChange={setRoomName} />
                <Button variant="primary" onClick={addRoom} disabled={busy}>Dodaj</Button>
              </div>
            </Card>

            <Card title="Pokoje (tylko nazwy)">
              {property.rooms.length === 0 ? (
                <div className="text-sm opacity-70">Brak pokoi — dodaj pierwszy powyżej.</div>
              ) : (
                <ul className="space-y-2">
                  {property.rooms.map((r) => (
                    <li key={r.id} className="flex items-center justify-between border rounded-xl p-2">
                      <div className="font-medium">{r.name}</div>
                      <Button variant="outline" tone="danger" onClick={() => deleteRoom(r.id)} disabled={busy}>Usuń</Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {tab === "team" && (
          <div className="space-y-6">
            <Card title="Dodaj członka zespołu">
              <div className="grid md:grid-cols-6 gap-4 items-end">
                <TextInput label="Imię i nazwisko" value={memberDraft.name} onChange={(v) => setMemberDraft((s) => ({ ...s, name: v }))} />
                <TextInput label="E-mail" value={memberDraft.email} onChange={(v) => setMemberDraft((s) => ({ ...s, email: v }))} />
                <TextInput label="Hasło" value={memberDraft.password} onChange={(v) => setMemberDraft((s) => ({ ...s, password: v }))} />
                <SelectInput
                  label="Rola"
                  value={memberDraft.roleSel}
                  onChange={(v) => setMemberDraft((s) => ({ ...s, roleSel: v }))}
                  options={["Owner", "Manager", "Housekeeping", "Accounting", "PropertyService", "Custom"]}
                  renderLabel={(v) => (roleLabels as any)[v] || (v === "Custom" ? "Własna rola" : v)}
                />
                {memberDraft.roleSel === "Custom" && (
                  <TextInput label="Własna rola" value={memberDraft.customRole} onChange={(v) => setMemberDraft((s) => ({ ...s, customRole: v }))} />
                )}
                <Button variant="primary" onClick={addMember} disabled={busy}>Dodaj</Button>
              </div>
            </Card>

            <Card title="Przypisane osoby">
              {property.members.length === 0 ? (
                <div className="text-sm opacity-70">Brak osób — dodaj kogoś powyżej.</div>
              ) : (
                <ul className="space-y-2">
                  {property.members.map((m) => (
                    <li key={m.id} className="border rounded-xl p-2">
                      {editingId === m.id ? (
                        <div className="grid md:grid-cols-6 gap-4 items-end">
                          <TextInput label="Imię i nazwisko" value={editDraft.name} onChange={(v) => setEditDraft((s) => ({ ...s, name: v }))} />
                          <TextInput label="E-mail" value={editDraft.email} onChange={(v) => setEditDraft((s) => ({ ...s, email: v }))} />
                          <TextInput label="Nowe hasło (opcjonalnie)" value={editDraft.password} onChange={(v) => setEditDraft((s) => ({ ...s, password: v }))} />
                          <SelectInput
                            label="Rola"
                            value={editDraft.roleSel}
                            onChange={(v) => setEditDraft((s) => ({ ...s, roleSel: v }))}
                            options={["Owner", "Manager", "Housekeeping", "Accounting", "PropertyService", "Custom"]}
                            renderLabel={(v) => (roleLabels as any)[v] || (v === "Custom" ? "Własna rola" : v)}
                          />
                          {editDraft.roleSel === "Custom" && (
                            <TextInput label="Własna rola" value={editDraft.customRole} onChange={(v) => setEditDraft((s) => ({ ...s, customRole: v }))} />
                          )}
                          <div className="flex gap-2">
                            <Button variant="primary" onClick={() => saveEdit(m.id)} disabled={busy}>Zapisz</Button>
                            <Button variant="outline" onClick={cancelEdit} disabled={busy}>Anuluj</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{m.name}</div>
                            <div className="text-xs opacity-70">{m.email}</div>
                            <div className="text-xs opacity-70">Rola: <RoleBadge role={m.role} /></div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => startEdit(m)} disabled={busy}>Edytuj</Button>
                            <Button variant="outline" onClick={() => openPermissions(m)} disabled={busy}>Uprawnienia</Button>
                            <Button variant="outline" tone="danger" onClick={() => deleteMember(m.id)} disabled={busy}>Usuń</Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </main>

      {permFor && (
        <PermissionsModal
          member={permFor}
          rooms={property.rooms}
          onClose={closePermissions}
          onSave={(perms) => { savePermissions(perms); closePermissions(); }}
          onApplyPreset={(roleKey) => {
            const allRoomIds = property.rooms.map((r) => r.id);
            const preset = defaultPermissions(roleKey, allRoomIds);
            const curr = permFor.permissions;
            const merged: Permissions = {
              ...curr,
              ...preset,
              calendar: {
                ...preset.calendar,
                roomIds: preset.calendar.roomScope === "all" ? allRoomIds : preset.calendar.roomIds,
              },
            };
            savePermissions(merged);
          }}
        />
      )}
    </div>
  );
}

/* ========= Modal: Uprawnienia ========= */

function PermissionsModal({
  member, rooms, onClose, onSave, onApplyPreset,
}: { member: Member; rooms: Room[]; onClose: () => void; onSave: (p: Permissions) => void; onApplyPreset: (role: MemberRoleStd) => void; }) {
  const [state, setState] = useState<Permissions>(() => member.permissions || defaultPermissions(member.role, rooms.map((r) => r.id)));

  const toggle = (path: string) => (val?: boolean) => { setState((s) => setDeep(s, path, val ?? !getDeep(s, path))); };
  const setRoomScope = (mode: "all" | "selected") => {
    setState((s) => ({
      ...s,
      calendar: {
        ...s.calendar,
        roomScope: mode,
        roomIds: mode === "all" ? rooms.map((r) => r.id) : s.calendar.roomIds,
      },
    }));
  };
  const toggleRoom = (id: string) => {
    setState((s) => {
      const exists = s.calendar.roomIds.includes(id);
      return { ...s, calendar: { ...s.calendar, roomIds: exists ? s.calendar.roomIds.filter((x) => x !== id) : [...s.calendar.roomIds, id] } };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-white w-full md:max-w-4xl rounded-t-2xl md:rounded-2xl shadow-xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Uprawnienia — {member.name}</div>
            <div className="text-xs opacity-70">Szybkie presety: właściciel, menadżer, sprzątanie, księgowość, obsługa</div>
          </div>
          <Button variant="outline" onClick={onClose}>Zamknij</Button>
        </div>

        <div className="p-4 space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onApplyPreset("Owner")}>{roleLabels.Owner}</Button>
            <Button onClick={() => onApplyPreset("Manager")}>{roleLabels.Manager}</Button>
            <Button onClick={() => onApplyPreset("Housekeeping")}>{roleLabels.Housekeeping}</Button>
            <Button onClick={() => onApplyPreset("Accounting")}>{roleLabels.Accounting}</Button>
            <Button onClick={() => onApplyPreset("PropertyService")}>{roleLabels.PropertyService}</Button>
          </div>

          <Section title="Dostęp do kalendarza">
            <Checkbox label="Widok kalendarza dostępny" checked={state.calendar.canViewCalendar} onChange={toggle("calendar.canViewCalendar")} />

            <div className="mt-3 border rounded-xl p-3">
              <div className="text-sm font-medium mb-2">Zakres pokoi</div>
              <div className="flex gap-3 mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="scope" checked={state.calendar.roomScope === "all"} onChange={() => setRoomScope("all")} /> Wszystkie pokoje
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="scope" checked={state.calendar.roomScope === "selected"} onChange={() => setRoomScope("selected")} /> Wybrane pokoje
                </label>
              </div>
              {state.calendar.roomScope === "selected" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {rooms.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 text-sm border rounded p-2">
                      <input type="checkbox" checked={state.calendar.roomIds.includes(r.id)} onChange={() => toggleRoom(r.id)} /> {r.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-2 mt-3">
              <Checkbox label="Widać daty pobytu (od-do)" checked={state.calendar.showReservationDates} onChange={toggle("calendar.showReservationDates")} />
              <Checkbox label="Widać godziny check-in/out" checked={state.calendar.showCheckInOutTimes} onChange={toggle("calendar.showCheckInOutTimes")} />
              <Checkbox label="Widać liczbę gości" checked={state.calendar.showGuestCount} onChange={toggle("calendar.showGuestCount")} />
              <Checkbox label="Widać informację o psach" checked={state.calendar.showDogs} onChange={toggle("calendar.showDogs")} />
              <Checkbox label="Widać imię i nazwisko gościa" checked={state.calendar.showGuestName} onChange={toggle("calendar.showGuestName")} />
              <Checkbox label="Widać kontakt gościa (tel/e-mail)" checked={state.calendar.showContactInfo} onChange={toggle("calendar.showContactInfo")} />
              <Checkbox label="Widać kwoty i ceny" checked={state.calendar.showPrices} onChange={toggle("calendar.showPrices")} />
              <Checkbox label="Widać status płatności" checked={state.calendar.showPaymentStatus} onChange={toggle("calendar.showPaymentStatus")} />
            </div>
          </Section>

          <Section title="Notatki i adnotacje">
            <div className="grid md:grid-cols-2 gap-2">
              <Checkbox label="Widzi notatki właściciela" checked={state.notes.canViewOwnerNotes} onChange={toggle("notes.canViewOwnerNotes")} />
              <Checkbox label="Może dodawać własne notatki" checked={state.notes.canAddStaffNotes} onChange={toggle("notes.canAddStaffNotes")} />
              <Checkbox label="Może edytować swoje notatki" checked={state.notes.canEditOwnNotes} onChange={toggle("notes.canEditOwnNotes")} />
              <Checkbox label="Może edytować notatki właściciela" checked={state.notes.canEditOwnerNotes} onChange={toggle("notes.canEditOwnerNotes")} />
              <Checkbox label="Może dodawać zdjęcia do notatek" checked={state.notes.canAttachPhotos} onChange={toggle("notes.canAttachPhotos")} />
              <Checkbox label="Widzi zgłoszenia usterek" checked={state.notes.canViewDamageReports} onChange={toggle("notes.canViewDamageReports")} />
            </div>
          </Section>

          <Section title="Zadania sprzątania">
            <div className="grid md:grid-cols-2 gap-2">
              <Checkbox label="Widzi listę zadań sprzątania" checked={state.cleaning.canViewCleaningTasks} onChange={toggle("cleaning.canViewCleaningTasks")} />
              <Checkbox label="Może oznaczyć sprzątanie jako wykonane" checked={state.cleaning.canMarkCleaningDone} onChange={toggle("cleaning.canMarkCleaningDone")} />
              <Checkbox label="Może przydzielać zadania innym" checked={state.cleaning.canAssignCleaningTasks} onChange={toggle("cleaning.canAssignCleaningTasks")} />
              <Checkbox label="Może zmieniać datę/godzinę sprzątania" checked={state.cleaning.canChangeCleaningDate} onChange={toggle("cleaning.canChangeCleaningDate")} />
              <Checkbox label="Widzi adnotacje do sprzątania" checked={state.cleaning.canSeeCleaningAnnotations} onChange={toggle("cleaning.canSeeCleaningAnnotations")} />
            </div>
          </Section>

          <Section title="Operacje">
            <div className="grid md:grid-cols-2 gap-2">
              <Checkbox label="Może eksportować kalendarz (ICS/PDF)" checked={state.ops.canExportCalendar} onChange={toggle("ops.canExportCalendar")} />
              <Checkbox label="Może drukować kalendarz" checked={state.ops.canPrintCalendar} onChange={toggle("ops.canPrintCalendar")} />
              <Checkbox label="Może komentować zadania" checked={state.ops.canCommentOnTask} onChange={toggle("ops.canCommentOnTask")} />
            </div>
          </Section>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Anuluj</Button>
            <Button variant="primary" onClick={() => onSave(state)}>Zapisz uprawnienia</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========= Seed / utils ========= */

function emptyInvoice(): InvoiceData {
  return { name: "", email: "", nip: "", address_line1: "", address_line2: "", city: "", postal_code: "", country: "Polska" };
}

function seedProperty(name: string, city: string): Property {
  const rooms: Room[] = [
    { id: crypto.randomUUID(), name: "Apartament 1" },
    { id: crypto.randomUUID(), name: "Apartament 2" },
  ];
  const permsOwner = defaultPermissions("Owner", rooms.map((r) => r.id));
  const permsHK = defaultPermissions("Housekeeping", rooms.map((r) => r.id));
  return {
    id: crypto.randomUUID(),
    org_id: "org_abc",
    name,
    address_line1: "ul. Jeziorna 12",
    address_line2: "",
    city,
    postal_code: "67-410",
    country: "Polska",
    check_in_time: "16:00",
    check_out_time: "10:00",
    invoice: emptyInvoice(),
    rooms,
    members: [
      { id: crypto.randomUUID(), name: "Joanna Sobczak", email: "joanna@example.com", role: "Owner", permissions: permsOwner },
      { id: crypto.randomUUID(), name: "Jan Sprzątający", email: "sprzatacz@example.com", role: "Housekeeping", permissions: permsHK },
    ],
  };
}

function getDeep(obj: any, path: string): any { return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj); }
function setDeep(obj: any, path: string, value: any) {
  const keys = path.split(".");
  const clone = structuredClone(obj);
  let curr: any = clone;
  keys.slice(0, -1).forEach((k) => { curr[k] = structuredClone(curr[k]); curr = curr[k]; });
  curr[keys[keys.length - 1]] = value;
  return clone;
}

/* ========= UI primitives ========= */

function Card({ title, footer, children }: { title: string; footer?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-medium">{title}</div>
        {footer ? <div>{footer}</div> : null}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4">{children}</div>;
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1 w-full min-w-0">
      <span className="text-sm opacity-70">{label}</span>
      <input
        className="border rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1 w-full min-w-0">
      <span className="text-sm opacity-70">{label}</span>
      <input
        type="time"
        className="border rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectInput({
  label, value, onChange, options, renderLabel,
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; renderLabel?: (v: string) => string }) {
  return (
    <label className="grid gap-1 w-full min-w-0">
      <span className="text-sm opacity-70">{label}</span>
      <select
        className="border rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>{renderLabel ? renderLabel(o) : o}</option>
        ))}
      </select>
    </label>
  );
}

function Button({ children, variant = "solid", tone = "primary", disabled, onClick }: {
  children: React.ReactNode; variant?: "solid" | "outline" | "ghost" | "primary"; tone?: "primary" | "danger"; disabled?: boolean; onClick?: () => void;
}) {
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  const base = "px-3 py-2 rounded-2xl text-sm font-medium transition-colors";
  const className = isGhost
    ? `${base} text-indigo-700 hover:bg-indigo-100/60 border border-transparent`
    : isOutline
      ? `${base} border ${tone === "danger" ? "border-red-400 text-red-600 hover:bg-red-50" : "border-indigo-300 text-indigo-700 hover:bg-indigo-50"}`
      : `${base} ${tone === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"} text-white`;

  return (
    <button className={className} disabled={disabled} onClick={onClick}>{children}</button>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-2xl text-sm font-medium border ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"}`}
    >
      {children}
    </button>
  );
}

function RoleBadge({ role }: { role: string }) {
  const known = (Object.keys(roleLabels) as string[]).includes(role);
  const mapColor: Record<string, string> = {
    Owner: "bg-purple-100 text-purple-800",
    Manager: "bg-blue-100 text-blue-800",
    Housekeeping: "bg-emerald-100 text-emerald-800",
    Accounting: "bg-amber-100 text-amber-800",
    PropertyService: "bg-pink-100 text-pink-800",
  };
  const color = known ? mapColor[role] : "bg-gray-100 text-gray-800";
  const label = known ? (roleLabels as any)[role] : role;
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${color}`}>{label}</span>;
}

/** DODANE: prosta sekcja z nagłówkiem */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-2xl p-3">
      <div className="font-medium mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/** DODANE: prosty komponent Checkbox */
function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/* ========= Toastery ========= */

let setToast: (m: string) => void;
function ToastHost() {
  const [msg, _setMsg] = useState<string | null>(null);
  setToast = (m: string) => { _setMsg(m); setTimeout(() => _setMsg(null), 1500); };
  return (<div className="fixed bottom-4 left-1/2 -translate-x-1/2">{msg && <div className="px-4 py-2 rounded-xl border bg-white shadow">{msg}</div>}</div>);
}
function toast(m: string) { if (typeof setToast === "function") setToast(m); }

   ========================================================= */

// ---------- Helpers: IDs & Clone ----------
const uuid = () => {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  const rnd = () => Math.random().toString(36).slice(2);
  return `${rnd()}-${rnd()}-${Date.now()}`;
};

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ---------- Typy ----------
type MemberRoleStd = "Owner" | "Manager" | "Housekeeping" | "Accounting" | "PropertyService";
type Room = { id: string; name: string };

type InvoiceData = {
  name: string;
  email: string;
  nip: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
};

type CalendarPermissions = {
  canViewCalendar: boolean;
  roomScope: "all" | "selected";
  roomIds: string[];
  showReservationDates: boolean;
  showCheckInOutTimes: boolean;
  showGuestCount: boolean;
  showDogs: boolean;
  showGuestName: boolean;
  showContactInfo: boolean;
  showPrices: boolean;
  showPaymentStatus: boolean;
};

type NotesPermissions = {
  canViewOwnerNotes: boolean;
  canAddStaffNotes: boolean;
  canEditOwnNotes: boolean;
  canEditOwnerNotes: boolean;
  canAttachPhotos: boolean;
  canViewDamageReports: boolean;
};

type CleaningPermissions = {
  canViewCleaningTasks: boolean;
  canMarkCleaningDone: boolean;
  canAssignCleaningTasks: boolean;
  canChangeCleaningDate: boolean;
  canSeeCleaningAnnotations: boolean;
};

type OperationPermissions = {
  canExportCalendar: boolean;
  canPrintCalendar: boolean;
  canCommentOnTask: boolean;
};

type Permissions = {
  calendar: CalendarPermissions;
  notes: NotesPermissions;
  cleaning: CleaningPermissions;
  ops: OperationPermissions;
};

type Member = { id: string; name: string; email: string; password?: string; role: string; permissions: Permissions };

type Property = {
  id: string;
  org_id: string;
  name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country: string;
  check_in_time?: string;
  check_out_time?: string;
  invoice: InvoiceData;
  rooms: Room[];
  members: Member[];
};

// ---------- Labels ----------
const roleLabels: Record<MemberRoleStd, string> = {
  Owner: "Właściciel",
  Manager: "Menadżer",
  Housekeeping: "Sprzątanie",
  Accounting: "Księgowość",
  PropertyService: "Obsługa obiektu",
};

// ---------- Default permissions ----------
function defaultPermissions(role: string, allRoomIds: string[]): Permissions {
  const all: Permissions = {
    calendar: {
      canViewCalendar: true,
      roomScope: "all",
      roomIds: allRoomIds,
      showReservationDates: true,
      showCheckInOutTimes: true,
      showGuestCount: true,
      showDogs: true,
      showGuestName: true,
      showContactInfo: true,
      showPrices: true,
      showPaymentStatus: true,
    },
    notes: {
      canViewOwnerNotes: true,
      canAddStaffNotes: true,
      canEditOwnNotes: true,
      canEditOwnerNotes: true,
      canAttachPhotos: true,
      canViewDamageReports: true,
    },
    cleaning: {
      canViewCleaningTasks: true,
      canMarkCleaningDone: true,
      canAssignCleaningTasks: true,
      canChangeCleaningDate: true,
      canSeeCleaningAnnotations: true,
    },
    ops: {
      canExportCalendar: true,
      canPrintCalendar: true,
      canCommentOnTask: true,
    },
  };

  const manager: Permissions = { ...deepClone(all), notes: { ...deepClone(all.notes), canEditOwnerNotes: false } };

  const housekeeping: Permissions = {
    calendar: {
      canViewCalendar: true,
      roomScope: "all",
      roomIds: allRoomIds,
      showReservationDates: true,
      showCheckInOutTimes: true,
      showGuestCount: true,
      showDogs: true,
      showGuestName: false,
      showContactInfo: false,
      showPrices: false,
      showPaymentStatus: false,
    },
    notes: { canViewOwnerNotes: true, canAddStaffNotes: true, canEditOwnNotes: true, canEditOwnerNotes: false, canAttachPhotos: true, canViewDamageReports: true },
    cleaning: { canViewCleaningTasks: true, canMarkCleaningDone: true, canAssignCleaningTasks: false, canChangeCleaningDate: false, canSeeCleaningAnnotations: true },
    ops: { canExportCalendar: false, canPrintCalendar: true, canCommentOnTask: true },
  };

  const accounting: Permissions = {
    calendar: {
      canViewCalendar: true,
      roomScope: "all",
      roomIds: allRoomIds,
      showReservationDates: true,
      showCheckInOutTimes: true,
      showGuestCount: true,
      showDogs: false,
      showGuestName: true,
      showContactInfo: true,
      showPrices: true,
      showPaymentStatus: true,
    },
    notes: { canViewOwnerNotes: true, canAddStaffNotes: false, canEditOwnNotes: false, canEditOwnerNotes: false, canAttachPhotos: false, canViewDamageReports: true },
    cleaning: { canViewCleaningTasks: false, canMarkCleaningDone: false, canAssignCleaningTasks: false, canChangeCleaningDate: false, canSeeCleaningAnnotations: false },
    ops: { canExportCalendar: true, canPrintCalendar: true, canCommentOnTask: false },
  };

  const service: Permissions = {
    calendar: {
      canViewCalendar: true,
      roomScope: "selected",
      roomIds: allRoomIds.slice(0, 1),
      showReservationDates: true,
      showCheckInOutTimes: true,
      showGuestCount: true,
      showDogs: true,
      showGuestName: false,
      showContactInfo: false,
      showPrices: false,
      showPaymentStatus: false,
    },
    notes: { canViewOwnerNotes: true, canAddStaffNotes: true, canEditOwnNotes: true, canEditOwnerNotes: false, canAttachPhotos: true, canViewDamageReports: true },
    cleaning: { canViewCleaningTasks: true, canMarkCleaningDone: true, canAssignCleaningTasks: false, canChangeCleaningDate: false, canSeeCleaningAnnotations: true },
    ops: { canExportCalendar: false, canPrintCalendar: true, canCommentOnTask: true },
  };

  switch (role) {
    case "Owner": return all;
    case "Manager": return manager;
    case "Housekeeping": return housekeeping;
    case "Accounting": return accounting;
    case "PropertyService": return service;
    default: return housekeeping;
  }
}

// ---------- FAKE API ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fakeApi = {
  async addProperty(_: Partial<Property>) { await sleep(150); return { ok: true, id: uuid() } as const; },
  async deleteProperty(_: string) { await sleep(100); return { ok: true } as const; },
  async saveProperty(_: any) { await sleep(100); return { ok: true } as const; },
  async saveInvoice(_: any) { await sleep(100); return { ok: true } as const; },
  async addRoom(_: any) { await sleep(100); return { ok: true, id: uuid() } as const; },
  async deleteRoom(_: string) { await sleep(100); return { ok: true } as const; },
  async addMember(_: any) { await sleep(120); return { ok: true, id: uuid() } as const; },
  async updateMember(_: any) { await sleep(120); return { ok: true } as const; },
  async deleteMember(_: string) { await sleep(100); return { ok: true } as const; },
};

// ---------- App Root ----------
export default function ObjectsApp() {
  const [screen, setScreen] = useState<"home" | "property">("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [properties, setProperties] = useState<Property[]>([
    seedProperty("Apartamenty Słoneczna", "Sława"),
  ]);

  const selected = properties.find((p) => p.id === selectedId) || null;
  const openProperty = (id: string) => { setSelectedId(id); setScreen("property"); };

  const createProperty = async (draft: Partial<Property>) => {
    if (!draft.name?.trim()) return toast("Podaj nazwę obiektu");
    setBusy(true);
    const res = await fakeApi.addProperty(draft);
    const newProp: Property = {
      id: res.id,
      org_id: "org_abc",
      name: draft.name!,
      address_line1: draft.address_line1 ?? "",
      address_line2: draft.address_line2 ?? "",
      city: draft.city ?? "",
      postal_code: draft.postal_code ?? "",
      country: draft.country ?? "Polska",
      check_in_time: draft.check_in_time ?? "16:00",
      check_out_time: draft.check_out_time ?? "10:00",
      invoice: emptyInvoice(),
      rooms: [],
      members: [],
    };
    setProperties((arr) => [newProp, ...arr]);
    setBusy(false);
    toast("Dodano obiekt");
  };

  const removeProperty = async (id: string) => {
    if (!confirm("Usunąć obiekt?")) return;
    setBusy(true);
    await fakeApi.deleteProperty(id);
    setProperties((arr) => arr.filter((p) => p.id !== id));
    if (selectedId === id) { setSelectedId(null); setScreen("home"); }
    setBusy(false);
  };

  const persistProperty = (updated: Property) => {
    setProperties((arr) => arr.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900"
      style={{
        ["--awon-primary" as any]: "#4F46E5",
        ["--awon-primary-600" as any]: "#4338CA",
        ["--awon-ring" as any]: "#A5B4FC",
        ["--awon-danger" as any]: "#EF4444",
      }}
    >
      {screen === "home" && (
        <HomeScreen properties={properties} onOpen={openProperty} onCreate={createProperty} onDelete={removeProperty} busy={busy} />
      )}

      {screen === "property" && selected && (
        <PropertyScreen property={selected} onBack={() => setScreen("home")} onPersist={persistProperty} />
      )}

      <ToastHost />
    </div>
  );
}

// ---------- HOME ----------
function HomeScreen({ properties, onOpen, onCreate, onDelete, busy }: { properties: Property[]; onOpen: (id: string) => void; onCreate: (draft: Partial<Property>) => void; onDelete: (id: string) => void; busy: boolean; }) {
  const [draft, setDraft] = useState<Partial<Property>>({ country: "Polska", check_in_time: "16:00", check_out_time: "10:00" });

  return (
    <div>
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-xl md:text-2xl font-semibold">Twoje obiekty</div>
            <div className="text-sm opacity-70">Dodaj obiekt, a potem zarządzaj pokojami i zespołem</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <Card title="Dodaj obiekt" footer={<Button variant="primary" disabled={busy} onClick={() => onCreate(draft)}>Dodaj</Button>}>
          <FormGrid>
            <TextInput label="Nazwa obiektu" value={draft.name ?? ""} onChange={(v) => setDraft((s) => ({ ...s, name: v }))} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput label="Adres – linia 1" value={draft.address_line1 ?? ""} onChange={(v) => setDraft((s) => ({ ...s, address_line1: v }))} />
              <TextInput label="Adres – linia 2" value={draft.address_line2 ?? ""} onChange={(v) => setDraft((s) => ({ ...s, address_line2: v }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextInput label="Miasto" value={draft.city ?? ""} onChange={(v) => setDraft((s) => ({ ...s, city: v }))} />
              <TextInput label="Kod pocztowy" value={draft.postal_code ?? ""} onChange={(v) => setDraft((s) => ({ ...s, postal_code: v }))} />
              <TextInput label="Kraj" value={draft.country ?? "Polska"} onChange={(v) => setDraft((s) => ({ ...s, country: v }))} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TimeInput label="Check-in" value={draft.check_in_time ?? "16:00"} onChange={(v) => setDraft((s) => ({ ...s, check_in_time: v }))} />
              <TimeInput label="Check-out" value={draft.check_out_time ?? "10:00"} onChange={(v) => setDraft((s) => ({ ...s, check_out_time: v }))} />
            </div>
          </FormGrid>
        </Card>

        <Card title="Lista obiektów">
          {properties.length === 0 ? (
            <div className="text-sm opacity-70">Brak obiektów — dodaj pierwszy powyżej.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((p) => (
                <div key={p.id} className="border rounded-2xl p-4 bg-white shadow-sm hover:shadow transition-shadow">
                  <div className="text-lg font-medium">{p.name}</div>
                  <div className="text-sm opacity-70">{[p.city, p.country].filter(Boolean).join(", ")}</div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => onOpen(p.id)}>Wejdź</Button>
                    <Button variant="outline" tone="danger" onClick={() => onDelete(p.id)}>Usuń</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

// ---------- PROPERTY ----------
function PropertyScreen({ property: initialProp, onBack, onPersist }: { property: Property; onBack: () => void; onPersist: (p: Property) => void }) {
  const [tab, setTab] = useState<"ust" | "rooms" | "team">("ust");
  const [busy, setBusy] = useState(false);
  const [property, setProperty] = useState<Property>(initialProp);

  const headerSubtitle = useMemo(() => [property.city, property.country].filter(Boolean).join(", "), [property.city, property.country]);

  const saveBasics = async () => {
    setBusy(true);
    await fakeApi.saveProperty({ id: property.id, name: property.name, address_line1: property.address_line1, address_line2: property.address_line2, city: property.city, postal_code: property.postal_code, country: property.country, check_in_time: property.check_in_time, check_out_time: property.check_out_time });
    setBusy(false);
    onPersist(property);
    toast("Zapisano dane obiektu");
  };

  const copyBasicsToInvoice = () => {
    setProperty((p) => ({ ...p, invoice: { ...p.invoice, address_line1: p.address_line1 || "", address_line2: p.address_line2 || "", city: p.city || "", postal_code: p.postal_code || "", country: p.country || "Polska" } }));
    toast("Skopiowano dane adresowe do faktury");
  };
  const saveInvoice = async () => { setBusy(true); await fakeApi.saveInvoice({ property_id: property.id, ...property.invoice }); setBusy(false); onPersist(property); toast("Zapisano dane do faktury"); };

  // Pokoje (CRUD + edycja nazwy)
  const [roomName, setRoomName] = useState("");
  const addRoom = async () => {
    const name = roomName.trim(); if (!name) return toast("Podaj nazwę pokoju");
    setBusy(true); const res = await fakeApi.addRoom({ name, property_id: property.id, org_id: property.org_id });
    const updated: Property = { ...property, rooms: [...property.rooms, { id: res.id, name }] };
    updated.members = updated.members.map((m) => ({ ...m, permissions: { ...m.permissions, calendar: { ...m.permissions.calendar, roomIds: m.permissions.calendar.roomScope === "all" ? updated.rooms.map((r) => r.id) : m.permissions.calendar.roomIds } } }));
    setProperty(updated); setRoomName(""); setBusy(false); onPersist(updated); toast("Dodano pokój");
  };
  const deleteRoom = async (id: string) => {
    if (!confirm("Usunąć pokój?")) return;
    setBusy(true); await fakeApi.deleteRoom(id);
    const updated: Property = { ...property, rooms: property.rooms.filter((r) => r.id !== id) };
    updated.members = updated.members.map((m) => ({ ...m, permissions: { ...m.permissions, calendar: { ...m.permissions.calendar, roomIds: m.permissions.calendar.roomIds.filter((rid) => rid !== id) } } }));
    setProperty(updated); setBusy(false); onPersist(updated);
  };
  const renameRoom = (id: string, name: string) => {
    const updated: Property = { ...property, rooms: property.rooms.map((r) => (r.id === id ? { ...r, name } : r)) };
    setProperty(updated); onPersist(updated);
  };

  // Zespół
  const [memberDraft, setMemberDraft] = useState<{ name: string; email: string; password: string; roleSel: string; customRole: string }>({ name: "", email: "", password: "", roleSel: "Housekeeping", customRole: "" });

  const addMember = async () => {
    const name = memberDraft.name.trim(); const email = memberDraft.email.trim(); const password = memberDraft.password.trim();
    if (!name) return toast("Podaj imię i nazwisko"); if (!email) return toast("Podaj e-mail"); if (!password) return toast("Podaj hasło");
    const role = memberDraft.roleSel === "Custom" ? (memberDraft.customRole.trim() || "Rola") : memberDraft.roleSel;
    setBusy(true);
    const res = await fakeApi.addMember({ name, email, password, role, property_id: property.id, org_id: property.org_id });
    const perms = defaultPermissions(role, property.rooms.map((r) => r.id));
    const updated: Property = { ...property, members: [...property.members, { id: res.id, name, email, password, role, permissions: perms }] };
    setProperty(updated); setMemberDraft({ name: "", email: "", password: "", roleSel: "Housekeeping", customRole: "" }); setBusy(false); onPersist(updated); toast("Dodano członka zespołu");
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; email: string; password: string; roleSel: string; customRole: string }>({ name: "", email: "", password: "", roleSel: "Housekeeping", customRole: "" });

  const startEdit = (m: Member) => {
    const isStd = (Object.keys(roleLabels) as string[]).includes(m.role);
    setEditingId(m.id);
    setEditDraft({ name: m.name, email: m.email, password: "", roleSel: isStd ? m.role : "Custom", customRole: isStd ? "" : m.role });
  };
  const cancelEdit = () => { setEditingId(null); };
  const saveEdit = async (id: string) => {
    const role = editDraft.roleSel === "Custom" ? (editDraft.customRole.trim() || "Rola") : editDraft.roleSel;
    setBusy(true); await fakeApi.updateMember({ id, ...editDraft, role });
    const updated: Property = { ...property, members: property.members.map((m) => (m.id === id ? { ...m, name: editDraft.name, email: editDraft.email, role, ...(editDraft.password ? { password: editDraft.password } : {}) } : m)) };
    setProperty(updated); setBusy(false); onPersist(updated); setEditingId(null); toast("Zapisano zmiany członka zespołu");
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Usunąć przypisanie?")) return;
    setBusy(true); await fakeApi.deleteMember(id);
    const updated: Property = { ...property, members: property.members.filter((m) => m.id !== id) };
    setProperty(updated); setBusy(false); onPersist(updated);
  };

  // Uprawnienia
  const [permFor, setPermFor] = useState<Member | null>(null);
  const openPermissions = (m: Member) => { setPermFor(m); };
  const closePermissions = () => setPermFor(null);
  const savePermissions = (updatedPerms: Permissions) => {
    if (!permFor) return;
    const updated: Property = { ...property, members: property.members.map((m) => (m.id === permFor.id ? { ...m, permissions: updatedPerms } : m)) };
    setProperty(updated); onPersist(updated); toast("Zapisano uprawnienia");
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onBack}>Obiekty</Button>
            <div>
              <div className="text-xl md:text-2xl font-semibold">{property.name}</div>
              <div className="text-sm opacity-70">{headerSubtitle}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <TabButton active={tab === "ust"} onClick={() => setTab("ust")}>Ustawienia</TabButton>
            <TabButton active={tab === "rooms"} onClick={() => setTab("rooms")}>Pokoje</TabButton>
            <TabButton active={tab === "team"} onClick={() => setTab("team")}>Zespół</TabButton>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {tab === "ust" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Dane podstawowe" footer={<Button variant="primary" disabled={busy} onClick={saveBasics}>Zapisz dane</Button>}>
              <FormGrid>
                <TextInput label="Nazwa obiektu" value={property.name} onChange={(v) => setProperty({ ...property, name: v })} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="Adres – linia 1" value={property.address_line1 ?? ""} onChange={(v) => setProperty({ ...property, address_line1: v })} />
                  <TextInput label="Adres – linia 2" value={property.address_line2 ?? ""} onChange={(v) => setProperty({ ...property, address_line2: v })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextInput label="Miasto" value={property.city ?? ""} onChange={(v) => setProperty({ ...property, city: v })} />
                  <TextInput label="Kod pocztowy" value={property.postal_code ?? ""} onChange={(v) => setProperty({ ...property, postal_code: v })} />
                  <TextInput label="Kraj" value={property.country} onChange={(v) => setProperty({ ...property, country: v })} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <TimeInput label="Check-in" value={property.check_in_time ?? ""} onChange={(v) => setProperty({ ...property, check_in_time: v })} />
                  <TimeInput label="Check-out" value={property.check_out_time ?? ""} onChange={(v) => setProperty({ ...property, check_out_time: v })} />
                </div>
              </FormGrid>
            </Card>

            <Card title="Dane do faktury" footer={<Button variant="primary" disabled={busy} onClick={saveInvoice}>Zapisz dane do faktury</Button>}>
              <div className="flex justify-end">
                <Button variant="outline" onClick={copyBasicsToInvoice}>Takie same jak dane podstawowe</Button>
              </div>
              <FormGrid>
                <TextInput label="Nazwa firmy / Imię i nazwisko" value={property.invoice.name} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, name: v } }))} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="Adres – linia 1" value={property.invoice.address_line1} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, address_line1: v } }))} />
                  <TextInput label="Adres – linia 2" value={property.invoice.address_line2} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, address_line2: v } }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextInput label="Miasto" value={property.invoice.city} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, city: v } }))} />
                  <TextInput label="Kod pocztowy" value={property.invoice.postal_code} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, postal_code: v } }))} />
                  <TextInput label="Kraj" value={property.invoice.country} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, country: v } }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="E-mail" value={property.invoice.email} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, email: v } }))} />
                  <TextInput label="NIP" value={property.invoice.nip} onChange={(v) => setProperty((p) => ({ ...p, invoice: { ...p.invoice, nip: v } }))} />
                </div>
              </FormGrid>
            </Card>
          </div>
        )}

        {tab === "rooms" && (
          <div className="space-y-6">
            <Card title="Dodaj pokój">
              <div className="grid md:grid-cols-4 gap-4 items-end">
                <TextInput label="Nazwa pokoju" value={roomName} onChange={setRoomName} />
                <Button variant="primary" onClick={addRoom} disabled={busy}>Dodaj</Button>
              </div>
            </Card>

            <Card title="Pokoje">
              {property.rooms.length === 0 ? (
                <div className="text-sm opacity-70">Brak pokoi — dodaj pierwszy powyżej.</div>
              ) : (
                <ul className="space-y-2">
                  {property.rooms.map((r) => (
                    <li key={r.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border rounded-xl p-2">
                      <div className="flex-1">
                        <TextInput label="Nazwa" value={r.name} onChange={(v) => renameRoom(r.id, v)} />
                      </div>
                      <Button variant="outline" tone="danger" onClick={() => deleteRoom(r.id)} disabled={busy}>Usuń</Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {tab === "team" && (
          <div className="space-y-6">
            <Card title="Dodaj członka zespołu">
              <div className="grid md:grid-cols-6 gap-4 items-end">
                <TextInput label="Imię i nazwisko" value={memberDraft.name} onChange={(v) => setMemberDraft((s) => ({ ...s, name: v }))} />
                <TextInput label="E-mail" value={memberDraft.email} onChange={(v) => setMemberDraft((s) => ({ ...s, email: v }))} />
                <TextInput label="Hasło" value={memberDraft.password} onChange={(v) => setMemberDraft((s) => ({ ...s, password: v }))} />
                <SelectInput label="Rola" value={memberDraft.roleSel} onChange={(v) => setMemberDraft((s) => ({ ...s, roleSel: v }))} options={["Owner","Manager","Housekeeping","Accounting","PropertyService","Custom"]} renderLabel={(v) => (roleLabels as any)[v] || (v === "Custom" ? "Własna rola" : v)} />
                {memberDraft.roleSel === "Custom" && (
                  <TextInput label="Własna rola" value={memberDraft.customRole} onChange={(v) => setMemberDraft((s) => ({ ...s, customRole: v }))} />
                )}
                <Button variant="primary" onClick={addMember} disabled={busy}>Dodaj</Button>
              </div>
            </Card>

            <Card title="Przypisane osoby">
              {property.members.length === 0 ? (
                <div className="text-sm opacity-70">Brak osób — dodaj kogoś powyżej.</div>
              ) : (
                <ul className="space-y-2">
                  {property.members.map((m) => (
                    <li key={m.id} className="border rounded-xl p-2">
                      {editingId === m.id ? (
                        <div className="grid md:grid-cols-6 gap-4 items-end">
                          <TextInput label="Imię i nazwisko" value={editDraft.name} onChange={(v) => setEditDraft((s) => ({ ...s, name: v }))} />
                          <TextInput label="E-mail" value={editDraft.email} onChange={(v) => setEditDraft((s) => ({ ...s, email: v }))} />
                          <TextInput label="Nowe hasło (opcjonalnie)" value={editDraft.password} onChange={(v) => setEditDraft((s) => ({ ...s, password: v }))} />
                          <SelectInput label="Rola" value={editDraft.roleSel} onChange={(v) => setEditDraft((s) => ({ ...s, roleSel: v }))} options={["Owner","Manager","Housekeeping","Accounting","PropertyService","Custom"]} renderLabel={(v) => (roleLabels as any)[v] || (v === "Custom" ? "Własna rola" : v)} />
                          {editDraft.roleSel === "Custom" && (
                            <TextInput label="Własna rola" value={editDraft.customRole} onChange={(v) => setEditDraft((s) => ({ ...s, customRole: v }))} />
                          )}
                          <div className="flex gap-2">
                            <Button variant="primary" onClick={() => saveEdit(m.id)} disabled={busy}>Zapisz</Button>
                            <Button variant="outline" onClick={cancelEdit} disabled={busy}>Anuluj</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{m.name}</div>
                            <div className="text-xs opacity-70">{m.email}</div>
                            <div className="text-xs opacity-70">Rola: <RoleBadge role={m.role} /></div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => startEdit(m)} disabled={busy}>Edytuj</Button>
                            <Button variant="outline" onClick={() => openPermissions(m)} disabled={busy}>Uprawnienia</Button>
                            <Button variant="outline" tone="danger" onClick={() => deleteMember(m.id)} disabled={busy}>Usuń</Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </main>

      {/* Modal uprawnień w ErrorBoundary */}
      <ErrorBoundary>
        {permFor && (
          <PermissionsModal
            member={permFor}
            rooms={property.rooms || []}
            onClose={closePermissions}
            onSave={(perms) => { savePermissions(perms); closePermissions(); }}
            onApplyPreset={(roleKey) => {
              const allRoomIds = (property.rooms || []).map((r) => r.id);
              const preset = defaultPermissions(roleKey, allRoomIds);
              const curr = permFor.permissions || defaultPermissions(permFor.role, allRoomIds);
              const merged: Permissions = { ...curr, ...preset, calendar: { ...preset.calendar, roomIds: preset.calendar.roomScope === "all" ? allRoomIds : preset.calendar.roomIds } };
              savePermissions(merged);
            }}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}

// ---------- Modal: Permissions Editor ----------
function PermissionsModal({ member, rooms, onClose, onSave, onApplyPreset }: { member: Member; rooms: Room[]; onClose: () => void; onSave: (p: Permissions) => void; onApplyPreset: (role: MemberRoleStd) => void; }) {
  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeInitial = member.permissions || defaultPermissions(member.role, safeRooms.map(r => r.id));
  const [state, setState] = useState<Permissions>(deepClone(safeInitial));

  const getByPath = (obj: any, path: string) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
  const setByPath = (obj: any, path: string, value: any) => {
    const clone = deepClone(obj);
    const keys = path.split(".");
    let curr = clone as any;
    for (let i = 0; i < keys.length - 1; i++) curr = curr[keys[i]];
    curr[keys[keys.length - 1]] = value;
    return clone;
  };

  const toggle = (path: string) => (val?: boolean) => { setState((s) => setByPath(s, path, val ?? !Boolean(getByPath(s, path)))); };
  const setRoomScope = (mode: "all" | "selected") => {
    setState((s) => ({
      ...s,
      calendar: {
        ...s.calendar,
        roomScope: mode,
        roomIds: mode === "all" ? safeRooms.map((r) => r.id) : s.calendar.roomIds
      }
    }));
  };
  const toggleRoom = (id: string) => {
    setState((s) => {
      const exists = s.calendar.roomIds.includes(id);
      return { ...s, calendar: { ...s.calendar, roomIds: exists ? s.calendar.roomIds.filter((x) => x !== id) : [...s.calendar.roomIds, id] } };
    });
  };
  const applyPreset = (role: MemberRoleStd) => onApplyPreset(role);

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-white text-gray-900 w-full md:max-w-4xl rounded-t-2xl md:rounded-2xl shadow-xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Uprawnienia — {member.name}</div>
            <div className="text-xs opacity-70">Presety: właściciel / menadżer / sprzątanie / księgowość / obsługa</div>
          </div>
          <Button variant="outline" onClick={onClose}>Zamknij</Button>
        </div>

        <div className="p-4 space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => applyPreset("Owner")}>{roleLabels.Owner}</Button>
            <Button onClick={() => applyPreset("Manager")}>{roleLabels.Manager}</Button>
            <Button onClick={() => applyPreset("Housekeeping")}>{roleLabels.Housekeeping}</Button>
            <Button onClick={() => applyPreset("Accounting")}>{roleLabels.Accounting}</Button>
            <Button onClick={() => applyPreset("PropertyService")}>{roleLabels.PropertyService}</Button>
          </div>

          {/* Dostęp do kalendarza */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Dostęp do kalendarza</h4>
            <Checkbox label="Widok kalendarza dostępny" checked={state.calendar.canViewCalendar} onChange={toggle("calendar.canViewCalendar")} />

            <div className="mt-3 border rounded-xl p-3">
              <div className="text-sm font-medium mb-2">Zakres pokoi</div>
              <div className="flex gap-3 mb-2">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="scope" checked={state.calendar.roomScope === "all"} onChange={() => setRoomScope("all")} /> Wszystkie pokoje</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="scope" checked={state.calendar.roomScope === "selected"} onChange={() => setRoomScope("selected")} /> Wybrane pokoje</label>
              </div>
              {state.calendar.roomScope === "selected" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {safeRooms.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 text-sm border rounded p-2">
                      <input type="checkbox" checked={state.calendar.roomIds.includes(r.id)} onChange={() => toggleRoom(r.id)} /> {r.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-2 mt-3">
              <Checkbox label="Widać daty pobytu (od-do)" checked={state.calendar.showReservationDates} onChange={toggle("calendar.showReservationDates")} />
              <Checkbox label="Widać godziny check-in/out" checked={state.calendar.showCheckInOutTimes} onChange={toggle("calendar.showCheckInOutTimes")} />
              <Checkbox label="Widać liczbę gości" checked={state.calendar.showGuestCount} onChange={toggle("calendar.showGuestCount")} />
              <Checkbox label="Widać informację o psach" checked={state.calendar.showDogs} onChange={toggle("calendar.showDogs")} />
              <Checkbox label="Widać imię i nazwisko gościa" checked={state.calendar.showGuestName} onChange={toggle("calendar.showGuestName")} />
              <Checkbox label="Widać kontakt gościa (tel/e-mail)" checked={state.calendar.showContactInfo} onChange={toggle("calendar.showContactInfo")} />
              <Checkbox label="Widać kwoty i ceny" checked={state.calendar.showPrices} onChange={toggle("calendar.showPrices")} />
              <Checkbox label="Widać status płatności" checked={state.calendar.showPaymentStatus} onChange={toggle("calendar.showPaymentStatus")} />
            </div>
          </div>

          {/* Notatki */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Notatki i adnotacje</h4>
            <div className="grid md:grid-cols-2 gap-2">
              <Checkbox label="Widzi notatki właściciela" checked={state.notes.canViewOwnerNotes} onChange={toggle("notes.canViewOwnerNotes")} />
              <Checkbox label="Może dodawać własne notatki" checked={state.notes.canAddStaffNotes} onChange={toggle("notes.canAddStaffNotes")} />
              <Checkbox label="Może edytować swoje notatki" checked={state.notes.canEditOwnNotes} onChange={toggle("notes.canEditOwnNotes")} />
              <Checkbox label="Może edytować notatki właściciela" checked={state.notes.canEditOwnerNotes} onChange={toggle("notes.canEditOwnerNotes")} />
              <Checkbox label="Może dodawać zdjęcia do notatek" checked={state.notes.canAttachPhotos} onChange={toggle("notes.canAttachPhotos")} />
              <Checkbox label="Widzi zgłoszenia usterek" checked={state.notes.canViewDamageReports} onChange={toggle("notes.canViewDamageReports")} />
            </div>
          </div>

          {/* Sprzątanie */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Zadania sprzątania</h4>
            <div className="grid md:grid-cols-2 gap-2">
              <Checkbox label="Widzi listę zadań sprzątania" checked={state.cleaning.canViewCleaningTasks} onChange={toggle("cleaning.canViewCleaningTasks")} />
              <Checkbox label="Może oznaczyć sprzątanie jako wykonane" checked={state.cleaning.canMarkCleaningDone} onChange={toggle("cleaning.canMarkCleaningDone")} />
              <Checkbox label="Może przydzielać zadania innym" checked={state.cleaning.canAssignCleaningTasks} onChange={toggle("cleaning.canAssignCleaningTasks")} />
              <Checkbox label="Może zmieniać datę/godzinę sprzątania" checked={state.cleaning.canChangeCleaningDate} onChange={toggle("cleaning.canChangeCleaningDate")} />
              <Checkbox label="Widzi adnotacje do sprzątania" checked={state.cleaning.canSeeCleaningAnnotations} onChange={toggle("cleaning.canSeeCleaningAnnotations")} />
            </div>
          </div>

          {/* Operacje */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Operacje</h4>
            <div className="grid md:grid-cols-2 gap-2">
              <Checkbox label="Może eksportować kalendarz (ICS/PDF)" checked={state.ops.canExportCalendar} onChange={toggle("ops.canExportCalendar")} />
              <Checkbox label="Może drukować kalendarz" checked={state.ops.canPrintCalendar} onChange={toggle("ops.canPrintCalendar")} />
              <Checkbox label="Może komentować zadania" checked={state.ops.canCommentOnTask} onChange={toggle("ops.canCommentOnTask")} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Anuluj</Button>
            <Button variant="primary" onClick={() => onSave(state)}>Zapisz uprawnienia</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Seed ----------
function emptyInvoice(): InvoiceData { return { name: "", email: "", nip: "", address_line1: "", address_line2: "", city: "", postal_code: "", country: "Polska" }; }

function seedProperty(name: string, city: string): Property {
  const rooms: Room[] = [ { id: uuid(), name: "Apartament 1" }, { id: uuid(), name: "Apartament 2" } ];
  const permsOwner = defaultPermissions("Owner", rooms.map((r) => r.id));
  const permsHK = defaultPermissions("Housekeeping", rooms.map((r) => r.id));
  return {
    id: uuid(),
    org_id: "org_abc",
    name,
    address_line1: "ul. Jeziorna 12",
    address_line2: "",
    city,
    postal_code: "67-410",
    country: "Polska",
    check_in_time: "16:00",
    check_out_time: "10:00",
    invoice: emptyInvoice(),
    rooms,
    members: [
      { id: uuid(), name: "Joanna Sobczak", email: "joanna@example.com", role: "Owner", permissions: permsOwner },
      { id: uuid(), name: "Jan Sprzątający", email: "sprzatacz@example.com", role: "Housekeeping", permissions: permsHK },
    ],
  };
}

// ---------- UI primitives ----------
function Card({ title, footer, children }: { title: string; footer?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-medium">{title}</div>
        {footer ? <div>{footer}</div> : null}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) { return <div className="grid gap-4">{children}</div>; }

function TextInput({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1 w-full min-w-0">
      <span className="text-sm opacity-70">{label}</span>
      <input className="border rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--awon-primary)] focus:border-[var(--awon-primary)]" value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1 w-full min-w-0">
      <span className="text-sm opacity-70">{label}</span>
      <input type="time" className="border rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--awon-primary)] focus:border-[var(--awon-primary)]" value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SelectInput({ label, value, onChange, options, renderLabel }: { label: string; value: string; onChange: (v: string) => void; options: string[]; renderLabel?: (v: string) => string }) {
  return (
    <label className="grid gap-1 w-full min-w-0">
      <span className="text-sm opacity-70">{label}</span>
      <select className="border rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--awon-primary)] focus:border-[var(--awon-primary)]" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (<option key={o} value={o}>{renderLabel ? renderLabel(o) : o}</option>))}
      </select>
    </label>
  );
}

function Button({ children, variant = "solid", tone = "primary", disabled, onClick }: { children: React.ReactNode; variant?: "solid" | "outline" | "ghost" | "primary"; tone?: "primary" | "danger"; disabled?: boolean; onClick?: () => void }) {
  const base = "px-3 py-2 rounded-2xl text-sm font-medium transition-colors";
  let className = base;
  if (variant === "ghost") className += " text-indigo-700 hover:bg-indigo-50 border border-transparent";
  else if (variant === "outline") className += tone === "danger" ? " border border-red-400 text-red-600 hover:bg-red-50" : " border border-indigo-300 text-indigo-700 hover:bg-indigo-50";
  else className += tone === "danger" ? " bg-red-500 text-white hover:bg-red-600" : " bg-indigo-600 text-white hover:bg-indigo-700";
  return <button className={className} disabled={disabled} onClick={onClick}>{children}</button>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-2xl text-sm font-medium border ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"}`}>{children}</button>
  );
}

function RoleBadge({ role }: { role: string }) {
  const known = (Object.keys(roleLabels) as string[]).includes(role);
  const mapColor: Record<string, string> = { Owner: "bg-purple-100 text-purple-800", Manager: "bg-blue-100 text-blue-800", Housekeeping: "bg-emerald-100 text-emerald-800", Accounting: "bg-amber-100 text-amber-800", PropertyService: "bg-pink-100 text-pink-800" };
  const color = known ? mapColor[role] : "bg-gray-100 text-gray-800";
  const label = known ? (roleLabels as any)[role] : role;
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${color}`}>{label}</span>;
}

// ---------- Error Boundary ----------
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; msg?: string }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(err: any) { return { hasError: true, msg: String(err) }; }
  componentDidCatch(error: any, info: any) { console.error("Permissions modal error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-6">
          <div className="bg-white text-gray-900 rounded-2xl p-6 max-w-xl w-full shadow">
            <h3 className="text-lg font-semibold mb-2">Ups… coś poszło nie tak</h3>
            <p className="text-sm text-red-600 break-words">{this.state.msg}</p>
            <div className="mt-4 text-sm">Odśwież stronę lub zamknij modal i spróbuj ponownie.</div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

// ---------- Toasty ----------
let setToast: any;
function ToastHost() {
  const [msg, _setMsg] = useState<string | null>(null);
  setToast = (m: string) => { _setMsg(m); setTimeout(() => _setMsg(null), 1500); };
  return (<div className="fixed bottom-4 left-1/2 -translate-x-1/2">{msg && <div className="px-4 py-2 rounded-xl border bg-white shadow">{msg}</div>}</div>);
}
function toast(m: string) { if (typeof setToast === "function") setToast(m); }
/* -- KONIEC CAŁOŚCI -- */
