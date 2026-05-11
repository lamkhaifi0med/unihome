--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_enum AS ENUM (
    'ETUDIANT',
    'PROPRIETAIRE',
    'ADMIN'
);


--
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
-- Name: statut_logement_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.statut_logement_enum AS ENUM (
    'DISPONIBLE',
    'OCCUPE',
    'ARCHIVE'
);


--
-- Name: statut_signalement_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.statut_signalement_enum AS ENUM (
    'OUVERT',
    'TRAITE',
    'REJETE'
);


--
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
-- Name: type_logement_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.type_logement_enum AS ENUM (
    'STUDIO',
    'CHAMBRE',
    'COLOCATION',
    'APPARTEMENT'
);


--
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

    -- Mise +á jour du compteur d+¬normalis+¬ sur annonces
    UPDATE annonces
    SET nb_signalements = (
        SELECT COUNT(*) FROM signalements WHERE annonce_id = NEW.annonce_id
    )
    WHERE id = NEW.annonce_id;

    RETURN NEW;
END;
$$;


--
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
-- Name: recalcule_note_proprietaire(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recalcule_note_proprietaire() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_proprietaire_id UUID;
BEGIN
    -- R+¬cup+¬rer le propri+¬taire via annonce GåÆ logement
    SELECT l.proprietaire_id INTO v_proprietaire_id
    FROM annonces a
    JOIN logements l ON l.id = a.logement_id
    WHERE a.id = NEW.annonce_id;

    -- Recalcul agr+¬g+¬
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
-- Name: annonce_equipements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annonce_equipements (
    annonce_id uuid NOT NULL,
    equipement_id integer NOT NULL
);


--
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
    raison_statut text,
    CONSTRAINT annonces_loyer_check CHECK ((loyer > (0)::numeric)),
    CONSTRAINT annonces_nb_signalements_check CHECK ((nb_signalements >= 0)),
    CONSTRAINT annonces_score_confiance_check CHECK (((score_confiance >= 0) AND (score_confiance <= 100)))
);


--
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
-- Name: confirmation_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.confirmation_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    utilisateur_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
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
-- Name: contacts_annonce; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts_annonce (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    annonce_id uuid NOT NULL,
    plateforme public.type_contact_enum NOT NULL,
    valeur character varying(300) NOT NULL
);


--
-- Name: equipements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipements (
    id integer NOT NULL,
    libelle character varying(100) NOT NULL
);


--
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
-- Name: equipements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipements_id_seq OWNED BY public.equipements.id;


--
-- Name: favoris; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favoris (
    etudiant_id uuid NOT NULL,
    annonce_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
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
    justificatif_url text,
    adresse_confirmee boolean DEFAULT false,
    CONSTRAINT logements_superficie_check CHECK ((superficie > (0)::numeric))
);


--
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
-- Name: equipements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipements ALTER COLUMN id SET DEFAULT nextval('public.equipements_id_seq'::regclass);


--
-- Name: annonce_equipements annonce_equipements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonce_equipements
    ADD CONSTRAINT annonce_equipements_pkey PRIMARY KEY (annonce_id, equipement_id);


--
-- Name: annonces annonces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT annonces_pkey PRIMARY KEY (id);


--
-- Name: avis avis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_pkey PRIMARY KEY (id);


--
-- Name: confirmation_tokens confirmation_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.confirmation_tokens
    ADD CONSTRAINT confirmation_tokens_pkey PRIMARY KEY (id);


--
-- Name: confirmation_tokens confirmation_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.confirmation_tokens
    ADD CONSTRAINT confirmation_tokens_token_key UNIQUE (token);


--
-- Name: consultations consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);


--
-- Name: contacts_annonce contacts_annonce_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts_annonce
    ADD CONSTRAINT contacts_annonce_pkey PRIMARY KEY (id);


--
-- Name: equipements equipements_libelle_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipements
    ADD CONSTRAINT equipements_libelle_key UNIQUE (libelle);


--
-- Name: equipements equipements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipements
    ADD CONSTRAINT equipements_pkey PRIMARY KEY (id);


--
-- Name: favoris favoris_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoris
    ADD CONSTRAINT favoris_pkey PRIMARY KEY (etudiant_id, annonce_id);


--
-- Name: logements logements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logements
    ADD CONSTRAINT logements_pkey PRIMARY KEY (id);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: recommandations recommandations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommandations
    ADD CONSTRAINT recommandations_pkey PRIMARY KEY (id);


--
-- Name: signalements signalements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_pkey PRIMARY KEY (id);


--
-- Name: universites universites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universites
    ADD CONSTRAINT universites_pkey PRIMARY KEY (id);


--
-- Name: avis uq_avis_etudiant_annonce; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT uq_avis_etudiant_annonce UNIQUE (etudiant_id, annonce_id);


--
-- Name: contacts_annonce uq_contact_annonce_plateforme; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts_annonce
    ADD CONSTRAINT uq_contact_annonce_plateforme UNIQUE (annonce_id, plateforme);


--
-- Name: signalements uq_signalement_etudiant_annonce; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT uq_signalement_etudiant_annonce UNIQUE (etudiant_id, annonce_id);


--
-- Name: utilisateurs utilisateurs_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_email_key UNIQUE (email);


--
-- Name: utilisateurs utilisateurs_numero_cin_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_numero_cin_key UNIQUE (numero_cin);


--
-- Name: utilisateurs utilisateurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_pkey PRIMARY KEY (id);


--
-- Name: idx_annonces_detail_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_annonces_detail_score ON public.annonces USING gin (detail_score);


