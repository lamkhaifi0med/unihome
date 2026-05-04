--
-- PostgreSQL database dump
--

\restrict GCclTSh7IQBKPf46zMmAKQhmlKyJ9vjCxgYqelRI4S4R6icoQNu4E72GUgWzuJp

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

-- Started on 2026-04-27 21:42:22

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 17654)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5980 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 16397)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5981 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 1693 (class 1247 OID 17692)
-- Name: role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_enum AS ENUM (
    'ETUDIANT',
    'PROPRIETAIRE',
    'ADMIN'
);


--
-- TOC entry 1702 (class 1247 OID 17718)
-- Name: statut_annonce_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.statut_annonce_enum AS ENUM (
    'EN_ATTENTE',
    'VALIDEE',
    'REJETEE',
    'SUSPENDUE',
    'ARCHIVEE'
);


--
-- TOC entry 1699 (class 1247 OID 17710)
-- Name: statut_logement_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.statut_logement_enum AS ENUM (
    'DISPONIBLE',
    'OCCUPE',
    'ARCHIVE'
);


--
-- TOC entry 1705 (class 1247 OID 17730)
-- Name: statut_signalement_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.statut_signalement_enum AS ENUM (
    'OUVERT',
    'TRAITE',
    'REJETE'
);


--
-- TOC entry 1708 (class 1247 OID 17738)
-- Name: type_contact_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.type_contact_enum AS ENUM (
    'TELEPHONE',
    'WHATSAPP',
    'EMAIL',
    'FACEBOOK',
    'INSTAGRAM'
);


--
-- TOC entry 1696 (class 1247 OID 17700)
-- Name: type_logement_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.type_logement_enum AS ENUM (
    'STUDIO',
    'CHAMBRE',
    'COLOCATION',
    'APPARTEMENT'
);


--
-- TOC entry 279 (class 1255 OID 17991)
-- Name: auto_suspend_annonce(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_suspend_annonce() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (
        SELECT COUNT(*) FROM signalements
        WHERE annonce_id = NEW.annonce_id AND statut = 'OUVERT'
    ) >= 3 THEN
        UPDATE annonces SET statut = 'SUSPENDUE' WHERE id = NEW.annonce_id;
    END IF;

    -- Mise à jour du compteur dénormalisé sur annonces
    UPDATE annonces
    SET nb_signalements = (
        SELECT COUNT(*) FROM signalements WHERE annonce_id = NEW.annonce_id
    )
    WHERE id = NEW.annonce_id;

    RETURN NEW;
END;
$$;


--
-- TOC entry 286 (class 1255 OID 17864)
-- Name: check_photos_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_photos_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (SELECT COUNT(*) FROM photos WHERE annonce_id = NEW.annonce_id) > 10 THEN
        RAISE EXCEPTION 'Une annonce ne peut pas avoir plus de 10 photos.';
    END IF;
    RETURN NEW;
END;
$$;


--
-- TOC entry 395 (class 1255 OID 18024)
-- Name: recalcule_note_proprietaire(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recalcule_note_proprietaire() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_proprietaire_id UUID;
BEGIN
    -- Récupérer le propriétaire via annonce → logement
    SELECT l.proprietaire_id INTO v_proprietaire_id
    FROM annonces a
    JOIN logements l ON l.id = a.logement_id
    WHERE a.id = NEW.annonce_id;

    -- Recalcul agrégé
    UPDATE utilisateurs
    SET
        note_moyenne  = (
            SELECT AVG(av.note)
            FROM avis av
            JOIN annonces a ON a.id = av.annonce_id
            JOIN logements l ON l.id = a.logement_id
            WHERE l.proprietaire_id = v_proprietaire_id
        ),
        nb_avis_total = (
            SELECT COUNT(*)
            FROM avis av
            JOIN annonces a ON a.id = av.annonce_id
            JOIN logements l ON l.id = a.logement_id
            WHERE l.proprietaire_id = v_proprietaire_id
        )
    WHERE id = v_proprietaire_id;

    RETURN NEW;
END;
$$;


--
-- TOC entry 292 (class 1255 OID 18026)
-- Name: set_annonce_expiration(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_annonce_expiration() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.date_publication IS NOT NULL THEN
        NEW.date_expiration := NEW.date_publication + INTERVAL '90 days';
    END IF;
    RETURN NEW;
END;
$$;


--
-- TOC entry 667 (class 1255 OID 18028)
-- Name: set_recommandation_expiration(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_recommandation_expiration() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.date_expiration := NEW.date_generation + INTERVAL '24 hours';
    RETURN NEW;
END;
$$;


--
-- TOC entry 616 (class 1255 OID 18020)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 17880)
-- Name: annonce_equipements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annonce_equipements (
    annonce_id uuid NOT NULL,
    equipement_id integer NOT NULL
);


--
-- TOC entry 227 (class 1259 OID 17821)
-- Name: annonces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annonces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    logement_id uuid NOT NULL,
    titre character varying(200) NOT NULL,
    description text NOT NULL,
    loyer numeric(10,2) NOT NULL,
    charges_incluses boolean DEFAULT false NOT NULL,
    statut public.statut_annonce_enum DEFAULT 'EN_ATTENTE'::public.statut_annonce_enum NOT NULL,
    score_confiance smallint,
    detail_score jsonb,
    nb_signalements integer DEFAULT 0 NOT NULL,
    date_publication timestamp with time zone,
    date_expiration timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT annonces_loyer_check CHECK ((loyer > (0)::numeric)),
    CONSTRAINT annonces_nb_signalements_check CHECK ((nb_signalements >= 0)),
    CONSTRAINT annonces_score_confiance_check CHECK (((score_confiance >= 0) AND (score_confiance <= 100)))
);


--
-- TOC entry 233 (class 1259 OID 17932)
-- Name: avis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    etudiant_id uuid NOT NULL,
    annonce_id uuid NOT NULL,
    consultation_id uuid NOT NULL,
    note smallint NOT NULL,
    commentaire text,
    valide_par_ia boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT avis_note_check CHECK (((note >= 1) AND (note <= 5)))
);


--
-- TOC entry 231 (class 1259 OID 17895)
-- Name: consultations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    etudiant_id uuid NOT NULL,
    annonce_id uuid NOT NULL,
    contacts_affiches boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 17866)
