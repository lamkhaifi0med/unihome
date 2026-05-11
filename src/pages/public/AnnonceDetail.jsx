import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Phone, MessageCircle, Mail, Heart, Flag, Star, Wifi, Car, Wind, ChefHat, ArrowLeft, Shield, User, Check } from 'lucide-react'
import ScoreBadge from '../../components/ui/ScoreBadge'
import { annonces } from '../../data/mockData'
import { useFavoris } from '../../hooks/useFavoris'

export default function AnnonceDetail() {
  const { id } = useParams()
  const annonce = annonces.find(a => a.id === Number(id))
  const { toggleFavori, isFavori } = useFavoris()
  const [activeImg, setActiveImg] = useState(0)
  const [showContacts, setShowContacts] = useState(false)
  const [reported, setReported] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')

  if (!annonce) return (
    <div className="page-container py-20 text-center">
      <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">Annonce introuvable</h2>
      <Link to="/annonces" className="btn-primary">Retour aux annonces</Link>
    </div>
  )

  const fav = isFavori(annonce.id)
  const eqIcons = { WiFi: Wifi, Parking: Car, Clim: Wind, 'Cuisine équipée': ChefHat }

  const avgNote = annonce.avis.length ? (annonce.avis.reduce((s, a) => s + a.note, 0) / annonce.avis.length).toFixed(1) : null

  return (
    <div className="page-container py-8">
      <Link to="/annonces" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour aux annonces
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2">
          {/* Gallery */}
          <div className="relative rounded-2xl overflow-hidden mb-4 aspect-video bg-gray-100 dark:bg-dark-700">
            <img src={annonce.images[activeImg]} alt={annonce.titre} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 flex gap-2">
              <ScoreBadge score={annonce.scoreConfiance} />
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => toggleFavori(annonce.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${fav ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-dark-700/80 text-gray-500'}`}>
                <Heart className={`w-5 h-5 ${fav ? 'fill-current' : ''}`} />
              </button>
              <button onClick={() => setShowReport(true)} className="w-10 h-10 rounded-xl bg-white/80 dark:bg-dark-700/80 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors">
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>
          {annonce.images.length > 1 && (
            <div className="flex gap-2 mb-6">
              {annonce.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-80'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="glass-light rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">{annonce.titre}</h1>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{annonce.adresse}</span>
                  <span>·</span>
                  <span>{annonce.distance} km du campus</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-display font-bold text-2xl text-primary-600 dark:text-primary-400">{annonce.loyer.toLocaleString()} MAD</p>
                <p className="text-gray-400 text-sm">/mois</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Type', value: annonce.type },
                { label: 'Superficie', value: `${annonce.superficie} m²` },
                { label: 'Université', value: annonce.universite.split(' ').slice(0, 2).join(' ') },
                { label: 'Score IA', value: `${annonce.scoreConfiance}/100` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="font-display font-semibold text-gray-900 dark:text-white text-sm">{value}</p>
                </div>
              ))}
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5">{annonce.description}</p>

            <div>
              <p className="font-display font-semibold text-gray-900 dark:text-white text-sm mb-3">Équipements</p>
              <div className="flex flex-wrap gap-2">
                {annonce.equipements.map(eq => (
                  <span key={eq} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Avis */}
          <div className="glass-light rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">
                Avis étudiants {avgNote && <span className="text-primary-600 dark:text-primary-400">({avgNote}/5)</span>}
              </h3>
              {avgNote && (
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgNote) ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />)}
                </div>
              )}
            </div>
            {annonce.avis.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun avis pour le moment. Soyez le premier à évaluer ce logement.</p>
            ) : (
              <div className="space-y-4">
                {annonce.avis.map((avis, i) => (
                  <div key={i} className="border-b border-gray-100 dark:border-white/10 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-bold">
                          {avis.auteur[0]}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{avis.auteur}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= avis.note ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />)}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{avis.commentaire}</p>
                    <p className="text-gray-400 text-xs mt-1">{avis.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Propriétaire */}
          <div className="glass-light rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white font-bold text-lg">
                {annonce.proprietaire.nom[0]}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-display font-semibold text-gray-900 dark:text-white text-sm">{annonce.proprietaire.nom}</p>
                  {annonce.proprietaire.verifie && <Shield className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{annonce.proprietaire.note}</span>
                  {annonce.proprietaire.verifie && <span className="text-xs text-emerald-600 dark:text-emerald-400">· Vérifié</span>}
                </div>
              </div>
            </div>

            {!showContacts ? (
              <button onClick={() => setShowContacts(true)} className="btn-primary w-full text-center text-sm">
                Afficher les contacts
              </button>
            ) : (
              <div className="space-y-2">
                <a href={`tel:${annonce.proprietaire.telephone}`} className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{annonce.proprietaire.telephone}</span>
                </a>
                <a href={`https://wa.me/${annonce.proprietaire.whatsapp.replace(/\s/g, '')}`} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors">
                  <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">WhatsApp</span>
                </a>
                <a href={`mailto:${annonce.proprietaire.email}`} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{annonce.proprietaire.email}</span>
                </a>
              </div>
            )}
          </div>

          {/* Score detail */}
          <div className="glass-light rounded-2xl p-5">
            <h4 className="font-display font-semibold text-gray-900 dark:text-white text-sm mb-4">Analyse IA du logement</h4>
            <div className="mb-3">
              <ScoreBadge score={annonce.scoreConfiance} size="lg" />
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Identité propriétaire', score: annonce.proprietaire.verifie ? 30 : 18, max: 30 },
                { label: 'Analyse textuelle', score: 22, max: 25 },
                { label: 'Photos originales', score: 20, max: 25 },
                { label: 'Cohérence prix', score: 20, max: 20 },
              ].map(({ label, score, max }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{score}/{max}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ width: `${(score / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signalement modal */}
          {showReport && (
            <div className="glass-light rounded-2xl p-5 border border-red-200 dark:border-red-500/30">
              <h4 className="font-display font-semibold text-red-600 dark:text-red-400 mb-3">Signaler cette annonce</h4>
              <div className="space-y-2 mb-4">
                {['Photos volées', 'Prix suspect', 'Propriétaire fictif', 'Arnaque suspectée', 'Autre'].map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="report" value={r} onChange={() => setReportReason(r)} className="accent-red-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{r}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowReport(false)} className="btn-ghost text-sm flex-1">Annuler</button>
                <button onClick={() => { setReported(true); setShowReport(false) }} className="flex-1 py-2 text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors">Signaler</button>
              </div>
              {reported && <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-2 text-center">Signalement envoyé. Merci !</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
