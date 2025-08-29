import React, { useEffect, useMemo, useState } from "react";
import { Plus, X, KeyRound, DollarSign } from "lucide-react";

// ============================================================================
// KALENDARZ PANEL — WERSJA MINIMALNA (single-file)
// + Strona „Lista zadań (30 dni)” pod kalendarzem
// ============================================================================

// --- Typy ---
export type Booking = {
  id: string;
  room: string;
  guest?: string;
  start: string; // YYYY-MM-DD (check-in)
  end: string;   // YYYY-MM-DD (check-out)
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  totalPrice?: number;
  depositPaid?: number;
  balanceDueDate?: string;   // termin dopłaty
  balancePaid?: boolean;     // dopłata uregulowana
  amountDue?: number;        // wyliczenie pomocnicze
  payOnArrival?: boolean;    // dopłata na miejscu
  pets?: { hasPets: boolean; type?: "dog" | "cat" | "other"; fee?: number };
  notes?: string;
  securityDeposit?: { amount?: number; status?: "due" | "paid" | "waived"; paidMethod?: "transfer" | "cash" | "card"; refundMethod?: "transfer" | "cash"; refundTarget?: string };
  keysNotified?: boolean;    // wysłano instrukcje dot. kluczy
  preliminary?: boolean;     // czy wstępna
  preliminaryUntil?: string; // termin wpłaty zadatku
  source?: "manual"|"booking"|"artbnb"|"airbnb"|"other";
};

export type Task = { id: string; text: string; done?: boolean };

// --- Utils kalendarzowe ---
function toISO(d: Date): string { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; }
function isoToDate(iso:string){ return new Date(parseInt(iso.slice(0,4)), parseInt(iso.slice(5,7))-1, parseInt(iso.slice(8,10))); }
function mondayIndex(jsDay:number){ return (jsDay+6)%7; }
function addDays(d: Date, days: number){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()+days); }
function buildMonthWeeks(year:number, month0:number){
  const first=new Date(year,month0,1);
  let start=new Date(first);
  while(mondayIndex(start.getDay())!==0) start=new Date(start.getFullYear(),start.getMonth(),start.getDate()-1);
  const last=new Date(year,month0+1,0);
  let end=new Date(last);
  while(mondayIndex(end.getDay())!==6) end=new Date(end.getFullYear(),end.getMonth(),end.getDate()+1);
  const weeks:{date:string;weekday:number;inMonth:boolean}[][]=[]; let cur:{date:string;weekday:number;inMonth:boolean}[]=[];
  for(let d=new Date(start); d<=end; d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)){
    const weekday=mondayIndex(d.getDay()); cur.push({date:toISO(d),weekday,inMonth:d.getMonth()===month0}); if(weekday===6){ weeks.push(cur); cur=[]; }
  }
  return weeks;
}
function monthLabelPL(year:number, month0:number){ try{ const d=new Date(year,month0,1); return d.toLocaleDateString('pl-PL',{ month:'long', year:'numeric' }); } catch{ const N=['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień']; return `${N[month0]} ${year}`; } }
const prevISO=(iso:string)=> toISO(new Date(parseInt(iso.slice(0,4)),parseInt(iso.slice(5,7))-1,parseInt(iso.slice(8,10))-1));
const nextISO=(iso:string)=> toISO(new Date(parseInt(iso.slice(0,4)),parseInt(iso.slice(5,7))-1,parseInt(iso.slice(8,10))+1));
const inRange=(date:string,start:string,end:string)=> date>=start && date<=end;

