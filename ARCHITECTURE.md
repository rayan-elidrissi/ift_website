# Architecture du site IFT (Institute for Future Technologies)

Ce document décrit l’ensemble des briques du site et son fonctionnement actuel.

---

## 1. Vue d’ensemble

Le site est une application web **React + Vite** qui fonctionne comme :

- **Site public** : vitrine pour l’institut (recherche, éducation, arts, événements, collaboration)
- **CMS en ligne** : édition de contenu par des utilisateurs authentifiés
- **Espace admin** : gestion des rôles et des accès CMS

---

## 2. Stack technique

| Technologie | Usage |
|-------------|-------|
| **React 18** | UI |
| **Vite 6** | Build et dev server |
| **React Router** | Navigation |
| **Supabase** | Auth + base de données PostgreSQL |
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
│   ├── AuthContext.tsx  # État utilisateur + profil + rôles
│   └── CMSContext.tsx    # État CMS (contenu, mode édition)
├── components/
│   ├── cms/             # Composants d'édition CMS
│   │   ├── CMSWrapper.tsx
│   │   ├── EditableContent.tsx
│   │   ├── EditableLink.tsx
│   │   ├── EditableVideo.tsx
│   │   ├── EditableImageSingle.tsx
│   │   ├── EditableCollection.tsx
│   │   ├── EditableImage.tsx
│   │   ├── FeaturedProjectSelector.tsx
│   │   └── CMSModal.tsx
│   ├── ui/              # Composants UI réutilisables (shadcn/radix)
│   └── [pages]          # Hero, FeaturedProjects, About, etc.
├── lib/
│   ├── supabase.ts      # Client Supabase
│   ├── roles.ts         # Récupération profil (legacy global_admin)
│   └── cmsPermissions.ts # Mapping clés CMS → sections → rôles
supabase/migrations/     # Schéma base de données
```

---

## 4. Flux de données et providers

### Arborescence des providers

```
Router
└── AuthProvider          # Gère user, profile, role, canEditKey
    └── CMSWrapper
        └── CMSProvider   # Gère isEditing, getContent, updateContent
            └── [App content]
```

### AuthContext

- **Responsabilités** :
  - Authentification via Supabase Auth
  - Chargement du profil (`profiles`) avec le rôle
  - Exposition de `user`, `profile`, `loading`, `role`, `isAdmin`, `canEditKey`, `canEditAny`, `signOut`
- **Rôles** : `admin` | `staff` | `students` (cf. section permissions)
- **Événement** : `ift_auth_change` dispatché à la déconnexion pour rafraîchir les données CMS

### CMSContext

- **Responsabilités** :
  - Chargement du contenu depuis Supabase (`cms_content`) ou `localStorage` si Supabase non configuré
  - Mode édition (toggle via bouton flottant)
  - `getContent(key, default)` : lecture d’une clé CMS
  - `updateContent(key, value)` : écriture (avec vérification `canEditKey`)
- **Fallback** : sans Supabase, tout est stocké dans `localStorage` sous `ift_cms_data`

---

## 5. Système de permissions CMS

### Rôles et sections

| Rôle | Sections modifiables |
|------|----------------------|
| **admin** | Toutes (hero, featured, latest_events, about, research, arts, education, events, collaborate, footer) |
| **staff** | about, research, arts, education, events |
| **students** | education uniquement |

### Mapping clé → section

Les clés CMS sont mappées à des sections via des préfixes (`cmsPermissions.ts`) :

| Préfixe | Section |
|---------|---------|
| `hero-` | hero |
| `featured-`, `research-projects` | featured |
| `latest-events` | latest_events |
| `about-`, `team-` | about |
| `research-` | research |
| `arts-` | arts |
| `edu-`, `education-` | education |
| `events-` | events |
| `collaborate-` | collaborate |
| `footer-` | footer |

`canEditKey(key, role)` vérifie si le rôle peut modifier la section associée à la clé.

---

## 6. Base de données (Supabase)

### Tables

#### `cms_content`

| Colonne | Type | Description |
|---------|------|-------------|
| `key` | TEXT (PK) | Identifiant unique du contenu (ex. `hero-title`, `featured-project-ids`) |
| `value` | JSONB | Contenu (texte, objet, tableau) |
| `updated_at` | TIMESTAMPTZ | Dernière modification |

- **RLS** : lecture publique ; écriture réservée aux utilisateurs authentifiés avec rôle approprié via `can_edit_cms_key(key)`.

#### `profiles`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK, FK auth.users) | ID utilisateur |
| `email` | TEXT | Email |
| `full_name` | TEXT | Nom complet |
| `avatar_url` | TEXT | URL avatar |
| `role` | TEXT | `admin`, `staff`, `students` ou NULL |
| `updated_at` | TIMESTAMPTZ | Dernière modification |

- **RLS** : l’utilisateur peut lire/mettre à jour son propre profil ; seuls les admins peuvent lire et modifier les rôles des autres.
- **Trigger** : `handle_new_user` crée un profil à l’inscription (par défaut `role = 'students'`).

### Fonctions SQL

- `can_edit_cms_key(key)` : détermine si l’utilisateur connecté peut modifier cette clé selon son rôle.
- `has_cms_role()` : indique si l’utilisateur a un rôle CMS (admin, staff ou students).

---

## 7. Routes et pages

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
| `/login` | Connexion / inscription | Public |
| `/dashboard` | Gestion des utilisateurs et rôles | Admin uniquement (ProtectedRoute) |

---

## 8. Composants CMS éditable

### CMSWrapper

- Enveloppe l’app avec `CMSProvider`
- Affiche un bouton flottant (Edit / Exit) pour activer/désactiver le mode édition
- Le bouton n’est visible que si `canEdit` est vrai (l’utilisateur a un rôle CMS)

### EditableContent

- Texte ou Markdown éditable
- **Props** : `id`, `defaultContent`, `multiline`, `enableProse`, optionnel `secondaryId` pour un second champ (ex. URL de redirection)
- En mode édition : clic sur le contenu → ouverture d’un modal avec textarea/input
- Stocke le contenu sous la clé `id` (et `secondaryId` si fourni)

### EditableLink

- Lien dont l’URL est stockée en CMS
- **Props** : `id`, `defaultHref`, `children`
- En mode édition : affiche le contenu sans naviguer (le lien est désactivé)
- Détecte automatiquement les liens externes (`http`, `//`) pour utiliser `<a>` au lieu de `<Link>`