-- Name: contacts_annonce; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts_annonce (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    annonce_id uuid NOT NULL,
    plateforme public.type_contact_enum NOT NULL,
    valeur character varying(300) NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 17792)
-- Name: equipements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipements (
    id integer NOT NULL,
    libelle character varying(100) NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 17791)
-- Name: equipements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5982 (class 0 OID 0)
-- Dependencies: 224
-- Name: equipements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipements_id_seq OWNED BY public.equipements.id;


--
-- TOC entry 232 (class 1259 OID 17916)
-- Name: favoris; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favoris (
    etudiant_id uuid NOT NULL,
    annonce_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 226 (class 1259 OID 17800)
-- Name: logements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proprietaire_id uuid NOT NULL,
    adresse character varying(300) NOT NULL,
    ville character varying(100) NOT NULL,
    superficie numeric(8,2) NOT NULL,
    type_logement public.type_logement_enum NOT NULL,
    statut_logement public.statut_logement_enum DEFAULT 'DISPONIBLE'::public.statut_logement_enum NOT NULL,
    coordonnees public.geography(Point,4326) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT logements_superficie_check CHECK ((superficie > (0)::numeric))
);


--
-- TOC entry 228 (class 1259 OID 17846)
-- Name: photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    annonce_id uuid NOT NULL,
    url character varying(500) NOT NULL,
    phash character varying(64),
    est_principale boolean DEFAULT false NOT NULL,
    ordre smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 235 (class 1259 OID 17993)
-- Name: recommandations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recommandations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    etudiant_id uuid NOT NULL,
    annonce_id uuid NOT NULL,
    score_pertinence numeric(5,2),
    raison text,
    date_generation timestamp with time zone DEFAULT now() NOT NULL,
    date_expiration timestamp with time zone,
    CONSTRAINT recommandations_score_pertinence_check CHECK (((score_pertinence >= (0)::numeric) AND (score_pertinence <= (100)::numeric)))
);


--
-- TOC entry 234 (class 1259 OID 17962)
-- Name: signalements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signalements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    etudiant_id uuid NOT NULL,
    annonce_id uuid NOT NULL,
    admin_id uuid,
    raison character varying(100) NOT NULL,
    description text,
    statut public.statut_signalement_enum DEFAULT 'OUVERT'::public.statut_signalement_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    traite_at timestamp with time zone
);


--
-- TOC entry 222 (class 1259 OID 17749)
-- Name: universites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.universites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom character varying(200) NOT NULL,
    ville character varying(100) NOT NULL,
    adresse character varying(300),
    coordonnees public.geography(Point,4326) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 17760)
