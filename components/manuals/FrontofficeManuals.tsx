import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, RotateCcw, Flag, QrCode, Plus, Trash2, Save, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

/**
 * FRONTOFFICE + ADMIN • Foodtruck Manuals (Pizza demo)
 * ----------------------------------------------------
 * - Frontoffice: read-only weergave + checklists met lokale voortgang per dag
 * - Admin: inline bewerken (truck, menu, infra, apparatuur, checklists, logistiek, bijzonderheden)
 * - CRUD voor trucks, menu, apparatuur, checklists én paklijst
 * - Hash-router zodat dit als statische website kan draaien
 * - Opslaan = placeholder (console.log payload)
 *
 * ✅ Paklijst afvinken per dag (localStorage)
 * ✅ Paklijst categorieën + CSV-export
 */

// ——— Types
export type ChecklistItem = { id: string; text: string; required?: boolean };
export type MenuItem = { id: string; naam: string; prijs?: string; beschrijving?: string; allergenen?: string[]; fotoUrl?: string };
export type PakItem = { id: string; naam: string; aantal?: number; eenheid?: string; opmerking?: string; verplicht?: boolean; categorie?: string };
export type Manual = {
  id: string;
  naam: string;
  beschrijving?: string;
  actief: boolean;
  fotoTruckUrl?: string;
  infra: { stroom: string; water?: string; gas?: string };
  menu: MenuItem[];
  apparatuur: { id: string; naam: string; specs?: string; opmerking?: string }[];
  logistiek?: string;
  opbouw: ChecklistItem[];
  afbouw: ChecklistItem[];
  bijzonderheden?: string;
  paklijst?: PakItem[]; // optioneel
};

// ——— Helpers / Demo
const uid = () => Math.random().toString(36).slice(2, 9);
function storageKey(truckId: string, section: "opbouw" | "afbouw" | "paklijst") {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `frontoffice:${truckId}:${section}:${date}`;
}
const ADMIN_KEY = "frontoffice:admin:auth";

