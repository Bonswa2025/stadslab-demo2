    // Stadslab Backoffice – Pastel UI + Tabs + Admin (login + rechter paneel)
// Build: v2025-10-27-admin1
// - Gebaseerd op "stadslab_backoffice_pastel_ui_update (2).jsx" + admin-CRUD uit
//   "smart_order_app_admin_crud_producten_toevoegen_verwijderen.jsx".
// - Admin: login popup, togglebaar rechter beheerpaneel, concept CRUD, categorie CRUD,
//   product CRUD, inline aanpassen van "Basis (per 100)" wanneer admin.
// - Data-persist via localStorage (concepts + event state).
// - Stabiele concept-IDs behouden; bij verwijderen van een concept wordt ook de instance verwijderd.

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const UI_BUILD_VERSION = "v2025-10-27b-admin";

// ---------------------------------------------
// Basis data & helpers
// ---------------------------------------------
const logoUrl = "https://keystonecrushers.com/stadslab.png";
const colors = ["#7dd3fc","#86efac","#fde68a","#fca5a5","#c4b5fd","#99f6e4","#f9a8d4"]; // pastels
const uid = () => Math.random().toString(36).slice(2, 9);

const LS_CONCEPTS = "stadslab_concepts_v2";
const LS_EVENT_INST = "stadslab_event_instances_v4";
const LS_EVENT_NAME = "stadslab_event_name";
const LS_EVENT_TOTAL = "stadslab_event_total_people";
const ADMIN_FLAG = "stadslab_admin";
const ADMIN_PASS = "stadslab"; // wijzig indien nodig

// Default concepts (met optionele kleur)
const defaultConcepts = [
  {
    id: 'concept-gemaal',
    name: "Gemaal",
    color: "#7dd3fc",
    howToUrl: "",
    categories: {
      basis: [
        { id: uid(), name: "Friet", unit: "doos", basePer100: 3 },
        { id: uid(), name: "Mayonaise", unit: "emmer", basePer100: 0.6 },
        { id: uid(), name: "Ketchup", unit: "emmer", basePer100: 0.3 },
        { id: uid(), name: "Curry", unit: "emmer", basePer100: 0.2 },
        { id: uid(), name: "A13 bakjes", unit: "stuks", basePer100: 100 },
        { id: uid(), name: "Servetten", unit: "pakken", basePer100: 0.2 },
        { id: uid(), name: "Friet vorkjes", unit: "stuks", basePer100: 100 },
      ],
      parmeTruff: [
        { id: uid(), name: "Parmezaan", unit: "kg", basePer100: 1 },
        { id: uid(), name: "Truffel mayonaise", unit: "emmer", basePer100: 1 },
        { id: uid(), name: "Gehakte peterselie", unit: "zak", basePer100: 1 },
      ],
      loadedKip: [
        { id: uid(), name: "Hete kip (gaar)", unit: "kg", basePer100: 3 },
        { id: uid(), name: "Sriracha mayo", unit: "emmer", basePer100: 1 },
        { id: uid(), name: "Peterselie", unit: "zak", basePer100: 1 },
      ],
      rendangStoof: [
        { id: uid(), name: "Rendang", unit: "kg", basePer100: 4 },
        { id: uid(), name: "Uitjes", unit: "kg", basePer100: 1 },
      ],
    },
  },
  {
    id: 'concept-pinsa',
    name: "Pinsa",
    color: "#86efac",
    howToUrl: "",
    categories: {
      basis: [
        { id: uid(), name: "Pinsa Bodem", unit: "doos", basePer100: 3 },
        { id: uid(), name: "Pizza saus mutti", unit: "blik", basePer100: 8 },
        { id: uid(), name: "Pizza kaas", unit: "kg", basePer100: 7 },
        { id: uid(), name: "Rucola", unit: "zak", basePer100: 2 },
      ],
      caprese: [
        { id: uid(), name: "Mozzarella", unit: "kg", basePer100: 2 },
        { id: uid(), name: "Pesto", unit: "kg", basePer100: 1 },
        { id: uid(), name: "Basilicum", unit: "bos", basePer100: 1 },
        { id: uid(), name: "Tomaten plak", unit: "kg", basePer100: 2 },
      ],
      bbqKip: [
        { id: uid(), name: "Hete kip", unit: "kg", basePer100: 3 },
        { id: uid(), name: "Paprika salade", unit: "bak", basePer100: 1 },
        { id: uid(), name: "Mais", unit: "blik", basePer100: 2 },
        { id: uid(), name: "Barbeque saus", unit: "fles", basePer100: 1 },
      ],
      tuna: [
        { id: uid(), name: "Tonijn salade", unit: "bak", basePer100: 2 },
        { id: uid(), name: "Rode ui fijn", unit: "kg", basePer100: 1 },
        { id: uid(), name: "Kappertjes", unit: "pot", basePer100: 1 },
      ],
      cheeseOnion: [
        { id: uid(), name: "Uien", unit: "kg", basePer100: 2 },
        { id: uid(), name: "Roomkaas", unit: "kg", basePer100: 1 },
      ],
      carbonara: [
        { id: uid(), name: "Bacon blokjes", unit: "kg", basePer100: 2 },
        { id: uid(), name: "Knoflook olie", unit: "liter", basePer100: 1 },
        { id: uid(), name: "Uien", unit: "kg", basePer100: 1 },
        { id: uid(), name: "Roomkaas", unit: "kg", basePer100: 1 },
      ],
    },
  },
  { id: 'concept-bbq-stadslab', name: "Barbeque Stadslab", color: "#fde68a", howToUrl: "", categories: { basis: [] } },
  { id: 'concept-storm', name: "Storm", color: "#fca5a5", howToUrl: "", categories: { basis: [ { id: uid(), name: "Couscous pot", unit: "stuks", basePer100: 100 } ] } },
  { id: 'concept-broodjes', name: "Broodjes lunch", color: "#c4b5fd", howToUrl: "", categories: { basis: [] } },
  { id: 'concept-burger', name: "Burger concept", color: "#99f6e4", howToUrl: "", categories: { basis: [] } },
];