-- Name: utilisateurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateurs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    mot_de_passe character varying(255) NOT NULL,
    est_verifie boolean DEFAULT false NOT NULL,
    email_confirme boolean DEFAULT false NOT NULL,
    role public.role_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    budget_max numeric(10,2),
    ville_recherche character varying(100),
    universite_id uuid,
    numero_cin character varying(20),
    photo_cin_url character varying(500),
    est_verifie_cin boolean DEFAULT false NOT NULL,
    note_moyenne numeric(3,2),
    nb_avis_total integer DEFAULT 0 NOT NULL,
    telephone character varying(20),
    CONSTRAINT chk_etudiant_fields CHECK (((role = 'ETUDIANT'::public.role_enum) OR ((budget_max IS NULL) AND (ville_recherche IS NULL) AND (universite_id IS NULL)))),
    CONSTRAINT chk_proprietaire_fields CHECK (((role = 'PROPRIETAIRE'::public.role_enum) OR ((numero_cin IS NULL) AND (photo_cin_url IS NULL) AND (telephone IS NULL)))),
    CONSTRAINT utilisateurs_budget_max_check CHECK ((budget_max > (0)::numeric)),
    CONSTRAINT utilisateurs_nb_avis_total_check CHECK ((nb_avis_total >= 0)),
    CONSTRAINT utilisateurs_note_moyenne_check CHECK (((note_moyenne >= (1)::numeric) AND (note_moyenne <= (5)::numeric)))
);


--
-- TOC entry 236 (class 1259 OID 18015)
-- Name: v_annonces_avec_distance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_annonces_avec_distance AS
 SELECT a.id AS annonce_id,
    a.titre,
    a.loyer,
    a.statut,
    a.score_confiance,
    a.nb_signalements,
    a.date_expiration,
    l.id AS logement_id,
    l.adresse,
    l.ville,
    l.superficie,
    l.type_logement,
    l.coordonnees AS coordonnees_logement,
    u.nom AS proprietaire_nom,
    u.prenom AS proprietaire_prenom,
    u.est_verifie_cin AS proprietaire_verifie,
    u.note_moyenne AS proprietaire_note,
    univ.id AS universite_id,
    univ.nom AS universite_nom,
    public.st_distance((l.coordonnees)::public.geography, (univ.coordonnees)::public.geography) AS distance_campus_m
   FROM ((((public.annonces a
     JOIN public.logements l ON ((l.id = a.logement_id)))
     JOIN public.utilisateurs u ON ((u.id = l.proprietaire_id)))
     LEFT JOIN public.utilisateurs etu ON ((etu.role = 'ETUDIANT'::public.role_enum)))
     LEFT JOIN public.universites univ ON ((univ.id = etu.universite_id)))
  WHERE ((a.statut = 'VALIDEE'::public.statut_annonce_enum) AND ((a.date_expiration IS NULL) OR (a.date_expiration > now())));


--
-- TOC entry 5680 (class 2604 OID 17795)
-- Name: equipements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipements ALTER COLUMN id SET DEFAULT nextval('public.equipements_id_seq'::regclass);


--
-- TOC entry 5969 (class 0 OID 17880)
-- Dependencies: 230
-- Data for Name: annonce_equipements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5966 (class 0 OID 17821)
-- Dependencies: 227
-- Data for Name: annonces; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5972 (class 0 OID 17932)
-- Dependencies: 233
-- Data for Name: avis; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5970 (class 0 OID 17895)
-- Dependencies: 231
-- Data for Name: consultations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5968 (class 0 OID 17866)
-- Dependencies: 229
-- Data for Name: contacts_annonce; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5964 (class 0 OID 17792)
-- Dependencies: 225
-- Data for Name: equipements; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.equipements VALUES (1, 'WiFi');
INSERT INTO public.equipements VALUES (2, 'Meublé');
INSERT INTO public.equipements VALUES (3, 'Cuisine équipée');
INSERT INTO public.equipements VALUES (4, 'Parking');
INSERT INTO public.equipements VALUES (5, 'Climatisation');
INSERT INTO public.equipements VALUES (6, 'Chauffage');
INSERT INTO public.equipements VALUES (7, 'Ascenseur');
INSERT INTO public.equipements VALUES (8, 'Gardien');
INSERT INTO public.equipements VALUES (9, 'Terrasse');
INSERT INTO public.equipements VALUES (10, 'Balcon');
INSERT INTO public.equipements VALUES (11, 'Machine à laver');
INSERT INTO public.equipements VALUES (12, 'Eau chaude');
INSERT INTO public.equipements VALUES (13, 'Sécurité 24h');


