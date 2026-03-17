# Audit de performance — Site IFT v3.0

## Table des matières

1. [Architecture actuelle](#1-architecture-actuelle)
2. [Flux de données actuel](#2-flux-de-données-actuel)
3. [Diagnostic de performance](#3-diagnostic-de-performance)
4. [Architecture optimisée](#4-architecture-optimisée)
5. [Plan de migration](#5-plan-de-migration)

---

## 1. Architecture actuelle

### 1.1 Stack technique

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React 18 + Vite 6)        │
│                                                         │
│  React Router · Tailwind CSS · Radix UI · Framer Motion │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ AuthContext  │  │  CMSContext   │  │  Pages (8)     │  │
│  │ (session)   │──│  (contenu)   │──│  Home, About…  │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (fetch)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Uvicorn)            │
│                                                         │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ /resources/* │  │ /upload  │  │ /auth/*           │  │
│  │ CRUD + Pub   │  │ (inutilisé│  │ OAuth/JWT/Gate   │  │
│  └──────┬───────┘  │ par le CMS│  └───────────────────┘  │
│         │          └──────────┘                          │
│         ▼                                                │
│  ┌─────────────────────────────────────────────────┐     │
│  │            Stockage fichier JSON                 │     │
│  │  backend/db/INDEX     → slug ↔ uid mapping       │     │
│  │  backend/db/{uid}.json → contenu complet (+ b64) │     │
│  │  backend/db/search_index/ → Whoosh (full-text)   │     │
│  └─────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Pages et slugs

| Slug | Route | Rôle |
|------|-------|------|
| `page-home` | `/` | Accueil (hero, projets, événements) |
| `page-about` | `/about` | Présentation, équipe |
| `page-research` | `/research` | Thèmes, publications |
| `page-education` | `/education` | Programmes, projets étudiants |
| `page-arts` | `/arts` | Expositions, archives |
| `page-events` | `/events` | Talks, festivals |
| `page-collaborate` | `/collaborate` | Partenaires, contact |
| `page-footer` | (global) | Footer du site |

---

## 2. Flux de données actuel

### 2.1 Chargement initial — toutes les pages d'un coup

```
┌──────────┐                          ┌──────────────┐
│ Navigateur│                          │   Backend    │
│  (React)  │                          │  (FastAPI)   │
└────┬──────┘                          └──────┬───────┘
     │                                        │
     │  ── App mount ──────────────────────►   │
     │                                        │
     │  CMSContext.loadData()                  │
     │  Promise.allSettled(8 requêtes)         │
     │                                        │
     │  GET /resources/page-home?version=Draft │
     │  ─────────────────────────────────────► │──► Lit {uid}.json
     │  ◄──────── 1.6 kB ─────── 312 ms ──── │
     │                                        │
     │  GET /resources/page-about?version=Draft│
     │  ─────────────────────────────────────► │──► Lit {uid}.json
     │  ◄──── 10,628 kB ────── 26.32 s ───── │    (10 Mo de base64 !)
     │                                        │
     │  GET /resources/page-research?v=Draft   │
     │  ─────────────────────────────────────► │──► Lit {uid}.json
     │  ◄──── 17,745 kB ────── 38.28 s ───── │    (17 Mo de base64 !)
     │                                        │
     │  GET /resources/page-education?v=Draft  │
     │  ─────────────────────────────────────► │──► Lit {uid}.json
     │  ◄──── 16,856 kB ────── 37.75 s ───── │    (16 Mo de base64 !)
     │                                        │
     │  GET /resources/page-arts?version=Draft │
     │  ─────────────────────────────────────► │──► Lit {uid}.json
     │  ◄───── 1,506 kB ─────── 5.67 s ───── │
     │                                        │
     │  GET /resources/page-events?v=Draft     │
     │  ─────────────────────────────────────► │──► Lit {uid}.json
     │  ◄───── 5.1 kB ──────── 495 ms ────── │
     │                                        │
     │  GET /resources/page-collaborate?v=Draft│
     │  ─────────────────────────────────────► │
     │  ◄───── ... ──────────────────────────  │
     │                                        │
     │  GET /resources/page-footer?v=Draft     │
     │  ─────────────────────────────────────► │
     │  ◄───── ... ──────────────────────────  │
     │                                        │
     │  ── Toutes les réponses reçues ────►    │
     │  setData(merged)                        │
     │  sessionStorage.setItem(cache)          │
     │                                        │
     │  ✅ Site prêt (~40 secondes plus tard)  │
     └────────────────────────────────────────┘
```

### 2.2 Upload d'image — encodage base64

```
┌──────────────────────────────────────────────────────────────┐
│                     FLUX ACTUEL D'UPLOAD                      │
└──────────────────────────────────────────────────────────────┘

   Utilisateur sélectionne un fichier image (ex: photo 2 Mo)
                         │
                         ▼
   ┌──────────────────────────────────────┐
   │  EditableImageSingle.tsx             │
   │                                      │
   │  FileReader.readAsDataURL(file)      │
   │       │                              │
   │       ▼                              │
   │  "data:image/jpeg;base64,/9j/4AA..." │  ← Chaîne base64 (~2.7 Mo)
   │       │                              │     (+33% vs binaire)
   │       ▼                              │
   │  updateContent(id, dataUrl)          │
   └──────────┬───────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────┐
   │  CMSContext.updateContent()          │
   │                                      │
   │  1. Met à jour le state local        │
   │  2. GET /resources/{slug} (Draft)    │  ← Re-télécharge la page entière
   │  3. Insère la clé dans content[]     │
   │  4. PUT /resources/{slug}            │  ← Re-upload la page entière
   │     body = JSON complet avec TOUTES  │    incluant TOUTES les images
   │     les images base64 de la page     │    base64 de cette page
   └──────────────────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────┐
   │  Backend: resources.py               │
   │                                      │
   │  Écrit le JSON entier dans           │
   │  backend/db/{uid}.json               │
   │  → Fichier de 10-17 Mo              │
   └──────────────────────────────────────┘
```

---

## 3. Diagnostic de performance

### 3.1 Mesures réseau (réseau entreprise)

| Requête | Taille | Temps | Problème |
|---------|--------|-------|----------|
| `page-home` | 1.6 kB | 312 ms | ✅ OK |
| `page-about` | **10,628 kB** | **26.32 s** | ❌ Images d'équipe en base64 |
| `page-research` | **17,745 kB** | **38.28 s** | ❌ Images publications en base64 |
| `page-education` | **16,856 kB** | **37.75 s** | ❌ Images programmes en base64 |
| `page-arts` | 1,506 kB | 5.67 s | ⚠️ Quelques images base64 |
| `page-events` | 5.1 kB | 495 ms | ✅ OK |
| **TOTAL** | **~49 Mo** | **~40 s** | ❌ |

### 3.2 Causes racines identifiées

```
┌─────────────────────────────────────────────────────────────┐
│                    CAUSES RACINES                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ CAUSE 1 : Images en base64 dans le JSON                │
│  ──────────────────────────────────────────                 │
│  • EditableImage/EditableImageSingle utilisent              │
│    FileReader.readAsDataURL() au lieu de /upload            │
│  • Les chaînes "data:image/..." sont stockées              │
│    directement dans le contenu de la ressource              │
│  • Base64 = +33% de taille vs binaire                      │
│  • Pas de compression, pas de cache CDN                     │
│  • Chaque PUT re-transmet TOUTES les images                │
│                                                             │
│  ❌ CAUSE 2 : Chargement de toutes les pages au démarrage  │
│  ──────────────────────────────────────────────             │
│  • CMSContext.loadData() fetch les 8 slugs en parallèle    │
│  • L'utilisateur sur / télécharge aussi les données        │
│    de /about, /research, /education, etc.                   │
│  • Les 8 réponses sont fusionnées dans un seul objet       │
│  • Le cache sessionStorage essaie de stocker ~45 Mo        │
│    (dépasse souvent le quota → échec silencieux)            │
│                                                             │
│  ❌ CAUSE 3 : Pas d'optimisation des images                │
│  ──────────────────────────────────────────                 │
│  • Pas de redimensionnement                                 │
│  • Pas de conversion WebP/AVIF                              │
│  • Pas de lazy loading côté navigateur                      │
│  • Pas de cache HTTP (pas d'ETag, pas de Cache-Control)     │
│                                                             │
│  ⚠️ FACTEUR AGGRAVANT : Réseau entreprise                  │
│  ──────────────────────────────────────                     │
│  • Proxy d'entreprise avec inspection SSL                   │
│  • Bande passante partagée entre utilisateurs               │
│  • Latence accrue sur les gros payloads                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Impact

```
                    COMPARAISON DES TAILLES

  Actuel (base64 dans JSON):
  ┌──────────────────────────────────────────────────┐
  │████████████████████████████████████████████████   │ ~49 Mo
  └──────────────────────────────────────────────────┘

  Optimal (URLs + images séparées):
  ┌─┐                                                   ~50 Ko (JSON seul)
  └─┘
  + images chargées à la demande, avec cache navigateur

  Ratio : ~1000x de réduction sur le payload JSON initial
```

---

## 4. Architecture optimisée

### 4.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 18 + Vite 6)             │
│                                                             │
│  ┌──────────────┐   ┌───────────────┐   ┌───────────────┐  │
│  │  AuthContext  │   │  CMSContext    │   │  Pages        │  │
│  │  (inchangé)  │   │  (lazy-load)  │   │  (route-based)│  │
│  └──────────────┘   └───────┬───────┘   └───────────────┘  │
│                             │                               │
│                 Fetch uniquement la page                     │
│                 de la route courante                         │
│                 + footer (global)                            │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP (fetch)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI + Uvicorn)                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ /resources/* │  │ /upload      │  │ /uploads/{hash}   │  │
│  │ JSON léger   │  │ Stocke le    │  │ Sert les images   │  │
│  │ (URLs, pas   │  │ fichier      │  │ avec cache HTTP   │  │
│  │  de base64)  │  │ SHA-256      │  │ (Cache-Control,   │  │
│  └──────────────┘  └──────────────┘  │  ETag)            │  │
│                                      └───────────────────┘  │
│         ┌─────────────────────────────────────────┐         │
│         │            Stockage                      │         │
│         │  backend/db/{uid}.json  → JSON léger     │         │
│         │  backend/db/uploads/   → fichiers images │         │
│         └─────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Nouveau flux d'upload d'image

```
┌──────────────────────────────────────────────────────────────┐
│                   FLUX OPTIMISÉ D'UPLOAD                      │
└──────────────────────────────────────────────────────────────┘

   Utilisateur sélectionne un fichier image (ex: photo 2 Mo)
                         │
                         ▼
   ┌──────────────────────────────────────┐
   │  EditableImageSingle.tsx (modifié)   │
   │                                      │
   │  api.uploadFile(file)                │  ← Upload binaire direct
   │       │                              │    via FormData (pas de base64)
   │       ▼                              │
   │  POST /upload                        │
   │       │                              │
   │       ▼                              │
   │  Réponse: { url: "/uploads/a1b2c3" } │
   │       │                              │
   │       ▼                              │
   │  updateContent(id, url)              │  ← Stocke l'URL, pas le base64
   └──────────┬───────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────┐
   │  CMSContext.updateContent()          │
   │                                      │
   │  PUT /resources/{slug}               │
   │  body = JSON léger avec des URLs     │  ← ~2 Ko au lieu de ~10 Mo
   │  ex: "/uploads/a1b2c3d4e5f6..."      │
   └──────────────────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────┐
   │  Backend: upload.py                  │
   │                                      │
   │  1. SHA-256 du contenu → dédup       │
   │  2. Stocke dans backend/db/uploads/  │
   │  3. Retourne /uploads/{hash}         │
   └──────────────────────────────────────┘
```

### 4.3 Nouveau flux de chargement — lazy par route

```
┌──────────┐                          ┌──────────────┐
│ Navigateur│                          │   Backend    │
│  (React)  │                          │  (FastAPI)   │
└────┬──────┘                          └──────┬───────┘
     │                                        │
     │  ── Visite / ───────────────────────►   │
     │                                        │
     │  CMSContext charge uniquement:          │
     │                                        │
     │  GET /resources/page-home?version=Draft │
     │  ─────────────────────────────────────► │
     │  ◄──────── ~2 kB ────── <100 ms ───── │  ← Plus de base64 !
     │                                        │
     │  GET /resources/page-footer?v=Draft     │
     │  ─────────────────────────────────────► │
     │  ◄──────── ~1 kB ────── <50 ms ────── │
     │                                        │
     │  ✅ Page / prête en <200 ms            │
     │                                        │
     │  ── Navigation vers /about ──────────►  │
     │                                        │
     │  GET /resources/page-about?v=Draft      │
     │  ─────────────────────────────────────► │
     │  ◄──────── ~5 kB ────── <100 ms ───── │  ← URLs, pas de base64
     │                                        │
     │  Le navigateur charge les images:       │
     │                                        │
     │  GET /uploads/a1b2c3... (team-photo-1)  │
     │  ─────────────────────────────────────► │
     │  ◄──────── 200 kB ───── 100 ms ────── │  ← Cache HTTP !
     │                                        │
     │  GET /uploads/d4e5f6... (team-photo-2)  │
     │  ─────────────────────────────────────► │
     │  ◄──── 304 Not Modified (cache) ────── │  ← Instant !
     │                                        │
     └────────────────────────────────────────┘
```

### 4.4 Comparaison avant/après

```
┌────────────────────┬──────────────────────┬──────────────────────┐
│                    │   ACTUEL (v3.0)      │   OPTIMISÉ           │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Payload initial    │ ~49 Mo (8 pages)     │ ~3 Ko (1 page)       │
│ Temps de chargement│ ~40 secondes         │ < 1 seconde          │
│ Stockage images    │ base64 dans JSON     │ Fichiers /uploads/   │
│ Taille d'un PUT    │ 10-17 Mo             │ < 10 Ko              │
│ Cache navigateur   │ ❌ Impossible        │ ✅ Cache-Control     │
│ Pages chargées     │ 8 (toutes)           │ 1-2 (route courante) │
│ Réseau entreprise  │ ❌ 40s+ de blocage   │ ✅ Fluide            │
│ sessionStorage     │ ⚠️ Dépasse le quota  │ ✅ Quelques Ko       │
│ Dédup images       │ ❌ Dupliquées        │ ✅ SHA-256           │
└────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 5. Plan de migration

### 5.1 Étapes

```
  PHASE 1 : Migration des images existantes
  ──────────────────────────────────────────
  ┌────────┐    ┌────────────┐    ┌──────────────┐    ┌────────────┐
  │ Lire   │───►│ Détecter   │───►│ Décoder et   │───►│ Remplacer  │
  │ chaque │    │ champs     │    │ sauvegarder  │    │ base64 par │
  │ {uid}  │    │ "data:image│    │ dans         │    │ URL dans   │
  │ .json  │    │ /..."      │    │ /uploads/    │    │ le JSON    │
  └────────┘    └────────────┘    └──────────────┘    └────────────┘

  Résultat: les fichiers JSON passent de 10-17 Mo à < 10 Ko


  PHASE 2 : Modifier les composants d'upload
  ──────────────────────────────────────────
  ┌───────────────────────┐    ┌──────────────────────────┐
  │ EditableImageSingle   │    │ EditableImage             │
  │                       │    │                           │
  │ AVANT:                │    │ AVANT:                    │
  │ readAsDataURL(file)   │    │ readAsDataURL(file)       │
  │ updateContent(id,b64) │    │ onChange(b64)             │
  │                       │    │                           │
  │ APRÈS:                │    │ APRÈS:                    │
  │ api.uploadFile(file)  │    │ api.uploadFile(file)      │
  │ updateContent(id,url) │    │ onChange(url)             │
  └───────────────────────┘    └──────────────────────────┘


  PHASE 3 : Lazy-loading par route dans CMSContext
  ─────────────────────────────────────────────────
  ┌──────────────────────────────────────────────────────┐
  │  CMSContext.loadData() — AVANT                       │
  │                                                      │
  │  Promise.allSettled(                                  │
  │    PAGE_SLUGS.map(slug => getResource(slug))         │
  │  )  → 8 requêtes → ~49 Mo                           │
  │                                                      │
  │  CMSContext.loadData() — APRÈS                       │
  │                                                      │
  │  const route = useLocation().pathname                 │
  │  const slugs = routeToSlugs(route) // ex: ["page-home", "page-footer"]
  │  Promise.allSettled(                                  │
  │    slugs.map(slug => getResource(slug))              │
  │  )  → 2 requêtes → ~5 Ko                            │
  │                                                      │
  │  + prefetch des autres pages en arrière-plan (idle)  │
  └──────────────────────────────────────────────────────┘


  PHASE 4 (optionnel) : Optimisation des images servies
  ─────────────────────────────────────────────────────
  • Cache-Control: public, max-age=31536000, immutable
    (hash dans l'URL → cache infini, le hash change si l'image change)
  • Compression gzip/brotli sur les réponses JSON
  • Redimensionnement serveur (thumbnails)
  • Conversion automatique WebP
```

### 5.2 Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| `src/components/cms/EditableImageSingle.tsx` | `readAsDataURL` → `api.uploadFile` |
| `src/components/cms/EditableImage.tsx` | `readAsDataURL` → `api.uploadFile` |
| `src/context/CMSContext.tsx` | Lazy-load par route au lieu de toutes les pages |
| `src/lib/resourceMapping.ts` | Ajouter mapping route → slugs |
| `backend/app/routers/upload.py` | Ajouter headers de cache |
| `backend/db/*.json` | Migration des base64 → URLs (script) |
| Nouveau: `scripts/migrate_base64.py` | Script de migration des images existantes |

### 5.3 Risques et précautions

```
  ⚠️  POINTS D'ATTENTION
  ──────────────────────

  1. Migration non-destructive
     → Sauvegarder backend/db/ avant migration
     → Le script doit être idempotent (relançable sans risque)

  2. Compatibilité des URLs
     → Les <img src="..."> existants avec data:image/... continueront
       à fonctionner, donc migration progressive possible

  3. Endpoint /upload et auth
     → /upload requiert actuellement l'authentification
     → Les images servies via /uploads/{hash} doivent être publiques

  4. Limite de taille
     → /upload actuel : max 10 Mo par fichier
     → Suffisant pour des photos de site vitrine
```