const EMPTY_CONCEPT = { id: "__empty__", name: "(geen concept)", color: "#e2e8f0", categories: { basis: [] } };

function computeScaledQty(basePer100, people) {
  const raw = (people / 100) * (basePer100 || 0);
  return { raw, shown: Math.ceil(raw) };
}
function labelForKey(key){
  if (key === 'parmeTruff') return 'Parme/Truff';
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s=>s.toUpperCase());
}
const normalizeColor = (v, fb = '#7dd3fc') => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : fb;
const keyFromLabel = (label) => (label||"").replace(/[^a-zA-Z0-9 ]/g, " ").trim().replace(/\s+(\w)/g,(_,c)=>c.toUpperCase()).replace(/^\w/, c=>c.toLowerCase()) || "nieuweCategorie";

// ---------------------------------------------
// Admin subcomponents (re-implemented in shadcn-stijl)
// ---------------------------------------------
function InlineNumber({ value, onChange, disabled }) {
  return (
    <input type="number" min={0} step={0.01} value={value}
      disabled={disabled}
      onChange={(e)=>onChange?.(e.target.value)}
      className={`w-24 text-right border rounded-md px-2 py-1 ${disabled?'bg-slate-50 text-slate-500':'bg-white'}`} />
  );
}

function ConceptAdmin({ concepts, onAdd, onRemove, onSelect, selectedId }){
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7dd3fc');
  const [removeId, setRemoveId] = useState('');

  // Sync de verwijder-keuze met de bovenste selectie, zodat "verwijderen" werkt
  // zelfs als je alleen de eerste dropdown gebruikt.
  useEffect(() => {
    if (!removeId) setRemoveId(selectedId || '');
  }, [selectedId]);

  const handleRemove = () => {
    const idToRemove = removeId || selectedId || '';
    if (!idToRemove) return;
    const c = concepts.find(x => x.id === idToRemove);
    if (!c) return;
    if (confirm(`Concept "${c.name}" verwijderen?`)) {
      onRemove(idToRemove);
      setRemoveId('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Bestaande concepten</Label>
        <select className="w-full border rounded-md px-2 py-2" value={selectedId} onChange={(e)=>onSelect(e.target.value)}>
          {concepts.map((c)=>(<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="col-span-2">
          <Label>Naam nieuw concept</Label>
          <Input placeholder="Bijv. Tacos" value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div>
          <Label>Kleur</Label>
          <input type="color" className="w-full h-10 border rounded" value={color} onChange={(e)=>setColor(e.target.value)} />
        </div>
        <div className="col-span-3 flex justify-end">
          <Button variant="outline" onClick={()=>{ onAdd(name, color); setName(''); }}>+ Concept toevoegen</Button>
        </div>
      </div>
      <div>
        <Label>Concept verwijderen</Label>
        <div className="flex gap-2 items-center">
          <select className="w-full border rounded-md px-2 py-2" value={removeId} onChange={(e)=>setRemoveId(e.target.value)}>
            <option value="">(Gebruik selectie hierboven of kies hier)</option>
            {concepts.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          { (removeId || selectedId) && (
            <span style={{ background: concepts.find(c=>c.id===(removeId||selectedId))?.color || '#ccc', width: 16, height: 16, borderRadius: '50%', border: '1px solid #e5e7eb' }} />
          )}
          <Button variant="destructive" disabled={!(removeId || selectedId)} onClick={handleRemove}>Verwijderen</Button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Tip: je kunt gewoon de bovenste lijst gebruiken; de knop verwijdert de daar geselecteerde.</p>
      </div>
    </div>
  );
}

function CategoryAdmin({ concept, optionKeys, addItem, keyFromLabel }){
  const [adminCatChoice, setAdminCatChoice] = useState('basis');
  const [adminNewCatLabel, setAdminNewCatLabel] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminUnit, setAdminUnit] = useState('');
  const [adminBase, setAdminBase] = useState('');
  return (
    <div className="space-y-2">
      <div>
        <Label>Categorie</Label>
        <select className="w-full border rounded-md px-2 py-2" value={adminCatChoice} onChange={(e)=>setAdminCatChoice(e.target.value)}>
          <option value="basis">Basis</option>
          {optionKeys.map(k => (<option key={k} value={k}>{labelForKey(k)}</option>))}
          <option value="__new__">+ Nieuwe categorie…</option>
        </select>
      </div>
      {adminCatChoice === "__new__" && (
        <div>
          <Label>Naam nieuwe categorie</Label>
          <Input placeholder="Bijv. veganSpecial" value={adminNewCatLabel} onChange={(e)=>setAdminNewCatLabel(e.target.value)} />
        </div>
      )}
      <div>
        <Label>Productnaam</Label>
        <Input placeholder="Bijv. Frietsaus" value={adminName} onChange={(e)=>setAdminName(e.target.value)} />
      </div>
      <div>
        <Label>Eenheid</Label>
        <Input placeholder="kg / doos / stuks" value={adminUnit} onChange={(e)=>setAdminUnit(e.target.value)} />
      </div>
      <div>
        <Label>Basis (per 100)</Label>
        <Input type="number" step={0.01} min={0} value={adminBase} onChange={(e)=>setAdminBase(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={()=>{
          const targetCat = adminCatChoice === "__new__" ? keyFromLabel(adminNewCatLabel || "nieuw") : adminCatChoice;
          if(!targetCat) return;
          addItem(concept.id, targetCat, { name: adminName, unit: adminUnit, basePer100: adminBase });
          setAdminName(''); setAdminUnit(''); setAdminBase('');
          if(adminCatChoice==='__new__') setAdminCatChoice(targetCat);
        }}>+ Product toevoegen</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------
// Component: ConceptEditor (defensief, met admin inline-edit)
// ---------------------------------------------
function ConceptEditor({ concept, instance, onChange, colorIdx, isAdmin, updateItemBase, removeItem, removeCategory }) {
  const defaultInst = useMemo(() => ({ conceptId: concept.id, people: 0, enabledOptions: {}, optionWeights: {} }), [concept.id]);
  const inst = instance ?? defaultInst;

  useEffect(() => { if (!instance && onChange) onChange(defaultInst); }, [instance, defaultInst]);

  const optionKeys = useMemo(() => Object.keys(concept.categories || {}).filter(k => k !== 'basis'), [concept]);

  useEffect(() => {
    const nextEnabled = { ...(inst.enabledOptions || {}) };
    const nextWeights = { ...(inst.optionWeights || {}) };
    optionKeys.forEach(k => { if (!(k in nextEnabled)) nextEnabled[k] = false; if (!(k in nextWeights)) nextWeights[k] = 0; });
    onChange?.({ ...inst, enabledOptions: nextEnabled, optionWeights: nextWeights });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept.id]);

  const enabledOptions = inst.enabledOptions || {};
  const optionWeights = inst.optionWeights || {};

  const equalize = () => {
    const on = optionKeys.filter(k => enabledOptions[k]);
    if (!on.length) return;
    if (on.length === 1) return onChange?.({ ...inst, optionWeights: { ...optionWeights, [on[0]]: 100 } });
    const even = Number((100 / on.length).toFixed(2));
    const next = { ...optionWeights };
    on.forEach(k => (next[k] = even));
    const sum = on.reduce((a, k) => a + (Number(next[k]) || 0), 0);
    const diff = Number((100 - sum).toFixed(2));
    if (Math.abs(diff) > 0.01) { const fix = on[0]; next[fix] = Number(((Number(next[fix]) || 0) + diff).toFixed(2)); }
    optionKeys.filter(k => !enabledOptions[k]).forEach(k => (next[k] = 0));
    onChange?.({ ...inst, optionWeights: next });
  };

  const setWeightLocked = (targetKey, vRaw) => {
    const on = optionKeys.filter(k => enabledOptions[k]);
    if (!on.length) return;
    const v = Math.max(0, Math.min(100, Number(vRaw) || 0));
    if (on.length === 1) return onChange?.({ ...inst, optionWeights: { ...optionWeights, [targetKey]: 100 } });
    const next = { ...optionWeights, [targetKey]: v };
    const others = on.filter(k => k !== targetKey);
    let remaining = 100 - v;
    let totalOthers = others.reduce((acc, k) => acc + (Number(optionWeights[k]) || 0), 0);
    if (totalOthers <= 0) {
      const even = Number((remaining / others.length).toFixed(2)); others.forEach(k => (next[k] = even));
    } else {
      let assigned = 0; others.forEach((k, idx) => { if (idx === others.length - 1) next[k] = Number((remaining - assigned).toFixed(2)); else { const share = (Number(optionWeights[k]) || 0) / totalOthers; const val = Number((remaining * share).toFixed(2)); next[k] = val; assigned += val; } });
    }
    const sum = on.reduce((a, k) => a + (Number(next[k]) || 0), 0);
    const diff = Number((100 - sum).toFixed(2));
    if (Math.abs(diff) > 0.01) { const fix = others[0] ?? targetKey; next[fix] = Number(((Number(next[fix]) || 0) + diff).toFixed(2)); }
    optionKeys.filter(k => !enabledOptions[k]).forEach(k => (next[k] = 0));
    onChange?.({ ...inst, optionWeights: next });
  };

  const normalizedWeights = useMemo(() => {
    const on = optionKeys.filter(k => enabledOptions[k]);
    if (!on.length) return {};

// w is een map van string → number
const w: Record<string, number> = {};

// vul w met nette getallen (2 decimalen)
on.forEach((k: string) => {
  const raw = Number(optionWeights[k] ?? 0);
  w[k] = Number(raw.toFixed(2));
});

// zeg expliciet dat dit nummers zijn
const values = Object.values(w) as number[];

// veilig optellen
const sum = values.reduce((a: number, b: number) => a + b, 0);

// verschil afronden en eerste item corrigeren
const diff = Number((100 - sum).toFixed(2));
if (Math.abs(diff) > 0.01) {
  const fix = on[0] as string;
  w[fix] = Number(((w[fix] ?? 0) + diff).toFixed(2));
}

return w;

  }, [optionKeys, enabledOptions, optionWeights]);

  const items = useMemo(() => {
    const basis = concept.categories?.basis || [];
    const enabled = Object.keys(normalizedWeights);
    const combined = [ ...basis.map(i => ({ ...i, __adjBasePer100: i.basePer100, __source: 'basis' })) ];
    enabled.forEach(k => { const catItems = concept.categories?.[k] || []; const pct = Number(normalizedWeights[k]) || 0; catItems.forEach(i => combined.push({ ...i, __adjBasePer100: (i.basePer100 || 0) * (pct / 100), __source: k })); });
    return combined;
  }, [concept, normalizedWeights]);

  const optionKeysEnabled = optionKeys.filter(k => enabledOptions[k]);
  const enabledWithPerc = optionKeysEnabled.map((k, i) => ({ key: k, pct: Number(optionWeights[k] || 0), color: colors[(colorIdx + i) % colors.length] }));

  return (
    <Card className="mb-4 border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-800">{concept.name} – instellingen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aantal personen */}
        <div className="grid grid-cols-12 items-center gap-3">
          <Label htmlFor={`people-${concept.id}`} className="col-span-12 md:col-span-3 text-slate-700 md:text-right">Aantal personen</Label>
          <div className="col-span-12 md:col-span-9">
            <Input id={`people-${concept.id}`} type="number" min={0} value={inst.people ?? ''}
              onChange={(e)=>{ const v = e.target.value; if (v === '') return onChange?.({ ...inst, people: '' }); const n = Math.max(0, parseInt(v,10)||0); onChange?.({ ...inst, people: n }); }}
              onBlur={()=>{ if (inst.people === '') onChange?.({ ...inst, people: 0 }); }} className="max-w-[220px]"/>
          </div>
        </div>

        {/* Optionele gerechten */}
        <div className="pt-2 border-t border-slate-200">
          <p className="text-slate-700 mb-2 font-medium">Optionele gerechten</p>
          {optionKeys.length === 0 ? (
            <div className="text-sm text-slate-500">Geen optionele categorieën voor dit concept.</div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {optionKeys.map((key) => (
                <Label key={key} className="flex items-center gap-2 text-slate-700">
                  <Checkbox checked={!!enabledOptions[key]} onCheckedChange={(v)=> onChange?.({ ...inst, enabledOptions: { ...enabledOptions, [key]: !!v } })} />
                  {labelForKey(key)}
                  {isAdmin && (
                    <Button variant="ghost" size="sm" className="text-red-600 px-2" title="Categorie verwijderen" onClick={()=>{ if (key!== 'basis' && confirm(`Categorie \"${labelForKey(key)}\" verwijderen?`)) removeCategory(concept.id, key); }}>×</Button>
                  )}
                </Label>
              ))}
            </div>
          )}
        </div>

        {/* Verdelen */}
        {optionKeysEnabled.length > 0 && (
          <div className="rounded-xl border p-3 bg-white/70">
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <div className="flex flex-wrap gap-2">
                {enabledWithPerc.map(({ key, pct, color }) => (
                  <span key={key} className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs" style={{ backgroundColor: "#eef2ff" }}>
                    <span style={{ background: color }} className="h-2.5 w-2.5 rounded" />
                    {labelForKey(key)}: <b>{Math.round(pct)}%</b>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={equalize} className="border-slate-300">Gelijk verdelen</Button>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 mb-3 flex">
              {enabledWithPerc.map(({ key, pct, color }) => (
                <div key={key} className="h-full" style={{ width: `${pct}%`, background: color }} />
              ))}
            </div>
            <div className="space-y-3">
              {optionKeysEnabled.map((key, i) => (
                <div key={key} className="grid grid-cols-12 items-center gap-3">
                  <div className="col-span-4 text-sm text-slate-700">{labelForKey(key)}</div>
                  <div className="col-span-7">
                    <input type="range" min={0} max={100} step={1}
                      value={Number(optionWeights[key] || 0)} onChange={(e)=> setWeightLocked(key, Number(e.target.value))}
                      className="w-full" style={{ accentColor: colors[(colorIdx + i) % colors.length] }} />
                  </div>
                  <div className="col-span-1 text-right text-sm tabular-nums">{Math.round(Number(optionWeights[key] || 0))}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview tabel per concept */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse">
            <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-right px-3 py-2">Eenheid</th>
                <th className="text-right px-3 py-2">Basis (per 100)</th>
                <th className="text-right px-3 py-2">Benodigd</th>
                {isAdmin && <th className="w-12 px-3 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const { shown } = computeScaledQty(item.__adjBasePer100 ?? item.basePer100, inst.people);
                return (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-800">{item.name}</td>
                    <td className="text-right px-3 py-2 text-slate-700">{item.unit}</td>
                    <td className="text-right px-3 py-2 text-slate-700">
                      {isAdmin ? (
                        <InlineNumber value={Number(item.basePer100 ?? 0)} onChange={(val)=>updateItemBase(concept.id, item.__source || 'basis', item.id, val)}  disabled={false} />
                      ) : (
                        <>{(item.__adjBasePer100 ?? item.basePer100).toFixed ? (item.__adjBasePer100 ?? item.basePer100).toFixed(2) : (item.__adjBasePer100 ?? item.basePer100)}</>
                      )}
                    </td>
                    <td className="text-right px-3 py-2 text-slate-800 font-medium">{shown} {item.unit}</td>
                    {isAdmin && (
                      <td className="text-center px-3 py-2"><Button variant="ghost" className="text-red-600" onClick={()=>removeItem(concept.id, item.__source || 'basis', item.id)} title="Verwijderen">×</Button></td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------
// Hoofdcomponent met Tabs + Admin
// ---------------------------------------------
export default function StadslabBackofficeIntegratedAdmin(){
  // Concepts (nu bewerkbaar + persist)
  const [concepts, setConcepts] = useState(()=>{ try{ const s = localStorage.getItem(LS_CONCEPTS); return s ? JSON.parse(s) : defaultConcepts; } catch{ return defaultConcepts; } });
  useEffect(()=>{ try{ localStorage.setItem(LS_CONCEPTS, JSON.stringify(concepts)); }catch{} }, [concepts]);

  const [eventName, setEventName] = useState(()=>{ const s = localStorage.getItem(LS_EVENT_NAME); return s || 'Nieuw evenement'; });
  useEffect(()=>{ localStorage.setItem(LS_EVENT_NAME, eventName); }, [eventName]);

  const [instancesById, setInstancesById] = useState(()=>{ const raw = localStorage.getItem(LS_EVENT_INST); const parsed = raw ? JSON.parse(raw) : {}; const valid = new Set((concepts||[]).map(c=>c.id)); return Object.fromEntries(Object.entries(parsed).filter(([k])=>valid.has(k))); });
  useEffect(()=>{ localStorage.setItem(LS_EVENT_INST, JSON.stringify(instancesById)); }, [instancesById]);
  useEffect(()=>{ const valid = new Set(concepts.map(c=>c.id)); setInstancesById(prev=>Object.fromEntries(Object.entries(prev).filter(([k])=>valid.has(k)))); }, [concepts]);

  const activeConceptIds = useMemo(()=>Object.keys(instancesById), [instancesById]);
  const isActive = (id)=>activeConceptIds.includes(id);

  const toggleConcept = (conceptId)=>{
    setInstancesById(prev=>{ const next = { ...prev }; if (next[conceptId]) delete next[conceptId]; else next[conceptId] = { conceptId, people: 0, enabledOptions: {}, optionWeights: {} }; return next; });
  };
  const updateInstance = (conceptId, patch)=> setInstancesById(prev=>({ ...prev, [conceptId]: patch }));

  type Instance = { people?: number };
const totalPeople = useMemo(
  () =>
    activeConceptIds.reduce((a, cid) => {
      const m = (instancesById as Record<string, Instance>)[cid];
      return a + Number(m?.people ?? 0);
    }, 0),
  [activeConceptIds, instancesById]
);


  const setSplitByPerc = (cidTarget, pct)=>{
    const total = Math.max(1, totalPeople);
    const targetAbs = Math.round((pct/100)*total);
 
setInstancesById((prev) => {
  const next: Record<string, Instance> = { ...(prev as Record<string, Instance>) };

  const target = next[cidTarget];
  if (!target) return prev;

  // zet doel
  next[cidTarget] = { ...target, people: Number(targetAbs) };

  // overige ids verdelen
  const others = activeConceptIds.filter((id) => id !== cidTarget);
  const rest = Math.max(0, total - targetAbs);

  if (others.length) {
    const per = Math.floor(rest / others.length);
    let remainder = rest - per * others.length;

    for (const id of others) {
      const base = Number(next[id]?.people ?? 0);
      const add = per + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      next[id] = { ...(next[id] || {}), people: base + add };
    }
  }

  return next;
});

  };
  const equalizeSplit = ()=>{
    if (!activeConceptIds.length) return;
    const total = Math.max(0, totalPeople);
    const even = activeConceptIds.length ? Math.floor(total/activeConceptIds.length) : 0;
    const leftover = total - even*activeConceptIds.length;
    setInstancesById(prev=>{ const next = { ...prev }; activeConceptIds.forEach((id, idx)=>{ next[id] = { ...next[id], people: idx<leftover ? even+1 : even }; }); return next; });
  };

  // Aggregatie (zoals pastel-versie)
  const detailedPerConcept = useMemo(()=>{
    return activeConceptIds.map(cid=>{
      const inst = instancesById[cid];
      const concept = concepts.find(c=>c.id===cid) || EMPTY_CONCEPT;
      const optionKeys = Object.keys(concept.categories||{}).filter(k=>k!=="basis");
      const on = optionKeys.filter(k=>inst?.enabledOptions?.[k]);
      let w = {};
      if (on.length){ on.forEach(k=>w[k] = Number((Number(inst?.optionWeights?.[k])||0).toFixed(2))); const sum = Object.values(w).reduce((a,b)=>a+b,0); const diff = Number((100-sum).toFixed(2)); if (Math.abs(diff)>0.01){ const fix = on[0]; w[fix] = Number(((w[fix]||0)+diff).toFixed(2)); } }
      const basis = concept.categories?.basis||[]; const list = [];
      basis.forEach(i=> list.push({ id: i.id, name: i.name, unit: i.unit, basePer100: i.basePer100, source: { concept: concept.name, category: 'basis' } }));
      Object.keys(w).forEach(k=>{ const pct = Number(w[k])||0; const catItems = concept.categories?.[k]||[]; catItems.forEach(i=> list.push({ id: i.id, name: i.name, unit: i.unit, basePer100: (i.basePer100||0)*(pct/100), source: { concept: concept.name, category: k } })); });
      const scaled = list.map(row=>{ const { raw, shown } = computeScaledQty(row.basePer100, inst?.people || 0); return { ...row, qtyRaw: raw, qtyShown: shown }; });
      return { conceptId: cid, conceptName: concept.name, people: inst?.people || 0, items: scaled };
    });
  }, [activeConceptIds, instancesById, concepts]);

  const aggregated = useMemo(()=>{
    const map = new Map();
    detailedPerConcept.forEach(block=>{ block.items.forEach(it=>{ const key = `${it.name}||${it.unit}`; if (!map.has(key)) map.set(key, { name: it.name, unit: it.unit, qtyRaw: 0, sources: [] }); const rec = map.get(key); rec.qtyRaw += it.qtyRaw; rec.sources.push({ concept: block.conceptName, category: it.source.category, qtyRaw: it.qtyRaw }); }); });
    const rows = Array.from(map.values()).map(r=>({ ...r, qtyShown: Math.ceil(r.qtyRaw) }));
    rows.sort((a,b)=> a.name.localeCompare(b.name) || a.unit.localeCompare(b.unit));
    return rows;
  }, [detailedPerConcept]);

  // ------------------- Admin: state + handlers -------------------
  const [isAdmin, setIsAdmin] = useState(()=>{ try{ return localStorage.getItem(ADMIN_FLAG)==='1'; }catch{ return false; } });
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(true);

  const submitLogin = useCallback(()=>{ if (password === ADMIN_PASS){ setIsAdmin(true); setShowAdminPanel(true); try{ localStorage.setItem(ADMIN_FLAG,'1'); }catch{} setShowLogin(false); setPassword(""); } else alert('Onjuist wachtwoord'); }, [password]);
  const doLogout = useCallback(()=>{ setIsAdmin(false); try{ localStorage.removeItem(ADMIN_FLAG); }catch{} }, []);

  // CRUD helpers
  const ensureCategory = (c, catKey) => { const cats={...c.categories}; if(!cats[catKey]) cats[catKey]=[]; return cats; };
  const addItem = (conceptId, catKey, item) => { setConcepts(prev=>prev.map(c=>{ if(c.id!==conceptId) return c; const cats=ensureCategory(c,catKey); const list=[...cats[catKey]]; list.push({ id: uid(), name: item.name?.trim()||"Nieuw product", unit: item.unit?.trim()||"stuks", basePer100: Math.max(0, Number(item.basePer100)||0) }); cats[catKey]=list; return { ...c, categories: cats }; })); };
  const removeItem = (conceptId, catKey, itemId) => { setConcepts(prev=>prev.map(c=>{ if(c.id!==conceptId) return c; const cats={...c.categories}; cats[catKey]=(cats[catKey]||[]).filter(i=>i.id!==itemId); return { ...c, categories: cats }; })); };
  const updateItemBase = (conceptId, categoryKey, itemId, newBase) => { setConcepts(prev=>prev.map(c=>{ if(c.id!==conceptId) return c; const cats={...c.categories}; const list=[...(cats[categoryKey]||[])]; const idx=list.findIndex(i=>i.id===itemId); if(idx!==-1){ const nb=Math.max(0, Number(newBase)||0); list[idx]={...list[idx], basePer100: nb}; cats[categoryKey]=list; } return { ...c, categories: cats }; })); };
  const removeCategory = (conceptId, catKey) => { if (catKey==='basis') return; setConcepts(prev=>prev.map(c=>{ if(c.id!==conceptId) return c; const cats={...c.categories}; delete cats[catKey]; return { ...c, categories: cats }; })); };
  const addConcept = (name, color) => { const n=(name||'').trim()||'Nieuw concept'; const col=normalizeColor(color,'#7dd3fc'); const c={ id: uid(), name: n, color: col, howToUrl: "", categories: { basis: [] } }; setConcepts(prev=>[...prev,c]); };
  const removeConcept = (id) => { setConcepts(prev => prev.filter(c=>c.id!==id)); setInstancesById(prev=>{ const next={...prev}; delete next[id]; return next; }); };

  // PDF Dropzone (optioneel – onveranderd uit pastel v2)
  const [pdfState, setPdfState] = useState({ status: "idle", name: "", error: "" });
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(()=>{
    const el = dropRef.current; if (!el) return;
    const onDragOver = e=>{ e.preventDefault(); el.classList.add("ring-2","ring-slate-400"); };
    const onDragLeave = ()=>{ el.classList.remove("ring-2","ring-slate-400"); };
    const onDrop = e=>{ e.preventDefault(); el.classList.remove("ring-2","ring-slate-400"); const f = e.dataTransfer.files?.[0]; if (f) handlePdf(f); };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return ()=>{ el.removeEventListener("dragover", onDragOver); el.removeEventListener("dragleave", onDragLeave); el.removeEventListener("drop", onDrop); };
  }, []);
  async function readPdfText(file){ const pdfjsLib = await import("pdfjs-dist"); const workerSrc = await import("pdfjs-dist/build/pdf.worker.min.mjs"); if (pdfjsLib.GlobalWorkerOptions) pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc; const url = URL.createObjectURL(file); const doc = await pdfjsLib.getDocument({ url }).promise; let fullText = ""; for (let p=1; p<=doc.numPages; p++){ const page = await doc.getPage(p); const content = await page.getTextContent(); const strings = content.items.map(it=>it.str); fullText += "\n" + strings.join(" "); } URL.revokeObjectURL(url); return fullText; }
  async function handlePdf(file){ setPdfState({ status: 'reading', name: file.name, error: '' }); try { const text = await readPdfText(file); setPdfState({ status: 'parsing', name: file.name, error: '' }); /* Hook voor AI/heuristics kan hier */ setPdfState({ status: 'done', name: file.name, error: '' }); } catch (e){ console.error(e); setPdfState({ status: 'error', name: file.name, error: String(e) }); } }

  const [activeTab, setActiveTab] = useState('totaal');
  useEffect(()=>{ if (activeTab !== 'totaal' && !activeConceptIds.includes(activeTab)) setActiveTab(activeConceptIds[0] || 'totaal'); }, [activeConceptIds, activeTab]);
  const handlePrint = ()=> window.print();

  const splitData = useMemo(()=>{
    const total = Math.max(1, totalPeople);
    return activeConceptIds.map((cid, idx)=>{
      const people = Number(instancesById[cid]?.people)||0;
      return { cid, name: (concepts.find(c=>c.id===cid)?.name)||'Concept', people, pct: Math.round((people/total)*100), color: colors[idx % colors.length] };
    });
  }, [activeConceptIds, instancesById, totalPeople, concepts]);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 ${isAdmin && showAdminPanel ? 'pr-96' : ''}`}>
      <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35}}
        className="mx-auto max-w-6xl bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 border border-slate-200">

        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Stadslab Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-semibold leading-tight text-slate-900">Stadslab Backoffice</h1>
              <p className="text-sm text-slate-600">Schaal je bestelling op basis van personen en concept.</p>
              <p className="text-[11px] text-slate-400">Build: {UI_BUILD_VERSION}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            {isAdmin ? (
              <>
                <Button variant="outline" onClick={()=>setShowAdminPanel(v=>!v)}>{showAdminPanel? 'Paneel verbergen' : 'Paneel tonen'}</Button>
                <Button variant="outline" onClick={doLogout}>Uitloggen (admin)</Button>
                <Button variant="outline" onClick={handlePrint}>Print</Button>
              </>
            ) : (
              <Button variant="outline" onClick={()=>setShowLogin(true)}>Admin login</Button>
            )}
          </div>

          {/* TOP-RIGHT PDF DROPBOX */}
          <div ref={dropRef} className="relative print:hidden">
            <div className="w-60 rounded-xl border border-dashed bg-white/70 hover:bg-white p-3 text-sm text-slate-600 flex flex-col items-center gap-2 cursor-pointer"
                 onClick={()=>fileInputRef.current?.click()}>
              <div className="font-medium">Draaiboek (PDF) droppen</div>
              <div className="text-xs text-slate-500 -mt-1">Sleep & drop of klik om te kiezen</div>
              {pdfState.status !== 'idle' && (
                <div className="mt-1 w-full rounded-lg bg-slate-50 border p-2 text-xs">
                  <div className="truncate"><b>Bestand:</b> {pdfState.name}</div>
                  <div className="mt-1">
                    {pdfState.status === 'reading' && 'PDF lezen…'}
                    {pdfState.status === 'parsing' && 'Analyseren…'}
                    {pdfState.status === 'done' && 'Gereed ✓'}
                    {pdfState.status === 'error' && `Fout: ${pdfState.error}`}
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e=>{ const f = e.target.files?.[0]; if (f) handlePdf(f); }} />
            </div>
          </div>
        </header>

        {/* Eventnaam + totaal */}
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <Label className="text-slate-700">Evenement</Label>
            <input value={eventName} onChange={e=>setEventName(e.target.value)}
              className="text-xl font-medium bg-transparent outline-none border-b border-transparent focus:border-slate-300 text-slate-900" />
            <span className="text-sm text-slate-500">Totaal: <b>{totalPeople}</b> personen</span>
          </div>
          <div className="print:hidden"><Button variant="outline" onClick={handlePrint} className="border-slate-300">Print</Button></div>
        </div>

        {/* Concept toggles */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {concepts.map((c, idx)=>{
            const active = isActive(c.id);
            const dot = c.color || colors[idx % colors.length];
            return (
              <button key={c.id} onClick={()=>toggleConcept(c.id)}
                className={`px-3 py-1.5 rounded-full border text-sm transition ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded" style={{background:dot}} />
                  {active ? '✓ ' : ''}{c.name}
                </span>
              </button>
            );
          })}
        </div>
        <div className="text-xs text-slate-500 mb-3">Klik om een concept aan/uit te zetten. Actieve concepten verschijnen in tabbladen hieronder.</div>

        {/* Personenverdeling */}
        {activeConceptIds.length>1 && (
          <Card className="mb-4 border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-slate-800">
                <span>Personenverdeling</span>
                <Button variant="outline" size="sm" onClick={equalizeSplit} className="border-slate-300">Gelijk verdelen</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {splitData.map(s=> (
                  <span key={s.cid} className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs text-slate-700" style={{backgroundColor:'#f1f5f9'}}>
                    <span style={{background:s.color}} className="h-2.5 w-2.5 rounded" />
                    {s.name}: <b>{s.people}</b> ({s.pct}%)
                  </span>
                ))}
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 flex">
                {splitData.map(s=> <div key={s.cid} style={{width:`${s.pct}%`, background:s.color}} className="h-full" />)}
              </div>
              <div className="space-y-2">
                {splitData.map(s=> (
                  <div key={s.cid} className="grid grid-cols-12 items-center gap-3">
                    <div className="col-span-4 text-sm text-slate-700">{s.name}</div>
                    <div className="col-span-7">
                      <input type="range" min={0} max={100} step={1} value={s.pct}
                        onChange={e=>setSplitByPerc(s.cid, Number(e.target.value))} className="w-full" style={{ accentColor: s.color }} />
                    </div>
                    <div className="col-span-1 text-right text-sm tabular-nums">{s.pct}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: concepten + bestellijst */}
        {activeConceptIds.length===0 ? (
          <Card className="mb-4 border-slate-200 shadow-sm"><CardContent className="p-4 text-slate-600">Nog geen concept actief. Zet minstens één concept aan bovenaan.</CardContent></Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="flex w-full overflow-x-auto max-w-full">
              {activeConceptIds.map((cid, idx)=>{
                const concept = concepts.find(c=>c.id===cid) || EMPTY_CONCEPT;
                const dot = concept.color || colors[idx % colors.length];
                return (
                  <TabsTrigger key={cid} value={cid} className="px-3 py-2 mr-1 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded" style={{background:dot}} />
                      {concept.name}
                    </span>
                  </TabsTrigger>
                );
              })}
              <TabsTrigger value="totaal" className="px-3 py-2 whitespace-nowrap">Bestellijst</TabsTrigger>
            </TabsList>

            {activeConceptIds.map((cid, idx)=>{
              const concept = concepts.find(c=>c.id===cid) || EMPTY_CONCEPT;
              const inst = instancesById[cid];
              return (
                <TabsContent key={cid} value={cid} className="mt-3">
                  <ConceptEditor concept={concept} instance={inst} onChange={(patch)=>updateInstance(cid, patch)} colorIdx={idx}
                    isAdmin={isAdmin} updateItemBase={updateItemBase} removeItem={removeItem} removeCategory={removeCategory} />
                </TabsContent>
              );
            })}

            <TabsContent value="totaal" className="mt-3">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-slate-800">Gecombineerde bestellijst – {eventName} (totaal {totalPeople} pers.)</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                      <tr>
                        <th className="text-left px-3 py-2">Product</th>
                        <th className="text-right px-3 py-2">Eenheid</th>
                        <th className="text-right px-3 py-2">Benodigd totaal</th>
                        <th className="text-left px-3 py-2">Herkomst</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregated.map((row, idx)=> (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-800">{row.name}</td>
                          <td className="text-right px-3 py-2 text-slate-700">{row.unit}</td>
                          <td className="text-right px-3 py-2 tabular-nums text-slate-800 font-medium">{row.qtyShown} {row.unit}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-2">
                              {row.sources.map((s,i)=> (
                                <span key={i} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-slate-700" style={{backgroundColor:'#f1f5f9'}}>
                                  <span className="h-2.5 w-2.5 rounded" style={{background: colors[(i)%colors.length]}} />
                                  <b>{s.concept}</b> · {labelForKey(s.category)} · {Math.ceil(s.qtyRaw)}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              <div className="mt-6 flex justify-end gap-2 print:hidden">
                <Button variant="outline" onClick={handlePrint} className="border-slate-300">Print</Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </motion.div>

      {/* Rechter admin side panel */}
      {isAdmin && showAdminPanel && (
        <Card className="w-80 fixed right-6 top-6 h-[calc(100vh-3rem)] overflow-auto border-emerald-200 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Admin: beheren</CardTitle>
              <Button variant="ghost" onClick={() => setShowAdminPanel(false)} title="Paneel sluiten" className="text-slate-500 px-2">×</Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <section className="space-y-2">
              <h4 className="font-semibold">Concepten</h4>
              <ConceptAdmin concepts={concepts} onAdd={addConcept} onRemove={removeConcept} onSelect={(id)=>{ if(!isActive(id)) toggleConcept(id); }} selectedId={activeConceptIds[0] || concepts[0]?.id} />
            </section>
            <hr className="border-slate-200" />
            <section className="space-y-2">
              <h4 className="font-semibold">Producten</h4>
              {activeConceptIds.length ? (
                <CategoryAdmin optionKeys={Object.keys((concepts.find(c=>c.id===activeConceptIds[0])||EMPTY_CONCEPT).categories||{}).filter(k=>k!=='basis')} addItem={addItem} keyFromLabel={keyFromLabel} concept={concepts.find(c=>c.id===activeConceptIds[0])||EMPTY_CONCEPT} />
              ) : (
                <div className="text-sm text-slate-500">Activeer eerst een concept om producten toe te voegen.</div>
              )}
            </section>
          </CardContent>
        </Card>
      )}

      {/* Login modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>setShowLogin(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-80" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Admin login</h2>
              <button className="text-slate-500" onClick={()=>setShowLogin(false)} aria-label="Sluiten">×</button>
            </div>
            <Input type="password" placeholder="Wachtwoord" value={password} onChange={(e)=>setPassword(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && submitLogin()} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setShowLogin(false)}>Annuleren</Button>
              <Button onClick={submitLogin} className="bg-emerald-600 text-white">Inloggen</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