// --- Dni wolne (Polska) ---
const HOLI_CACHE: Record<number, Set<string>> = {};
const HOLI_NAME_CACHE: Record<number, Record<string,string>> = {};
const POP_NAME_CACHE: Record<number, Record<string,string>> = {};
function easterSunday(year: number){
  // Meeus/Jones/Butcher (gregoriański)
  const a = year % 19; const b = Math.floor(year / 100); const c = year % 100;
  const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7; const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); const day = ((h + l - 7 * m + 114) % 31) + 1; return new Date(year, month - 1, day);
}
function holidaySetPL(year: number): Set<string>{
  if (HOLI_CACHE[year]) return HOLI_CACHE[year];
  const set = new Set<string>();
  const add=(y:number,m0:number,d:number)=> set.add(toISO(new Date(y,m0,d)));
  // Stałe święta ustawowe
  add(year,0,1);   // Nowy Rok
  add(year,0,6);   // Trzech Króli
  add(year,4,1);   // Święto Pracy
  add(year,4,3);   // Święto Konstytucji 3 Maja
  add(year,7,15);  // Wniebowzięcie NMP
  add(year,10,1);  // Wszystkich Świętych
  add(year,10,11); // Narodowe Święto Niepodległości
  add(year,11,25); // Boże Narodzenie (I dzień)
  add(year,11,26); // Boże Narodzenie (II dzień)
  // Ruchome
  const easter = easterSunday(year);
  set.add(toISO(easter));
  set.add(toISO(addDays(easter,1)));
  set.add(toISO(addDays(easter,49)));
  set.add(toISO(addDays(easter,60)));
  HOLI_CACHE[year]=set; return set;
}
function holidayMapPL(year: number): Record<string,string>{
  if (HOLI_NAME_CACHE[year]) return HOLI_NAME_CACHE[year];
  const map: Record<string,string> = {};
  const add=(y:number,m0:number,d:number,name:string)=>{ map[toISO(new Date(y,m0,d))]=name; };
  add(year,0,1,'Nowy Rok');
  add(year,0,6,'Trzech Króli');
  add(year,4,1,'Święto Pracy');
  add(year,4,3,'Święto Konstytucji 3 Maja');
  add(year,7,15,'Wniebowzięcie NMP');
  add(year,10,1,'Wszystkich Świętych');
  add(year,10,11,'Narodowe Święto Niepodległości');
  add(year,11,25,'Boże Narodzenie (I dzień)');
  add(year,11,26,'Boże Narodzenie (II dzień)');
  const easter = easterSunday(year);
  map[toISO(easter)] = 'Niedziela Wielkanocna';
  map[toISO(addDays(easter,1))] = 'Poniedziałek Wielkanocny';
  map[toISO(addDays(easter,49))] = 'Zesłanie Ducha Świętego';
  map[toISO(addDays(easter,60))] = 'Boże Ciało';
  HOLI_NAME_CACHE[year]=map; return map;
}
function popularMapPL(year: number): Record<string,string>{
  if (POP_NAME_CACHE[year]) return POP_NAME_CACHE[year];
  const map: Record<string,string> = {};
  const add=(y:number,m0:number,d:number,name:string)=>{ map[toISO(new Date(y,m0,d))]=name; };
  add(year,4,2,'Dzień Flagi RP (2 maja)');
  add(year,11,24,'Wigilia');
  add(year,11,31,'Sylwester');
  const E = easterSunday(year);
  add(year, E.getMonth(), E.getDate()-1, 'Wielka Sobota');
  POP_NAME_CACHE[year]=map; return map;
}
function isPLHoliday(iso: string){ const y=parseInt(iso.slice(0,4),10); return holidaySetPL(y).has(iso); }
function holidayInfoPL(iso: string, includePopular: boolean): { kind: 'statutory'|'popular'; name: string } | null {
  const y=parseInt(iso.slice(0,4),10);
  const hm = holidayMapPL(y)[iso]; if (hm) return { kind:'statutory', name:hm };
  if (includePopular){ const pm = popularMapPL(y)[iso]; if (pm) return { kind:'popular', name:pm }; }
  return null;
}
function getShowPopular(){ try { return localStorage.getItem('awon_show_popular') !== '0'; } catch { return true; } }
function setShowPopular(v:boolean){ try { localStorage.setItem('awon_show_popular', v? '1':'0'); window.dispatchEvent(new CustomEvent('awon:cfg-change')); } catch {} }

// --- Kolory i malowanie komórki ---
function hashStr(s:string){ let h=0; for(let i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))>>>0; } return h; }
// Paleta BEZ czerwieni/różu — czerwony używamy tylko dla wstępnych
const PALETTE=["#0ea5e9","#10b981","#22c55e","#06b6d4","#14b8a6","#3b82f6","#6366f1","#8b5cf6","#a855f7","#60a5fa","#a3e635","#84cc16"];
function colorFor(b:Booking){ if(b.preliminary) return "#ef4444"; if((b as any).source && ((b as any).source==='booking' || (b as any).source==='artbnb')) return "#eab308"; const idx=hashStr((b.id||"")+"|"+(b.room||""))%PALETTE.length; return PALETTE[idx]; }
function cellPaint(date:string, bks:Booking[]): React.CSSProperties{
  const on=bks.filter(b=> inRange(date,b.start,prevISO(b.end)) || date===b.end || date===b.start);
  if(on.length===0) return { backgroundImage: 'none', backgroundColor: 'transparent' };

  const layers:string[]=[];
  const fills:string[]=[];

  // 🔴 Granica dwóch sąsiadujących rezerwacji WSTĘPNYCH: linia ukośna ↗
  const prelimBoundary = on.some(b => b.preliminary && b.end === date) && on.some(b => b.preliminary && b.start === date);

  for(const b of on){
    const col=colorFor(b); const semi=col+"88"; const mid=date>b.start && date<b.end;
    if(mid){ fills.push(semi); continue; }
    if(date===b.start){ layers.push(`linear-gradient(135deg, transparent 50%, ${semi} 50%)`); continue; }
    if(date===b.end){ layers.push(`linear-gradient(135deg, ${semi} 50%, transparent 50%)`); continue; }
  }

  const style:React.CSSProperties={};
  if(fills.length>0) style.backgroundColor=fills[0];
  if(prelimBoundary){
    layers.unshift('linear-gradient(135deg, transparent calc(50% - 0.5px), #000 calc(50% - 0.5px), #000 calc(50% + 0.5px), transparent calc(50% + 0.5px))');
  }
  if(layers.length>0){
    style.backgroundImage=layers.join(', ');
    style.backgroundSize='100% 100%';
    style.backgroundRepeat='no-repeat';
  }
  return style;
}
const computeAmountDue=(b:Booking)=> Math.max(0,(b.totalPrice||0)-(b.depositPaid||0));
const showDollar=(b:Booking)=> !b.balancePaid && computeAmountDue(b)>0;
const showKey=(b:Booking)=> !!b.keysNotified;

// --- iCal (do self-testów) ---
function icsExport(bookings:Booking[]):string{
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//AWON//Calendar Demo//PL"];
  for(const b of bookings){ const uid=b.id+"@awon"; const dtS=b.start.replace(/-/g,""); const dtE=b.end.replace(/-/g,""); lines.push("BEGIN:VEVENT",`UID:${uid}`,`SUMMARY:${b.room} - ${b.guest||b.guestName||"Rezerwacja"}`,`DTSTART;VALUE=DATE:${dtS}`,`DTEND;VALUE=DATE:${dtE}`,"END:VEVENT"); }
  lines.push("END:VCALENDAR"); return lines.join("\n");
}

