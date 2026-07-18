# SymbioNexus - Guide de Démarrage

Voici toutes les commandes nécessaires pour lancer et gérer les différentes parties de votre projet (Base de données, API, Interface Web). 

Étant donné que le projet est configuré comme un monorepo, **vous pouvez lancer toutes ces commandes depuis la racine du projet (le dossier `symbionexus`)**.

## 🚀 1. Lancer l'infrastructure (Base de données)
Avant de lancer le code, démarrez PostgreSQL et Redis via Docker (depuis la racine) :
```bash
docker-compose up -d
```

## 🌐 2. Lancer l'Application (Web + API) simultanément
Pour démarrer à la fois l'interface de l'application et le backend (API) avec une seule commande depuis la racine :
```bash
npm run dev
```
- **Interface Web** sera accessible sur : [http://localhost:3000](http://localhost:3000)
- **API Backend** sera accessible sur : [http://localhost:4000](http://localhost:4000)
- **Documentation API (Swagger)** : [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

## 🗄️ 3. Ouvrir et visualiser la Base de Données
Pour voir ou modifier facilement les données de votre base de données PostgreSQL via une interface visuelle (Prisma Studio) :
```bash
npm run db:studio
```
- **Interface de la Base de données** : [http://localhost:5555](http://localhost:5555)

---

## 🛠️ Autres commandes utiles (depuis la racine du projet)

### Gestion de la base de données (Prisma)
- **Appliquer les changements à la base de données** : 
  ```bash
  npm run db:push
  ```
- **Injecter des données de test (Seed)** :
  ```bash
  npm run db:seed
  ```

### Lancer les services individuellement
Si vous ne voulez pas utiliser `npm run dev` pour tout lancer :
- **Lancer uniquement l'Interface Web** : 
  ```bash
  npm run dev:web
  ```
- **Lancer uniquement l'API (Backend)** : 
  ```bash
  npm run dev:api
  ```

### Commandes Docker
- **Voir l'état des conteneurs** : `docker-compose ps`
- **Arrêter les conteneurs** : `docker-compose down`

---

## 🏗️ 4. Build, Tests et Production

Voici les commandes pour préparer votre projet pour la mise en production ou tester votre code.

### 🧪 Tests (Backend)
Depuis le dossier `apps/api` :
- **Lancer les tests unitaires** : `npm run test`
- **Lancer les tests de bout en bout (e2e)** : `npm run test:e2e`

### 🏗️ Build (Générer les fichiers de production)
- **Compiler l'application Web** (depuis la racine) : `npm run build`
- **Compiler l'API** (depuis `apps/api`) : `npm run build`

### 🚀 Lancer en mode Production
Après avoir exécuté la commande de Build correspondante :
- **Web** (depuis `apps/web`) : `npm run start`
- **API** (depuis `apps/api`) : `npm run start:prod`

### 🧹 Linting (Vérification du code)
- **Vérifier le code de l'application Web** (depuis la racine) : `npm run lint`
- **Vérifier le code de l'API** (depuis `apps/api`) : `npm run lint`

### ⚙️ Génération des clients Prisma
Si vous avez fait des changements à `schema.prisma` mais ne voulez pas l'envoyer à la base de données :
- **Générer le client Prisma** (depuis `apps/api`) : `npm run db:generate`