--
-- TOC entry 5971 (class 0 OID 17916)
-- Dependencies: 232
-- Data for Name: favoris; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5965 (class 0 OID 17800)
-- Dependencies: 226
-- Data for Name: logements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5967 (class 0 OID 17846)
-- Dependencies: 228
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5974 (class 0 OID 17993)
-- Dependencies: 235
-- Data for Name: recommandations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5973 (class 0 OID 17962)
-- Dependencies: 234
-- Data for Name: signalements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5670 (class 0 OID 16715)
-- Dependencies: 218
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5961 (class 0 OID 17749)
-- Dependencies: 222
-- Data for Name: universites; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5962 (class 0 OID 17760)
-- Dependencies: 223
-- Data for Name: utilisateurs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5983 (class 0 OID 0)
-- Dependencies: 224
-- Name: equipements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipements_id_seq', 13, true);


--
-- TOC entry 5761 (class 2606 OID 17884)
-- Name: annonce_equipements annonce_equipements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonce_equipements
    ADD CONSTRAINT annonce_equipements_pkey PRIMARY KEY (annonce_id, equipement_id);


--
-- TOC entry 5746 (class 2606 OID 17836)
-- Name: annonces annonces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT annonces_pkey PRIMARY KEY (id);


--
-- TOC entry 5770 (class 2606 OID 17942)
-- Name: avis avis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_pkey PRIMARY KEY (id);


--
-- TOC entry 5763 (class 2606 OID 17902)
-- Name: consultations consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);


--
-- TOC entry 5756 (class 2606 OID 17871)
-- Name: contacts_annonce contacts_annonce_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts_annonce
    ADD CONSTRAINT contacts_annonce_pkey PRIMARY KEY (id);


--
-- TOC entry 5736 (class 2606 OID 17799)
-- Name: equipements equipements_libelle_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipements
    ADD CONSTRAINT equipements_libelle_key UNIQUE (libelle);


--
-- TOC entry 5738 (class 2606 OID 17797)
-- Name: equipements equipements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipements
    ADD CONSTRAINT equipements_pkey PRIMARY KEY (id);


--
-- TOC entry 5768 (class 2606 OID 17921)
-- Name: favoris favoris_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoris
    ADD CONSTRAINT favoris_pkey PRIMARY KEY (etudiant_id, annonce_id);


--
-- TOC entry 5744 (class 2606 OID 17811)
-- Name: logements logements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logements
    ADD CONSTRAINT logements_pkey PRIMARY KEY (id);


--
-- TOC entry 5754 (class 2606 OID 17856)
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- TOC entry 5784 (class 2606 OID 18002)
-- Name: recommandations recommandations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommandations
    ADD CONSTRAINT recommandations_pkey PRIMARY KEY (id);


--
-- TOC entry 5778 (class 2606 OID 17971)
-- Name: signalements signalements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_pkey PRIMARY KEY (id);


--
-- TOC entry 5725 (class 2606 OID 17757)
-- Name: universites universites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universites
    ADD CONSTRAINT universites_pkey PRIMARY KEY (id);


--
-- TOC entry 5774 (class 2606 OID 17944)
-- Name: avis uq_avis_etudiant_annonce; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT uq_avis_etudiant_annonce UNIQUE (etudiant_id, annonce_id);


--
-- TOC entry 5759 (class 2606 OID 17873)
-- Name: contacts_annonce uq_contact_annonce_plateforme; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts_annonce
    ADD CONSTRAINT uq_contact_annonce_plateforme UNIQUE (annonce_id, plateforme);


--
-- TOC entry 5780 (class 2606 OID 17973)
-- Name: signalements uq_signalement_etudiant_annonce; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT uq_signalement_etudiant_annonce UNIQUE (etudiant_id, annonce_id);


--
-- TOC entry 5730 (class 2606 OID 17780)
-- Name: utilisateurs utilisateurs_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_email_key UNIQUE (email);


--
-- TOC entry 5732 (class 2606 OID 17782)
-- Name: utilisateurs utilisateurs_numero_cin_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_numero_cin_key UNIQUE (numero_cin);


--
-- TOC entry 5734 (class 2606 OID 17778)
-- Name: utilisateurs utilisateurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_pkey PRIMARY KEY (id);


--
-- TOC entry 5747 (class 1259 OID 17845)
-- Name: idx_annonces_detail_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_annonces_detail_score ON public.annonces USING gin (detail_score);