// --- LocalStorage: pokoje i rezerwacje ---
const DEFAULT_ROOMS=["Ap. 1","Ap. 2","Ap. 3","Ap. 4"];
function loadRooms():string[]{ try{ const raw=localStorage.getItem("awon_rooms"); if(raw){ const arr=JSON.parse(raw); if(Array.isArray(arr)&&arr.length) return arr.slice(0,50).map(String); } }catch{} return DEFAULT_ROOMS.slice(); }
function saveRooms(r:string[]){ try{ localStorage.setItem("awon_rooms", JSON.stringify(r)); window.dispatchEvent(new CustomEvent("awon:rooms-change")); }catch{} }
function useRooms():[string[],(next:string[]|((prev:string[])=>string[]))=>void]{ const [rooms,setRoomsState]=useState<string[]>(loadRooms()); useEffect(()=>{ const h=()=>setRoomsState(loadRooms()); window.addEventListener("awon:rooms-change",h as any); window.addEventListener("storage",h as any); return ()=>{ window.removeEventListener("awon:rooms-change",h as any); window.removeEventListener("storage",h as any); }; },[]); const setRooms=(next:any)=>{ const val=typeof next==='function' ? (next as any)(loadRooms()) : next; saveRooms(val); setRoomsState(val); }; return [rooms,setRooms]; }

function demoBookings():Booking[]{
  return [
    { id:"BK-001", room:"Ap. 1", guest:"Anna K.", guestName:"Anna Kowalska", guestPhone:"+48 600 100 200", guestEmail:"anna@example.com", start:"2025-09-12", end:"2025-09-15", totalPrice:1200, depositPaid:300, amountDue:900, payOnArrival:true, pets:{ hasPets:true, type:"dog", fee:100 }, notes:"Klucz w skrzynce", securityDeposit:{ amount:200, status:"due", refundMethod:"cash" }, keysNotified:true },
    { id:"BK-002", room:"Ap. 1", guest:"Piotr M.", guestName:"Piotr Malinowski", guestPhone:"+48 511 222 333", guestEmail:"piotr@example.com", start:"2025-09-15", end:"2025-09-18", totalPrice:1500, depositPaid:0, amountDue:1500, payOnArrival:false, notes:"Prosi o fakturę pro forma", preliminary:true, preliminaryUntil:"2025-09-01" },
    { id:"BK-003", room:"Ap. 2", guest:"Julia Z.", guestName:"Julia Zielińska", guestPhone:"+48 502 333 444", guestEmail:"julia@example.com", start:"2025-09-20", end:"2025-09-23", totalPrice:980, depositPaid:200, amountDue:780 },
    { id:"BK-004", room:"Ap. 3", guest:"Stefan R.", guestName:"Stefan Rudnicki", guestPhone:"+48 503 444 555", guestEmail:"stefan@example.com", start:"2025-09-10", end:"2025-09-12", totalPrice:600, depositPaid:100, amountDue:500 }
  ];
}
function loadBookings():Booking[]{ try{ const raw=localStorage.getItem("awon_bookings"); if(raw){ const arr=JSON.parse(raw); if(Array.isArray(arr)) return arr; } }catch{} const demo=demoBookings(); try{ localStorage.setItem("awon_bookings", JSON.stringify(demo)); }catch{} return demo; }
function saveBookings(b:Booking[]){ try{ localStorage.setItem("awon_bookings", JSON.stringify(b)); window.dispatchEvent(new CustomEvent("awon:bookings-change")); }catch{} }
function useBookings():[Booking[],(updater:Booking[]|((prev:Booking[])=>Booking[]))=>void]{ const [bks,setBks]=useState<Booking[]>(loadBookings()); useEffect(()=>{ const h=()=>setBks(loadBookings()); window.addEventListener("awon:bookings-change",h as any); window.addEventListener("storage",h as any); return ()=>{ window.removeEventListener("awon:bookings-change",h as any); window.removeEventListener("storage",h as any); }; },[]); const setBookings=(updater:any)=>{ setBks(prev => { const next = typeof updater==='function' ? updater(prev) : updater; saveBookings(next); return next; }); }; return [bks,setBookings]; }

