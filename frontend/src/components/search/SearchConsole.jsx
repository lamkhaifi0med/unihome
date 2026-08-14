/**
 * SearchConsole — "La Ligne de Commande".
 * The search is authored as a command issued to the verification machine:
 * editable pill controls compose a live mono query line, and a natural-
 * language input fills the same tokens. Interpretation is AI-backed
 * (Gemini via /api/annonces/recherche/interpret, validated against the
 * real catalogue server-side); a deterministic catalogue parser remains
 * as the offline fallback — either way, only real values can be chosen.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  Check,
  ChevronDown,
  GraduationCap,
  Home,
  Loader2,
  MapPin,
  Route,
  Search,
  Sparkles,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { searchApi } from "../../api/searchApi";

const TYPES = [
  { value: "STUDIO", label: "Studio" },
  { value: "CHAMBRE", label: "Chambre" },
  { value: "APPARTEMENT", label: "Appartement" },
  { value: "COLOCATION", label: "Colocation" },
];

const RAYONS = [
  { value: "1000", label: "1 km" },
  { value: "2000", label: "2 km" },
  { value: "3000", label: "3 km" },
  { value: "5000", label: "5 km" },
  { value: "8000", label: "8 km" },
  { value: "10000", label: "10 km" },
];

/** Deterministic parser: only matches values that exist in the catalogue. */

/* fold accents + case so "près de l'ENIAD" matches "ENIAD" */
const fold = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/* Levenshtein distance capped at 2 — tolerates "marrakesh"→"marrakech" */
function editDistance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const STOPWORDS = new Set([
  "universite",
  "university",
  "ecole",
  "institut",
  "faculte",
  "superieure",
  "nationale",
  "internationale",
  "de",
  "des",
  "du",
  "la",
  "le",
  "les",
]);

/* does token appear (exactly or within edit distance) among query words? */
function tokenInQuery(token, qWords) {
  const tol = token.length >= 6 ? 2 : token.length >= 4 ? 1 : 0;
  return qWords.some(
    (w) => w === token || (tol > 0 && editDistance(w, token, tol) <= tol),
  );
}

export function parseQuery(text, { universites, cityOptions, equipements }) {
  const q = fold(text);
  const qWords = q.split(/[^a-z0-9]+/).filter(Boolean);
  const out = {};

  const budget = q.match(/(\d[\d\s]{2,6})\s*(?:dh|dhs|mad|dirhams?)/i);
  if (budget) out.budgetMax = budget[1].replace(/\s/g, "");

  const surface = q.match(/(\d{2,3})\s*m(?:²|2)/i);
  if (surface) out.surfaceMin = surface[1];

  for (const t of TYPES) {
    if (q.includes(fold(t.label))) {
      out.type = t.value;
      break;
    }
  }

  /* Campus: every significant token of the name (sigle + distinctive words)
     must appear in the query, with small typo tolerance. Most specific wins. */
  let best = null;
  let bestScore = 0;
  for (const u of universites) {
    const tokens = [
      ...new Set(
        `${u.sigle || ""} ${u.nom || ""} ${u.ville || ""}`
          .split(/[^a-zA-Z0-9\u00c0-\u017f]+/)
          .map(fold)
          .filter((t) => t.length >= 2 && !STOPWORDS.has(t)),
      ),
    ];
    if (tokens.length === 0) continue;
    const matched = tokens.filter((t) => tokenInQuery(t, qWords));
    /* require at least the campus "brand" token(s): 2+ matches, or a single
       distinctive token when that's all the name has */
    const enough =
      matched.length >= 2 || (tokens.length === 1 && matched.length === 1);
    if (enough && matched.length > bestScore) {
      best = u;
      bestScore = matched.length;
    }
  }
  if (best) {
    out.universiteId = String(best.id);
    out.ville = best.ville || "";
  } else {
    const ville = cityOptions.find((c) => tokenInQuery(fold(c), qWords));
    if (ville) out.ville = ville;
  }

  const eq = (equipements || [])
    .map((e) => e.libelle || e)
    .filter((label) => q.includes(fold(label)));
  if (eq.length) out.equipements = eq;

  return out;
}

const chipBase =
  "inline-flex h-9 items-center gap-1.5 rounded-full border text-[13px] font-medium transition-colors focus-within:ring-2 focus-within:ring-blue-500/30";
const chipIdle =
  "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600";
const chipActive =
  "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200";

/**
 * MenuChip — a chip that opens a Control Room dropdown panel.
 * Native <option> can't be styled, so the menu is a real popover:
 * white hairline card, float shadow, checked row, optional mono values.
 */
