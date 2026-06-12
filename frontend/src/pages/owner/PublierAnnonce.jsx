import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  FileCheck2,
  Home,
  List,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PlusCircle,
  ShieldCheck,
  Upload,
  User,
  X,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { ownerApi } from "../../api/ownerApi";
import { useAuth } from "../../hooks/useAuth";

const sidebarLinks = [
  { to: "/dashboard-proprietaire", label: "Tableau de bord", icon: Home },
  { to: "/publier-annonce", label: "Publier une annonce", icon: PlusCircle },
  { to: "/mes-annonces", label: "Mes annonces", icon: List },
  { to: "/profil-proprietaire", label: "Mon profil", icon: User },
];

const steps = ["Logement", "Photos", "Equipements", "Contacts"];
const typeLogements = ["STUDIO", "CHAMBRE", "COLOCATION", "APPARTEMENT"];
const defaultMapCenter = { latitude: 34.018125, longitude: -5.007845 };
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector(
      `script[src="${LEAFLET_JS}"]`,
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.L), {
        once: true,
      });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function LocationPicker({ latitude, longitude, mapCenter, onChange }) {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapCenterRef = useRef(mapCenter);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const hasSelection = latitude !== "" && longitude !== "";

  const updateMarker = (L, latLng, { pan = false, zoom = null } = {}) => {
    if (!mapRef.current) return;

    if (!markerRef.current) {
      markerRef.current = L.marker(latLng, { draggable: true })
        .addTo(mapRef.current)
        .bindPopup("Position exacte du logement");
      markerRef.current.on("dragend", () => {
        const position = markerRef.current.getLatLng();
        onChange({
          latitude: position.lat.toFixed(6),
          longitude: position.lng.toFixed(6),
        });
      });
    } else {
      markerRef.current.setLatLng(latLng);
    }

    if (pan) {
      if (zoom) mapRef.current.setView(latLng, zoom);
      else mapRef.current.panTo(latLng);
    }
  };

  useEffect(() => {
    mapCenterRef.current = mapCenter;
  }, [mapCenter]);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapNode.current || mapRef.current) return;

        const initialCenter = hasSelection
          ? [Number(latitude), Number(longitude)]
          : [mapCenter.latitude, mapCenter.longitude];

        mapRef.current = L.map(mapNode.current, {
          zoomControl: false,
          scrollWheelZoom: true,
        }).setView(initialCenter, hasSelection ? 17 : 13);

        L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);

        mapRef.current.on("click", (event) => {
          const nextLatLng = [event.latlng.lat, event.latlng.lng];
          updateMarker(L, nextLatLng);
          onChange({
            latitude: event.latlng.lat.toFixed(6),
            longitude: event.latlng.lng.toFixed(6),
          });
        });

        if (hasSelection) updateMarker(L, initialCenter);
        setLoading(false);

        setTimeout(() => mapRef.current?.invalidateSize(), 100);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;

    if (hasSelection) {
      const latLng = [Number(latitude), Number(longitude)];
      updateMarker(L, latLng, {
        pan: true,
        zoom: mapRef.current.getZoom() < 16 ? 17 : null,
      });
      return;
    }

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    mapRef.current.setView([mapCenter.latitude, mapCenter.longitude], 13);
  }, [latitude, longitude, mapCenter, hasSelection]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      onChange({
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6),
      });
    });
  };

  const useMapCenter = () => {
    const center = mapRef.current?.getCenter();
    if (!center) return;
    onChange({
      latitude: center.lat.toFixed(6),
      longitude: center.lng.toFixed(6),
    });
  };

  const centerOnCity = () => {
    const center = [
      mapCenterRef.current.latitude,
      mapCenterRef.current.longitude,
    ];
    mapRef.current?.setView(center, 13);
  };

  if (failed) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        La carte interactive est indisponible. Utilisez la recherche d'adresse
        ou reessayez plus tard.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-gray-900">
      <div className="relative h-80">
        <div
          ref={mapNode}
          className="h-full w-full [&_.leaflet-control-zoom]:overflow-hidden [&_.leaflet-control-zoom]:rounded-xl [&_.leaflet-control-zoom]:border-0 [&_.leaflet-control-zoom]:shadow-lg [&_.leaflet-popup-content-wrapper]:rounded-2xl"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-gray-500 backdrop-blur dark:bg-dark-900/80 dark:text-gray-300">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Chargement de la carte...
          </div>
        )}
        <div className="pointer-events-none absolute left-4 top-4 max-w-sm rounded-2xl border border-white/80 bg-white/90 p-3 text-xs text-gray-600 shadow-xl backdrop-blur dark:border-white/10 dark:bg-dark-900/90 dark:text-gray-300">
          Cliquez sur la carte ou deplacez le marqueur pour choisir l'entree
          exacte du logement.
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-gray-200 dark:border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {latitude !== "" && longitude !== ""
            ? `Coordonnees selectionnees : ${latitude}, ${longitude}`
            : "Aucun point choisi. Cliquez sur la carte ou recherchez une adresse."}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={centerOnCity}
            className="btn-ghost text-sm"
          >
            Centrer ville
          </button>
          <button
            type="button"
            onClick={useMapCenter}
            className="btn-ghost text-sm"
          >
            Utiliser centre
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="btn-ghost text-sm"
          >
            Ma position
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublierAnnonce({ isDark, onToggleTheme }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [selectedEquipementIds, setSelectedEquipementIds] = useState([]);
  const [justificatifFile, setJustificatifFile] = useState(null);
  const [form, setForm] = useState({
    titre: "",
    typeLogement: "",
    ville: "",
    adresse: "",
    superficie: "",
    latitude: "",
    longitude: "",
    loyer: "",
    chargesIncluses: false,
    description: "",
    telephone: "",
    whatsapp: "",
    email: "",
    facebook: "",
    instagram: "",
  });
  const [loadingEquipements, setLoadingEquipements] = useState(true);
  const [loadingUniversites, setLoadingUniversites] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [createdAnnonce, setCreatedAnnonce] = useState(null);
  const photosRef = useRef([]);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([ownerApi.getEquipements(), ownerApi.getUniversites()])
      .then(([equipementsResult, universitesResult]) => {
        if (!isMounted) return;
        if (equipementsResult.status === "fulfilled") {
          setEquipements(equipementsResult.value.data || []);
        } else {
          setError("Impossible de charger les equipements.");
        }
        if (universitesResult.status === "fulfilled") {
          setUniversites(universitesResult.value.data || []);
        } else {
          setError("Impossible de charger les villes universitaires.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingEquipements(false);
          setLoadingUniversites(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    },
    [],
  );

  const cityOptions = useMemo(() => {
    return [
      ...new Set(
        universites.map((universite) => universite.ville).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [universites]);

  const cityCenters = useMemo(() => {
    return universites.reduce((acc, universite) => {
      if (
        !universite.ville ||
        universite.latitude == null ||
        universite.longitude == null
      )
        return acc;
      if (!acc[universite.ville]) {
        acc[universite.ville] = { latitude: 0, longitude: 0, count: 0 };
      }
      acc[universite.ville].latitude += Number(universite.latitude);
      acc[universite.ville].longitude += Number(universite.longitude);
      acc[universite.ville].count += 1;
      return acc;
    }, {});
  }, [universites]);

  const selectedCityCenter = useMemo(() => {
    const center = cityCenters[form.ville];
    if (!center?.count) return defaultMapCenter;
    return {
      latitude: center.latitude / center.count,
      longitude: center.longitude / center.count,
    };
  }, [cityCenters, form.ville]);

  const set = (key) => (event) => {
    const { type, checked, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [key]: type === "checkbox" ? checked : value,
      ...(key === "ville" ? { latitude: "", longitude: "" } : {}),
    }));
    setError("");
  };

  const setLocation = ({ latitude, longitude }) => {
    setForm((prev) => ({ ...prev, latitude, longitude }));
    setError("");
  };

  const searchAddressOnMap = async () => {
    if (!form.ville) {
      setError("Selectionnez d'abord la ville.");
      return;
    }
    if (!form.adresse.trim()) {
      setError("Saisissez l'adresse avant de la rechercher sur la carte.");
      return;
    }

    setSearchingAddress(true);
    setError("");
    try {
      const query = `${form.adresse.trim()}, ${form.ville}, Maroc`;
      const params = new URLSearchParams({
        format: "json",
        limit: "1",
        countrycodes: "ma",
        q: query,
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: { Accept: "application/json" },
        },
      );
      if (!response.ok) {
        throw new Error("search failed");
      }
      const results = await response.json();
      const result = results?.[0];
      if (!result) {
        setError(
          "Adresse introuvable. Placez le point manuellement sur la carte.",
        );
        return;
      }
      setLocation({
        latitude: Number(result.lat).toFixed(6),
        longitude: Number(result.lon).toFixed(6),
      });
    } catch {
      setError(
        "Recherche d'adresse indisponible. Placez le point manuellement sur la carte.",
      );
    } finally {
      setSearchingAddress(false);
    }
  };

  const toggleEquipement = (id) => {
    setSelectedEquipementIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setError("");
  };

  const handlePhotos = (files) => {
    const nextPhotos = Array.from(files || [])
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        file,
        name: file.name,
        url: URL.createObjectURL(file),
      }));

    setPhotos((prev) => {
      const merged = [...prev, ...nextPhotos].slice(0, 10);
      const removed = [...prev, ...nextPhotos].slice(10);
      removed.forEach((photo) => URL.revokeObjectURL(photo.url));
      return merged;
    });
    setError("");
  };

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const photo = prev[index];
      if (photo) URL.revokeObjectURL(photo.url);
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const buildContacts = () => {
    const candidates = [
      { plateforme: "TELEPHONE", valeur: form.telephone },
      { plateforme: "WHATSAPP", valeur: form.whatsapp },
      { plateforme: "EMAIL", valeur: form.email },
      { plateforme: "FACEBOOK", valeur: form.facebook },
      { plateforme: "INSTAGRAM", valeur: form.instagram },
    ];
    return candidates
      .map((contact) => ({ ...contact, valeur: contact.valeur.trim() }))
      .filter((contact) => contact.valeur);
  };

  const validate = () => {
    if (!user?.id)
      return "Utilisateur proprietaire introuvable. Reconnectez-vous.";
    if (!form.titre.trim()) return "Le titre de l'annonce est requis.";
    if (!form.typeLogement) return "Le type de logement est requis.";
    if (!form.ville) return "La ville est requise.";
    if (!form.adresse.trim()) return "L'adresse est requise.";
    if (!form.superficie || Number(form.superficie) <= 0)
      return "La superficie doit etre positive.";
    if (
      form.latitude === "" ||
      Number(form.latitude) < -90 ||
      Number(form.latitude) > 90
    )
      return "Latitude invalide.";
    if (
      form.longitude === "" ||
      Number(form.longitude) < -180 ||
      Number(form.longitude) > 180
    )
      return "Longitude invalide.";
    if (!form.loyer || Number(form.loyer) <= 0)
      return "Le loyer doit etre positif.";
    if (!form.description.trim()) return "La description est requise.";
    if (!justificatifFile) return "Le justificatif du logement est requis.";
    if (photos.length < 2) return "Ajoutez au moins 2 photos.";
    if (photos.length > 10) return "Maximum 10 photos.";
    if (selectedEquipementIds.length === 0)
      return "Selectionnez au moins un equipement.";
    if (buildContacts().length === 0)
      return "Ajoutez au moins un moyen de contact.";
    return "";
  };

  const publish = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const logementRes = await ownerApi.createLogement(
        {
          proprietaireId: user.id,
          adresse: form.adresse.trim(),
          ville: form.ville,
          superficie: Number(form.superficie),
          typeLogement: form.typeLogement,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        },
        justificatifFile,
      );

      const annonceRes = await ownerApi.publishAnnonce(
        logementRes.data.id,
        {
          titre: form.titre.trim(),
          description: form.description.trim(),
          loyer: form.loyer,
          chargesIncluses: form.chargesIncluses,
          contacts: buildContacts(),
          equipementIds: selectedEquipementIds,
        },
        photos,
      );

      setCreatedAnnonce(annonceRes.data);
      setDone(true);
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        null;
      setError(
        serverMsg ||
          "Impossible de publier l'annonce. Verifiez les informations.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done)
    return (
      <DashboardLayout
        sidebarLinks={sidebarLinks}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-3">
              Annonce soumise !
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              Votre annonce est maintenant enregistree avec ses equipements.
            </p>
            {createdAnnonce?.statut && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Statut actuel :{" "}
                <span className="font-semibold">{createdAnnonce.statut}</span>
              </p>
            )}
            <button
              onClick={() => navigate("/mes-annonces")}
              className="btn-primary"
            >
              Voir mes annonces
            </button>
          </div>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">
          Publier une annonce
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Creez le logement puis envoyez l'annonce complete au backend
        </p>
      </div>

      <div className="flex items-center gap-0 mb-8">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div
              className={`flex items-center gap-2 ${index + 1 <= step ? "text-primary-600 dark:text-primary-400" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${index + 1 < step ? "bg-primary-600 text-white" : index + 1 === step ? "border-2 border-primary-600 text-primary-600 dark:text-primary-400" : "border-2 border-gray-300 dark:border-white/20 text-gray-400"}`}
              >
                {index + 1 < step ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 ${index + 1 < step ? "bg-primary-600" : "bg-gray-200 dark:bg-white/10"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="glass-light rounded-2xl p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">
              Informations du logement
            </h2>
            <input
              type="text"
              placeholder="Titre de l'annonce"
              value={form.titre}
              onChange={set("titre")}
              className="input-field"
            />
            <div className="grid md:grid-cols-2 gap-4">
              <select
                value={form.typeLogement}
                onChange={set("typeLogement")}
                className="input-field"
              >
                <option value="">Type de logement</option>
                {typeLogements.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={form.ville}
                onChange={set("ville")}
                className="input-field"
              >
                <option value="">
                  {loadingUniversites
                    ? "Chargement des villes..."
                    : "Ville universitaire"}
                </option>
                {cityOptions.map((ville) => (
                  <option key={ville} value={ville}>
                    {ville}
                  </option>
                ))}
              </select>
            </div>
            {cityOptions.length === 0 && !loadingUniversites && (
              <p className="text-sm text-red-500">
                Aucune ville universitaire n'est disponible depuis la base.
              </p>
            )}
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                placeholder="Adresse complete"
                value={form.adresse}
                onChange={set("adresse")}
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={searchAddressOnMap}
                disabled={searchingAddress}
                className="btn-ghost justify-center text-sm md:w-56"
              >
                {searchingAddress ? "Recherche..." : "Rechercher sur la carte"}
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="number"
                min="1"
                step="0.1"
                placeholder="Superficie (m2)"
                value={form.superficie}
                onChange={set("superficie")}
                className="input-field"
              />
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Loyer mensuel (MAD)"
                value={form.loyer}
                onChange={set("loyer")}
                className="input-field"
              />
              <label className="input-field flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.chargesIncluses}
                  onChange={set("chargesIncluses")}
                  className="w-4 h-4 accent-primary-600"
                />
                <span>Charges incluses</span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Localisation du logement
              </label>
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                mapCenter={selectedCityCenter}
                onChange={setLocation}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                La recherche place le point automatiquement. Vous pouvez cliquer
                sur la carte pour corriger la position exacte.
              </p>
            </div>
            <textarea
              rows={4}
              placeholder="Description detaillee du logement..."
              value={form.description}
              onChange={set("description")}
              className="input-field resize-none"
            />
            <div className="rounded-3xl border border-primary-100 bg-primary-50/60 p-5 shadow-sm dark:border-primary-400/20 dark:bg-primary-500/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/25">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <label className="font-display text-base font-bold text-gray-900 dark:text-white">
                      Justificatif du logement
                    </label>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Ajoutez un document qui prouve que le logement existe et
                      qu'il est lie au proprietaire. Il est utilise par l'IA et,
                      si besoin, par l'equipe de moderation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-xs text-gray-500 dark:text-gray-400 md:grid-cols-3">
                <div className="rounded-2xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    Exemples acceptes
                  </span>
                  <p className="mt-1">
                    Titre, contrat, quittance, facture ou attestation liee au
                    logement.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    Important
                  </span>
                  <p className="mt-1">
                    Le nom et/ou l'adresse visibles renforcent fortement le
                    score de confiance.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    Formats
                  </span>
                  <p className="mt-1">
                    PDF, JPG ou PNG. Evitez les documents flous, coupes ou
                    illisibles.
                  </p>
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  document.getElementById("justificatif-input")?.click()
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    document.getElementById("justificatif-input")?.click();
                  }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = Array.from(event.dataTransfer.files || []).find(
                    (item) =>
                      item.type.startsWith("image/") ||
                      item.type === "application/pdf",
                  );
                  if (file) {
                    setJustificatifFile(file);
                    setError("");
                  }
                }}
                className="mt-4 cursor-pointer rounded-3xl border-2 border-dashed border-primary-200 bg-white/80 p-6 text-center transition-all hover:border-primary-500 hover:bg-white dark:border-primary-400/30 dark:bg-dark-900/50 dark:hover:border-primary-300"
              >
                <input
                  id="justificatif-input"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    setJustificatifFile(e.target.files?.[0] || null);
                    setError("");
                  }}
                />
                {justificatifFile ? (
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:text-left">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                        <FileCheck2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {justificatifFile.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {(justificatifFile.size / 1024 / 1024).toFixed(2)} MB
                          - Cliquez pour remplacer le document
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setJustificatifFile(null);
                        const input =
                          document.getElementById("justificatif-input");
                        if (input) input.value = "";
                      }}
                      className="btn-ghost text-sm"
                    >
                      Retirer
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto mb-3 h-10 w-10 text-primary-500" />
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Glissez le justificatif ici
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      ou cliquez pour choisir un fichier PDF, JPG ou PNG
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">
              Photos du logement
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Entre 2 et 10 photos.
            </p>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl p-10 text-center hover:border-primary-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById("photo-input").click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handlePhotos(event.dataTransfer.files);
              }}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                Glissez vos photos ici
              </p>
              <p className="text-gray-400 text-xs">JPG, PNG - Max 10 photos</p>
              <input
                id="photo-input"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(event) => handlePhotos(event.target.files)}
              />
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={`${photo.name}-${index}`}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">{photos.length}/10 photos</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">
              Equipements disponibles
            </h2>
            {loadingEquipements ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chargement des equipements...
              </p>
            ) : equipements.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucun equipement n'est configure dans la base.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {equipements.map((equipement) => (
                  <button
                    key={equipement.id}
                    type="button"
                    onClick={() => toggleEquipement(equipement.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedEquipementIds.includes(equipement.id) ? "bg-primary-600 border-primary-600 text-white" : "border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400"}`}
                  >
                    {equipement.libelle}
                  </button>
                ))}
              </div>
            )}
            {selectedEquipementIds.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                {selectedEquipementIds.length} equipement
                {selectedEquipementIds.length > 1 ? "s" : ""} selectionne
                {selectedEquipementIds.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">
              Contacts
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Au moins un moyen de contact est obligatoire.
            </p>
            <div className="space-y-3">
              {[
                {
                  key: "telephone",
                  icon: Phone,
                  placeholder: "+212 6 XX XX XX XX",
                },
                {
                  key: "whatsapp",
                  icon: MessageCircle,
                  placeholder: "+212 6 XX XX XX XX",
                },
                { key: "email", icon: Mail, placeholder: "votre@email.com" },
                {
                  key: "facebook",
                  icon: MapPin,
                  placeholder: "Facebook URL ou @pseudo",
                },
                {
                  key: "instagram",
                  icon: MapPin,
                  placeholder: "Instagram URL ou @pseudo",
                },
              ].map(({ key, icon: Icon, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={set(key)}
                    className="input-field flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              className="btn-ghost text-sm"
            >
              Etape precedente
            </button>
          ) : (
            <span />
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => prev + 1)}
              className="btn-primary flex items-center gap-2"
            >
              Etape suivante <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={publish}
              disabled={submitting}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? "Publication en cours..." : "Publier l'annonce"}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
