# 🚀 Déployer SymbioNexus (HTTPS + PWA installable iPhone/Android)

Objectif : mettre l'app en ligne en **HTTPS** pour qu'elle soit **installable comme une appli**
sur téléphone. Architecture :

```
GitHub (code)  →  Vercel (Frontend)  ⇄  Render (API)  →  Neon (PostgreSQL)
```

Légende : 🧑 = toi (clics / comptes) · 🤖 = moi (commandes)

---

## Prérequis (comptes gratuits)
- 🧑 **GitHub** (tu l'as ✅)
- 🧑 **Vercel** (tu l'as ✅) — connexion via GitHub
- 🧑 **Neon** → https://neon.tech (Postgres gratuit, permanent) — connexion via GitHub
- 🧑 **Render** → https://render.com (API gratuite) — connexion via GitHub

---

## Étape 1 — Code sur GitHub
1. 🧑 Va sur https://github.com/new → crée un dépôt **vide** nommé `symbionexus`
   (⚠️ NE coche PAS « Add README/.gitignore »).
2. 🧑 Copie l'URL du dépôt (ex. `https://github.com/ton-user/symbionexus.git`) et donne-la moi.
3. 🤖 Je lance dans `symbionexus/` :
   ```bash
   git init && git add . && git commit -m "SymbioNexus - initial"
   git branch -M main
   git remote add origin <TON_URL>
   git push -u origin main
   ```
   *(Le `.gitignore` garantit qu'aucun `node_modules`, `.env` ni `dev.db` n'est envoyé.)*
   🧑 Au push, GitHub te demandera de t'authentifier (navigateur ou token).

---

## Étape 2 — Base PostgreSQL (Neon)
1. 🧑 Sur https://neon.tech → **New Project** → nomme-le `symbionexus`.
2. 🧑 Copie la **Connection string** (format `postgresql://...sslmode=require`).
3. 🧑 Donne-la moi.

---

## Étape 3 — Initialiser la base (🤖 moi)
Je mets l'URL Neon dans `apps/api/.env`, puis :
```bash
cd apps/api
npx prisma db push     # crée les tables dans Neon
npm run db:seed        # injecte les comptes + annonces de démo
```
→ Tes données de démo sont maintenant dans le cloud.

---

## Étape 4 — Déployer l'API (Render)
1. 🧑 https://render.com → **New** → **Web Service** → connecte le dépôt GitHub `symbionexus`.
2. 🧑 Réglages :
   - **Root Directory** : `apps/api`
   - **Build Command** : `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command** : `node dist/main`
3. 🧑 Onglet **Environment** → ajoute les variables :
   | Clé | Valeur |
   |-----|--------|
   | `DATABASE_URL` | (l'URL Neon de l'étape 2) |
   | `JWT_SECRET` | une longue chaîne aléatoire |
   | `JWT_REFRESH_SECRET` | une autre longue chaîne aléatoire |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | (on la remplira à l'étape 6) |
4. 🧑 **Create Web Service** → attends le déploiement → note l'URL (ex. `https://symbionexus-api.onrender.com`).
5. ✅ Vérifie : ouvre `https://<ton-api>.onrender.com/api/docs` → la doc Swagger s'affiche.

> 💡 Générer un secret aléatoire : dans un terminal → `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

---

## Étape 5 — Déployer le Frontend (Vercel)
1. 🧑 https://vercel.com → **Add New** → **Project** → importe le dépôt `symbionexus`.
2. 🧑 Réglages :
   - **Root Directory** : `apps/web`
   - **Framework** : Next.js (détecté automatiquement)
3. 🧑 **Environment Variables** → ajoute :
   | Clé | Valeur |
   |-----|--------|
   | `NEXT_PUBLIC_API_URL` | `https://<ton-api>.onrender.com/api/v1` |
4. 🧑 **Deploy** → note l'URL (ex. `https://symbionexus.vercel.app`).

---

## Étape 6 — Relier CORS (API ↔ Frontend)
1. 🧑 Retourne sur **Render** → variable `FRONTEND_URL` = ton domaine Vercel (ex. `https://symbionexus.vercel.app`).
2. 🧑 **Save** → Render redéploie l'API automatiquement.

---

## Étape 7 — Installer sur ton téléphone 📱
1. 🧑 Ouvre l'URL Vercel dans le navigateur de ton téléphone.
2. 🧑 Connecte-toi : `seller@cafvert.fr` / `Demo2024!`
3. **Android (Chrome)** : appuie sur le bouton flottant **« 📲 Installer l'app »** → Installer.
4. **iPhone (Safari)** : appuie sur **Partager** → **« Sur l'écran d'accueil »** → Ajouter.
5. ✅ L'icône SymbioNexus apparaît sur ton écran d'accueil et l'app s'ouvre en plein écran.

---

## Dépannage
| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| Page blanche / erreurs réseau sur Vercel | `NEXT_PUBLIC_API_URL` manquant ou faux | Vérifie la variable sur Vercel (avec `/api/v1`) puis redéploie |
| Erreurs CORS dans la console | `FRONTEND_URL` ≠ domaine Vercel | Corrige `FRONTEND_URL` sur Render |
| API lente au 1er appel | Free tier Render « s'endort » | Normal — le 1er appel réveille l'API (~30s) |
| Bouton « Installer » absent | App pas en HTTPS, ou déjà installée | Utilise bien l'URL Vercel (https), pas localhost |
| `db push` échoue au build | `DATABASE_URL` absente sur Render | Ajoute la variable puis redéploie |
