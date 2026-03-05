# Architecture du site IFT (Institute for Future Technologies)

Ce document décrit l'ensemble des briques du site et son fonctionnement actuel.

---

## 1. Vue d'ensemble

Le site est une application web **React + Vite** qui fonctionne comme :

- **Site public** : vitrine pour l'institut (recherche, éducation, arts, événements, collaboration)
- **CMS en ligne** : édition de contenu par des utilisateurs authentifiés via un mot de passe local
- **Espace admin** : accès au dashboard pour éditer le contenu

---

## 2. Stack technique

| Technologie | Usage |
|-------------|-------|
| **React 18** | UI |
| **Vite 6** | Build et dev server |
| **React Router** | Navigation |
| **localStorage / sessionStorage** | CMS content + auth (pas de base de données) |
| **Tailwind CSS** | Styles |
| **Radix UI** | Composants (dialog, tabs, etc.) |
| **Motion (Framer Motion)** | Animations |
| **React Markdown + remark-gfm** | Rendu Markdown pour le contenu éditable |

---

## 3. Structure des dossiers

```
src/
├── App.tsx              # Point d'entrée, routes, providers
├── main.tsx
├── context/
│   ├── AuthContext.tsx   # État utilisateur (session locale)
│   └── CMSContext.tsx    # État CMS (contenu, mode édition)
├── components/
│   ├── cms/             # Composants d'édition CMS
│   ├── ui/              # Composants UI réutilisables (shadcn/radix)
│   └── [pages]          # Hero, FeaturedProjects, About, etc.
├── lib/
│   ├── auth.service.ts  # signOut (efface session locale)
│   └── cmsPermissions.ts # Mapping clés CMS → sections → rôles
```

---

## 4. Flux de données et providers

### Arborescence des providers

```
Router
└── AuthProvider          # Gère user, profile, role (local)
    └── CMSWrapper
        └── CMSProvider   # Gère isEditing, getContent, updateContent
            └── [App content]
```

### AuthContext

- **Responsabilités** :
  - Authentification locale via mot de passe (PasswordGate)
  - Session stockée dans `sessionStorage` sous `ift_local_admin`
  - Exposition de `user`, `profile`, `loading`, `role`, `isAdmin`, `canEditKey`, `canEditAny`, `signOut`
- **Rôle** : quand le gate est validé, l'utilisateur a le rôle `admin`
- **Événement** : `ift_auth_change` dispatché à la connexion/déconnexion pour rafraîchir les données CMS

### CMSContext

- **Responsabilités** :
  - Chargement du contenu depuis `localStorage` sous la clé `ift_cms_data`
  - Mode édition (toggle via bouton flottant)
  - `getContent(key, default)` : lecture d'une clé CMS
  - `updateContent(key, value)` : écriture (avec vérification `canEditKey`)
- **Stockage** : tout est dans `localStorage` ; pas de base de données

---

## 5. Système de permissions CMS

### Rôles et sections

| Rôle | Sections modifiables |
|------|----------------------|
| **admin** | Toutes (hero, featured, latest_events, about, research, arts, education, events, collaborate, footer) |
| **staff** | about, research, arts, education, events |
| **students** | education uniquement |

Avec l'auth locale (PasswordGate), l'utilisateur authentifié a toujours le rôle `admin`.

---

## 6. Routes et pages

| Route | Contenu | Accès |
|-------|---------|-------|
| `/` | Hero + Featured Projects + Latest Events | Public |
| `/about` | À propos | Public |
| `/research` | Recherche | Public |
| `/education` | Éducation | Public |
| `/events` | Événements | Public |
| `/arts` | Arts | Public |
| `/collaborate` | Collaboration / Contact | Public |
| `/contact` | Redirige vers `/collaborate` | Public |
| `/login` | Page d'info (pas de cloud auth) | Public |
| `/dashboard` | Lien vers édition du site | Admin uniquement (ProtectedRoute) |

---

## 7. Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_GATE_PASSWORD` | Mot de passe pour le portail d'édition (avec VITE_ADMIN_EMAIL) |
| `VITE_ADMIN_EMAIL` | Email affiché pour l'admin local (avec VITE_GATE_PASSWORD) |

Quand les deux sont définis, les visiteurs voient une invite de mot de passe avant d'accéder au site. Une fois validé, ils obtiennent les droits d'édition admin.

---

## 8. Flux utilisateur

### Visiteur anonyme

1. Parcourt les pages publiques
2. Voit le contenu depuis `localStorage` (ou valeurs par défaut)
3. Pas de bouton d'édition

### Utilisateur (après mot de passe gate)

1. Entre le mot de passe correct (si VITE_GATE_PASSWORD configuré)
2. Session stockée en `sessionStorage`
3. Bouton flottant "Edit" visible
4. Clique sur "Edit" → mode édition
5. Clic sur une zone → modal d'édition → sauvegarde → `localStorage`

### Admin

1. Accès au lien Dashboard dans la navbar
2. `/dashboard` protégé par `ProtectedRoute` (requireAdmin)
3. Lien vers le site pour éditer le contenu

---

## 9. Backend API (optionnel)

Quand `VITE_API_URL` est défini, le frontend utilise l'API backend au lieu de `localStorage`.

### Backend (FastAPI)

- **Stockage** : fichiers JSON (INDEX, USERS, TAGS, MARKS, TOKENS, ressources)
- **Ressources** : versions Draft / Published, lifecycle Create → Mark → Publish
- **Auth** : OAuth + JWT (cookie `ift_auth`) ou password gate en fallback
- **Endpoints** : `/resources/{slug}`, `/publish_resources/{slug}`, `/search`, `/upload`, `/auth/*`

### Démarrage du backend

```bash
cd backend && .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

Ou `npm run backend` depuis la racine.

### Migration

1. Lancer le backend
2. Définir `VITE_API_URL=http://localhost:8000`
3. Aller sur `/migrate` (Dashboard) pour copier `localStorage` vers l'API