--
-- Name: idx_annonces_logement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_annonces_logement ON public.annonces USING btree (logement_id);


--
-- Name: idx_annonces_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_annonces_score ON public.annonces USING btree (score_confiance);


--
-- Name: idx_annonces_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_annonces_statut ON public.annonces USING btree (statut);


--
-- Name: idx_avis_annonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avis_annonce ON public.avis USING btree (annonce_id);


--
-- Name: idx_avis_etudiant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avis_etudiant ON public.avis USING btree (etudiant_id);


--
-- Name: idx_consultations_annonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consultations_annonce ON public.consultations USING btree (annonce_id);


--
-- Name: idx_consultations_contacts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consultations_contacts ON public.consultations USING btree (etudiant_id, annonce_id) WHERE (contacts_affiches = true);


--
-- Name: idx_consultations_etudiant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consultations_etudiant ON public.consultations USING btree (etudiant_id);


--
-- Name: idx_contacts_annonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_annonce ON public.contacts_annonce USING btree (annonce_id);


--
-- Name: idx_logements_coordonnees; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logements_coordonnees ON public.logements USING gist (coordonnees);


--
-- Name: idx_logements_proprietaire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logements_proprietaire ON public.logements USING btree (proprietaire_id);


--
-- Name: idx_logements_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logements_type ON public.logements USING btree (type_logement);


--
-- Name: idx_logements_ville; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logements_ville ON public.logements USING btree (ville);


--
-- Name: idx_photos_annonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photos_annonce ON public.photos USING btree (annonce_id);


--
-- Name: idx_photos_phash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photos_phash ON public.photos USING btree (phash);


--
-- Name: idx_recommandations_etudiant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recommandations_etudiant ON public.recommandations USING btree (etudiant_id);


--
-- Name: idx_recommandations_expiration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recommandations_expiration ON public.recommandations USING btree (date_expiration);


--
-- Name: idx_signalements_annonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signalements_annonce ON public.signalements USING btree (annonce_id);


--
-- Name: idx_signalements_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signalements_statut ON public.signalements USING btree (statut);


--
-- Name: idx_universites_coordonnees; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_universites_coordonnees ON public.universites USING gist (coordonnees);


--
-- Name: idx_universites_ville; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_universites_ville ON public.universites USING btree (ville);


--
-- Name: idx_utilisateurs_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_utilisateurs_email ON public.utilisateurs USING btree (email);


--
-- Name: idx_utilisateurs_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_utilisateurs_role ON public.utilisateurs USING btree (role);


--
-- Name: idx_utilisateurs_universite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_utilisateurs_universite ON public.utilisateurs USING btree (universite_id) WHERE (universite_id IS NOT NULL);


--
-- Name: annonces trg_annonce_expiration; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_annonce_expiration BEFORE INSERT OR UPDATE OF date_publication ON public.annonces FOR EACH ROW EXECUTE FUNCTION public.set_annonce_expiration();


--
-- Name: annonces trg_annonces_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_annonces_updated_at BEFORE UPDATE ON public.annonces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: signalements trg_auto_suspend; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_suspend AFTER INSERT ON public.signalements FOR EACH ROW EXECUTE FUNCTION public.auto_suspend_annonce();


--
-- Name: photos trg_check_photos_max; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_photos_max BEFORE INSERT ON public.photos FOR EACH ROW EXECUTE FUNCTION public.check_photos_count();


--
-- Name: logements trg_logements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_logements_updated_at BEFORE UPDATE ON public.logements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: avis trg_recalcule_note; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recalcule_note AFTER INSERT OR DELETE OR UPDATE ON public.avis FOR EACH ROW EXECUTE FUNCTION public.recalcule_note_proprietaire();


--
-- Name: recommandations trg_recommandation_expiration; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recommandation_expiration BEFORE INSERT OR UPDATE OF date_generation ON public.recommandations FOR EACH ROW EXECUTE FUNCTION public.set_recommandation_expiration();


--
-- Name: utilisateurs trg_utilisateurs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_utilisateurs_updated_at BEFORE UPDATE ON public.utilisateurs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: annonce_equipements annonce_equipements_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonce_equipements
    ADD CONSTRAINT annonce_equipements_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- Name: annonce_equipements annonce_equipements_equipement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonce_equipements
    ADD CONSTRAINT annonce_equipements_equipement_id_fkey FOREIGN KEY (equipement_id) REFERENCES public.equipements(id) ON DELETE CASCADE;


--
-- Name: annonces annonces_logement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT annonces_logement_id_fkey FOREIGN KEY (logement_id) REFERENCES public.logements(id) ON DELETE CASCADE;


--
-- Name: avis avis_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- Name: avis avis_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE;


--
-- Name: avis avis_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: confirmation_tokens confirmation_tokens_utilisateur_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.confirmation_tokens
    ADD CONSTRAINT confirmation_tokens_utilisateur_fk FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id);


--
-- Name: consultations consultations_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- Name: consultations consultations_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: contacts_annonce contacts_annonce_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts_annonce
    ADD CONSTRAINT contacts_annonce_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- Name: favoris favoris_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoris
    ADD CONSTRAINT favoris_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- Name: favoris favoris_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoris
    ADD CONSTRAINT favoris_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: logements logements_proprietaire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logements
    ADD CONSTRAINT logements_proprietaire_id_fkey FOREIGN KEY (proprietaire_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: photos photos_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- Name: recommandations recommandations_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommandations
    ADD CONSTRAINT recommandations_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- Name: recommandations recommandations_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommandations
    ADD CONSTRAINT recommandations_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: signalements signalements_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: signalements signalements_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- Name: signalements signalements_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: utilisateurs utilisateurs_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