// ——— Demo data
const DEMO_TRUCKS: Manual[] = [
  {
    id: "gemaal",
    naam: "Gemaal – Frituurwagen",
    beschrijving: "Frites, loaded fries & haute frituur. 2× Pitco, afzuigkap verplicht aan, koeling in wagen.",
    actief: true,
    fotoTruckUrl: "",
    infra: { stroom: "1x16A (afzuigkap/koelingen)", water: "Wasbak met jerrycan (aan-/afvoer)", gas: "4× propaanflessen in dissel" },
    menu: [
      { id: uid(), naam: "Verse friet", prijs: "€4,50", beschrijving: "Dubbel gebakken", allergenen: ["gluten"] },
      { id: uid(), naam: "Loaded Fries", prijs: "€8,50", beschrijving: "Cheddar, jalapeño, crispy onions", allergenen: ["gluten", "lactose"] },
      { id: uid(), naam: "Haute frituur special", prijs: "€9,50", beschrijving: "Seizoenswissel – vraag de chef", allergenen: [] },
    ],
    apparatuur: [
      { id: uid(), naam: "Pitco friteuse #1", specs: "Gasgestookt", opmerking: "Dagelijks oliecheck" },
      { id: uid(), naam: "Pitco friteuse #2", specs: "Gasgestookt", opmerking: "Dagelijks oliecheck" },
      { id: uid(), naam: "Afzuigkap", specs: "1x16A", opmerking: "Moet AAN bij gebruik friteuses" },
      { id: uid(), naam: "Koeling", specs: "0–4°C", opmerking: "Temperatuur loggen" },
    ],
    logistiek: "Aanhanger – controleer gasflessen (4×) vastgezet in dissel. Parkeerplek 6m. Vetafscheider indien locatie vereist.",
    opbouw: [
      { id: uid(), text: "Plaats waterpas, wielkeggen", required: true },
      { id: uid(), text: "Gasflessen openen en lekcheck (zeepproef)", required: true },
      { id: uid(), text: "Afzuigkap inschakelen vóór ontsteken friteuses", required: true },
      { id: uid(), text: "Koelingen aan en temp. controleren" },
      { id: uid(), text: "Mise-en-place: sauzen, toppings, bakjes" },
    ],
    afbouw: [
      { id: uid(), text: "Friteuses uitschakelen, olie laten afkoelen", required: true },
      { id: uid(), text: "Afzuigkap uit na afkoelen", required: true },
      { id: uid(), text: "Gasflessen dicht + beveiliging vast" },
      { id: uid(), text: "Koelingen reinigen, temp. loggen" },
      { id: uid(), text: "Afval/vetrestanten volgens locatievoorschrift afvoeren" },
    ],
    bijzonderheden: "Brandblusser 6kg + blusdeken nabij frituur. Let op slipgevaar bij vetlekkage.",
    paklijst: [
      { id: uid(), naam: "Handschoenen", aantal: 2, eenheid: "doos", verplicht: true, categorie: "Hygiëne" },
      { id: uid(), naam: "Vetabsorptie korrels", aantal: 1, eenheid: "zak", categorie: "Schoonmaak" },
      { id: uid(), naam: "Schoonmaakdoeken", aantal: 10, eenheid: "stuks", categorie: "Schoonmaak" },
    ],
  },
  {
    id: "storm",
    naam: "Storm – Schaftwagen",
    beschrijving: "Wraps en bowls – snelle service voor bouw-/crewlocaties.",
    actief: true,
    fotoTruckUrl: "",
    infra: { stroom: "1x16A (koeling/werkbank)", water: "Wasbak met jerrycan", gas: "n.v.t." },
    menu: [
      { id: uid(), naam: "Chicken wrap", prijs: "€8,50", beschrijving: "Kip, knapperige sla, yoghurtsaus", allergenen: ["gluten", "lactose"] },
      { id: uid(), naam: "Veggie bowl", prijs: "€9,00", beschrijving: "Quinoa, geroosterde groente, tahini", allergenen: ["sesam"] },
    ],
    apparatuur: [
      { id: uid(), naam: "Koelwerkbank", specs: "0–4°C", opmerking: "Dagstart temp. loggen" },
      { id: uid(), naam: "Contactgrill", specs: "1x16A", opmerking: "Schoonmaken na service" },
    ],
    logistiek: "Rijbewijs B voldoende. Let op hoogte 2.7m bij inrijden parkeergarages.",
    opbouw: [
      { id: uid(), text: "Plaats, waterpas zetten, wielkeggen", required: true },
      { id: uid(), text: "Stroom aansluiten, koelingen aan" },
      { id: uid(), text: "GN-bakken vullen, allergenenkaart klaarleggen", required: true },
    ],
    afbouw: [
      { id: uid(), text: "Koelingen reinigen/schoonmaken" },
      { id: uid(), text: "Afval scheiden en afvoeren" },
      { id: uid(), text: "Stroom los, kabels oprollen, wagen check", required: true },
    ],
    bijzonderheden: "Allergenenkaart verplicht zichtbaar bij uitgifte.",
    paklijst: [
      { id: uid(), naam: "GN-bakken", aantal: 6, eenheid: "stuks", categorie: "Disposables" },
      { id: uid(), naam: "Handschoenen", aantal: 1, eenheid: "doos", categorie: "Hygiëne" },
      { id: uid(), naam: "Folierol", aantal: 1, eenheid: "rol", categorie: "Disposables" },
    ],
  },
  {
    id: "pizza_electric",
    naam: "Pizza – Elektrisch",
    beschrijving: "Dubbele elektrische oven; 60–80 pizza’s/uur met 2 pizzaioli.",
    actief: true,
    fotoTruckUrl: "",
    infra: { stroom: "1x32A of 2x16A CEE", water: "Watertank 40L + wasbak", gas: "Geen" },
    menu: [
      { id: uid(), naam: "Margherita", prijs: "€10,00", beschrijving: "San Marzano, fior di latte, basilicum", allergenen: ["gluten", "lactose"] },
      { id: uid(), naam: "Diavola", prijs: "€12,00", beschrijving: "Spianata piccante, fior di latte", allergenen: ["gluten", "lactose"] },
    ],
    apparatuur: [
      { id: uid(), naam: "Elektrische pizzaoven (dubbel)", specs: "430–450°C, 2x16A", opmerking: "Handschoenen verplicht" },
      { id: uid(), naam: "Koelwerkbank 3-deurs", specs: "0–4°C", opmerking: "Temp. loggen" },
    ],
    logistiek: "BE-rijbewijs indien >750kg. Parkeerplek 6m.",
    opbouw: [
      { id: uid(), text: "Waterpas + keggen", required: true },
      { id: uid(), text: "Stroom aansluiten (volgens schema)", required: true },
      { id: uid(), text: "Oven voorverwarmen tot 430–450°C" },
      { id: uid(), text: "Deegballen en toppings klaarzetten" },
    ],
    afbouw: [
      { id: uid(), text: "Ovens uit + laten afkoelen", required: true },
      { id: uid(), text: "Koelingen reinigen, temp. loggen" },
      { id: uid(), text: "Kabels los en oprollen" },
    ],
    bijzonderheden: "HACCP map in lade 2. Brandblusser + blusdeken naast oven.",
    paklijst: [
      { id: uid(), naam: "Deegkrabbers", aantal: 4, eenheid: "stuks", categorie: "Tools" },
      { id: uid(), naam: "Pizzaboxen 33cm", aantal: 50, eenheid: "stuks", categorie: "Disposables" },
      { id: uid(), naam: "Meel (00)", aantal: 5, eenheid: "kg", categorie: "Ingrediënten" },
    ],
  },
  {
    id: "pizza_wood",
    naam: "Pizza – Houtgestookt",
    beschrijving: "Mobiele houtoven – authentieke smaak, vlam in zicht.",
    actief: true,
    fotoTruckUrl: "",
    infra: { stroom: "1x16A (licht/koeling)", water: "Watertank 40L + wasbak", gas: "n.v.t." },
    menu: [
      { id: uid(), naam: "Marinara", prijs: "€9,50", beschrijving: "San Marzano, knoflook, oregano", allergenen: ["gluten"] },
      { id: uid(), naam: "Prosciutto", prijs: "€12,50", beschrijving: "Fior di latte, prosciutto, rucola", allergenen: ["gluten", "lactose"] },
    ],
    apparatuur: [
      { id: uid(), naam: "Houtoven", specs: "400–500°C", opmerking: "Vonkenvanger plaatsen" },
      { id: uid(), naam: "Koelwerkbank", specs: "0–4°C", opmerking: "Dagstart temp. loggen" },
    ],
    logistiek: "Houtvoorraad mee (droog). As-emmer en vuurvaste mat verplicht.",
    opbouw: [
      { id: uid(), text: "Plaats oven met vonkenvanger", required: true },
      { id: uid(), text: "Stroom aan voor koelingen" },
      { id: uid(), text: "Vuur opstoken tot 430–450°C", required: true },
      { id: uid(), text: "Mise-en-place: deeg en toppings" },
    ],
    afbouw: [
      { id: uid(), text: "Vuur doven, as veilig opslaan", required: true },
      { id: uid(), text: "Werkbank/koelingen reinigen" },
      { id: uid(), text: "Stroom los, terrein schoon" },
    ],
    bijzonderheden: "Brandblusser + blusdeken nabij oven; let op vonken en windrichting.",
    paklijst: [
      { id: uid(), naam: "Hout (droog)", aantal: 6, eenheid: "kratten", verplicht: true, categorie: "Brandstof" },
      { id: uid(), naam: "As-emmer", aantal: 1, eenheid: "stuks", categorie: "Veiligheid" },
      { id: uid(), naam: "Pizzaschep", aantal: 2, eenheid: "stuks", categorie: "Tools" },
    ],
  },
];

