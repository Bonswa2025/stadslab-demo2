'use client';

/**
 * Stadslab Backoffice – Pastel UI + Tabs + Admin (login + rechter paneel)
 * Build: v2025-11-06 stable
 *
 * Fixes t.o.v. jouw upload:
 * - Eén enkele export default (duplicate render verwijderd)
 * - Imports naar boven verplaatst
 * - Haakjes/blocks in balans (geen "Expected '}', got <eof>")
 * - Types opgeschoond (Instance één keer gedeclareerd)
 * - Dubbele Admin-paneel-render verwijderd
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ---------------------------------------------
// Build/meta
// ---------------------------------------------
export const UI_BUILD_VERSION = 'v2025-11-06-stable';

// --- localStorage safety helpers (SSR safe) ---
const isBrowser = typeof window !== 'undefined';
const storage = {
  get(key: string) {
    if (!isBrowser) return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, val: string) {
    if (!isBrowser) return;
    try { window.localStorage.setItem(key, val); } catch {}
  },
  remove(key: string) {
    if (!isBrowser) return;
    try { window.localStorage.removeItem(key); } catch {}
  },
};

// ---------------------------------------------
// Basis data & helpers
// ---------------------------------------------
const logoUrl = 'https://keystonecrushers.com/stadslab.png';
const colors = [
  '#7dd3fc',
  '#86efac',
  '#fde68a',
  '#fca5a5',
  '#c4b5fd',
  '#99f6e4',
  '#f9a8d4',
]; // pastels
const uid = () => Math.random().toString(36).slice(2, 9);

const LS_CONCEPTS = 'stadslab_concepts_v2';
const LS_EVENT_INST = 'stadslab_event_instances_v4';
const LS_EVENT_NAME = 'stadslab_event_name';
const ADMIN_FLAG = 'stadslab_admin';
const ADMIN_PASS = 'stadslab'; // wijzig indien nodig

type Instance = {
  conceptId?: string;
  people?: number;
  enabledOptions?: Record<string, boolean>;
  optionWeights?: Record<string, number>;
};


// Default concepts (met optionele kleur)
const defaultConcepts = [
  {
    id: 'concept-gemaal',
    name: 'Gemaal',
    color: '#7dd3fc',
    howToUrl: '',
    categories: {
      basis: [
        { id: uid(), name: 'Friet', unit: 'doos', basePer100: 3 },
        { id: uid(), name: 'Mayonaise', unit: 'emmer', basePer100: 0.6 },
        { id: uid(), name: 'Ketchup', unit: 'emmer', basePer100: 0.3 },
        { id: uid(), name: 'Curry', unit: 'emmer', basePer100: 0.2 },
        { id: uid(), name: 'A13 bakjes', unit: 'stuks', basePer100: 100 },
        { id: uid(), name: 'Servetten', unit: 'pakken', basePer100: 0.2 },
        { id: uid(), name: 'Friet vorkjes', unit: 'stuks', basePer100: 100 },
      ],
      parmeTruff: [
        { id: uid(), name: 'Parmezaan', unit: 'kg', basePer100: 1 },
        { id: uid(), name: 'Truffel mayonaise', unit: 'emmer', basePer100: 1 },
        { id: uid(), name: 'Gehakte peterselie', unit: 'zak', basePer100: 1 },
      ],
      loadedKip: [
        { id: uid(), name: 'Hete kip (gaar)', unit: 'kg', basePer100: 3 },
        { id: uid(), name: 'Sriracha mayo', unit: 'emmer', basePer100: 1 },
        { id: uid(), name: 'Peterselie', unit: 'zak', basePer100: 1 },
      ],
      rendangStoof: [
        { id: uid(), name: 'Rendang', unit: 'kg', basePer100: 4 },
        { id: uid(), name: 'Uitjes', unit: 'kg', basePer100: 1 },
      ],
    },
  },
  {
    id: 'concept-pinsa',
    name: 'Pinsa',
    color: '#86efac',
    howToUrl: '',
    categories: {
      basis: [
        { id: uid(), name: 'Pinsa Bodem', unit: 'doos', basePer100: 3 },
        { id: uid(), name: 'Pizza saus mutti', unit: 'blik', basePer100: 8 },
        { id: uid(), name: 'Pizza kaas', unit: 'kg', basePer100: 7 },
        { id: uid(), name: 'Rucola', unit: 'zak', basePer100: 2 },
      ],
      caprese: [
        { id: uid(), name: 'Mozzarella', unit: 'kg', basePer100: 2 },
        { id: uid(), name: 'Pesto', unit: 'kg', basePer100: 1 },
        { id: uid(), name: 'Basilicum', unit: 'bos', basePer100: 1 },
        { id: uid(), name: 'Tomaten plak', unit: 'kg', basePer100: 2 },
      ],
      bbqKip: [
        { id: uid(), name: 'Hete kip', unit: 'kg', basePer100: 3 },
        { id: uid(), name: 'Paprika salade', unit: 'bak', basePer100: 1 },
        { id: uid(), name: 'Mais', unit: 'blik', basePer100: 2 },
        { id: uid(), name: 'Barbeque saus', unit: 'fles', basePer100: 1 },
      ],
      tuna: [
        { id: uid(), name: 'Tonijn salade', unit: 'bak', basePer100: 2 },
        { id: uid(), name: 'Rode ui fijn', unit: 'kg', basePer100: 1 },
        { id: uid(), name: 'Kappertjes', unit: 'pot', basePer100: 1 },
      ],
      cheeseOnion: [
        { id: uid(), name: 'Uien', unit: 'kg', basePer100: 2 },
        { id: uid(), name: 'Roomkaas', unit: 'kg', basePer100: 1 },
      ],
      carbonara: [
        { id: uid(), name: 'Bacon blokjes', unit: 'kg', basePer100: 2 },
        { id: uid(), name: 'Knoflook olie', unit: 'liter', basePer100: 1 },
        { id: uid(), name: 'Uien', unit: 'kg', basePer100: 1 },
        { id: uid(), name: 'Roomkaas', unit: 'kg', basePer100: 1 },
      ],
    },
  },
  { id: 'concept-bbq-stadslab', name: 'Barbeque Stadslab', color: '#fde68a', howToUrl: '', categories: { basis: [] } },
  { id: 'concept-storm', name: 'Storm', color: '#fca5a5', howToUrl: '', categories: { basis: [{ id: uid(), name: 'Couscous pot', unit: 'stuks', basePer100: 100 }] } },
  { id: 'concept-broodjes', name: 'Broodjes lunch', color: '#c4b5fd', howToUrl: '', categories: { basis: [] } },
  { id: 'concept-burger', name: 'Burger concept', color: '#99f6e4', howToUrl: '', categories: { basis: [] } },
];

const EMPTY_CONCEPT = {
  id: '__empty__',
  name: '(geen concept)',
  color: '#e2e8f0',
  categories: { basis: [] as Array<any> },
};

function computeScaledQty(basePer100: number, people: number) {
  const raw = (people / 100) * (basePer100 || 0);
  return { raw, shown: Math.ceil(raw) };
}
function labelForKey(key: string) {
  if (key === 'parmeTruff') return 'Parme/Truff';
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}
const normalizeColor = (v: string, fb = '#7dd3fc') =>
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : fb;
const keyFromLabel = (label: string) =>
  (label || '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .replace(/\s+(\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toLowerCase()) || 'nieuweCategorie';

// ---------------------------------------------
// Subcomponents (inline controls / admin)
// ---------------------------------------------
function InlineNumber({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number | string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      step={0.01}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-24 text-right border rounded-md px-2 py-1 ${
        disabled ? 'bg-slate-50 text-slate-500' : 'bg-white'
      }`}
    />
  );
}

function ConceptAdmin({
  concepts,
  onAdd,
  onRemove,
  onSelect,
  selectedId,
}: {
  concepts: any[];
  onAdd: (name: string, color: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId?: string;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7dd3fc');
  const [removeId, setRemoveId] = useState('');

  useEffect(() => {
    if (!removeId) setRemoveId(selectedId || '');
  }, [selectedId, removeId]);

  const handleRemove = () => {
    const idToRemove = removeId || selectedId || '';
    if (!idToRemove) return;
    const c = concepts.find((x) => x.id === idToRemove);
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
        <select
          className="w-full border rounded-md px-2 py-2"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
        >
          {concepts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="col-span-2">
          <Label>Naam nieuw concept</Label>
          <Input
            placeholder="Bijv. Tacos"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label>Kleur</Label>
          <input
            type="color"
            className="w-full h-10 border rounded"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <div className="col-span-3 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              onAdd(name, color);
              setName('');
            }}
          >
            + Concept toevoegen
          </Button>
        </div>
      </div>
      <div>
        <Label>Concept verwijderen</Label>
        <div className="flex gap-2 items-center">
          <select
            className="w-full border rounded-md px-2 py-2"
            value={removeId}
            onChange={(e) => setRemoveId(e.target.value)}
          >
            <option value="">
              (Gebruik selectie hierboven of kies hier)
            </option>
            {concepts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {(removeId || selectedId) && (
            <span
              style={{
                background:
                  concepts.find((c) => c.id === (removeId || selectedId))
                    ?.color || '#ccc',
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '1px solid #e5e7eb',
              }}
            />
          )}
          <Button
            variant="destructive"
            disabled={!(removeId || selectedId)}
            onClick={handleRemove}
          >
            Verwijderen
          </Button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Tip: je kunt gewoon de bovenste lijst gebruiken; de knop verwijdert de
          daar geselecteerde.
        </p>
      </div>
    </div>
  );
}

function CategoryAdmin({
  concept,
  optionKeys,
  addItem,
  keyFromLabel: kfl,
}: {
  concept: any;
  optionKeys: string[];
  addItem: (conceptId: string, catKey: string, item: any) => void;
  keyFromLabel: (s: string) => string;
}) {
  const [adminCatChoice, setAdminCatChoice] = useState('basis');
  const [adminNewCatLabel, setAdminNewCatLabel] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminUnit, setAdminUnit] = useState('');
  const [adminBase, setAdminBase] = useState('');

  return (
    <div className="space-y-2">
      <div>
        <Label>Categorie</Label>
        <select
          className="w-full border rounded-md px-2 py-2"
          value={adminCatChoice}
          onChange={(e) => setAdminCatChoice(e.target.value)}
        >
          <option value="basis">Basis</option>
          {optionKeys.map((k) => (
            <option key={k} value={k}>
              {labelForKey(k)}
            </option>
          ))}
          <option value="__new__">+ Nieuwe categorie…</option>
        </select>
      </div>
      {adminCatChoice === '__new__' && (
        <div>
          <Label>Naam nieuwe categorie</Label>
          <Input
            placeholder="Bijv. veganSpecial"
            value={adminNewCatLabel}
            onChange={(e) => setAdminNewCatLabel(e.target.value)}
          />
        </div>
      )}
      <div>
        <Label>Productnaam</Label>
        <Input
          placeholder="Bijv. Frietsaus"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
        />
      </div>
      <div>
        <Label>Eenheid</Label>
        <Input
          placeholder="kg / doos / stuks"
          value={adminUnit}
          onChange={(e) => setAdminUnit(e.target.value)}
        />
      </div>
      <div>
        <Label>Basis (per 100)</Label>
        <Input
          type="number"
          step={0.01}
          min={0}
          value={adminBase}
          onChange={(e) => setAdminBase(e.target.value)}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            const targetCat =
              adminCatChoice === '__new__'
                ? kfl(adminNewCatLabel || 'nieuw')
                : adminCatChoice;
            if (!targetCat) return;
            addItem(concept.id, targetCat, {
              name: adminName,
              unit: adminUnit,
              basePer100: adminBase,
            });
            setAdminName('');
            setAdminUnit('');
            setAdminBase('');
            if (adminCatChoice === '__new__') setAdminCatChoice(targetCat);
          }}
        >
          + Product toevoegen
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------
// Component: ConceptEditor (per concept)
// ---------------------------------------------
function ConceptEditor({
  concept,
  instance,
  onChange,
  colorIdx,
  isAdmin,
  updateItemBase,
  removeItem,
  removeCategory,
}: {
  concept: any;
  instance?: Instance;
  onChange?: (inst: Instance) => void;
  colorIdx: number;
  isAdmin: boolean;
  updateItemBase: (
    conceptId: string,
    categoryKey: string,
    itemId: string,
    newBase: number | string
  ) => void;
  removeItem: (conceptId: string, categoryKey: string, itemId: string) => void;
  removeCategory: (conceptId: string, catKey: string) => void;
}) {
  const defaultInst = useMemo<Instance>(
    () => ({ conceptId: concept.id, people: 0, enabledOptions: {}, optionWeights: {} }),
    [concept.id]
  );
  const inst = instance ?? defaultInst;

  useEffect(() => {
    if (!instance && onChange) onChange(defaultInst);
  }, [instance, defaultInst, onChange]);

  const optionKeys = useMemo(
    () => Object.keys(concept.categories || {}).filter((k) => k !== 'basis'),
    [concept]
  );

  useEffect(() => {
    const nextEnabled = { ...(inst.enabledOptions || {}) };
    const nextWeights = { ...(inst.optionWeights || {}) };
    optionKeys.forEach((k) => {
      if (!(k in nextEnabled)) nextEnabled[k] = false;
      if (!(k in nextWeights)) nextWeights[k] = 0;
    });
    onChange?.({ ...inst, enabledOptions: nextEnabled, optionWeights: nextWeights });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept.id]);

  const enabledOptions = inst.enabledOptions || {};
  const optionWeights = inst.optionWeights || {};

  const equalize = () => {
    const on = optionKeys.filter((k) => enabledOptions[k]);
    if (!on.length) return;
    if (on.length === 1)
      return onChange?.({
        ...inst,
        optionWeights: { ...optionWeights, [on[0]]: 100 },
      });
    const even = Number((100 / on.length).toFixed(2));
    const next: Record<string, number> = { ...optionWeights };
    on.forEach((k) => (next[k] = even));
    const sum = on.reduce((a, k) => a + (Number(next[k]) || 0), 0);
    const diff = Number((100 - sum).toFixed(2));
    if (Math.abs(diff) > 0.01) {
      const fix = on[0];
      next[fix] = Number(((Number(next[fix]) || 0) + diff).toFixed(2));
    }
    optionKeys.filter((k) => !enabledOptions[k]).forEach((k) => (next[k] = 0));
    onChange?.({ ...inst, optionWeights: next });
  };

  const setWeightLocked = (targetKey: string, vRaw: number) => {
    const on = optionKeys.filter((k) => enabledOptions[k]);
    if (!on.length) return;
    const v = Math.max(0, Math.min(100, Number(vRaw) || 0));
    if (on.length === 1)
      return onChange?.({
        ...inst,
        optionWeights: { ...optionWeights, [targetKey]: 100 },
      });

    const next: Record<string, number> = { ...optionWeights, [targetKey]: v };
    const others = on.filter((k) => k !== targetKey);
    let remaining = 100 - v;
    let totalOthers = others.reduce(
      (acc, k) => acc + (Number(optionWeights[k]) || 0),
      0
    );
    if (totalOthers <= 0) {
      const even = Number((remaining / others.length).toFixed(2));
      others.forEach((k) => (next[k] = even));
    } else {
      let assigned = 0;
      others.forEach((k, idx) => {
        if (idx === others.length - 1) {
          next[k] = Number((remaining - assigned).toFixed(2));
        } else {
          const share = (Number(optionWeights[k]) || 0) / totalOthers;
          const val = Number((remaining * share).toFixed(2));
          next[k] = val;
          assigned += val;
        }
      });
    }
    const sum = on.reduce((a, k) => a + (Number(next[k]) || 0), 0);
    const diff = Number((100 - sum).toFixed(2));
    if (Math.abs(diff) > 0.01) {
      const fix = others[0] ?? targetKey;
      next[fix] = Number(((Number(next[fix]) || 0) + diff).toFixed(2));
    }
    optionKeys.filter((k) => !enabledOptions[k]).forEach((k) => (next[k] = 0));
    onChange?.({ ...inst, optionWeights: next });
  };

  const normalizedWeights = useMemo(() => {
    const on = optionKeys.filter((k) => enabledOptions[k]);
    if (!on.length) return {} as Record<string, number>;

    const w: Record<string, number> = {};
    on.forEach((k) => {
      const raw = Number(optionWeights[k] ?? 0);
      w[k] = Number(raw.toFixed(2));
    });

    const values = Object.values(w) as number[];
    const sum = values.reduce((a: number, b: number) => a + b, 0);
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
    const combined: any[] = [
      ...basis.map((i: any) => ({
        ...i,
        __adjBasePer100: i.basePer100,
        __source: 'basis',
      })),
    ];
    enabled.forEach((k) => {
      const catItems = concept.categories?.[k] || [];
      const pct = Number(normalizedWeights[k]) || 0;
      catItems.forEach((i: any) =>
        combined.push({
          ...i,
          __adjBasePer100: (i.basePer100 || 0) * (pct / 100),
          __source: k,
        })
      );
    });
    return combined;
  }, [concept, normalizedWeights]);

  const optionKeysEnabled = optionKeys.filter((k) => enabledOptions[k]);
  const enabledWithPerc = optionKeysEnabled.map((k, i) => ({
    key: k,
    pct: Number(optionWeights[k] || 0),
    color: colors[(colorIdx + i) % colors.length],
  }));

  return (
    <Card className="mb-4 border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-800">
          {concept.name} – instellingen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aantal personen */}
        <div className="grid grid-cols-12 items-center gap-3">
          <Label
            htmlFor={`people-${concept.id}`}
            className="col-span-12 md:col-span-3 text-slate-700 md:text-right"
          >
            Aantal personen
          </Label>
          <div className="col-span-12 md:col-span-9">
            <Input
              id={`people-${concept.id}`}
              type="number"
              min={0}
              value={inst.people ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') return onChange?.({ ...inst, people: undefined });
                const n = Math.max(0, parseInt(v, 10) || 0);
                onChange?.({ ...inst, people: n });
              }}
              onBlur={() => {
                if (inst.people === undefined)
                  onChange?.({ ...inst, people: 0 });
              }}
              className="max-w-[220px]"
            />
          </div>
        </div>

        {/* Optionele gerechten */}
        <div className="pt-2 border-t border-slate-200">
          <p className="text-slate-700 mb-2 font-medium">Optionele gerechten</p>
          {optionKeys.length === 0 ? (
            <div className="text-sm text-slate-500">
              Geen optionele categorieën voor dit concept.
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {optionKeys.map((key) => (
                <Label key={key} className="flex items-center gap-2 text-slate-700">
                  <Checkbox
                    checked={!!enabledOptions[key]}
                    onCheckedChange={(v) =>
                      onChange?.({
                        ...inst,
                        enabledOptions: { ...enabledOptions, [key]: !!v },
                      })
                    }
                  />
                  {labelForKey(key)}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 px-2"
                      title="Categorie verwijderen"
                      onClick={() => {
                        if (
                          key !== 'basis' &&
                          confirm(`Categorie "${labelForKey(key)}" verwijderen?`)
                        )
                          removeCategory(concept.id, key);
                      }}
                    >
                      ×
                    </Button>
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
                  <span
                    key={key}
                    className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                    style={{ backgroundColor: '#eef2ff' }}
                  >
                    <span
                      style={{ background: color }}
                      className="h-2.5 w-2.5 rounded"
                    />
                    {labelForKey(key)}: <b>{Math.round(pct)}%</b>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={equalize}
                  className="border-slate-300"
                >
                  Gelijk verdelen
                </Button>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 mb-3 flex">
              {enabledWithPerc.map(({ key, pct, color }) => (
                <div
                  key={key}
                  className="h-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              ))}
            </div>
            <div className="space-y-3">
              {optionKeysEnabled.map((key, i) => (
                <div key={key} className="grid grid-cols-12 items-center gap-3">
                  <div className="col-span-4 text-sm text-slate-700">
                    {labelForKey(key)}
                  </div>
                  <div className="col-span-7">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Number(optionWeights[key] || 0)}
                      onChange={(e) =>
                        setWeightLocked(key, Number(e.target.value))
                      }
                      className="w-full"
                      style={{
                        accentColor: colors[(colorIdx + i) % colors.length],
                      }}
                    />
                  </div>
                  <div className="col-span-1 text-right text-sm tabular-nums">
                    {Math.round(Number(optionWeights[key] || 0))}%
                  </div>
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
              {items.map((item: any) => {
                const { shown } = computeScaledQty(
                  item.__adjBasePer100 ?? item.basePer100,
                  inst.people || 0
                );
                return (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-800">{item.name}</td>
                    <td className="text-right px-3 py-2 text-slate-700">
                      {item.unit}
                    </td>
                    <td className="text-right px-3 py-2 text-slate-700">
                      {isAdmin ? (
                        <InlineNumber
                          value={Number(item.basePer100 ?? 0)}
                          onChange={(val) =>
                            updateItemBase(
                              concept.id,
                              item.__source || 'basis',
                              item.id,
                              val
                            )
                          }
                          disabled={false}
                        />
                      ) : (
                        <>
                          {(
                            item.__adjBasePer100 ?? item.basePer100
                          ).toFixed
                            ? (item.__adjBasePer100 ?? item.basePer100).toFixed(
                                2
                              )
                            : item.__adjBasePer100 ?? item.basePer100}
                        </>
                      )}
                    </td>
                    <td className="text-right px-3 py-2 text-slate-800 font-medium">
                      {shown} {item.unit}
                    </td>
                    {isAdmin && (
                      <td className="text-center px-3 py-2">
                        <Button
                          variant="ghost"
                          className="text-red-600"
                          onClick={() =>
                            removeItem(
                              concept.id,
                              item.__source || 'basis',
                              item.id
                            )
                          }
                          title="Verwijderen"
                        >
                          ×
                        </Button>
                      </td>
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
export default function StadslabBackoffice() {
// Concepts (nu bewerkbaar + persist)
const [concepts, setConcepts] = useState(defaultConcepts);

// load once from localStorage on client
useEffect(() => {
  const s = storage.get(LS_CONCEPTS);
  if (s) {
    try { setConcepts(JSON.parse(s)); } catch {}
  }
}, []);

// persist when concepts change
useEffect(() => {
  storage.set(LS_CONCEPTS, JSON.stringify(concepts));
}, [concepts]);


 const [eventName, setEventName] = useState('Nieuw evenement');

useEffect(() => {
  const s = storage.get(LS_EVENT_NAME);
  if (s) setEventName(s);
}, []);

useEffect(() => {
  storage.set(LS_EVENT_NAME, eventName);
}, [eventName]);

const [instancesById, setInstancesById] = useState<Record<string, Instance>>({});

// load once from localStorage
useEffect(() => {
  const raw = storage.get(LS_EVENT_INST);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as Record<string, Instance>;
    const valid = new Set((concepts || []).map((c) => c.id));
    const cleaned = Object.fromEntries(
      Object.entries(parsed).filter(([k]) => valid.has(k))
    );
    setInstancesById(cleaned);
  } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// persist on change
useEffect(() => {
  storage.set(LS_EVENT_INST, JSON.stringify(instancesById));
}, [instancesById]);

// when concepts change, remove stale instances
useEffect(() => {
  const valid = new Set(concepts.map((c) => c.id));
  setInstancesById((prev) =>
    Object.fromEntries(Object.entries(prev).filter(([k]) => valid.has(k)))
  );
}, [concepts]);


  const activeConceptIds = useMemo(
    () => Object.keys(instancesById),
    [instancesById]
  );
  const isActive = (id: string) => activeConceptIds.includes(id);

  const toggleConcept = (conceptId: string) => {
    setInstancesById((prev) => {
      const next = { ...prev };
      if (next[conceptId]) delete next[conceptId];
      else
        next[conceptId] = {
          conceptId,
          people: 0,
          enabledOptions: {},
          optionWeights: {},
        };
      return next;
    });
  };
  const updateInstance = (conceptId: string, patch: Instance) =>
    setInstancesById((prev) => ({ ...prev, [conceptId]: patch }));

  const totalPeople = useMemo(
    () =>
      activeConceptIds.reduce((a, cid) => {
        const m = instancesById[cid];
        return a + Number(m?.people ?? 0);
      }, 0),
    [activeConceptIds, instancesById]
  );

  const setSplitByPerc = (cidTarget: string, pct: number) => {
    const total = Math.max(1, totalPeople);
    const targetAbs = Math.round((pct / 100) * total);

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

  const equalizeSplit = () => {
    if (!activeConceptIds.length) return;
    const total = Math.max(0, totalPeople);

    const even = activeConceptIds.length ? Math.floor(total / activeConceptIds.length) : 0;
    const leftover = total - even * activeConceptIds.length;

    setInstancesById((prev) => {
      const next: Record<string, Instance> = { ...(prev as Record<string, Instance>) };

      activeConceptIds.forEach((id, idx) => {
        const cur: Instance = (next[id] ?? {}) as Instance;
        const add = even + (idx < leftover ? 1 : 0);
        const base = Number(cur.people ?? 0);
        next[id] = { ...cur, people: base + add };
      });

      return next;
    });
  };

  const detailedPerConcept = useMemo(() => {
    return activeConceptIds.map((cid) => {
      const inst = instancesById[cid];
      const concept = concepts.find((c) => c.id === cid) || EMPTY_CONCEPT;
      const optionKeys = Object.keys(concept.categories || {}).filter(
        (k) => k !== 'basis'
      );
      const on = optionKeys.filter((k) => inst?.enabledOptions?.[k]);
      let w: Record<string, number> = {};
      if (on.length) {
        on.forEach(
          (k) => (w[k] = Number((Number(inst?.optionWeights?.[k]) || 0).toFixed(2)))
        );
        const sum = Object.values(w).reduce((a, b) => a + b, 0);
        const diff = Number((100 - sum).toFixed(2));
        if (Math.abs(diff) > 0.01) {
          const fix = on[0];
          w[fix] = Number(((w[fix] || 0) + diff).toFixed(2));
        }
      }
      const basis = concept.categories?.basis || [];
      const list: any[] = [];
      basis.forEach((i: any) =>
        list.push({
          id: i.id,
          name: i.name,
          unit: i.unit,
          basePer100: i.basePer100,
          source: { concept: concept.name, category: 'basis' },
        })
      );
      Object.keys(w).forEach((k) => {
        const pct = Number(w[k]) || 0;
        const catItems = concept.categories?.[k] || [];
        catItems.forEach((i: any) =>
          list.push({
            id: i.id,
            name: i.name,
            unit: i.unit,
            basePer100: (i.basePer100 || 0) * (pct / 100),
            source: { concept: concept.name, category: k },
          })
        );
      });
      const scaled = list.map((row) => {
        const { raw, shown } = computeScaledQty(row.basePer100, inst?.people || 0);
        return { ...row, qtyRaw: raw, qtyShown: shown };
      });
      return {
        conceptId: cid,
        conceptName: concept.name,
        people: inst?.people || 0,
        items: scaled,
      };
    });
  }, [activeConceptIds, instancesById, concepts]);

  const aggregated = useMemo(() => {
    const map = new Map<
      string,
      { name: string; unit: string; qtyRaw: number; sources: any[]; qtyShown?: number }
    >();
    detailedPerConcept.forEach((block) => {
      block.items.forEach((it: any) => {
        const key = `${it.name}||${it.unit}`;
        if (!map.has(key))
          map.set(key, { name: it.name, unit: it.unit, qtyRaw: 0, sources: [] });
        const rec = map.get(key)!;
        rec.qtyRaw += it.qtyRaw;
        rec.sources.push({
          concept: block.conceptName,
          category: it.source.category,
          qtyRaw: it.qtyRaw,
        });
      });
    });
    const rows = Array.from(map.values()).map((r) => ({
      ...r,
      qtyShown: Math.ceil(r.qtyRaw),
    }));
    rows.sort((a, b) => a.name.localeCompare(b.name) || a.unit.localeCompare(b.unit));
    return rows;
  }, [detailedPerConcept]);

  // ------------------- Admin: state + handlers -------------------
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_FLAG) === '1';
    } catch {
      return false;
    }
  });
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(true);

  const submitLogin = useCallback(() => {
    if (password === ADMIN_PASS) {
      setIsAdmin(true);
      setShowAdminPanel(true);
      try {
        localStorage.setItem(ADMIN_FLAG, '1');
      } catch {}
      setShowLogin(false);
      setPassword('');
    } else alert('Onjuist wachtwoord');
  }, [password]);
  const doLogout = useCallback(() => {
    setIsAdmin(false);
    try {
      localStorage.removeItem(ADMIN_FLAG);
    } catch {}
  }, []);

  // CRUD helpers
  const ensureCategory = (c: any, catKey: string) => {
    const cats = { ...c.categories };
    if (!cats[catKey]) cats[catKey] = [];
    return cats;
  };
  const addItem = (conceptId: string, catKey: string, item: any) => {
    setConcepts((prev) =>
      prev.map((c) => {
        if (c.id !== conceptId) return c;
        const cats = ensureCategory(c, catKey);
        const list = [...cats[catKey]];
        list.push({
          id: uid(),
          name: item.name?.trim() || 'Nieuw product',
          unit: item.unit?.trim() || 'stuks',
          basePer100: Math.max(0, Number(item.basePer100) || 0),
        });
        cats[catKey] = list;
        return { ...c, categories: cats };
      })
    );
  };
  const removeItem = (conceptId: string, catKey: string, itemId: string) => {
    setConcepts((prev) =>
      prev.map((c) => {
        if (c.id !== conceptId) return c;
        const cats = { ...c.categories };
        cats[catKey] = (cats[catKey] || []).filter((i: any) => i.id !== itemId);
        return { ...c, categories: cats };
      })
    );
  };
  const updateItemBase = (
    conceptId: string,
    categoryKey: string,
    itemId: string,
    newBase: number | string
  ) => {
    setConcepts((prev) =>
      prev.map((c) => {
        if (c.id !== conceptId) return c;
        const cats = { ...c.categories };
        const list = [...(cats[categoryKey] || [])];
        const idx = list.findIndex((i: any) => i.id === itemId);
        if (idx !== -1) {
          const nb = Math.max(0, Number(newBase) || 0);
          list[idx] = { ...list[idx], basePer100: nb };
          cats[categoryKey] = list;
        }
        return { ...c, categories: cats };
      })
    );
  };
  const removeCategory = (conceptId: string, catKey: string) => {
    if (catKey === 'basis') return;
    setConcepts((prev) =>
      prev.map((c) => {
        if (c.id !== conceptId) return c;
        const cats = { ...c.categories };
        delete cats[catKey];
        return { ...c, categories: cats };
      })
    );
  };
  const addConcept = (name: string, color: string) => {
    const n = (name || '').trim() || 'Nieuw concept';
    const col = normalizeColor(color, '#7dd3fc');
    const c = { id: uid(), name: n, color: col, howToUrl: '', categories: { basis: [] } };
    setConcepts((prev) => [...prev, c]);
  };
  const removeConcept = (id: string) => {
    setConcepts((prev) => prev.filter((c) => c.id !== id));
    setInstancesById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // UI state
  const [activeTab, setActiveTab] = useState('totaal');
  useEffect(() => {
    if (activeTab !== 'totaal' && !activeConceptIds.includes(activeTab))
      setActiveTab(activeConceptIds[0] || 'totaal');
  }, [activeConceptIds, activeTab]);

  const handlePrint = () => window.print();

  // data voor verdeling
  const splitData = useMemo(() => {
    const total = Math.max(1, totalPeople);
    return activeConceptIds.map((cid, idx) => {
      const people = Number(instancesById[cid]?.people) || 0;
      return {
        cid,
        name: concepts.find((c) => c.id === cid)?.name || 'Concept',
        people,
        pct: Math.round((people / total) * 100),
        color: colors[idx % colors.length],
      };
    });
  }, [activeConceptIds, instancesById, totalPeople, concepts]);

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 ${
        isAdmin && showAdminPanel ? 'pr-96' : ''
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-6xl bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 border border-slate-200"
      >
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Stadslab" className="h-8 w-8 rounded" />
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Stadslab Backoffice
              </h1>
              <div className="text-xs text-slate-500">
                {UI_BUILD_VERSION} — {eventName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              Print
            </Button>
            {!isAdmin ? (
              <Button variant="outline" onClick={() => setShowLogin(true)}>
                Admin login
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowAdminPanel((v) => !v)}
                >
                  {showAdminPanel ? 'Paneel sluiten' : 'Paneel openen'}
                </Button>
                <Button variant="ghost" onClick={doLogout}>
                  Uitloggen
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="totaal">Totaal</TabsTrigger>
            {concepts.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Totaal tab */}
          <TabsContent value="totaal">
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-800">
                  Overzicht & verdeling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Actieve concepten toggles */}
                <div className="flex flex-wrap gap-2">
                  {concepts.map((c, i) => {
                    const active = isActive(c.id);
                    return (
                      <Button
                        key={c.id}
                        variant={active ? 'default' : 'outline'}
                        onClick={() => toggleConcept(c.id)}
                        style={{
                          background: active ? c.color : undefined,
                          color: active ? '#1f2937' : undefined,
                        }}
                      >
                        {c.name}
                      </Button>
                    );
                  })}
                </div>

                {/* People verdelen */}
                {activeConceptIds.length > 0 && (
                  <div className="rounded-xl border p-3 bg-white/70">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-slate-700">
                        Totaal personen:{' '}
                        <b className="tabular-nums">{totalPeople}</b>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={equalizeSplit}>
                          Verdeel gelijk
                        </Button>
                      </div>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 mb-3 flex">
                      {splitData.map((row) => (
                        <div
                          key={row.cid}
                          className="h-full"
                          style={{
                            width: `${row.pct}%`,
                            background: row.color,
                          }}
                          title={`${row.name}: ${row.pct}%`}
                        />
                      ))}
                    </div>

                    <div className="space-y-2">
                      {splitData.map((row) => (
                        <div
                          key={row.cid}
                          className="grid grid-cols-12 items-center gap-3"
                        >
                          <div className="col-span-4 text-sm text-slate-700">
                            {row.name}
                          </div>
                          <div className="col-span-7">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={row.pct}
                              onChange={(e) =>
                                setSplitByPerc(row.cid, Number(e.target.value))
                              }
                              className="w-full"
                              style={{ accentColor: row.color }}
                            />
                          </div>
                          <div className="col-span-1 text-right text-sm tabular-nums">
                            {row.pct}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aggregaat tabel */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                      <tr>
                        <th className="text-left px-3 py-2">Product</th>
                        <th className="text-right px-3 py-2">Eenheid</th>
                        <th className="text-right px-3 py-2">Benodigd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregated.map((r) => (
                        <tr key={`${r.name}-${r.unit}`} className="border-b">
                          <td className="px-3 py-2">{r.name}</td>
                          <td className="text-right px-3 py-2">{r.unit}</td>
                          <td className="text-right px-3 py-2 font-medium">
                            {r.qtyShown}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Concept tabs */}
          {concepts.map((c, idx) => (
            <TabsContent key={c.id} value={c.id}>
              <ConceptEditor
                concept={c}
                instance={instancesById[c.id]}
                onChange={(inst) => updateInstance(c.id, inst)}
                colorIdx={idx}
                isAdmin={isAdmin}
                updateItemBase={updateItemBase}
                removeItem={removeItem}
                removeCategory={removeCategory}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Login modal */}
        {showLogin && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowLogin(false)}
          >
            <div
              className="bg-white rounded-xl shadow-xl p-6 w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Admin login</h2>
                <button
                  className="text-slate-500"
                  onClick={() => setShowLogin(false)}
                  aria-label="Sluiten"
                >
                  ×
                </button>
              </div>

              <Input
                type="password"
                placeholder="Wachtwoord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitLogin()}
              />

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLogin(false)}>
                  Annuleren
                </Button>
                <Button onClick={submitLogin} className="bg-emerald-600 text-white">
                  Inloggen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Admin zijpaneel */}
        {isAdmin && showAdminPanel && (
          <Card className="fixed top-0 right-0 h-screen w-96 rounded-none border-l shadow-xl bg-white z-40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="font-semibold">Admin-paneel</div>
              <Button
                variant="ghost"
                onClick={() => setShowAdminPanel(false)}
                title="Paneel sluiten"
                className="text-slate-500 px-2"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              <section className="space-y-2">
                <h4 className="font-semibold">Concepten</h4>
                <ConceptAdmin
                  concepts={concepts}
                  onAdd={addConcept}
                  onRemove={removeConcept}
                  onSelect={(id) => {
                    if (!isActive(id)) toggleConcept(id);
                  }}
                  selectedId={activeConceptIds[0] || concepts[0]?.id}
                />
              </section>

              <hr className="border-slate-200" />

              <section className="space-y-2">
                <h4 className="font-semibold">Producten</h4>
                {activeConceptIds.length ? (
                  <CategoryAdmin
                    optionKeys={Object.keys(
                      (concepts.find((c) => c.id === activeConceptIds[0]) ||
                        EMPTY_CONCEPT).categories || {}
                    ).filter((k) => k !== 'basis')}
                    addItem={addItem}
                    keyFromLabel={keyFromLabel}
                    concept={
                      concepts.find((c) => c.id === activeConceptIds[0]) ||
                      EMPTY_CONCEPT
                    }
                  />
                ) : (
                  <div className="text-sm text-slate-500">
                    Activeer eerst een concept om producten toe te voegen.
                  </div>
                )}
              </section>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
