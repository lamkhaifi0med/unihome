/*
THESIS: Search is a command issued to the verification machine, not a form above a list —
refuses the category's filter-sidebar + card-grid default.
OWN-WORLD: Control Room (Soft-depth SaaS): #fafafa ground, white hairline cards, one blue-600
accent, JetBrains Mono as the machine's voice, verdict colors earned by score thresholds.
STORY: the student composes criteria as chips, watches the mono query line echo the command,
launches, then steers the radius ring on the map and the trust lens — list, map and count
react as one instrument.
FIRST VIEWPORT: query-line console on top; below, list rows (left) and the campus map with
draggable radius ring (right) at 50/50; result count + trust lens on the list header.
FORM: candidate 6 of the grounded list — "the synchronized instrument"; seed f66ed5f9.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
the verdict, and DESIGN.md.
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2, Map as MapIcon, SearchX, X } from "lucide-react";
import SearchConsole from "../../components/search/SearchConsole";
import ResultRow from "../../components/search/ResultRow";
import CommandMap from "../../components/search/CommandMap";
import TrustLens from "../../components/search/TrustLens";
import { ownerApi } from "../../api/ownerApi";
import { searchApi } from "../../api/searchApi";

const PAGE_SIZE = 12;

function normalizePageResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function sortAnnonces(items, sortBy) {
  return [...items].sort((a, b) => {
    if (sortBy === "prix-asc")
      return Number(a.loyer || 0) - Number(b.loyer || 0);
    if (sortBy === "prix-desc")
      return Number(b.loyer || 0) - Number(a.loyer || 0);
    if (sortBy === "score")
      return Number(b.scoreConfiance || 0) - Number(a.scoreConfiance || 0);
    return (
      Number(a.distanceMetres ?? Infinity) -
      Number(b.distanceMetres ?? Infinity)
    );
  });
}

function filterAnnonces(items, filters) {
  return items.filter((annonce) => {
    if (annonce.statut !== "VALIDEE") return false;
    if (filters.ville && annonce.ville !== filters.ville) return false;
    if (
      filters.budgetMax &&
      Number(annonce.loyer || 0) > Number(filters.budgetMax)
    )
      return false;
    if (
      filters.surfaceMin &&
      Number(annonce.superficie || 0) < Number(filters.surfaceMin)
    )
      return false;
    if (filters.type && annonce.typeLogement !== filters.type) return false;
    if (filters.equipements?.length) {
      const available = annonce.equipements || [];
      return filters.equipements.every((e) => available.includes(e));
    }
    return true;
  });
}

const SORTS = [
  { value: "distance", label: "Distance" },
  { value: "prix-asc", label: "Prix ↑" },
  { value: "prix-desc", label: "Prix ↓" },
  { value: "score", label: "Score IA" },
];

export default function SearchPage({
  defaultSearched = false,
  title = "Rechercher un logement",
}) {
  const [searchParams] = useSearchParams();
  const [universites, setUniversites] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({
    ville: searchParams.get("ville") || "",
    universiteId: searchParams.get("universiteId") || "",
    budgetMax: searchParams.get("budgetMax") || "",
    surfaceMin: searchParams.get("surfaceMin") || "",
    type: searchParams.get("type") || "",
    rayon: searchParams.get("rayon") || "5000",
    equipements: [],
  });
  const [searched, setSearched] = useState(
    defaultSearched || Boolean(searchParams.toString()),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("distance");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState(null);
  const [minScore, setMinScore] = useState(0);
  const [mobileMap, setMobileMap] = useState(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const cityOptions = useMemo(
    () =>
      [...new Set(universites.map((u) => u.ville).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [universites],
  );

  const selectedCampus = useMemo(
    () =>
      universites.find((u) => String(u.id) === String(filters.universiteId)) ||
      null,
    [universites, filters.universiteId],
  );

  const sortedResults = useMemo(
    () => sortAnnonces(results, sortBy),
    [results, sortBy],
  );
  /* trust lens: rows below threshold dim but stay — the count is honest */
  const lensResults = useMemo(
    () =>
      sortedResults.map((a) => ({
        annonce: a,
        dimmed: Number(a.scoreConfiance || 0) < minScore,
      })),
    [sortedResults, minScore],
  );
  const passingCount = lensResults.filter((r) => !r.dimmed).length;
  const visibleResults = lensResults.slice(0, visibleCount);
  const hasMore = visibleCount < lensResults.length;
  const mapAnnonces = useMemo(
    () =>
      sortedResults.filter((a) => Number(a.scoreConfiance || 0) >= minScore),
    [sortedResults, minScore],
  );

  const runSearch = async (nextFilters, keepSilent = false) => {
    if (!keepSilent) setSearched(true);
    setLoading(true);
    setError(null);
    setSelectedId(null);
    setVisibleCount(PAGE_SIZE);
    try {
      const response = nextFilters.universiteId
        ? await searchApi.searchNearUniversity({
            universiteId: nextFilters.universiteId,
            rayon: nextFilters.rayon || 5000,
            page: 0,
            size: 120,
          })
        : await searchApi.getAnnonces();
      setResults(
        filterAnnonces(normalizePageResponse(response.data), nextFilters),
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "La recherche est actuellement indisponible. Veuillez réessayer plus tard.",
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [universitesRes, equipementsRes] = await Promise.all([
          ownerApi.getUniversites(),
          ownerApi.getEquipements(),
        ]);
        if (!mounted) return;
        setUniversites(universitesRes.data || []);
        setEquipements(equipementsRes.data || []);
        await runSearch(filtersRef.current, !searched);
      } catch (err) {
        if (mounted) {
          setError(
            err?.response?.data?.detail ||
              "Impossible de charger les annonces.",
          );
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (nextFilters) => {
    setFilters(nextFilters);
    runSearch(nextFilters);
  };

  /* the radius commander commits a new rayon → same pipeline as the console */
  const handleRayonCommit = (meters) => {
    const next = { ...filtersRef.current, rayon: String(meters) };
    setFilters(next);
    runSearch(next);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 font-geist sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Annonces validées par l'IA, ancrées sur votre campus — composez votre
          commande.
        </p>
      </div>

      <SearchConsole
        universites={universites}
        cityOptions={cityOptions}
        equipements={equipements}
        initialFilters={filters}
        loading={loading}
        onSearch={handleSearch}
        onLiveChange={setFilters}
      />

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Theater: list ⇄ map */}
      <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
        {/* ——— list column ——— */}
        <section className="min-w-0">
          {/* list header: honest count + trust lens + sort */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {loading ? (
                "recherche en cours…"
              ) : (
                <>
                  <span className="font-semibold text-zinc-950 tabular-nums dark:text-zinc-50">
                    {passingCount}
                  </span>
                  {minScore > 0 && (
                    <span className="text-zinc-400 dark:text-zinc-500">
                      /{sortedResults.length}
                    </span>
                  )}{" "}
                  annonce{passingCount > 1 ? "s" : ""}
                  {minScore > 0 && ` · score ≥ ${minScore}`}
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <TrustLens
                value={minScore}
                onChange={setMinScore}
                distribution={sortedResults.map((a) =>
                  Number(a.scoreConfiance || 0),
                )}
              />
              <div className="flex overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSortBy(s.value)}
                    aria-pressed={sortBy === s.value}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      sortBy === s.value
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-white text-zinc-600 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="h-24 w-28 animate-pulse rounded-xl bg-zinc-100 sm:h-28 sm:w-40 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-2/3 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : !searched ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-20 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Composez votre commande
              </p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
                Campus, budget, rayon — ou décrivez ce que vous cherchez en une
                phrase.
              </p>
            </div>
          ) : sortedResults.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-20 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <SearchX className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" />
              <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Aucun résultat pour cette commande
              </p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
                Élargissez le rayon sur la carte, augmentez le budget ou changez
                de ville.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {visibleResults.map(({ annonce, dimmed }) => (
                  <ResultRow
                    key={annonce.id}
                    annonce={annonce}
                    dimmed={dimmed}
                    onHover={() => setSelectedId(annonce.id)}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:shadow-[0_8px_24px_-12px_rgba(9,9,11,0.2)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600"
                  >
                    Afficher plus ({lensResults.length - visibleCount})
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ——— map column (desktop) ——— */}
        <div className="sticky top-6 hidden h-[calc(100vh-8rem)] min-h-[480px] lg:block">
          <CommandMap
            annonces={mapAnnonces}
            campus={selectedCampus}
            rayon={Number(filters.rayon)}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRayonCommit={handleRayonCommit}
            searching={loading}
          />
        </div>
      </div>

      {/* ——— mobile map toggle ——— */}
      <button
        type="button"
        onClick={() => setMobileMap(true)}
        className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_48px_-12px_rgba(9,9,11,0.5)] lg:hidden dark:bg-zinc-100 dark:text-zinc-900"
      >
        <MapIcon className="h-4 w-4" />
        Carte
      </button>
      {mobileMap && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
              Carte campus
            </p>
            <button
              type="button"
              onClick={() => setMobileMap(false)}
              aria-label="Fermer la carte"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 p-3">
            <CommandMap
              annonces={mapAnnonces}
              campus={selectedCampus}
              rayon={Number(filters.rayon)}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRayonCommit={handleRayonCommit}
              searching={loading}
            />
          </div>
        </div>
      )}

      {loading && searched && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-zinc-200 bg-white/95 px-4 py-2 font-mono text-xs text-zinc-600 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
          dispatch en cours…
        </div>
      )}
    </div>
  );
}
