# Déploiement Railway – Guide complet (A à Z)

Ce guide détaille le déploiement du backend FastAPI sur Railway, puis du frontend sur Vercel.

---

## Prérequis

- Compte [Railway](https://railway.app) (gratuit avec carte bancaire ou $5 de crédit mensuel)
- Projet sur **GitHub** (ou GitLab)
- Données CMS dans le **localStorage** de ton navigateur (pour la migration initiale)

Note : le dossier `backend/db/` est dans `.gitignore`, donc Railway déploiera un backend vide. La migration (Partie 2) est obligatoire.

---

## Partie 1 : Déployer le backend sur Railway

### Étape 1.1 – Créer un projet Railway

1. Va sur [railway.app](https://railway.app) et connecte-toi (GitHub).
2. Clique sur **New Project**.

### Étape 1.2 – Ajouter le backend depuis GitHub

1. Choisis **Deploy from GitHub repo**.
2. Sélectionne ton dépôt (ex. `ift_website`).
3. Railway crée un premier service.

### Étape 1.3 – Configurer le service backend

1. Clique sur le service créé.
2. Onglet **Settings**.
3. **Root Directory** : mets `backend` (le chemin du dossier backend).
4. **Build Command** : laisser vide ou `pip install -r requirements.txt`.
5. **Start Command** : laisser vide si tu as un `Procfile`, sinon :
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Étape 1.4 – Ajouter un volume (stockage persistant)

Sans volume, les données `db/` et `uploads/` sont perdues à chaque redéploiement.

1. Dans ton projet Railway, clique sur **+ New**.
2. Choisis **Volume**.
3. Nom : `cms-data`.
4. Clique sur le volume, puis **Add Service** et associe-le à ton service backend.
5. **Mount Path** : `/data`.

### Étape 1.5 – Variables d’environnement backend

1. Clique sur ton service backend → **Variables**.
2. Clique sur **Add Variable** ou **RAW Editor** et ajoute :

| Variable | Valeur | Notes |
|----------|--------|-------|
| `DB_PATH` | `/data/db` | Chemin persistant pour les ressources |
| `DB_UPLOAD_BASE_PATH` | `/data/uploads` | Chemin persistant pour les uploads |
| `JWT_SECRET` | *(génère une chaîne aléatoire)* | Ex. `openssl rand -hex 32` |
| `CORS_ORIGINS` | `https://ton-projet.vercel.app` | À ajuster après déploiement Vercel |
| `FRONTEND_URL` | `https://ton-projet.vercel.app` | Même URL |

Pour `JWT_SECRET` :
```bash
# Sur Windows (PowerShell) :
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) | ForEach-Object { [byte]$_ })

# Ou en ligne : https://randomkeygen.com/ (CodeIgniter Encryption Keys)
```

### Étape 1.6 – Publier et obtenir l’URL

1. Railway build et déploie automatiquement.
2. Onglet **Settings** → **Networking** → **Generate Domain**.
3. Tu obtiens une URL du type `https://xxx-production-xxxx.up.railway.app`.
4. Copie cette URL (c’est ton `VITE_API_URL`).

### Étape 1.7 – Vérifier que le backend répond

Ouvre dans le navigateur :
```
https://ton-url.railway.app/
```

Tu devrais voir quelque chose comme : `{"status":"ok","service":"IFT CMS API"}`.

---

## Partie 2 : Migrer les données vers le backend (première fois)

Le volume est vide au premier déploiement. Il faut y envoyer ton contenu CMS.

### Option A : Migration depuis le navigateur

1. En local, assure-toi que le localStorage contient les données CMS.
2. Lance le frontend : `npm run dev`.
3. Dans `.env` ou directement, mets `VITE_API_URL` = ton URL Railway (ex. `https://xxx.up.railway.app`).
4. Va sur `http://localhost:3000/migrate`.
5. Clique sur **Run Migration**.
6. La migration envoie le contenu du localStorage vers l’API Railway.

### Option B : Copier `backend/db/` dans le volume

Si tu veux réutiliser ton `backend/db/` local :

1. Railway CLI : `npm i -g @railway/cli` puis `railway login`.
2. Connexion au projet : `railway link`.
3. Exécuter un shell : `railway run bash`.
4. Copier les fichiers depuis ta machine vers le volume (ou utiliser un script de déploiement).

Option plus simple : utiliser l’Option A (migration via le frontend).

---

## Partie 3 : Déployer le frontend sur Vercel

### Étape 3.1 – Créer le projet Vercel

1. Va sur [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Importe le même dépôt GitHub.
3. Clique sur **Import**.

### Étape 3.2 – Configurer le build

1. **Framework Preset** : Vite (détecté automatiquement).
2. **Build Command** : `npm run build`
3. **Output Directory** : `build` (configuré dans `vite.config.ts`)
4. **Root Directory** : laisser vide (racine du repo).

### Étape 3.3 – Variables d’environnement

Dans **Environment Variables**, ajoute :

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://ton-url.railway.app` (URL Railway de l’étape 1.6) |
| `VITE_GATE_PASSWORD` | *(optionnel)* Mot de passe pour le mode édition |
| `VITE_ADMIN_EMAIL` | *(optionnel)* Ex. `admin@example.com` |

Important : pas de slash final dans `VITE_API_URL` (ex. `https://xxx.up.railway.app` et non `https://xxx.up.railway.app/`).

### Étape 3.4 – Déployer

1. Clique sur **Deploy**.
2. Récupère l’URL du déploiement (ex. `https://ton-projet.vercel.app`).

---

## Partie 4 : Mettre à jour le backend (CORS)

Une fois le frontend déployé sur Vercel, tu as l’URL finale (ex. `https://ton-projet.vercel.app`).

1. Dans Railway → ton service backend → **Variables**.
2. Mets à jour :
   - `CORS_ORIGINS` = `https://ton-projet.vercel.app`
   - `FRONTEND_URL` = `https://ton-projet.vercel.app`
3. Railway redéploie automatiquement.

Pour les préviews Vercel (branch deploys), tu peux ajouter :
```
CORS_ORIGINS=https://ton-projet.vercel.app,https://ton-projet-*.vercel.app
```

---

## Partie 5 : Vérification finale

1. Ouvre ton site Vercel : `https://ton-projet.vercel.app`
2. Vérifie que le contenu s’affiche (chargé depuis l’API Railway).
3. Si `VITE_GATE_PASSWORD` est configuré, entre le mot de passe et teste l’édition.
4. Enregistre une modification, rafraîchis : les changements doivent persister (via le volume Railway).

---

## Résumé des URLs

| Composant | Où le trouver |
|-----------|----------------|
| Backend Railway | Settings → Networking → Domain |
| Frontend Vercel | Dashboard Vercel après déploiement |

---

## Dépannage

**"Application failed to respond"**
1. Clique sur ton service → **Deployments** → ouvre le dernier déploiement → **View Logs**.
2. Vérifie les erreurs au démarrage (import, crash, permission).
3. **Port** : l'app utilise `python run.py` qui lit `PORT` depuis l'environnement. Railway injecte `PORT` automatiquement.
4. **Volume** : si l'app plante au démarrage, teste sans volume : retire temporairement `DB_PATH` et `DB_UPLOAD_BASE_PATH` des variables pour utiliser les chemins par défaut (`./db`, `./uploads`). Si ça démarre, le problème vient du volume (montage ou permissions).
5. **Networking** : dans Settings → Networking, le port doit correspondre à celui exposé (souvent **8000** ou la valeur de `PORT` dans les logs).

**Le site reste vide / erreur de chargement**
- Vérifie que `VITE_API_URL` est bien l’URL Railway (sans slash final).
- Vérifie CORS : `CORS_ORIGINS` doit contenir l’URL Vercel exacte.

**403 / CORS dans la console**
- Vérifie que `CORS_ORIGINS` inclut bien l’URL du frontend (protocole + domaine).

**Les modifications ne persistent pas**
- Vérifie que le volume est bien monté sur `/data`.
- Vérifie que `DB_PATH=/data/db` et `DB_UPLOAD_BASE_PATH=/data/uploads` sont définis.

**Le backend ne démarre pas**
- Vérifie les logs Railway (onglet **Deployments** → dernier déploiement).
- Vérifie que `requirements.txt` et `Procfile` sont dans `backend/`.
