# SymbioNexus

La Marketplace Industrielle Intelligente de l'Économie Circulaire.

## Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé :
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (pour exécuter PostgreSQL et Redis)

## 🚀 Démarrage Rapide (Tout depuis la racine)

Grâce à la configuration du projet, vous pouvez tout lancer depuis la racine du projet (`symbionexus/`) très facilement.

### 1. Démarrer l'infrastructure de base (Base de données)
Ouvrez un terminal à la racine et exécutez :
```bash
docker-compose up -d
```
*(Cela démarrera PostgreSQL et Redis en arrière-plan)*

### 2. Lancer l'Application (Web + API)
Toujours depuis la racine, installez les dépendances et lancez tout le projet :
```bash
npm install
npm run dev
```
- **Interface Web** : [http://localhost:3000](http://localhost:3000)
- **API (Backend)** : [http://localhost:4000](http://localhost:4000)
- **Documentation API** : [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

### 3. Visualiser la Base de Données (Prisma Studio)
Pour ouvrir l'interface de gestion de votre base de données :
```bash
npm run db:studio
```
- **Interface Base de données** : [http://localhost:5555](http://localhost:5555)

---

## 🛠 Commandes Détaillées

Si vous souhaitez gérer la base de données ou lancer les applications séparément :

### Base de données (depuis la racine)
- **Mettre à jour le schéma** : `npm run db:push`
- **Générer des données de test** : `npm run db:seed`

### Lancer individuellement (depuis la racine)
- **Frontend (Web) uniquement** : `npm run dev:web`
- **Backend (API) uniquement** : `npm run dev:api`

### Commandes utiles pour Docker
- **Voir l'état des conteneurs** : `docker-compose ps`
- **Voir les logs** : `docker-compose logs -f`
- **Arrêter les conteneurs** : `docker-compose down`
- **Arrêter et supprimer les données** : `docker-compose down -v`

---

## 📱 Application Mobile (Expo)

Pour lancer le serveur de développement mobile et tester l'application sur votre téléphone (via l'application **Expo Go**) :

```bash
# Placez-vous dans le dossier de l'application mobile (s'il y en a un, ex: apps/mobile) ou à la racine si l'app est là.
npx expo start
```
*Note : Cette commande va générer un serveur local sur le port 8081. Assurez-vous de renseigner l'URL affichée par cette commande (ex: `exp://192.168.x.x:8081`) dans le composant QR Code du tableau de bord Web pour pouvoir le scanner facilement.*

---

## 🏗️ Build, Tests et Production

Voici les commandes pour tester votre code et préparer la mise en ligne.

### 🧪 Tests
Depuis le dossier `apps/api` :
- **Lancer les tests unitaires** : `npm run test`
- **Lancer les tests de bout en bout (e2e)** : `npm run test:e2e`

### 🏗️ Build
- **Compiler l'application Web** (depuis la racine) : `npm run build`
- **Compiler l'API Backend** (depuis le dossier `apps/api`) : `npm run build`

### 🚀 Production
Après avoir fait le build, pour lancer en conditions réelles :
- **Web** (depuis `apps/web`) : `npm run start`
- **API** (depuis `apps/api`) : `npm run start:prod`

### 🧹 Qualité du Code (Lint)
- **Vérifier le code Web** (depuis la racine) : `npm run lint`
- **Vérifier le code API** (depuis `apps/api`) : `npm run lint`

### ⚙️ Génération des clients Prisma
Si vous modifiez `schema.prisma` et souhaitez juste mettre à jour le client TS :
- **Générer le client Prisma** (depuis `apps/api`) : `npm run db:generate`