function MenuChip({
  icon: Icon,
  value,
  onChange,
  placeholder,
  options = [],
  mono = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => String(o.value) === String(value));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${chipBase} ${value ? chipActive : chipIdle} cursor-pointer px-3`}
      >
        <Icon
          className="h-3.5 w-3.5 flex-shrink-0 opacity-70"
          strokeWidth={2}
        />
        <span
          className={`max-w-[160px] truncate ${current && mono ? "font-mono text-[12.5px] tabular-nums" : ""} ${current ? "" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          {current ? current.label : placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 flex-shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={placeholder}
          className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-72 w-max min-w-[220px] max-w-[300px] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(9,9,11,0.35)] dark:border-zinc-700 dark:bg-zinc-900"
        >
          <p className="select-none px-2.5 pb-1 pt-1.5 font-mono text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {placeholder}
          </p>
          {value && (
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <X className="h-3.5 w-3.5" />
              Effacer
            </button>
          )}
          {options.map((o) => {
            const active = String(o.value) === String(value);
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(String(o.value));
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                  active
                    ? "bg-blue-50 font-semibold text-blue-800 dark:bg-blue-500/10 dark:text-blue-200"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="min-w-0">
                  <span
                    className={`block truncate ${mono ? "font-mono text-[12.5px] tabular-nums" : ""}`}
                  >
                    {o.label}
                  </span>
                  {o.hint && (
                    <span className="block truncate font-mono text-[10.5px] text-zinc-400 dark:text-zinc-500">
                      {o.hint}
                    </span>
                  )}
                </span>
                {active && (
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NumberChip({
  icon: Icon,
  value,
  onChange,
  placeholder,
  suffix,
  width = "w-24",
}) {
  return (
    <label
      className={`${chipBase} ${value ? chipActive : chipIdle} cursor-text px-3`}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-70" strokeWidth={2} />
      <input
        type="number"
        min="0"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${width} bg-transparent font-mono text-[13px] tabular-nums outline-none placeholder:font-geist placeholder:text-zinc-400 dark:placeholder:text-zinc-500`}
        aria-label={placeholder}
      />
      {value && (
        <span className="font-mono text-[11px] text-zinc-400">{suffix}</span>
      )}
    </label>
  );
}

export default function SearchConsole({
  universites = [],
  cityOptions = [],
  equipements = [],
  initialFilters,
  loading = false,
  onSearch,
  onLiveChange,
}) {
  const [filters, setFilters] = useState({
    ville: "",
    universiteId: "",
    budgetMax: "",
    surfaceMin: "",
    type: "",
    rayon: "5000",
    equipements: [],
    ...initialFilters,
  });
  const [nl, setNl] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [showEquip, setShowEquip] = useState(false);

  /* stay in sync with the page: when the map's radius commander (or any
     external control) commits new filters, the chips echo them */
  useEffect(() => {
    if (!initialFilters) return;
    setFilters((cur) => {
      const changed = Object.keys(initialFilters).some(
        (k) => String(initialFilters[k] ?? "") !== String(cur[k] ?? ""),
      );
      return changed ? { ...cur, ...initialFilters } : cur;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters]);

  const campus = useMemo(
    () =>
      universites.find((u) => String(u.id) === String(filters.universiteId)) ||
      null,
    [universites, filters.universiteId],
  );

  const set = (key, value) => {
    setFilters((cur) => {
      const next = { ...cur, [key]: value };
      if (key === "universiteId" && value) {
        const u = universites.find((x) => String(x.id) === String(value));
        if (u?.ville) next.ville = u.ville;
      }
      if (key === "ville" && campus && campus.ville !== value) {
        next.universiteId = "";
      }
      /* the map ring reacts immediately to campus/rayon changes */
      if (key === "rayon" || key === "universiteId" || key === "ville") {
        onLiveChange?.(next);
      }
      return next;
    });
  };

  const toggleEquip = (label) =>
    setFilters((cur) => ({
      ...cur,
      equipements: cur.equipements.includes(label)
        ? cur.equipements.filter((e) => e !== label)
        : [...cur.equipements, label],
    }));

  const launch = (override) => onSearch?.(override || filters);

  /* AI-backed interpretation (Gemini via /api/annonces/recherche/interpret);
     the deterministic catalogue parser stays as the offline fallback. */
  const handleNl = async () => {
    if (!nl.trim() || interpreting) return;
    setInterpreting(true);
    let parsed = null;
    try {
      const { data } = await searchApi.interpret(nl.trim());
      parsed = {};
      if (data.universiteId) parsed.universiteId = String(data.universiteId);
      if (data.ville) parsed.ville = data.ville;
      if (data.budgetMax) parsed.budgetMax = String(data.budgetMax);
      if (data.surfaceMin) parsed.surfaceMin = String(data.surfaceMin);
      if (data.type) parsed.type = data.type;
      if (data.rayon) parsed.rayon = String(data.rayon);
      if (data.equipements?.length) parsed.equipements = data.equipements;
      if (Object.keys(parsed).length === 0) parsed = null;
    } catch {
      parsed = null;
    }
    if (!parsed) {
      parsed = parseQuery(nl, { universites, cityOptions, equipements });
    }
    setInterpreting(false);
    const next = { ...filters, ...parsed };
    setFilters(next);
    launch(next);
  };

  /* Live query line — the machine echoes the command it will run. */
  const tokens = [];
  if (campus) tokens.push(["campus", campus.sigle || campus.nom]);
  else if (filters.ville) tokens.push(["ville", filters.ville]);
  if (campus)
    tokens.push(["rayon", `≤${(Number(filters.rayon) / 1000).toFixed(0)}km`]);
  if (filters.budgetMax)
    tokens.push([
      "budget",
      `≤${Number(filters.budgetMax).toLocaleString("fr-FR")}DH`,
    ]);
  if (filters.type) tokens.push(["type", filters.type.toLowerCase()]);
  if (filters.surfaceMin) tokens.push(["surface", `≥${filters.surfaceMin}m²`]);
  if (filters.equipements.length)
    tokens.push(["équip", filters.equipements.join(",").toLowerCase()]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_60px_-30px_rgba(9,9,11,0.25)] dark:border-zinc-800 dark:bg-zinc-900">
      {/* Query line — mono readout of the command being composed */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-t-2xl border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-950 [scrollbar-width:none]">
        <span className="select-none text-blue-600 dark:text-blue-400">$</span>
        <span className="text-zinc-500 dark:text-zinc-400">recherche</span>
        {tokens.length === 0 && (
          <span className="text-zinc-300 dark:text-zinc-600">
            — toutes les annonces validées
          </span>
        )}
        {tokens.map(([k, v]) => (
          <span key={k} className="whitespace-nowrap">
            <span className="text-zinc-400 dark:text-zinc-500">{k}:</span>
            <span className="font-medium text-zinc-900 tabular-nums dark:text-zinc-100">
              {v}
            </span>
          </span>
        ))}
        <span
          className="ml-0.5 inline-block h-3.5 w-[7px] flex-shrink-0 animate-pulse bg-blue-600/80 dark:bg-blue-400/80 motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>

      <div className="p-4 sm:p-5">
        {/* Chip controls */}
        <div className="flex flex-wrap items-center gap-2">
          <MenuChip
            icon={GraduationCap}
            value={filters.universiteId}
            onChange={(v) => set("universiteId", v)}
            placeholder="Campus"
            options={universites.map((u) => ({
              value: u.id,
              label: u.sigle || u.nom,
              hint: u.ville,
            }))}
          />

          <MenuChip
            icon={MapPin}
            value={filters.ville}
            onChange={(v) => set("ville", v)}
            placeholder="Ville"
            options={cityOptions.map((c) => ({ value: c, label: c }))}
          />

          {campus && (
            <MenuChip
              icon={Route}
              value={filters.rayon}
              onChange={(v) => set("rayon", v)}
              placeholder="Rayon"
              mono
              options={RAYONS.map((r) => ({
                value: r.value,
                label: `Rayon ${r.label}`,
              }))}
            />
          )}

          <NumberChip
            icon={Banknote}
            value={filters.budgetMax}
            onChange={(e) => set("budgetMax", e.target.value)}
            placeholder="Budget max"
            suffix="DH"
          />

          <MenuChip
            icon={Home}
            value={filters.type}
            onChange={(v) => set("type", v)}
            placeholder="Type"
            options={TYPES}
          />

          <NumberChip
            icon={SlidersHorizontal}
            value={filters.surfaceMin}
            onChange={(e) => set("surfaceMin", e.target.value)}
            placeholder="Surface min"
            suffix="m²"
            width="w-24"
          />

          <button
            type="button"
            onClick={() => setShowEquip((v) => !v)}
            aria-expanded={showEquip}
            className={`${chipBase} px-3 ${filters.equipements.length ? chipActive : chipIdle}`}
          >
            Équipements
            {filters.equipements.length > 0 && (
              <span className="rounded-full bg-blue-600 px-1.5 py-px font-mono text-[10px] font-semibold text-white">
                {filters.equipements.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => launch()}
            disabled={loading}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700 disabled:opacity-60"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
            {loading ? "Recherche…" : "Lancer"}
          </button>
        </div>

        {/* Equipment tray */}
        {showEquip && (
          <div className="mt-3 flex flex-wrap gap-1.5 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            {equipements.map((e) => {
              const label = e.libelle || e;
              const on = filters.equipements.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleEquip(label)}
                  aria-pressed={on}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    on
                      ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  {on && <X className="h-3 w-3" />}
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Natural-language alternative */}
        <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <input
            type="text"
            value={nl}
            onChange={(e) => setNl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNl()}
            placeholder={
              typeof window !== "undefined" && window.innerWidth < 640
                ? "Décrivez votre recherche…"
                : "Ou décrivez : « studio meublé avec wifi à 2000 dh près de l'ENIAD »"
            }
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            aria-label="Recherche en langage naturel"
          />
          <button
            type="button"
            onClick={handleNl}
            disabled={!nl.trim() || loading || interpreting}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-500/50 dark:hover:text-blue-300"
          >
            {interpreting && (
              <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
            )}
            {interpreting ? "Interprétation…" : "Interpréter"}
          </button>
        </div>
      </div>
    </section>
  );
}