--
-- TOC entry 5748 (class 1259 OID 17842)
-- Name: idx_annonces_logement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_annonces_logement ON public.annonces USING btree (logement_id);


--
-- TOC entry 5749 (class 1259 OID 17844)
-- Name: idx_annonces_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_annonces_score ON public.annonces USING btree (score_confiance);


--
-- TOC entry 5750 (class 1259 OID 17843)
-- Name: idx_annonces_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_annonces_statut ON public.annonces USING btree (statut);


--
-- TOC entry 5771 (class 1259 OID 17960)
-- Name: idx_avis_annonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avis_annonce ON public.avis USING btree (annonce_id);


--
-- TOC entry 5772 (class 1259 OID 17961)
-- Name: idx_avis_etudiant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avis_etudiant ON public.avis USING btree (etudiant_id);


--
-- TOC entry 5764 (class 1259 OID 17914)
-- Name: idx_consultations_annonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consultations_annonce ON public.consultations USING btree (annonce_id);


--
-- TOC entry 5765 (class 1259 OID 17915)
-- Name: idx_consultations_contacts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consultations_contacts ON public.consultations USING btree (etudiant_id, annonce_id) WHERE (contacts_affiches = true);


--
-- TOC entry 5766 (class 1259 OID 17913)
-- Name: idx_consultations_etudiant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consultations_etudiant ON public.consultations USING btree (etudiant_id);


--
-- TOC entry 5757 (class 1259 OID 17879)
-- Name: idx_contacts_annonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_annonce ON public.contacts_annonce USING btree (annonce_id);


--
-- TOC entry 5739 (class 1259 OID 17819)
-- Name: idx_logements_coordonnees; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logements_coordonnees ON public.logements USING gist (coordonnees);


--
-- TOC entry 5740 (class 1259 OID 17817)
-- Name: idx_logements_proprietaire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logements_proprietaire ON public.logements USING btree (proprietaire_id);


--
-- TOC entry 5741 (class 1259 OID 17820)
-- Name: idx_logements_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logements_type ON public.logements USING btree (type_logement);


--
-- TOC entry 5742 (class 1259 OID 17818)
-- Name: idx_logements_ville; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logements_ville ON public.logements USING btree (ville);


--
-- TOC entry 5751 (class 1259 OID 17862)
-- Name: idx_photos_annonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photos_annonce ON public.photos USING btree (annonce_id);


--
-- TOC entry 5752 (class 1259 OID 17863)
-- Name: idx_photos_phash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photos_phash ON public.photos USING btree (phash);


--
-- TOC entry 5781 (class 1259 OID 18013)
-- Name: idx_recommandations_etudiant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recommandations_etudiant ON public.recommandations USING btree (etudiant_id);


--
-- TOC entry 5782 (class 1259 OID 18014)
-- Name: idx_recommandations_expiration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recommandations_expiration ON public.recommandations USING btree (date_expiration);


--
-- TOC entry 5775 (class 1259 OID 17989)
-- Name: idx_signalements_annonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signalements_annonce ON public.signalements USING btree (annonce_id);


--
-- TOC entry 5776 (class 1259 OID 17990)
-- Name: idx_signalements_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signalements_statut ON public.signalements USING btree (statut);


--
-- TOC entry 5722 (class 1259 OID 17759)
-- Name: idx_universites_coordonnees; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_universites_coordonnees ON public.universites USING gist (coordonnees);


--
-- TOC entry 5723 (class 1259 OID 17758)
-- Name: idx_universites_ville; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_universites_ville ON public.universites USING btree (ville);


--
-- TOC entry 5726 (class 1259 OID 17789)
-- Name: idx_utilisateurs_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_utilisateurs_email ON public.utilisateurs USING btree (email);


--
-- TOC entry 5727 (class 1259 OID 17788)
-- Name: idx_utilisateurs_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_utilisateurs_role ON public.utilisateurs USING btree (role);


--
-- TOC entry 5728 (class 1259 OID 17790)
-- Name: idx_utilisateurs_universite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_utilisateurs_universite ON public.utilisateurs USING btree (universite_id) WHERE (universite_id IS NOT NULL);


--
-- TOC entry 5806 (class 2620 OID 18027)
-- Name: annonces trg_annonce_expiration; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_annonce_expiration BEFORE INSERT OR UPDATE OF date_publication ON public.annonces FOR EACH ROW EXECUTE FUNCTION public.set_annonce_expiration();