// --- Zadania (modal) — pozostawione, ale nieużywane jako strona główna
function loadTasks(): Task[]{ try{ const raw=localStorage.getItem('awon_tasks'); if(raw){ const arr=JSON.parse(raw); if(Array.isArray(arr)) return arr; } }catch{} return []; }
function saveTasks(t: Task[]){ try{ localStorage.setItem('awon_tasks', JSON.stringify(t)); }catch{} }
function useTasks(): [Task[], (updater:Task[]|((prev:Task[])=>Task[]))=>void]{ const [tasks, setTasksState]=useState<Task[]>(loadTasks()); useEffect(()=>{ const h=()=> setTasksState(loadTasks()); window.addEventListener('storage', h as any); return ()=> window.removeEventListener('storage', h as any); },[]); const setTasks=(updater:any)=>{ setTasksState(prev=>{ const next=typeof updater==='function'? updater(loadTasks()) : updater; saveTasks(next); return next; }); }; return [tasks, setTasks]; }
function TasksModal({ open, onClose }: { open:boolean; onClose:()=>void }){
  const [tasks, setTasks] = useTasks();
  const [text, setText] = useState('');
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between"><div className="font-semibold">Lista zadań</div><button className="rounded-md p-1 hover:bg-gray-100" onClick={onClose}><X className="h-4 w-4"/></button></div>
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {tasks.length===0 && <div className="text-sm text-gray-500">Brak zadań.</div>}
          {tasks.map(t=> (
            <label key={t.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
              <span className="flex items-center gap-2"><input type="checkbox" checked={!!t.done} onChange={()=> setTasks(prev=> prev.map(x=> x.id===t.id? {...x, done: !x.done}: x))}/> <span className={t.done? 'line-through text-gray-500':''}>{t.text}</span></span>
              <button onClick={()=> setTasks(prev=> prev.filter(x=> x.id!==t.id))} className="rounded-md px-2 py-1 text-xs hover:bg-red-50">Usuń</button>
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input value={text} onChange={(e)=> setText(e.target.value)} placeholder="Nowe zadanie…" className="flex-1 rounded-lg border px-2 py-1.5 text-sm"/>
          <button onClick={()=>{ const v=text.trim(); if(!v) return; const item:Task={ id:'T-'+Date.now().toString(36), text:v, done:false }; setTasks(prev=> [item, ...prev]); setText(''); }} className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Dodaj</button>
        </div>
      </div>
    </div>
  );
}

// --- Kolizje i zajętość ---
function roomHasConflict(bookings:Booking[], room:string, start:string, end:string){ return bookings.some(b=> b.room===room && !(end<=b.start || start>=b.end)); }
function isRoomBusyOn(bookings:Booking[], room:string, date:string){ return bookings.some(b=> b.room===room && inRange(date,b.start,prevISO(b.end))); }

// --- Helper: lista miesięcy do przodu od wskazanego (current-first) ---
const MONTHS_PL=['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień'];
function buildForwardMonthOptions(year:number, month0:number, count:number){
  const start = new Date(year, month0, 1);
  const opts: { value: string; label: string }[] = [];
  for(let i=0;i<count;i++){
    const d = new Date(start.getFullYear(), start.getMonth()+i, 1);
    opts.push({ value: `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`, label: `${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}` });
  }
  return opts;
}

// --- Mini-kalendarz (picker) ---
function InlineMonthPicker({ value, onPick, isBusy, canPick, title, showPopular }:{ value?:string; onPick:(iso:string)=>void; isBusy?:(iso:string)=>boolean; canPick?:(iso:string)=>boolean; title?:string; showPopular:boolean; }){
  const base = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(parseInt(value.slice(0,4)), parseInt(value.slice(5,7))-1, 1) : new Date();
  const [year,setYear]=useState(base.getFullYear());
  const [month0,setMonth0]=useState(base.getMonth());
  const weeks=useMemo(()=> buildMonthWeeks(year,month0), [year,month0]);
  const monthOptions = useMemo(()=> buildForwardMonthOptions(year, month0, 36), [year,month0]);
  return (
    <div className="mt-2 rounded-xl border p-2 shadow-sm">
      {title ? (<div className="mb-1 text-xs font-medium">{title}</div>) : null}
      <div className="mb-1">
        <select
          className="w-full truncate rounded-md border px-2 py-1 text-xs text-gray-700"
          value={`${year}-${String(month0).padStart(2,'0')}`}
          onChange={(e)=>{ const [yy,mm]=e.target.value.split('-').map(Number); setYear(yy); setMonth0(mm); }}
        >
          {monthOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-500 mb-1">{['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(d=> <div key={d}>{d}</div>)}</div>
      <div className="space-y-1">
        {weeks.map((w,wi)=> (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {w.map(d=>{
              const dd=parseInt(d.date.slice(-2),10);
              const busy=!!(isBusy && isBusy(d.date));
              const allowed = !busy && (!!canPick ? canPick(d.date) : true);
              const info = holidayInfoPL(d.date, showPopular);
              const isStat = isPLHoliday(d.date);
              const cls = busy
                ? 'bg-red-500/80 text-white ring-1 ring-red-600/50 cursor-not-allowed'
                : allowed ? 'hover:bg-blue-50 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed';
              const ringCls = info ? (isStat ? 'ring-2 ring-amber-500/70' : 'ring-2 ring-gray-500/60') : '';
              const titleStr = info ? `${d.date} — ${info.name}${info.kind==='popular'?' (popularny)':''}` : d.date;
              return (
                <div key={d.date} title={titleStr} onClick={()=>{ if(allowed) onPick(d.date); }} className={`relative h-9 rounded-md border p-1 text-center ${d.inMonth? 'bg-white' : 'bg-gray-50'} ${cls} ${ringCls}`}>
                  <div className={`pointer-events-none absolute inset-0 grid place-items-center text-[12px] ${isStat ? 'font-semibold' : 'font-normal'}`}>{dd}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500"><span className="inline-block h-3 w-3 rounded bg-red-500/80 ring-1 ring-red-600/50"></span> zajęte</div>
    </div>
  );
}

// --- Modale: Dodawanie / Edycja / Dzienny ---
function AddBookingModal({ open, onClose, rooms, bookings, setBookings, defaults, showPopular }:{ open:boolean; onClose:()=>void; rooms:string[]; bookings:Booking[]; setBookings:(updater:any)=>void; defaults?:{ room?:string; date?:string }; showPopular:boolean; }){
  const [room,setRoom]=useState<string>(defaults?.room || rooms[0] || 'Ap. 1');
  const [start,setStart]=useState<string>(defaults?.date || '');
  const [end,setEnd]=useState<string>(defaults?.date ? nextISO(defaults.date) : '');
  const [guestName,setGuestName]=useState('');
  const [guestPhone,setGuestPhone]=useState('');
  const [guestEmail,setGuestEmail]=useState('');
  const [totalPrice,setTotalPrice]=useState<number|undefined>(undefined);
  const [depositPaid,setDepositPaid]=useState<number|undefined>(undefined);
  const [depositDueDate,setDepositDueDate]=useState<string>('');
  const [payOnArrival,setPayOnArrival]=useState<boolean>(false);
  const [balancePaid,setBalancePaid]=useState<boolean>(false);
  const [hasPets,setHasPets]=useState(false); const [petType]=useState<'dog'|'cat'|'other'>('dog'); const [petFee]=useState<number|undefined>(undefined);
  const [notes,setNotes]=useState('');
  const [sdAmount,setSdAmount]=useState<number|undefined>(undefined); const [sdStatus,setSdStatus]=useState<'due'|'paid'|'waived'>('due'); const [sdPaidMethod,setSdPaidMethod]=useState<'transfer'|'cash'|'card'>('transfer'); const [sdRefundMethod,setSdRefundMethod]=useState<'transfer'|'cash'>('transfer'); const [sdRefundTarget,setSdRefundTarget]=useState('');
  const [keysNotified,setKeysNotified]=useState(false);
  const [preliminary,setPreliminary]=useState(false);
  const [preliminaryUntil,setPreliminaryUntil]=useState<string>('');
  const amountDue = Math.max(0,(totalPrice||0)-(depositPaid||0));

  function submit(){
    if(!room || !start || !end){ alert('Uzupełnij pokój i zakres dat'); return; }
    if(!(end>start)){ alert('Data wyjazdu musi być po dacie przyjazdu'); return; }
    if(roomHasConflict(bookings, room, start, end)){ alert('Konflikt w kalendarzu dla wybranego pokoju'); return; }
    const id='BK-'+String(Date.now()).slice(-6);
    const b:Booking={ id, room, start, end, guest: guestName||undefined, guestName, guestPhone, guestEmail, totalPrice, depositPaid, balanceDueDate: depositDueDate, amountDue, payOnArrival, balancePaid, pets:{ hasPets, type: hasPets? petType: undefined, fee: hasPets? petFee: undefined }, notes, securityDeposit:{ amount: sdAmount, status: sdStatus, paidMethod: sdPaidMethod, refundMethod: sdRefundMethod, refundTarget: sdRefundTarget }, keysNotified, preliminary, preliminaryUntil: preliminary ? (preliminaryUntil||depositDueDate||'') : undefined };
    setBookings((prev:Booking[])=> [b, ...prev]); onClose();
  }

  const isBusyStart = (iso:string)=> isRoomBusyOn(bookings, room, iso);
  const canPickStart = (iso:string)=>{ if(end && iso>=end) return false; return !isBusyStart(iso); };
  const canPickEnd = (iso:string)=>{ if(!start) return false; return iso>start && !roomHasConflict(bookings, room, start, iso); };
  const isBusyEnd = (iso:string)=>{ if(!start) return false; return roomHasConflict(bookings, room, start, iso); };

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-6xl rounded-2xl border bg-white p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold">Nowa rezerwacja</div>
          <button className="rounded-md p-1 hover:bg-gray-100" onClick={onClose}><X className="h-4 w-4"/></button>
        </div>

        {/* GÓRA: Przyjazd | Wyjazd */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <div className="rounded-xl border p-3">
            <div className="mb-1 text-sm font-medium">Wybierz dzień przyjazdu {start && <span className="ml-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">{start}</span>}</div>
            <InlineMonthPicker value={start} onPick={(iso)=> setStart(iso)} isBusy={(iso)=> isBusyStart(iso)} canPick={(iso)=> canPickStart(iso)} showPopular={showPopular}/>
          </div>
          <div className="rounded-xl border p-3">
            <div className="mb-1 text-sm font-medium">Wybierz dzień wyjazdu {end && <span className="ml-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">{end}</span>}</div>
            <InlineMonthPicker value={end} onPick={(iso)=> setEnd(iso)} isBusy={(iso)=> isBusyEnd(iso)} canPick={(iso)=> canPickEnd(iso)} showPopular={showPopular}/>
          </div>
        </div>

        {/* DÓŁ: Dane gościa | Płatności */}
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <div className="rounded-xl border p-3">
            <div className="mb-2 text-sm font-medium">Dane gościa</div>
            <label className="text-xs text-gray-500">Pokój</label>
            <select value={room} onChange={(e)=>setRoom(e.target.value)} className="w-full min-w-0 rounded-lg border px-2 py-2 text-sm">{rooms.map(r=> <option key={r} value={r}>{r}</option>)}</select>
            <input value={guestName} onChange={(e)=>setGuestName(e.target.value)} placeholder="Imię i nazwisko" className="mt-2 w-full rounded-lg border px-2 py-1.5 text-sm"/>
            <input value={guestPhone} onChange={(e)=>setGuestPhone(e.target.value)} placeholder="Telefon" className="mt-2 w-full rounded-lg border px-2 py-1.5 text-sm"/>
            <input value={guestEmail} onChange={(e)=>setGuestEmail(e.target.value)} placeholder="E-mail" className="mt-2 w-full rounded-lg border px-2 py-1.5 text-sm"/>
            <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={hasPets} onChange={(e)=> setHasPets(e.target.checked)} /> Są zwierzęta</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={keysNotified} onChange={(e)=> setKeysNotified(e.target.checked)} /> Klucze wysłane</label>
            </div>
            <details className="mt-3"><summary className="cursor-pointer select-none text-xs text-gray-500">Uwagi</summary><textarea value={notes} onChange={(e)=> setNotes(e.target.value)} rows={4} className="mt-2 w-full rounded-lg border px-2 py-1.5 text-sm"/></details>
          </div>

          <div className="rounded-xl border p-3">
            <div className="mb-2 text-sm font-medium">Płatności</div>
            <label className="text-xs text-gray-500">Cena całkowita (PLN)</label>
            <input inputMode="decimal" pattern="[0-9]*" value={totalPrice??''} onChange={(e)=>{ const v=e.target.value.replace(/[^0-9.]/g,''); setTotalPrice(v===''? undefined : Number(v)); }} className="w-full rounded-lg border px-2 py-1.5 text-sm"/>
            <label className="mt-2 text-xs text-gray-500">Zadatek (PLN)</label>
            <input inputMode="decimal" pattern="[0-9]*" value={depositPaid??''} onChange={(e)=>{ const v=e.target.value.replace(/[^0-9.]/g,''); setDepositPaid(v===''? undefined : Number(v)); }} className="w-full rounded-lg border px-2 py-1.5 text-sm"/>
            <label className="mt-2 text-xs text-gray-500">Termin dopłaty (opcjonalnie)</label>
            <input type="date" value={depositDueDate} onChange={(e)=> setDepositDueDate(e.target.value)} className="w-full rounded-lg border px-2 py-1.5 text-sm"/>
            <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={payOnArrival} onChange={(e)=> setPayOnArrival(e.target.checked)} /> Dopłaty na miejscu</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={balancePaid} onChange={(e)=> setBalancePaid(e.target.checked)} /> Doplata uregulowana</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={preliminary} onChange={(e)=> setPreliminary(e.target.checked)} /> Rezerwacja wstępna</label>
              {preliminary && (<div className="grid grid-cols-1"><label className="text-xs text-gray-500">Termin wpłaty zadatku</label><input type="date" value={preliminaryUntil} onChange={(e)=> setPreliminaryUntil(e.target.value)} className="w-full rounded-lg border px-2 py-1.5 text-sm"/></div>)}
            </div>
            <div className="mt-3 text-sm text-gray-700">Do dopłaty: <b>{amountDue.toFixed(2)} PLN</b></div>

            {/* Kaucja */}
            <details className="mt-3 rounded-xl border p-3"><summary className="cursor-pointer select-none text-sm font-medium">Kaucja</summary><div className="mt-2 grid grid-cols-2 gap-2"><input inputMode="decimal" pattern="[0-9]*" value={sdAmount??''} onChange={(e)=>{ const v=e.target.value.replace(/[^0-9.]/g,''); setSdAmount(v===''? undefined : Number(v)); }} placeholder="Kwota" className="w-full rounded-lg border px-2 py-1.5 text-sm"/><select value={sdStatus} onChange={(e)=> setSdStatus(e.target.value as any)} className="w-full rounded-lg border px-2 py-1.5 text-sm"><option value="due">Do zapłaty</option><option value="paid">Wpłacona</option><option value="waived">Brak</option></select><select value={sdPaidMethod} onChange={(e)=> setSdPaidMethod(e.target.value as any)} className="w-full rounded-lg border px-2 py-1.5 text-sm"><option value="transfer">Przelew</option><option value="cash">Gotówka</option><option value="card">Karta</option></select><select value={sdRefundMethod} onChange={(e)=> setSdRefundMethod(e.target.value as any)} className="w-full rounded-lg border px-2 py-1.5 text-sm"><option value="transfer">Zwrot przelewem</option><option value="cash">Zwrot gotówką</option></select><input value={sdRefundTarget} onChange={(e)=> setSdRefundTarget(e.target.value)} placeholder="Nr rachunku / opis zwrotu" className="col-span-2 w-full rounded-lg border px-2 py-1.5 text-sm"/></div></details>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Anuluj</button>
          <button onClick={submit} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white shadow hover:bg-blue-700">Zapisz</button>
        </div>
      </div>
    </div>
  );
}

function EditBookingModal({ open, onClose, bookings, setBookings, booking, rooms }:{ open:boolean; onClose:()=>void; bookings:Booking[]; setBookings:(updater:any)=>void; booking:Booking; rooms:string[] }){
  const [b,setB]=useState<Booking>({...booking});
  const [confirmDelete, setConfirmDelete] = useState(false);
  function submit(){ if(!(b.end>b.start)){ alert('Data wyjazdu musi być po dacie przyjazdu'); return; } if(roomHasConflict(bookings.filter(x=>x.id!==b.id), b.room, b.start, b.end)){ alert('Konflikt w kalendarzu'); return; } const amountDue=Math.max(0,(b.totalPrice||0)-(b.depositPaid||0)); const next={...b, amountDue}; setBookings((prev:Booking[])=> prev.map(x=> x.id===b.id ? next : x)); onClose(); }
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between"><div className="font-semibold">Modyfikuj rezerwację</div><button className="rounded-md p-1 hover:bg-gray-100" onClick={onClose}><X className="h-4 w-4"/></button></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs text-gray-500">Pokój</label>
            <select value={b.room} onChange={(e)=> setB({...b, room:e.target.value})} className="rounded-lg border px-3 py-2 text-sm">{rooms.map(r=> <option key={r} value={r}>{r}</option>)}</select>
            <label className="text-xs text-gray-500">Przyjazd</label>
            <input type="date" value={b.start} onChange={(e)=> setB({...b, start:e.target.value})} className="rounded-lg border px-3 py-2 text-sm"/>
            <label className="text-xs text-gray-500">Wyjazd</label>
            <input type="date" value={b.end} onChange={(e)=> setB({...b, end:e.target.value})} className="rounded-lg border px-3 py-2 text-sm"/>
            <label className="text-xs text-gray-500">Gość</label>
            <input value={b.guestName||''} onChange={(e)=> setB({...b, guestName:e.target.value})} className="rounded-lg border px-3 py-2 text-sm"/>
            <label className="text-xs text-gray-500">Telefon</label>
            <input value={b.guestPhone||''} onChange={(e)=> setB({...b, guestPhone:e.target.value})} className="rounded-lg border px-3 py-2 text-sm"/>
            <label className="text-xs text-gray-500">E-mail</label>
            <input value={b.guestEmail||''} onChange={(e)=> setB({...b, guestEmail:e.target.value})} className="rounded-lg border px-3 py-2 text-sm"/>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs text-gray-500">Cena całkowita (PLN)</label>
            <input inputMode="decimal" pattern="[0-9]*" value={b.totalPrice??''} onChange={(e)=>{ const v=e.target.value.replace(/[^0-9.]/g,''); setB({...b, totalPrice: v===''? undefined : Number(v)}); }} className="rounded-lg border px-3 py-2 text-sm"/>
            <label className="text-xs text-gray-500">Zadatek (PLN)</label>
            <input inputMode="decimal" pattern="[0-9]*" value={b.depositPaid??''} onChange={(e)=>{ const v=e.target.value.replace(/[^0-9.]/g,''); setB({...b, depositPaid: v===''? undefined : Number(v)}); }} className="rounded-lg border px-3 py-2 text-sm"/>
            <label className="text-xs text-gray-500">Termin dopłaty</label>
            <input type="date" value={b.balanceDueDate||''} onChange={(e)=> setB({...b, balanceDueDate:e.target.value})} className="rounded-lg border px-3 py-2 text-sm"/>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!b.balancePaid} onChange={(e)=> setB({...b, balancePaid:e.target.checked})}/> Dopłata uregulowana</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!b.preliminary} onChange={(e)=> setB({...b, preliminary:e.target.checked})}/> Rezerwacja wstępna</label>
            {b.preliminary && (<><label className="text-xs text-gray-500">Termin wpłaty zadatku</label><input type="date" value={b.preliminaryUntil||''} onChange={(e)=> setB({...b, preliminaryUntil:e.target.value})} className="rounded-lg border px-3 py-2 text-sm"/></>)}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!b.keysNotified} onChange={(e)=> setB({...b, keysNotified:e.target.checked})}/> Klucze wysłane</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!b.payOnArrival} onChange={(e)=> setB({...b, payOnArrival:e.target.checked})}/> Dopłaty na miejscu</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!(b.pets?.hasPets)} onChange={(e)=> setB({...b, pets:{ ...(b.pets||{}), hasPets:e.target.checked }})}/> Są zwierzęta</label>
            <details className="mt-2 rounded-xl border p-3"><summary className="cursor-pointer select-none text-sm font-medium">Kaucja</summary><div className="mt-2 grid grid-cols-2 gap-2"><input inputMode="decimal" pattern="[0-9]*" value={b.securityDeposit?.amount??''} onChange={(e)=>{ const v=e.target.value.replace(/[^0-9.]/g,''); setB({...b, securityDeposit:{ ...(b.securityDeposit||{}), amount: v===''? undefined : Number(v) }}); }} placeholder="Kwota" className="rounded-lg border px-3 py-2 text-sm"/><select value={b.securityDeposit?.status||'due'} onChange={(e)=> setB({...b, securityDeposit:{ ...(b.securityDeposit||{}), status: e.target.value as any }})} className="rounded-lg border px-3 py-2 text-sm"><option value="due">Do zapłaty</option><option value="paid">Wpłacona</option><option value="waived">Brak</option></select><select value={b.securityDeposit?.paidMethod||'transfer'} onChange={(e)=> setB({...b, securityDeposit:{ ...(b.securityDeposit||{}), paidMethod: e.target.value as any }})} className="rounded-lg border px-3 py-2 text-sm"><option value="transfer">Przelew</option><option value="cash">Gotówka</option><option value="card">Karta</option></select><select value={b.securityDeposit?.refundMethod||'transfer'} onChange={(e)=> setB({...b, securityDeposit:{ ...(b.securityDeposit||{}), refundMethod: e.target.value as any }})} className="rounded-lg border px-3 py-2 text-sm"><option value="transfer">Zwrot przelewem</option><option value="cash">Zwrot gotówką</option></select><input value={b.securityDeposit?.refundTarget||''} onChange={(e)=> setB({...b, securityDeposit:{ ...(b.securityDeposit||{}), refundTarget: e.target.value }})} placeholder="Nr rachunku / opis zwrotu" className="col-span-2 rounded-lg border px-3 py-2 text-sm"/></div></details>
          </div>
        </div>
        <label className="mt-3 block text-xs text-gray-500">Uwagi</label>
        <textarea value={b.notes||''} onChange={(e)=> setB({...b, notes:e.target.value})} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm"/>
        <div className="mt-4 flex items-center justify-between gap-2"><div className="text-sm text-gray-600">Pozostało do dopłaty: <b>{((b.totalPrice||0)-(b.depositPaid||0)).toFixed(2)} PLN</b></div><div className="flex items-center gap-2">
          {confirmDelete ? (
            <>
              <button type="button" onClick={()=> { setBookings((prev:Booking[])=> prev.filter(x=> x.id!==b.id)); onClose(); }} className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white shadow hover:bg-red-700">Potwierdź usuń</button>
              <button type="button" onClick={()=> setConfirmDelete(false)} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Cofnij</button>
            </>
          ) : (
            <button type="button" onClick={()=> setConfirmDelete(true)} className="rounded-xl border px-4 py-2 text-sm hover:bg-red-50">Usuń</button>
          )}
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Anuluj</button>
          <button type="button" onClick={submit} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white shadow hover:bg-blue-700">Zapisz</button>
        </div></div>
      </div>
    </div>
  );
}

function DayBookingsModal({ room, date, bookings, onClose, onOpenDetails, onAdd }:{ room:string; date:string; bookings:Booking[]; onClose:()=>void; onOpenDetails:(b:Booking)=>void; onAdd:()=>void }){
  const list=bookings.filter(b=> (b.room===room) && (inRange(date,b.start,prevISO(b.end)) || date===b.start || date===b.end));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between"><div className="font-semibold">{room} – {date}</div><button className="rounded-md p-1 hover:bg-gray-100" onClick={onClose}><X className="h-4 w-4"/></button></div>
        <div className="space-y-2">
          {list.map(b=> (
            <button key={b.id} onClick={()=> onOpenDetails(b)} className="w-full rounded-lg border p-2 text-left hover:bg-gray-50">
              <div className="font-medium text-sm">{b.guest||b.guestName||'Rezerwacja'} ({b.start} → {b.end})</div>
              <div className="text-xs text-gray-600">Cena: {(b.totalPrice||0).toFixed(2)} PLN | Zadatek: {(b.depositPaid||0).toFixed(2)} PLN</div>
            </button>
          ))}
          <button onClick={onAdd} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700"><Plus className="mr-1 inline h-4 w-4"/> Dodaj rezerwację</button>
        </div>
      </div>
    </div>
  );
}

// --- Główny widok: Kalendarz ---
function KalendarzPanel({ onOpenAgenda }:{ onOpenAgenda: ()=>void }){
  const [rooms]=useRooms();
  const [bookings,setBookings]=useBookings();
  const today=new Date(); const [year,setYear]=useState(today.getFullYear()); const [month0,setMonth0]=useState(today.getMonth());
  const [showPopular, setShowPopularState] = useState(getShowPopular());
  useEffect(()=>{
    const h=()=> setShowPopularState(getShowPopular());
    window.addEventListener('storage', h as any);
    window.addEventListener('awon:cfg-change', h as any);
    return ()=>{ window.removeEventListener('storage', h as any); window.removeEventListener('awon:cfg-change', h as any); };
  },[]);
  const weeks=useMemo(()=>buildMonthWeeks(year,month0),[year,month0]);
  const [addOpen,setAddOpen]=useState<{room?:string; date?:string}|null>(null);
  const [editBk,setEditBk]=useState<Booking|null>(null);
  const [dayOpen,setDayOpen]=useState<{room:string; date:string}|null>(null);

  function bookingsOnDate(date:string, list:Booking[]){ return list.filter(b=> inRange(date,b.start,prevISO(b.end)) || date===b.start || date===b.end); }
  function openAdd(room?:string, date?:string){ setAddOpen({ room, date }); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={()=> setMonth0(m=> m===0 ? (setYear(y=>y-1),11) : m-1)} className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Poprzedni</button>
          <button onClick={()=> setMonth0(m=> m===11 ? (setYear(y=>y+1),0) : m+1)} className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Następny</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">{monthLabelPL(year,month0)}</div>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input type="checkbox" checked={showPopular} onChange={(e)=>{ setShowPopular(e.target.checked); setShowPopularState(e.target.checked); }} />
            Pokaż popularne dni (Wigilia, 2 maja…)
          </label>
          <button onClick={()=>openAdd()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700"><Plus className="h-4 w-4"/> Dodaj rezerwację</button>
          <button onClick={onOpenAgenda} className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Lista zadań</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map(room=>{
          const bks=bookings.filter(b=>b.room===room);
          return (
            <div key={room} className="rounded-2xl border p-3">
              <div className="mb-2 font-medium">{room}</div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">{['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(d=> <div key={d}>{d}</div>)}</div>
              <div className="space-y-1">
                {weeks.map((w,wi)=> (
                  <div key={wi} className="grid grid-cols-7 gap-1">
                    {w.map(d=>{
                      const dd=parseInt(d.date.slice(-2),10);
                      const style=cellPaint(d.date,bks);
                      const dayBks=bookingsOnDate(d.date,bks);
                      const hasAny=dayBks.length>0; const startBk=dayBks.find(b=> b.start===d.date);
                      const info = holidayInfoPL(d.date, showPopular);
                      const isStat = isPLHoliday(d.date);
                      const ringCls = info ? (isStat ? 'ring-2 ring-amber-500/70' : 'ring-2 ring-gray-500/60') : '';
                      const titleStr = info ? `${d.date} — ${info.name}${info.kind==='popular'?' (popularny)':''}` : d.date;
                      return (
                        <button key={d.date} title={titleStr} onClick={()=>{ if(!hasAny){ openAdd(room,d.date); return; } if(dayBks.length===1){ setEditBk(dayBks[0]); return; } setDayOpen({room,date:d.date}); }} className={`relative h-12 rounded-lg border p-1 text-center ${d.inMonth? 'bg-white' : 'bg-gray-50'} ${ringCls}`} style={style as any}>
                          <div className={`pointer-events-none absolute inset-0 grid place-items-center text-[12px] ${isStat ? 'font-semibold' : 'font-normal'}`}>{dd}</div>
                          {startBk && (
                            <div className="pointer-events-none absolute right-0.5 top-0.5 z-10 flex flex-col items-center gap-0.5">
                              {showKey(startBk) && <KeyRound className="h-3 w-3 text-white drop-shadow"/>}
                              {showDollar(startBk) && <DollarSign className="h-3 w-3 text-white drop-shadow"/>}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {addOpen && (
        <AddBookingModal
          open={!!addOpen}
          defaults={addOpen}
          rooms={rooms}
          bookings={