// ——— Component
export default function FrontofficeManuals({ manuals }: { manuals?: Manual[] }) {
  // —— Hash Router voor statische hosting
  type Route = { name: "home" } | { name: "truck"; id: string };
  const parseHash = (): Route => {
    const h = (typeof window !== 'undefined' ? window.location.hash : '').replace(/^#/, "");
    const parts = h.split("/").filter(Boolean);
    if (parts[0] === "truck" && parts[1]) return { name: "truck", id: parts[1] };
    return { name: "home" };
  };
  const [route, setRoute] = useState<Route>(() => parseHash());
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigateHome = () => { window.location.hash = "/"; };
  const navigateTruck = (id: string) => { window.location.hash = `/truck/${id}`; };

  // Data state
  const [all, setAll] = useState<Manual[]>(manuals || DEMO_TRUCKS);
  const [selectedId, setSelectedId] = useState<string>(() => (manuals || DEMO_TRUCKS).find((t) => t.actief)?.id || (manuals || DEMO_TRUCKS)[0]?.id || "");
  useEffect(() => {
    if (route.name === 'truck') {
      const exists = all.some(t => t.id === route.id);
      if (exists) setSelectedId(route.id);
    }
  }, [route.name === 'truck' ? (route as any).id : undefined, all]);
  const truckIndex = useMemo(() => all.findIndex((t) => t.id === selectedId), [all, selectedId]);
  const truck = all[Math.max(0, truckIndex)];

  // Admin state
  const [admin, setAdmin] = useState<boolean>(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Frontoffice checklist progress
  const [opbouwDone, setOpbouwDone] = useState<Record<string, boolean>>({});
  const [afbouwDone, setAfbouwDone] = useState<Record<string, boolean>>({});
  const [packDone, setPackDone] = useState<Record<string, boolean>>({});
  const [incident, setIncident] = useState("");

  // Persistente admin-auth (onthouden tot refresh of expliciet uitloggen)
  useEffect(() => {
    try { if (localStorage.getItem(ADMIN_KEY) === "1") setAdmin(true); } catch {}
  }, []);

  // load progress bij truck wissel
  useEffect(() => {
    if (!truck) return;
    try { setOpbouwDone(JSON.parse(localStorage.getItem(storageKey(truck.id, "opbouw")) || "{}")); } catch { setOpbouwDone({}); }
    try { setAfbouwDone(JSON.parse(localStorage.getItem(storageKey(truck.id, "afbouw")) || "{}")); } catch { setAfbouwDone({}); }
    try { setPackDone(JSON.parse(localStorage.getItem(storageKey(truck.id, "paklijst")) || "{}")); } catch { setPackDone({}); }
  }, [truck?.id]);

  function toggle(section: "opbouw" | "afbouw", id: string) {
    if (!truck) return;
    if (section === "opbouw") {
      const next = { ...opbouwDone, [id]: !opbouwDone[id] };
      setOpbouwDone(next);
      localStorage.setItem(storageKey(truck.id, "opbouw"), JSON.stringify(next));
    } else {
      const next = { ...afbouwDone, [id]: !afbouwDone[id] };
      setAfbouwDone(next);
      localStorage.setItem(storageKey(truck.id, "afbouw"), JSON.stringify(next));
    }
  }
  function togglePack(id: string) {
    if (!truck) return;
    const next = { ...packDone, [id]: !packDone[id] };
    setPackDone(next);
    localStorage.setItem(storageKey(truck.id, "paklijst"), JSON.stringify(next));
  }
  function resetVandaag() {
    if (!truck) return;
    localStorage.removeItem(storageKey(truck.id, "opbouw"));
    localStorage.removeItem(storageKey(truck.id, "afbouw"));
    localStorage.removeItem(storageKey(truck.id, "paklijst"));
    setOpbouwDone({}); setAfbouwDone({}); setPackDone({});
  }

  const opbouwProgress = truck ? Math.round((Object.values(opbouwDone).filter(Boolean).length / Math.max(1, truck.opbouw.length)) * 100) : 0;
  const afbouwProgress = truck ? Math.round((Object.values(afbouwDone).filter(Boolean).length / Math.max(1, truck.afbouw.length)) * 100) : 0;
  const packProgress = truck ? Math.round((Object.values(packDone).filter(Boolean).length / Math.max(1, (truck.paklijst || []).length)) * 100) : 0;

  // —— Admin helpers
  function updateTruck(patch: Partial<Manual>) {
    setAll((arr) => {
      const copy = [...arr];
      const idx = copy.findIndex((t) => t.id === truck.id);
      if (idx >= 0) copy[idx] = { ...copy[idx], ...patch } as Manual;
      return copy;
    });
  }
  function updateAt<K extends keyof Manual>(key: K, value: Manual[K]) {
    setAll((arr) => {
      const copy = [...arr];
      const idx = copy.findIndex((t) => t.id === truck.id);
      if (idx >= 0) (copy[idx] as any)[key] = value;
      return copy;
    });
  }
  function onSave() {
    setSaving(true);
    console.log("[ADMIN SAVE] manuals payload", all);
    setTimeout(() => setSaving(false), 700);
  }
  function addTruck() {
    const id = `truck-${uid()}`;
    const novo: Manual = { id, naam: "Nieuwe truck", actief: true, infra: { stroom: "" }, menu: [], apparatuur: [], opbouw: [], afbouw: [] };
    setAll((arr) => [...arr, novo]);
    setSelectedId(id);
    navigateTruck(id);
  }
  function removeTruck() {
    if (!confirm(`Verwijder '${truck.naam}'?`)) return;
    setAll((arr) => {
      const copy = arr.filter((t) => t.id !== truck.id);
      setSelectedId(copy[0]?.id || "");
      navigateHome();
      return copy;
    });
  }
  // Menu CRUD
  function addMenuItem() { updateAt("menu", [...truck.menu, { id: uid(), naam: "Nieuw gerecht" }]); }
  function removeMenuItem(id: string) { updateAt("menu", truck.menu.filter((m) => m.id !== id)); }
  // Apparatuur CRUD
  function addApparatuur() { updateAt("apparatuur", [...truck.apparatuur, { id: uid(), naam: "Nieuw apparaat" }]); }
  function removeApparatuur(id: string) { updateAt("apparatuur", truck.apparatuur.filter((a) => a.id !== id)); }
  // Checklist CRUD
  function addChecklist(section: "opbouw" | "afbouw") { updateAt(section, [...(truck as any)[section], { id: uid(), text: "Nieuwe stap", required: false }]); }
  function removeChecklist(section: "opbouw" | "afbouw", id: string) { updateAt(section, (truck as any)[section].filter((c: ChecklistItem) => c.id !== id)); }
  // Paklijst CRUD
  function addPackItem() { updateAt("paklijst", [...(truck.paklijst || []), { id: uid(), naam: "Nieuw item" } as PakItem]); }
  function removePackItem(id: string) { updateAt("paklijst", (truck.paklijst || []).filter((p) => p.id !== id)); }
  // Export CSV van paklijst
  function exportPaklijstCSV(){
    const rows = (truck.paklijst || []).map(p => [p.naam, p.aantal ?? '', p.eenheid ?? '', p.opmerking ?? '', p.verplicht ? 'ja' : 'nee', p.categorie ?? '']);
    const header = ['naam','aantal','eenheid','opmerking','verplicht','categorie'];
    const csv = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${truck.id}-paklijst.csv`; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }
  // Admin toggle intent
  function handleAdminToggleIntent(next: boolean) {
    if (next) { setShowPwd(true); }
    else { setAdmin(false); try { localStorage.removeItem(ADMIN_KEY); } catch {} }
  }
  function confirmPassword() {
    if (pwd === "stadslab") {
      setAdmin(true);
      try { localStorage.setItem(ADMIN_KEY, "1"); } catch {}
      setShowPwd(false); setPwd(""); setPwdError("");
    } else { setPwdError("Wachtwoord onjuist"); }
  }

  // ——— Self-tests (rudimentair)
  useEffect(() => {
    console.assert(typeof uid() === "string" && uid().length >= 5, "uid() moet een korte string geven");
    const k1 = storageKey("t1", "opbouw");
    const k2 = storageKey("t1", "paklijst");
    console.assert(k1.includes("frontoffice:t1:opbouw"), "storageKey bevat verkeerde prefix (opbouw)");
    console.assert(k2.includes("frontoffice:t1:paklijst"), "storageKey bevat verkeerde prefix (paklijst)");
    console.assert(Array.isArray(DEMO_TRUCKS) && DEMO_TRUCKS.length >= 1, "Demo trucks ontbreken");
    console.assert(Array.isArray((DEMO_TRUCKS[0] as any).opbouw), "Opbouw lijst ontbreekt");
    console.assert(Array.isArray((DEMO_TRUCKS[0] as any).afbouw), "Afbouw lijst ontbreekt");
    console.assert(Array.isArray((DEMO_TRUCKS[0] as any).menu), "Menu lijst ontbreekt");
    console.assert(Array.isArray((DEMO_TRUCKS[0] as any).paklijst || []), "Paklijst ontbreekt (optioneel)");
    // Extra mini-tests
    const parsedHome = (() => { const prev = window.location.hash; window.location.hash = '/'; const r = parseHash().name; window.location.hash = prev; return r; })();
    console.assert(parsedHome === 'home', "Router parse (home) faalt");
  }, []);

  // ——— Routes
  if (route.name === 'home') {
    return (
      <div className="p-6 bg-white min-h-screen max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Foodtruck Manuals</h1>
            <p className="text-sm text-muted-foreground">Kies een truck om de handleiding te openen</p>
          </div>
          <Button onClick={() => navigateTruck(selectedId)} disabled={!selectedId}>Open geselecteerde</Button>
        </div>
        <Card>
          <CardHeader><CardTitle>Trucks</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {all.map((t) => (
              <div key={t.id} className="border rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.naam}</div>
                  <div className="text-xs text-muted-foreground">ID: {t.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => navigateTruck(t.id)}>Open</Button>
                  {t.actief ? <Badge variant="secondary">actief</Badge> : <Badge variant="destructive">inactief</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Detail pagina
  if (!truck) return <div className="p-6">Geen trucks beschikbaar.</div>;

  return (
    <div className="p-6 bg-white min-h-screen max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 justify-between mb-4">
        <div className="flex items-center gap-3">
          <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); navigateTruck(v); }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Kies foodtruck" />
            </SelectTrigger>
            <SelectContent>
              {all.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.naam}
                  {t.actief ? "" : " (inactief)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden md:block">
            <div className="text-xl font-semibold">{truck.naam}</div>
            <div className="text-sm text-muted-foreground">Frontoffice handleiding</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={admin} onCheckedChange={handleAdminToggleIntent} />
            <span className="text-sm">Admin</span>
          </div>
          {admin && (
            <>
              <Button variant="secondary" onClick={addTruck}>
                <Plus className="mr-2 h-4 w-4" /> Nieuwe truck
              </Button>
              <Button variant="destructive" onClick={removeTruck}>
                <Trash2 className="mr-2 h-4 w-4" /> Verwijder
              </Button>
              <Button onClick={onSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Opslaan..." : "Opslaan"}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="secondary" onClick={resetVandaag}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset vandaag
          </Button>
        </div>
      </div>

      {/* Admin password modal */}
      <Dialog open={showPwd} onOpenChange={setShowPwd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin toegang</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Wachtwoord</Label>
            <Input
              type="password"
              value={pwd}
              onChange={(e) => { setPwd(e.target.value); setPwdError(""); }}
              placeholder="••••••••"
              autoFocus
            />
            {pwdError && <p className="text-sm text-destructive">{pwdError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPwd(false); setPwd(""); setPwdError(""); }}>Annuleren</Button>
            <Button onClick={confirmPassword}>Inloggen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero / summary / Admin meta */}
      <Card className="mb-4">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex gap-4 items-center">
            {truck.fotoTruckUrl && (
              <img src={truck.fotoTruckUrl} alt="truck" className="w-40 h-28 object-cover rounded-xl border" />
            )}
            <div className="w-full">
              {!admin ? (
                <>
                  <div className="text-lg font-medium">{truck.naam}</div>
                  {truck.beschrijving && (
                    <p className="text-sm text-muted-foreground">{truck.beschrijving}</p>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Naam</Label>
                    <Input value={truck.naam} onChange={(e) => updateTruck({ naam: e.target.value })} />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex items-center gap-2 mt-6">
                      <Switch checked={truck.actief} onCheckedChange={(v) => updateTruck({ actief: v })} />
                      <span className="text-sm">Actief</span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Omschrijving</Label>
                    <Textarea rows={3} value={truck.beschrijving || ""} onChange={(e) => updateTruck({ beschrijving: e.target.value })} />
                  </div>
                  <div>
                    <Label>Truck foto URL</Label>
                    <Input value={truck.fotoTruckUrl || ""} onChange={(e) => updateTruck({ fotoTruckUrl: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {!admin ? (
                  <>
                    <Badge variant="secondary">Stroom: {truck.infra.stroom || "—"}</Badge>
                    <Badge variant="secondary">Water: {truck.infra.water || "—"}</Badge>
                    <Badge variant="secondary">Gas: {truck.infra.gas || "—"}</Badge>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                    <div>
                      <Label className="text-[11px]">Stroom (vereist)</Label>
                      <Input value={truck.infra.stroom} onChange={(e) => updateTruck({ infra: { ...truck.infra, stroom: e.target.value } })} placeholder="1x32A / 2x16A" />
                    </div>
                    <div>
                      <Label className="text-[11px]">Water</Label>
                      <Input value={truck.infra.water || ""} onChange={(e) => updateTruck({ infra: { ...truck.infra, water: e.target.value } })} />
                    </div>
                    <div>
                      <Label className="text-[11px]">Gas</Label>
                      <Input value={truck.infra.gas || ""} onChange={(e) => updateTruck({ infra: { ...truck.infra, gas: e.target.value } })} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="text-sm">Opbouw: <span className="font-semibold">{opbouwProgress}%</span></div>
            <div className="w-full h-2 bg-muted rounded-full mt-1"><div className="h-2 bg-primary rounded-full" style={{ width: `${opbouwProgress}%` }} /></div>
            <div className="text-sm mt-3">Afbouw: <span className="font-semibold">{afbouwProgress}%</span></div>
            <div className="w-full h-2 bg-muted rounded-full mt-1"><div className="h-2 bg-primary rounded-full" style={{ width: `${afbouwProgress}%` }} /></div>
            <div className="text-sm mt-3">Paklijst: <span className="font-semibold">{packProgress}%</span></div>
            <div className="w-full h-2 bg-muted rounded-full mt-1"><div className="h-2 bg-primary rounded-full" style={{ width: `${packProgress}%` }} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Incident / notitie</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="Korte notitie (alleen lokaal)" value={incident} onChange={(e) => setIncident(e.target.value)} />
              <Button onClick={() => setIncident("")}> <Flag className="mr-2 h-4 w-4" /> Bewaar lokaal</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">⚠️ Wordt niet naar de backend gestuurd in deze demo.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">QR / snelle toegang</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Toon een QR die naar deze truck-pagina linkt.</p>
            <Button variant="outline"><QrCode className="mr-2 h-4 w-4" /> Toon QR</Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="setup">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <TabsTrigger value="setup">Opbouw</TabsTrigger>
          <TabsTrigger value="service">Service</TabsTrigger>
          <TabsTrigger value="closing">Afbouw</TabsTrigger>
          <TabsTrigger value="safety">Veiligheid</TabsTrigger>
          <TabsTrigger value="pack">Paklijst</TabsTrigger>
          <TabsTrigger value="meta">Meta</TabsTrigger>
        </TabsList>

        {/* Opbouw */}
        <TabsContent value="setup" className="mt-4">
          {!admin ? (
            <ChecklistSection items={truck.opbouw} done={opbouwDone} onToggle={(id) => toggle("opbouw", id)} />
          ) : (
            <ChecklistAdmin title="Opbouw" items={truck.opbouw} onAdd={() => addChecklist("opbouw")} onRemove={(id) => removeChecklist("opbouw", id)} onChange={(items) => updateAt("opbouw", items)} />
          )}
        </TabsContent>

        {/* Service */}
        <TabsContent value="service" className="mt-4">
          {!admin ? (
            <ServiceSection truck={truck} />
          ) : (
            <ServiceAdmin
              menu={truck.menu}
              apparatuur={truck.apparatuur}
              onMenuChange={(menu) => updateAt("menu", menu)}
              onAppChange={(apparatuur) => updateAt("apparatuur", apparatuur)}
              onAddMenu={addMenuItem}
              onRemoveMenu={removeMenuItem}
              onAddApp={addApparatuur}
              onRemoveApp={removeApparatuur}
            />
          )}
        </TabsContent>

        {/* Afbouw */}
        <TabsContent value="closing" className="mt-4">
          {!admin ? (
            <ChecklistSection items={truck.afbouw} done={afbouwDone} onToggle={(id) => toggle("afbouw", id)} />
          ) : (
            <ChecklistAdmin title="Afbouw" items={truck.afbouw} onAdd={() => addChecklist("afbouw")} onRemove={(id) => removeChecklist("afbouw", id)} onChange={(items) => updateAt("afbouw", items)} />
          )}
        </TabsContent>

        {/* Veiligheid */}
        <TabsContent value="safety" className="mt-4">
          {!admin ? (
            <SafetySection truck={truck} />
          ) : (
            <Card>
              <CardHeader><CardTitle>Bijzonderheden & Veiligheid</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Label>Bijzonderheden</Label>
                <Textarea rows={6} value={truck.bijzonderheden || ""} onChange={(e) => updateTruck({ bijzonderheden: e.target.value })} />
                <Label>Logistiek</Label>
                <Textarea rows={6} value={truck.logistiek || ""} onChange={(e) => updateTruck({ logistiek: e.target.value })} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Paklijst */}
        <TabsContent value="pack" className="mt-4">
          {!admin ? (
            <PacklistSection items={truck.paklijst || []} done={packDone} onToggle={togglePack} onExportCSV={exportPaklijstCSV} />
          ) : (
            <>
              <div className="flex justify-end mb-3"><Button variant="outline" onClick={exportPaklijstCSV}><Download className="mr-2 h-4 w-4"/> Export CSV</Button></div>
              <PacklistAdmin
                items={truck.paklijst || []}
                onChange={(items) => updateAt("paklijst", items)}
                onAdd={addPackItem}
                onRemove={removePackItem}
              />
            </>
          )}
        </TabsContent>

        {/* Meta – beheer truck gegevens */}
        <TabsContent value="meta" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Truck instellingen</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Truck ID</Label>
                <Input value={truck.id} onChange={(e) => updateTruck({ id: e.target.value })} />
                <p className="text-[11px] text-muted-foreground mt-1">Gebruik unieke ID (voor URL's/QR).</p>
              </div>
              <div className="flex items-end gap-2">
                <Switch checked={truck.actief} onCheckedChange={(v) => updateTruck({ actief: v })} />
                <span className="text-sm">Actief</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ——— Frontoffice secties
function ChecklistSection({ items, done, onToggle }: { items: ChecklistItem[]; done: Record<string, boolean>; onToggle: (id: string) => void; }) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">Nog geen checklist-items toegevoegd.</CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader><CardTitle>Checklist</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((c) => (
          <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border ${done[c.id] ? "bg-green-50 dark:bg-green-950/20" : ""}`}>
            <input type="checkbox" className="h-5 w-5" checked={!!done[c.id]} onChange={() => onToggle(c.id)} />
            <span className="text-sm flex-1">{c.text}</span>
            {c.required && <Badge variant="destructive">verplicht</Badge>}
          </label>
        ))}
      </CardContent>
    </Card>
  );
}