### EditableVideo

- Champ pour une URL de vidéo
- Utilisé dans le Hero pour la vidéo de fond

### EditableImageSingle / EditableImage

- Images éditable(s), stockées sous une clé CMS

### EditableCollection

- Liste d’éléments éditable (ajout, suppression, réorganisation)

### FeaturedProjectSelector

- Sélecteur de projets mis en avant sur la page d’accueil
- En mode édition : bouton "Select Featured Projects" → modal avec grille de projets à cocher
- Stocke les IDs sélectionnés sous `featured-project-ids`

### CMSModal

- Modal réutilisable pour les formulaires d’édition (Save / Cancel)

---

## 9. Flux utilisateur

### Visiteur anonyme

1. Parcourt les pages publiques
2. Voit le contenu depuis `cms_content` (ou valeurs par défaut)
3. Pas de bouton d’édition

### Utilisateur connecté (admin, staff ou students)

1. Se connecte via `/login` (Supabase Auth)
2. Un profil est créé ou chargé avec son `role`
3. Si `role` présent : bouton flottant "Edit" visible
4. Clique sur "Edit" → `isEditing = true`
5. Les zones éditables selon son rôle affichent un contour
6. Clic sur une zone → modal d’édition → sauvegarde → `updateContent` → Supabase

### Admin

1. Accès au lien Dashboard dans la navbar
2. `/dashboard` protégé par `ProtectedRoute` (requireAdmin)
3. Peut :
   - Assigner les rôles (admin, staff, students) aux utilisateurs
   - Voir un lien vers le site pour éditer le contenu

---

## 10. Protection des routes

### ProtectedRoute

- Vérifie `user` et `loading` via `useAuth`
- Si non connecté : redirection vers `/login`
- Si `requireAdmin` et que `!isAdmin` : message "Access denied"
- Sinon : affiche les `children`

---

## 11. Déploiement (Vercel)

- **Build** : `npm run build`
- **Output** : dossier `build/`
- **Framework** : détection automatique Vite
- **SPA** : rewrites `/(.*)` → `/index.html` pour le routage côté client
- **Variables d’environnement** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 12. Résumé des flux

```
[Utilisateur] 
    → Login (Supabase Auth)
    → AuthProvider charge profile (role)
    → CMSProvider charge cms_content
    → Si role = admin|staff|students : bouton Edit visible
    → Mode édition → clic zone → modal → updateContent → Supabase upsert
    → Contenu partagé pour tous les visiteurs

[Admin]
    → /dashboard (ProtectedRoute)
    → Gestion des rôles des utilisateurs (profiles.role)
```

---

## 13. Fichiers clés à consulter

| Fichier | Rôle |
|---------|------|
| `src/App.tsx` | Routes et layout |
| `src/context/AuthContext.tsx` | Auth + profil + permissions |
| `src/context/CMSContext.tsx` | Chargement et mise à jour du contenu CMS |
| `src/lib/cmsPermissions.ts` | Règles clé → section → rôle |
| `src/components/cms/CMSWrapper.tsx` | Intégration du CMS et bouton Edit |
| `supabase/migrations/` | Schéma et politiques RLS |