--
-- TOC entry 5807 (class 2620 OID 18023)
-- Name: annonces trg_annonces_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_annonces_updated_at BEFORE UPDATE ON public.annonces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5810 (class 2620 OID 17992)
-- Name: signalements trg_auto_suspend; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_suspend AFTER INSERT ON public.signalements FOR EACH ROW EXECUTE FUNCTION public.auto_suspend_annonce();


--
-- TOC entry 5808 (class 2620 OID 17865)
-- Name: photos trg_check_photos_max; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_photos_max BEFORE INSERT ON public.photos FOR EACH ROW EXECUTE FUNCTION public.check_photos_count();


--
-- TOC entry 5805 (class 2620 OID 18022)
-- Name: logements trg_logements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_logements_updated_at BEFORE UPDATE ON public.logements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5809 (class 2620 OID 18025)
-- Name: avis trg_recalcule_note; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recalcule_note AFTER INSERT OR DELETE OR UPDATE ON public.avis FOR EACH ROW EXECUTE FUNCTION public.recalcule_note_proprietaire();


--
-- TOC entry 5811 (class 2620 OID 18029)
-- Name: recommandations trg_recommandation_expiration; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recommandation_expiration BEFORE INSERT OR UPDATE OF date_generation ON public.recommandations FOR EACH ROW EXECUTE FUNCTION public.set_recommandation_expiration();


--
-- TOC entry 5804 (class 2620 OID 18021)
-- Name: utilisateurs trg_utilisateurs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_utilisateurs_updated_at BEFORE UPDATE ON public.utilisateurs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5790 (class 2606 OID 17885)
-- Name: annonce_equipements annonce_equipements_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonce_equipements
    ADD CONSTRAINT annonce_equipements_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- TOC entry 5791 (class 2606 OID 17890)
-- Name: annonce_equipements annonce_equipements_equipement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonce_equipements
    ADD CONSTRAINT annonce_equipements_equipement_id_fkey FOREIGN KEY (equipement_id) REFERENCES public.equipements(id) ON DELETE CASCADE;


--
-- TOC entry 5787 (class 2606 OID 17837)
-- Name: annonces annonces_logement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT annonces_logement_id_fkey FOREIGN KEY (logement_id) REFERENCES public.logements(id) ON DELETE CASCADE;


--
-- TOC entry 5796 (class 2606 OID 17950)
-- Name: avis avis_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- TOC entry 5797 (class 2606 OID 17955)
-- Name: avis avis_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE;


--
-- TOC entry 5798 (class 2606 OID 17945)
-- Name: avis avis_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- TOC entry 5792 (class 2606 OID 17908)
-- Name: consultations consultations_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- TOC entry 5793 (class 2606 OID 17903)
-- Name: consultations consultations_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- TOC entry 5789 (class 2606 OID 17874)
-- Name: contacts_annonce contacts_annonce_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts_annonce
    ADD CONSTRAINT contacts_annonce_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- TOC entry 5794 (class 2606 OID 17927)
-- Name: favoris favoris_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoris
    ADD CONSTRAINT favoris_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- TOC entry 5795 (class 2606 OID 17922)
-- Name: favoris favoris_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoris
    ADD CONSTRAINT favoris_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- TOC entry 5786 (class 2606 OID 17812)
-- Name: logements logements_proprietaire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logements
    ADD CONSTRAINT logements_proprietaire_id_fkey FOREIGN KEY (proprietaire_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- TOC entry 5788 (class 2606 OID 17857)
-- Name: photos photos_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- TOC entry 5802 (class 2606 OID 18008)
-- Name: recommandations recommandations_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommandations
    ADD CONSTRAINT recommandations_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- TOC entry 5803 (class 2606 OID 18003)
-- Name: recommandations recommandations_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommandations
    ADD CONSTRAINT recommandations_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- TOC entry 5799 (class 2606 OID 17984)
-- Name: signalements signalements_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- TOC entry 5800 (class 2606 OID 17979)
-- Name: signalements signalements_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- TOC entry 5801 (class 2606 OID 17974)
-- Name: signalements signalements_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- TOC entry 5785 (class 2606 OID 17783)
-- Name: utilisateurs utilisateurs_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE SET NULL;


-- Completed on 2026-04-27 21:42:22

--
-- PostgreSQL database dump complete
--

\unrestrict GCclTSh7IQBKPf46zMmAKQhmlKyJ9vjCxgYqelRI4S4R6icoQNu4E72GUgWzuJp