function ServiceSection({ truck }: { truck: Manual }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Menu</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(!truck.menu || truck.menu.length === 0) && <div className="text-sm text-muted-foreground">Nog geen menu-items.</div>}
          {truck.menu?.map((m) => (
            <div key={m.id} className="flex items-center gap-3 border rounded-xl p-3">
              {m.fotoUrl && <img src={m.fotoUrl} className="w-16 h-16 object-cover rounded-lg" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">{m.naam}</div>
                  {m.prijs && <Badge variant="secondary">{m.prijs}</Badge>}
                </div>
                {m.beschrijving && <div className="text-xs text-muted-foreground mt-0.5">{m.beschrijving}</div>}
                {m.allergenen && m.allergenen.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.allergenen.map((a) => (
                      <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Apparatuur & Infra</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">Stroom: <span className="font-medium">{truck.infra.stroom}</span></div>
          {truck.infra.water && <div className="text-sm">Water: <span className="font-medium">{truck.infra.water}</span></div>}
          {truck.infra.gas && <div className="text-sm">Gas: <span className="font-medium">{truck.infra.gas}</span></div>}
          <div className="pt-2 grid gap-2">
            {(!truck.apparatuur || truck.apparatuur.length === 0) && <div className="text-sm text-muted-foreground">Nog geen apparatuur toegevoegd.</div>}
            {truck.apparatuur?.map((a) => (
              <div key={a.id} className="border rounded-xl p-3">
                <div className="font-medium">{a.naam}</div>
                {a.specs && <div className="text-xs text-muted-foreground">{a.specs}</div>}
                {a.opmerking && <div className="text-xs mt-1">{a.opmerking}</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PacklistSection({ items, done, onToggle, onExportCSV }: { items: PakItem[]; done: Record<string, boolean>; onToggle: (id: string) => void; onExportCSV: () => void; }) {
  // groepeer per categorie (leeg => Overig)
  const groups = (items || []).reduce((acc: Record<string, PakItem[]>, it) => {
    const key = it.categorie || "Overig";
    acc[key] = acc[key] || [];
    acc[key].push(it);
    return acc;
  }, {} as Record<string, PakItem[]>);
  const cats = Object.keys(groups).sort();

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button variant="outline" onClick={onExportCSV}><Download className="mr-2 h-4 w-4"/> Export CSV</Button></div>
      {cats.length === 0 && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nog geen paklijst-items.</CardContent></Card>
      )}
      {cats.map((cat) => (
        <Card key={cat}>
          <CardHeader><CardTitle>Paklijst – {cat}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {groups[cat].map((p) => (
              <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${done[p.id] ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                <input type="checkbox" className="h-5 w-5" checked={!!done[p.id]} onChange={() => onToggle(p.id)} />
                <div className="flex-1">
                  <div className="font-medium">{p.naam}</div>
                  {p.opmerking && <div className="text-xs text-muted-foreground">{p.opmerking}</div>}
                </div>
                {p.aantal !== undefined && <Badge variant="secondary">{p.aantal} {p.eenheid || ''}</Badge>}
                {p.verplicht && <Badge variant="destructive">verplicht</Badge>}
              </label>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ——— Admin secties
function ChecklistAdmin({ title, items, onAdd, onRemove, onChange }: { title: string; items: ChecklistItem[]; onAdd: () => void; onRemove: (id: string) => void; onChange: (items: ChecklistItem[]) => void; }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title} – checklist beheer</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <div className="text-sm text-muted-foreground">Nog geen regels. Voeg je eerste regel toe.</div>}
        {items.map((c, idx) => (
          <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-9">
              <Input value={c.text} onChange={(e) => { const copy = [...items]; copy[idx] = { ...c, text: e.target.value }; onChange(copy); }} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={!!c.required} onCheckedChange={(v) => { const copy = [...items]; copy[idx] = { ...c, required: v }; onChange(copy); }} />
              <span className="text-xs">verplicht</span>
            </div>
            <div className="col-span-1 flex justify-end">
              <Button variant="ghost" className="text-destructive" onClick={() => onRemove(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        <Button variant="secondary" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Regel toevoegen</Button>
      </CardContent>
    </Card>
  );
}

function ServiceAdmin({ menu, apparatuur, onMenuChange, onAppChange, onAddMenu, onRemoveMenu, onAddApp, onRemoveApp }: { menu: MenuItem[]; apparatuur: { id: string; naam: string; specs?: string; opmerking?: string }[]; onMenuChange: (menu: MenuItem[]) => void; onAppChange: (a: { id: string; naam: string; specs?: string; opmerking?: string }[]) => void; onAddMenu: () => void; onRemoveMenu: (id: string) => void; onAddApp: () => void; onRemoveApp: (id: string) => void; }) {
  const ALLERGENEN = ["gluten", "lactose", "noten", "pinda", "ei", "vis", "schaaldieren", "soja", "selderij", "mosterd"];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Menu beheer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {menu.map((m, idx) => (
            <div key={m.id} className="border rounded-2xl p-4 grid grid-cols-12 gap-2">
              <div className="col-span-4">
                <Label>Naam</Label>
                <Input value={m.naam} onChange={(e) => { const copy = [...menu]; copy[idx] = { ...m, naam: e.target.value }; onMenuChange(copy); }} />
              </div>
              <div className="col-span-2">
                <Label>Prijs</Label>
                <Input value={m.prijs || ""} onChange={(e) => { const copy = [...menu]; copy[idx] = { ...m, prijs: e.target.value }; onMenuChange(copy); }} />
              </div>
              <div className="col-span-6">
                <Label>Beschrijving</Label>
                <Input value={m.beschrijving || ""} onChange={(e) => { const copy = [...menu]; copy[idx] = { ...m, beschrijving: e.target.value }; onMenuChange(copy); }} />
              </div>
              <div className="col-span-12">
                <Label>Allergenen</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ALLERGENEN.map((a) => {
                    const active = m.allergenen?.includes(a);
                    return (
                      <Badge
                        key={a}
                        variant={active ? "default" : "secondary"}
                        className="cursor-pointer select-none"
                        onClick={() => {
                          const set = new Set(m.allergenen || []);
                          active ? set.delete(a) : set.add(a);
                          const copy = [...menu];
                          copy[idx] = { ...m, allergenen: Array.from(set) };
                          onMenuChange(copy);
                        }}
                      >
                        {a}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="col-span-10">
                <Label>Foto URL</Label>
                <Input value={m.fotoUrl || ""} onChange={(e) => { const copy = [...menu]; copy[idx] = { ...m, fotoUrl: e.target.value }; onMenuChange(copy); }} placeholder="https://..." />
              </div>
              <div className="col-span-2 flex items-end justify-end">
                <Button variant="ghost" className="text-destructive" onClick={() => onRemoveMenu(m.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={onAddMenu}><Plus className="mr-2 h-4 w-4" /> Menu-item toevoegen</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Apparatuur beheer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {apparatuur.map((a, idx) => (
            <div key={a.id} className="border rounded-2xl p-4 grid grid-cols-12 gap-2">
              <div className="col-span-4">
                <Label>Naam</Label>
                <Input value={a.naam} onChange={(e) => { const copy = [...apparatuur]; copy[idx] = { ...a, naam: e.target.value }; onAppChange(copy); }} />
              </div>
              <div className="col-span-8">
                <Label>Specs</Label>
                <Input value={a.specs || ""} onChange={(e) => { const copy = [...apparatuur]; copy[idx] = { ...a, specs: e.target.value }; onAppChange(copy); }} />
              </div>
              <div className="col-span-10">
                <Label>Opmerking</Label>
                <Input value={a.opmerking || ""} onChange={(e) => { const copy = [...apparatuur]; copy[idx] = { ...a, opmerking: e.target.value }; onAppChange(copy); }} />
              </div>
              <div className="col-span-2 flex items-end justify-end">
                <Button variant="ghost" className="text-destructive" onClick={() => onRemoveApp(a.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={onAddApp}><Plus className="mr-2 h-4 w-4" /> Apparaat toevoegen</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PacklistAdmin({ items, onChange, onAdd, onRemove }: { items: PakItem[]; onChange: (items: PakItem[]) => void; onAdd: () => void; onRemove: (id: string) => void; }) {
  return (
    <Card>
      <CardHeader><CardTitle>Paklijst beheer</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <div className="text-sm text-muted-foreground">Nog geen items. Voeg je eerste item toe.</div>}
        {items.map((p, idx) => (
          <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-3"><Label>Naam</Label><Input value={p.naam} onChange={(e) => { const copy = [...items]; copy[idx] = { ...p, naam: e.target.value }; onChange(copy); }} /></div>
            <div className="col-span-2"><Label>Aantal</Label><Input type="number" value={p.aantal ?? ''} onChange={(e) => { const copy = [...items]; const n = e.target.value === '' ? undefined : Number(e.target.value); copy[idx] = { ...p, aantal: n }; onChange(copy); }} /></div>
            <div className="col-span-2"><Label>Eenheid</Label><Input value={p.eenheid || ''} onChange={(e) => { const copy = [...items]; copy[idx] = { ...p, eenheid: e.target.value }; onChange(copy); }} /></div>
            <div className="col-span-3"><Label>Categorie</Label><Input value={p.categorie || ''} onChange={(e) => { const copy = [...items]; copy[idx] = { ...p, categorie: e.target.value }; onChange(copy); }} placeholder="bv. Hygiëne"/></div>
            <div className="col-span-1 flex items-end gap-2"><Switch checked={!!p.verplicht} onCheckedChange={(v) => { const copy = [...items]; copy[idx] = { ...p, verplicht: v }; onChange(copy); }} /></div>
            <div className="col-span-12"><Label>Opmerking</Label><Input value={p.opmerking || ''} onChange={(e) => { const copy = [...items]; copy[idx] = { ...p, opmerking: e.target.value }; onChange(copy); }} /></div>
            <div className="col-span-12 flex justify-end"><Button variant="ghost" className="text-destructive" onClick={() => onRemove(p.id)}><Trash2 className="h-4 w-4" /></Button></div>
          </div>
        ))}
        <Button variant="secondary" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Item toevoegen</Button>
      </CardContent>
    </Card>
  );
}

function SafetySection({ truck }: { truck: Manual }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Bijzonderheden</CardTitle></CardHeader>
        <CardContent>
          {truck.bijzonderheden ? (
            <p className="text-sm whitespace-pre-wrap">{truck.bijzonderheden}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen bijzonderheden.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Logistiek</CardTitle></CardHeader>
        <CardContent>
          {truck.logistiek ? (
            <p className="text-sm whitespace-pre-wrap">{truck.logistiek}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen logistieke info.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
