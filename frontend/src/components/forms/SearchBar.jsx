import { useEffect, useState } from "react";
import {
  Banknote,
  GraduationCap,
  Home,
  MapPin,
  Maximize2,
  Route,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

const defaultTypes = ["STUDIO", "CHAMBRE", "APPARTEMENT", "COLOCATION"];

export default function SearchBar({
  onSearch,
  compact = false,
  cityOptions = [],
  universites = [],
  equipements = [],
  typeOptions = defaultTypes,
  initialFilters,
  loading = false,
}) {
  const [filters, setFilters] = useState({
    ville: "",
    universiteId: "",
    budgetMax: "",
    surfaceMin: "",
    type: "",
    rayon: "5000",
    equipements: [],
  });

  useEffect(() => {
    if (initialFilters) {
      setFilters((current) => ({
        ...current,
        ...initialFilters,
        equipements: initialFilters.equipements || current.equipements,
      }));
    }
  }, [initialFilters]);

  const set = (key) => (event) => {
    const value = event.target.value;
    setFilters((current) => {
      if (key === "universiteId") {
        const selected = universites.find(
          (universite) => String(universite.id) === String(value),
        );
        return {
          ...current,
          universiteId: value,
          ville: selected?.ville || current.ville,
        };
      }
      if (key === "ville") {
        const selectedUniversity = universites.find(
          (universite) =>
            String(universite.id) === String(current.universiteId),
        );
        return {
          ...current,
          ville: value,
          universiteId:
            selectedUniversity?.ville === value ? current.universiteId : "",
        };
      }
      return { ...current, [key]: value };
    });
  };

  const toggleEquipement = (libelle) => {
    setFilters((current) => {
      const exists = current.equipements.includes(libelle);
      return {
        ...current,
        equipements: exists
          ? current.equipements.filter((item) => item !== libelle)
          : [...current.equipements, libelle],
      };
    });
  };

  const handleSearch = () => {
    onSearch?.(filters);
  };

  const selectedUniversity = universites.find(
    (universite) => String(universite.id) === String(filters.universiteId),
  );
  const clearCampus = () => {
    setFilters((current) => ({ ...current, universiteId: "" }));
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={filters.ville}
          onChange={set("ville")}
          className="input-field py-2 text-sm"
        >
          <option value="">Ville</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="btn-primary whitespace-nowrap py-2 text-sm disabled:opacity-60"
        >
          Rechercher
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/86 p-4 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-indigo-500/70" />

      <div className="grid gap-4 xl:grid-cols-[minmax(300px,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-indigo-100/80 bg-indigo-50/65 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-indigo-500 dark:text-indigo-300">
                  Campus cible
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {selectedUniversity
                    ? selectedUniversity.nom
                    : "Sélectionner une université"}
                </p>
              </div>
            </div>
            {selectedUniversity && (
              <button
                type="button"
                onClick={clearCampus}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-slate-400 transition-colors hover:text-red-500 dark:bg-white/10"
                aria-label="Retirer le campus"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]">
            <div className="relative">
              <select
                value={filters.universiteId}
                onChange={set("universiteId")}
                className="input-field text-sm"
              >
                <option value="">Université</option>
                {universites.map((universite) => (
                  <option key={universite.id} value={universite.id}>
                    {universite.nom} - {universite.ville}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={filters.ville}
                onChange={set("ville")}
                disabled={Boolean(filters.universiteId)}
                className="input-field pl-9 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">Ville</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5" /> Rayon depuis le campus
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                {Number(filters.rayon) / 1000} km
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="15000"
              step="1000"
              value={filters.rayon}
              onChange={set("rayon")}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="0"
                placeholder="Budget maximum"
                value={filters.budgetMax}
                onChange={set("budgetMax")}
                className="input-field pl-9 text-sm"
              />
            </div>

            <div className="relative">
              <Maximize2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="0"
                placeholder="Surface minimale"
                value={filters.surfaceMin}
                onChange={set("surfaceMin")}
                className="input-field pl-9 text-sm"
              />
            </div>

            <div className="relative">
              <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={filters.type}
                onChange={set("type")}
                className="input-field pl-9 text-sm"
              >
                <option value="">Type</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white/62 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Équipements
            </div>
            <div className="flex flex-wrap gap-2">
              {equipements.slice(0, 10).map((equipement) => {
                const label = equipement.libelle || equipement;
                const selected = filters.equipements.includes(label);
                return (
                  <button
                    key={equipement.id || label}
                    type="button"
                    onClick={() => toggleEquipement(label)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      selected
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-900/5 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-200"
                        : "border-gray-200 bg-white/70 text-gray-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl px-7 py-3 text-sm disabled:opacity-60"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
