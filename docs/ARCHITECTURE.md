# SymbioNexus — Architecture Globale Évolutive

> **SSOT** : le document *MASTER PROMPT SYMBIONEXUS* (149 p. — Parties 1–10 + AI-EOS Ch.1–15 + bonus) est la spécification officielle (SRS + SAD + ADR + vision produit).
> Ce fichier est la **synthèse vivante versionnée** dérivée de la SSOT, maintenue par l'architecte à chaque section analysée.
> **Règles** : ne jamais supprimer une info validée · fusionner · signaler les contradictions (ne pas trancher seul) · deux vues synchronisées (Réel ⇄ Cible).
> **Priorité de décision (v0.1, utilisateur — EN RÉVISION, voir C-005 / ADR-014-R)** : ① architecture ② UX ③ valeur métier ④ évolutivité ⑤ facilité (dernier).
> **Hiérarchie officielle proposée (AI-EOS Ch.3.2)** : N1 Sécurité&conformité · N2 Valeur métier · N3 Fiabilité · N4 Scalabilité · N5 UX · N6 Optimisation. → **à valider par PO** (les deux conservées, aucune écrasée).
>
> **Gouvernance (standard officiel)** :
> 1. Registre **ADR** : chaque décision = ID unique + justification + alternatives + impact + statut.
> 2. Toute amélioration proposée est classée : `[MVP]` indispensable · `[V2]` recommandée · `[LT]` optionnelle long-terme.
> 3. Toute nouvelle feature documente une **fiche d'impact** : dépendances techniques · impact DB · API concernées · sécurité · performance · tests à prévoir.
> 4. Ne jamais modifier une décision validée sans justification écrite.
> 5. Section qui remet en cause une décision → ouvrir un **ADR de révision** (`ADR-00X-R`), ne pas écraser l'ancien.
> 6. Fin de chaque section → auto-update : Roadmap · Registre d'écarts · Dépendances · Risques · Priorités.
> 7. Opportunité détectée → **proposer**, jamais implémenter sans validation.

**Version : v0.44** · **SSOT + toutes extensions stratégiques 100% traitées** (SCSRE/SFITE/SCCEM/SGAADS/SGD-SCI/SCCEN + Master Execution). **9 piliers officiels** cartographiés.
> Ce fichier **incarne la mémoire Ch.4** (architecturale + métier). Mémoire opérationnelle = runtime (dashboard/logs, à renforcer via Sentry). Règles actives : non-régression · **BREAKING CHANGE explicite** (Ch.4.5) · modules critiques (paiement/carbone/contrats) = évolution lente, testés/versionnés (Ch.4.8).

---

## PRINCIPES DIRECTEURS (AI-EOS Ch.1 — Constitution)
> Cadre décisionnel officiel. Chaque ADR doit s'y conformer.
- **Résolution de conflit (1.0)** : retenir la solution qui respecte le mieux objectifs/valeurs/principes (⇒ critère pour trancher C-001→C-004 ; proposition par l'architecte, validation PO).
- **Philosophie (1.3)** : simplicité > complexité inutile · fiabilité > raccourcis · maintenabilité > temporaire · évolutivité > optim locales · sécurité > facilité · automatisation > répétitif · données > suppositions · durabilité > court-terme · excellence > vitesse-au-détriment-qualité.
- **Valeurs (1.4)** : Intégrité · Transparence · Sécurité · Résilience · Modularité · Qualité · Maintenabilité · Interopérabilité · Automatisation · Durabilité · Conformité (20 au total).
- **Réussite (1.5)** = **impact, pas nb de features** : déchets valorisés · CO₂ évité · économies · uptime · précision IA · conformité · satisfaction.
- **Mentalité (1.7)** : chaque feature = capacité métier + industrielle + environnementale + stratégique + éco + techno + évolutive.

**Méthode de décision (AI-EOS Ch.2 — 10 étapes)** : ①Compréhension ②Analyse globale (10 impacts) ③**Cameroun-First** ④Comparaison ⑤Standards ⑥Cohérence (ne casse rien) ⑦Optimisation ⑧Risques+mitigation ⑨Long-terme(5–10 ans) ⑩Production-ready. Transparence : distinguer faits / hypothèses / recommandations.

**Checklist Cameroun-First (gate obligatoire par feature)** : infra dispo ? logistique locale ? réglementation ? **paiement adapté (MoMo)** ? langues ? **réseau/bande passante** ? → sinon alternative réaliste avant l'international.

**Grille multicritère par décision (AI-EOS Ch.3.3, scores 1–10)** : complexité · coût dev · coût exploitation · valeur métier · scalabilité · sécurité · maintenabilité · compatibilité système · adaptation Cameroun. → choisir le meilleur équilibre.
**Test réalité industrielle (Ch.3.4)** : utile à une entreprise réelle ? applicable en usine ? rentable B2B ? compatible logistique terrain ?
**Hiérarchie de tranchage des conflits** : voir en-tête (v0.1 utilisateur vs Ch.3.2 — arbitrage PO via C-005/ADR-014-R).

---

## VUE A — ÉTAT RÉEL (MVP implémenté)

**Stack** : Next.js 16 (App Router, React 19) · NestJS 11 · Prisma 6 · PostgreSQL (Neon serverless, 1 région) · Socket.io · déploiement Vercel(web)+Render(api)+Neon(db).

**Modules API réels** (`apps/api`, prefix `api/v1`, Swagger `/api/docs`) :
`auth · users · companies · listings · matches · contracts · passports · carbon · messaging · notifications · dashboard · audit · settings`

**Fonctionnalités effectives** :
- **Auth** : JWT access(15m)+refresh(7d), passport-jwt, rôles `SELLER/BUYER/TRANSPORTER/REGULATOR/ADMIN`.
- **Listings** : CRUD, 9 catégories (images LoremFlickr + fallback), photos base64, publish/duplicate/delete, CSV export, tri/recherche.
- **Matches** : moteur pondéré **hardcodé** — matériau 40% (`sectorMap`), distance 25% (Haversine, cutoff 500 km), volume 20% (fixe 0.7), trust 15%. Pas d'IA.
- **Contracts** : génération, signature (booléens seller/buyer), **paiement Mobile Money** (lien WhatsApp Orange Money +237 696 567 184).
- **Passports (DPP)** : PDF (pdfkit+QR), preuve livraison (signature `signature_pad` + photo), QR interactif (modale download/copy/verify), **page publique `/verify/:id`** (auth-less), panneau contrôle transport (6 statuts, avance auto, toast), **SOS incident** (tel+WhatsApp).
- **Carbon** : calcul CO₂ (facteurs par catégorie), certificat PDF, marché secondaire (list/unlist/retire), contact vendeur WhatsApp.
- **Messaging/Notifications** : Socket.io temps réel + notif auto sur changement statut passeport.
- **Dashboard** : KPIs, charts (recharts), widget 3D « Noyau IA » (three/R3F).
- **Settings** (7 modules) : profil B2B, certifications, préférences, notifications, webhook, API keys (hash SHA-256), journal d'audit.
- **i18n** 10 langues · thème clair/sombre · **localisation Cameroun** (FCFA, Douala, Mobile Money).
- **Résilience** : `PrismaService.onModuleInit` retry (Neon veille → pas de crash boot).

**Pipeline E2E réel** :
`annonce → matching(pondéré) → contrat → signature(bool) → Mobile Money(WhatsApp) → passeport(PDF/QR/verify) → carbone(certificat+marché) → [manque: ESG report, escrow réel]`

**Modèles Prisma** : `Company, User, WasteListing, Match, Contract, MaterialPassport, CarbonCredit, Transaction, ComplianceDocument, Message, Notification, ApiKey, AuditLog`.

---

## 9 PILIERS OFFICIELS (Master Execution Prompt) ⇄ registre
1. **Smart Factory / Industrie** → SFITE (ADR-025) · 2. **Marketplace matières** → SCCEM (ADR-026), réel ✅ · 3. **IA centrale / gouvernance** → SGAADS/Ch.11 (ADR-021) · 4. **Sécurité & conformité** → ADR-012, baseline réel ✅ · 5. **UX / dashboards / rôles** → Ch.8, réel **mûr** ✅ · 6. **Infra cloud mondiale** → SGD-SCI, Phase-1 réel ✅ · 7. **Économie circulaire citoyenne** → Pilier 6 / SCSRE / SCCEN (ADR-017/022) · 8. **Logistique temps réel** → WF6 (ADR-020) · 9. **ESG / carbone / impact** → carbon réel ✅ + Scope1/2/3.

---

## VUE B — VISION CIBLE (SSOT)

**Positionnement** : infrastructure numérique **mondiale** de l'économie circulaire industrielle. Nexus 6 acteurs : producteurs déchets · consommateurs matières secondaires · logisticiens · régulateurs · certificateurs · marchés carbone.

**Mission (6 piliers)** : ① connecter (IA matching) ② structurer (taxonomie) ③ tracer (DPP) ④ optimiser logistique ⑤ automatiser conformité (ESG/CSRD/GHG) · **⑥ Économie Circulaire Citoyenne & Publique (B2C+B2G)**.

**Pilier 6 — Économie Circulaire Citoyenne & Publique (ajout stratégique, ADR-017)** : relie **citoyens** (dépôt/collecte déchets ménagers, points d'apport, consigne, récompenses) · **entreprises** (débouchés) · **recycleurs** (tri/traitement) · **pouvoirs publics** (régulation, incitations, données déchets municipaux, reporting). Pont **B2B↔B2C↔B2G**, au même niveau qu'IA/Logistique/Conformité/ESG/Marketplace. Cameroun-first : formalise la collecte informelle + interface municipalités.
  - **SCCEN (spec B2C, MVP Douala)** : app citoyen → **photo → analyse IA (type/poids/qualité/valeur FCFA)** → collecte/dépôt → pesée → **paiement MoMo instantané** → **récompenses** (argent/points éco/badges/**score citoyen vert**/certificats). Edge-AI mobile (YOLO/TF-Lite) possible. Contrainte éco : prix achat < revente industrielle.

**SCSRE — Centres Intelligents (backbone opérationnel du Pilier 6, ADR-022)** : réseau de centres (proximité/communaux/industriels/usines/hubs/ports secs/export) connectés temps réel. Workflow 24 étapes : réception lot → analyse IA → pesage → QC → paiement → stock → tri → **transformation → matière 1re secondaire** → certification → **publication auto Marketplace** → matching → vente → transport → DPP → carbone → ESG → audit. Automatisation IoT (balances/RFID/caméras/capteurs/robots) · **Digital Twin** par centre · gestion stock RT. Nouveaux modèles : `Center`, `Lot`, `Stock`, `Processing`. Roadmap propre MVP(centres/pesage/paiement/stock)→V1(IA/GPS)→V2(IoT/DigitalTwin)→V3(robotique).

**SFITE — Usines Intelligentes & Transformation (aval SCSRE, ADR-025)** : réseau d'usines transformant déchets → matières 1res secondaires certifiées. **Filières** détaillées par matériau (plastiques/métaux/papier/verre/**DEEE**/pneus/huiles/organique) + procédés + industries clientes (seed **ADR-018**). IA industrielle (rendement/optim lignes/maintenance prédictive/énergie) · **Digital Twin industriel** · optim énergétique (solaire/batteries/récup chaleur). Standards **ISA-95 / IEC 62443 / OPC-UA / MQTT / Edge**. **DPP standardisé** GS1 Digital Link / CIRPASS / EPCIS 2.0 / W3C VC (**ADR-024**). Roadmap MVP(lots/QC/publication)→V1(IA procédés)→V2(DigitalTwin/IoT/énergie)→V3(robotique multi-usines).

**SCCEM — Bourse des matières secondaires (extension Marketplace, ADR-026)** : 4 marchés — **spot** (prix dynamique) · **contractuel** (long terme indexé) · **enchères** · **ESG premium** (bas-carbone). Moteur **pricing IA** (offre/demande/qualité/logistique/carbone/**LME**/rareté). Settlement off-chain (MoMo/escrow, blockchain LT/R9) · matching **pgvector** · trading IA/arbitrage (LT). Réel : germes ✅ (marketplace+contrats+marché carbone). Roadmap MVP(listing/prix dynamique/achat direct)→V1(enchères/contrats/matching IA)→V2(pricing prédictif+LME)→V3(trading autonome/blockchain).

**Vision architecturale (4 axes)** :
- **Cloud-native** : microservices · API gateway · event-driven · multi-tenant SaaS · K8s · multi-région.
- **IA-native** : génératif (OpenAI/Claude/Gemini) · agents autonomes · RAG/GraphRAG · embeddings/vectorDB · OCR.
- **Data-driven** : data lake · data warehouse · streaming temps réel · BI · Knowledge Graph industriel.
- **Trust/Security-first** : KYC/KYB · zero-trust · MFA · audit immuable · anti-fraude.

**Pipeline E2E cible** :
`annonce → analyse IA(OCR+embeddings) → matching sémantique → négociation IA → contrat auto → signature élec(DocuSign) → paiement escrow(Stripe) → logistique optimisée → livraison → validation → DPP(blockchain) → calcul carbone(Climatiq) → reporting ESG(CSRD)`

**Patterns entreprise (Partie 4)** :
- Clean Architecture : Domain / Application / Infrastructure / Interface.
- DDD — 7 bounded contexts : Marketplace · Carbon · Logistics · Compliance · Identity · Messaging · AI.
- CQRS (Commands/Queries) · Event-Driven bus (Kafka/RabbitMQ).
- Événements clés : `ListingCreated · MatchFound · ContractSigned · CarbonCalculated · ShipmentDelivered`.
- Microservices cibles (12) : Auth · User · Company · Listing · Matching · Carbon · Contract · Payment · Logistics · Notification · AI · Compliance.
- API Gateway (Kong/NGINX) + Service Mesh (Istio/Linkerd) · DB polyglotte (PG+VectorDB+Warehouse+Redis) · Zero-Trust · Observabilité (Datadog/Prom/Grafana/Sentry) · Multi-tenant (data/API/billing).

**Couche IA cible (Partie 5)** :
- Multi-modèles : OpenAI + Claude + Gemini (redondance, validation croisée).
- Matching sémantique : embeddings + contraintes physiques/logistiques (ex : chaleur fatale → serre/agro).
- RAG (ingestion PDF → vectorisation → vectorDB → retrieval → génération) · GraphRAG (knowledge graph industriel).
- Agents autonomes (voir C-003 : 5 en Partie 5 / 7 en Ch.11 / 8 en Ch.14) · OCR (Document AI) · Vision · Prédiction temporelle · IA négociation B2B · IA conformité/risque · multimodal.
- **Master Control System (Ch.11) / SGAADS** — Master AI + 8 agents + **Rule Engine** + **Moteur de simulation** (scénarios éco/logistique/carbone/financier) + mémoire vectorielle · boucle décision 8 étapes · **safe fallback** + validation humaine critique + audit immuable (= ADR-013/016/021). Réel = règles **hardcodées** (`sectorMap`/`CO2_FACTORS`), pas d'orchestrateur/simulation. Knowledge Graph = Neo4j (GraphRAG).

**Workflows IA (extension SSOT — WF1-3)** :
- **WF1 Acquisition** : ingestion multi-input (photos/vidéo/PDF/certifs/labo/**IoT/ERP/MES**) → OCR + Vision → classification + contaminants/pureté/humidité/granulo + détection danger + classification réglementaire → taxonomie + métadonnées + **DPP auto** (sans humain).
- **WF2 Valorisation** : déchet → **filières** possibles (ex ferraille→acier→auto/machines/export) ; par scénario : rendement · coût · rentabilité · CO₂ évité · énergie · valeur marché · risque · conformité · ESG → **classement** (ADR-018).
- **WF3 Matching IA multi-signal** : desc+images+docs+histo+logistique+marché → **7 scores** (compatibilité · éco · carbone · ESG · réglementaire · confiance · risque) + **WHY** auto (ADR-019, étend ADR-010). Réel = 4 facteurs.
- **WF4 Négociation IA** : agents → prix/scénarios/compromis → contrat auto, **validé user avant signature** (réel : signature ✅, agents absents — LT).
- **WF5 Paiement** : transaction + calcul taxes/TVA/logistique/assurance/commission/**escrow** · MoMo/**Flutterwave**/cartes/Stripe/Adyen · fonds **Escrow** jusqu'à livraison (étend ADR-011 ; réel MoMo+commission ✅).
- **WF6 Logistique temps réel** : sélection transporteur (coût/dist/CO₂/délai) + GPS/ETA/trafic/météo/géofencing/pesée/QR/signature/photos, diffusion **WebSocket** (ADR-020 ; réel timeline+PoD+Socket.io ✅ partiel).
- **WF7 Validation réception** : vérif identité/QR/poids/photos/conformité → DPP maj + **libération fonds** + certificats + archive (réel QR+PoD+DPP+crédit ✅ partiel ; voir **C-006**).
- **WF8 Carbone MRV** : Scope1/2/3 + transport + substitution vierge + LCA + ISO14064/14067 + CSRD (réel facteurs+certificat ✅ partiel).
- **WF9 IA décisionnelle continue** + **WF10 apprentissage continu** (des données validées, **contrôle humain sur critique**) = Master Control (Ch.11) + mémoire (Ch.4) — **ADR-021**, LT.
- Embeddings providers : OpenAI / Cohere / Voyage. VectorDB : Pinecone/Weaviate/Qdrant (**ou pgvector** — ADR-009).

**Sécurité cible (Partie 9)** : Zero-Trust · MFA/SSO · RBAC+ABAC · KYB/KYC renforcé · DevSecOps (SAST/SCA/scan) · Observabilité (Sentry/Prom/Grafana/Datadog) · anti-fraude · AES-256/TLS1.3 · secrets vault · audit immuable · WAF+rate-limiting · HA 99.99% multi-région.
**Posture réelle** ✅ : JWT+refresh · bcrypt · RBAC · ValidationPipe (anti-injection) · AuditLog · ApiKey hashé · TLS · `.env` gitignoré · KYBStatus data-ready.

**Contrat runtime IA (Partie 10 §8 — transverse)** : toute décision IA/agent doit → expliquer (**WHY**) · fournir justification · prioriser conformité+sécurité · optimiser carbone+coût+logistique · **jamais d'action non traçable**. (voir ADR-013)

---

## REGISTRE DES ÉCARTS (Réel → Cible)

| Domaine | Réel | Cible | Écart | Priorité* |
|---|---|---|---|---|
| Matching | pondéré hardcodé | embeddings/RAG multi-modèles | 🔴 majeur | P2 |
| Multi-tenancy | mono (companyId) | multi-tenant isolé | 🔴 | P3 |
| Paiement | Mobile Money (lien WhatsApp) | MoMo API natif + escrow (ADR-011) · Stripe intl V4 | 🟠 | P2 |
| Facturation | absente (Transaction 4% XAF prêt) | factures auto PDF + abonnements récurrents | 🟠 | P2 |
| DPP | PDF+QR+verify | blockchain immuable (si valeur, voir R9) | 🟢 | P4 |
| Preuve livraison | ✅ signature+photo (FAIT) | conforme doc §3.2 | 🟢 | — |
| Carbone monétisation | ✅ marché secondaire (FAIT) | +certification+vente intl | 🟢 | P3 |
| IoT/time-series | aucun | capteurs→annonce auto, InfluxDB/Timescale | 🟢 | P4 |
| Notifications | in-app socket + WhatsApp | +email(SendGrid)/SMS(Twilio)/push | 🟠 | P2 |
| Prix | manuel (`pricePerKg`) | prix suggéré/dynamique (heuristique) | 🟠 | P2 |
| Classification | enum manuel | auto (ADR-006 taxonomie) | 🟠 | P2 |
| Workflow engine | flux synchrone codé | orchestration via événements de domaine | 🟠 | P3 |
| ERP/CRM | aucun | SAP/Salesforce/Dynamics | 🟢 | P4 |
| Digital Twins | aucun | jumeau numérique + IoT | 🟢 | P4 |
| Design system UI | ✅ dark pro + KPI + charts + 3D + timelines (FAIT) | conforme §8 | 🟢 | — |
| Dashboards par rôle | SELLER/BUYER surtout | vues dédiées TRANSPORTER/REGULATOR/ADMIN (Role en base) | 🟠 | P2 |
| Matching UI « WHY » | ✅ `scoreBreakdown` déjà affiché (barres Matière/Distance/Volume/Confiance) | conforme Ch.8 explicabilité | 🟢 | — |
| Carbon UI compare | absent | vierge vs recyclé (facteurs déjà en base) | 🟢 | P2 |
| Rate limiting | ✅ throttler (global 100/min, login 5/min) — testé 429 | conforme Ch.5.8/6.7 | 🟢 | — |
| DevSecOps | tsc/lint/build | +Dependabot/Snyk(SCA)+SAST | 🟠 | P2 |
| MFA/SSO/ABAC | RBAC seul | MFA TOTP(admin)+SSO+ABAC | 🟠 | P2 |
| Secrets | `.env` gitignoré | vault + rotation (KMS/HashiCorp) | 🟢 | P3 |
| Zero-Trust/WAF | direct | segmentation+WAF+mesh | 🟢 | P4 |
| Anti-fraude | aucun | Sift/Radar + scoring risque | 🟢 | P3 |
| KYC/KYB réel | enum data-ready | Onfido/Sumsub intégré | 🟠 | P2 |
| HA/uptime | 1 région | 99.99% multi-région failover | 🟢 | P4 |
| Tests | 🟡 matching+carbon+contracts 12/12 ✓ | +passport + gate CI (ADR-015) | 🟡 | P2 |
| API standards | ✅ api/v1 + Swagger + JWT + ValidationPipe (FAIT) | conforme Ch.5 | 🟢 | — |
| Résilience externe | aucune (0 appel externe hors DB) | timeout+retry+circuit-breaker+fallback (Ch.5.7) | 🟠 | P2 |
| OWASP baseline | ✅ Prisma(anti-SQLi)+React(anti-XSS)+JWT-header(anti-CSRF) | conforme Ch.6.6 | 🟢 | — |
| Environnements | dev + prod direct | +staging, pas de deploy direct prod (6.5/6.11) | 🟠 | P3 |
| Sécurité agents IA | N/A (pas d'agents) | sandbox+human-in-loop+no-accès-critique (ADR-016) | 🟢 | P3 |
| Incident response | git rollback manuel | détection+rollback+isolation auto | 🟢 | P4 |
| Data governance | aucune | qualité + cycle de vie (rétention/suppression) + Knowledge Graph (Ch.7) | 🟠 | P3 |
| Assistant IA UX | aucun (Vercel SDK dormant, C-001) | dialogue/explications/auto-remplissage (Ch.8.7) | 🟢 | P3 |
| Geospatial | Haversine JS (OK MVP) | PostGIS (requêtes spatiales à l'échelle, Ch.9.8) | 🟢 | P3 |
| Cache/IaC | aucun · deploy managé | Redis cache + IaC (Terraform) reproductible | 🟢 | P4 |
| Monétisation | commission 4% data-ready · marché carbone ✅ | +SaaS abonnements + API billing + logistics margin (Ch.10.2) | 🟢 | P3 |
| **Pilier 6 Citoyen/Public** | absent (réel = B2B seul) | collecte citoyenne + points d'apport/consigne + portail municipalités (B2G) + incitations (ADR-017) | 🟠 | P3 |
| WF1 Acquisition IA | photos base64 + PDF passeport | multi-input + OCR/Vision + analyse matière (contaminant/pureté/danger/régl) + DPP auto | 🔴 | P2 (bloqué C-001/R8) |
| WF1 ingestion IoT/ERP/MES | aucune | connecteurs vidéo/IoT/ERP/MES | 🟢 | P4 |
| WF2 Valorisation | aucune | moteur filières + rendement/coût/CO₂/ESG/risque + ranking (ADR-018, rules-based d'abord) | 🟠 | P2 |
| WF3 Matching 7-scores | 4 facteurs + WHY ✅ | 7 scores (éco/carbone/ESG/régl/risque ajoutés) + signaux IA (ADR-019) | 🟠 | P2 |
| WF4 Négociation IA | prix manuel + signature ✅ | agents prix/scénarios/compromis (validation humaine gardée) | 🟢 | P3 |
| WF5 Paiement/Escrow | MoMo lien + commission 4% ✅ | escrow + calc taxes/TVA/logistique + Flutterwave/multi (ADR-011) | 🟠 | P2 |
| WF6 Logistique RT | timeline+PoD+Socket.io ✅ | carrier auto + GPS-live + ETA/géofencing/pesée (ADR-020) | 🟠 | P2 |
| WF7 Validation réception | QR+PoD+DPP+crédit ✅ | +poids/qualité/identité auto + libération fonds gardée (C-006) | 🟠 | P2 |
| WF9/10 IA continue+apprentissage | aucun | agents+prévision+Digital Twin+learning (contrôle humain, ADR-021) | 🟢 | P4 |
| **SCSRE Centres** | aucun (réel = annonces entreprises) | modèles Center/Lot/Stock/Processing + workflow 24 + publication auto marketplace (ADR-022) | 🟠 | P3 |
| Centres IoT/DigitalTwin/robotique | aucun | balances/RFID/caméras/capteurs/cobots + jumeau numérique | 🟢 | P4 |
| Stockage fichiers | ⚠️ base64 (R10) | object storage R2/Supabase (URL) — **résout R10** (ADR-023) | 🟠 | P2 |
| SFITE Usines/transformation | aucun | filières+procédés+IA industrielle+DigitalTwin+MES/SCADA (ISA-95/OPC-UA, ADR-025) | 🟢 | P4 |
| DPP standard | PDF+QR custom | GS1 Digital Link / CIRPASS / EPCIS / W3C VC (interop+export EU, ADR-024) | 🟠 | P3 |
| Optim énergétique | aucun | solaire/batteries/récup chaleur (usines) | 🟢 | P4 |
| SCCEM Bourse | marketplace + marché carbone ✅ germes | 4 marchés (spot/contractuel/enchères/ESG) + pricing dynamique (ADR-026) | 🟠 | P3 |
| Pricing dynamique/LME | prix manuel | moteur spot heuristique (now) + LME/prédictif (V2) | 🟠 | P2 |
| Enchères | aucun | modèle+logique enchères (MVP-able) | 🟢 | P3 |
| Rule Engine | règles hardcodées (sectorMap/CO2_FACTORS) | moteur externalisé (Drools/Camunda/Temporal) | 🟢 | P4 |
| Moteur simulation | aucun | simulation scénarios éco/logistique/carbone/financier | 🟢 | P4 |
| Récompenses citoyennes | aucun | argent/points éco/badges/score citoyen vert/certificats (gamification SCCEN) | 🟠 | P3 |
| Edge-AI mobile | aucun | classification déchet on-device (YOLO/TF-Lite) | 🟢 | P4 |
| Conformité | audit log | KYC/KYB+zero-trust | 🔴 | P2 |
| Logistique | waypoints simulés | Maps/HERE + ETA + rerouting + carrier(DHL/UPS/Shippo) + tracking | 🟠 | P2 |
| ESG | absent | Scope1/2/3 + CSRD + ISO 14001/14064/14067 | 🔴 | P2 |
| Carbone (précision) | facteur plat/catégorie | Scope1/2/3 + empreinte transport + LCA | 🟠 | P2 |
| Taxonomie matières | enum(10)+texte libre | normalisation canonique (dédoublonnage) | 🟠 | P2 |
| IA agents | aucun | 8 agents + Master Control | 🔴 | P3 |
| Embeddings/RAG | aucun | pgvector(ADR-009)+RAG | 🔴 | P2 |
| OCR | aucun | Document AI (extraction fiches) | 🟠 | P2 |
| Vision IA | aucun | reconnaissance matériaux/conteneurs | 🟢 | P4 |
| IA prédictive | aucun | prévision production/demande | 🟢 | P4 |
| IA négociation | aucun | négociation prix/volume auto | 🟢 | P4 |
| GraphRAG | aucun | knowledge graph industriel | 🟢 | P4 |
| Data | Postgres seul | +vectorDB(pgvector)/lake/warehouse | 🟠 | P3 |
| Streaming | Socket.io basique | Kafka/IoT | 🟢 | P4 |
| Infra | 1 région | K8s multi-région | 🟢 | P4 |
| Découpage | NestJS module/svc | Clean (Domain/App/Infra) + DDD strict | 🟠 | P3 |
| Event bus | synchrone (appels directs) | domain events → Kafka | 🟠 | P3 |
| CQRS | absent | Commands/Queries séparés | 🟢 | P4 |
| Microservices | modular monolith | 12 services (voir C-002/ADR-008) | 🟢 | P4 |
| API gateway/mesh | direct | Kong + Istio | 🟢 | P4 |
| Observabilité | logs bruts | Sentry(V2) → Datadog/Prom/Grafana | 🟠 | P2 |

*Priorité provisoire (à raffiner via Ch.12 roadmap). P2=V1.5, P3=V2, P4=V3+.

---

## DÉPENDANCES (macro)
`Auth → tout` · `Matching → listings+companies+taxonomie+(vectorDB)` · `DPP → contrat signé` · `Carbon → passport livré + empreinte transport(logistique)` · `ESG → carbon(Scope1/2/3)+transactions+ISO` · `Escrow → contrat+KYC` · `Logistique → Maps+companies` · `Agents IA → Master Control + data layer`.

**Chaîne d'événements (backbone cible)** : `ListingCreated → MatchFound → ContractSigned → ShipmentDelivered → CarbonCalculated`. Réel = même flux, **synchrone** (pas d'event bus).

---

## CONTRADICTIONS DÉTECTÉES (à trancher par le PO)
- ⚠️ **Écart d'échelle** doc(mondial SAP/Palantir) vs réel(MVP soutenance) : non-contradiction mais à gérer via **roadmap phasée** (le doc lui-même le prescrit Ch.12/B4). Non bloquant.
- 🔴 **C-001** (Partie 3 §1) : doc affirme « IA = Vercel AI SDK » ; réel = `ai`/`@ai-sdk/react` **installés mais 0 usage** (vérifié : aucun import). Dead dependency + faux signal IA. **Proposition** : câbler en V1.5 (assistant/OCR/matching) OU retirer. → décision PO. Non bloquant.
- ✅ **C-002 RÉSOLU** (par SSOT Ch.13.1) : le doc lui-même tranche « **modular monolith → microservices** ». ADR-008 = **Accepté** (SSOT-backed). Partie 4 §2.5 (microservices) = cible long-terme, pas immédiat.
- ✅ **C-003 RÉSOLU** (par SSOT Ch.14) : liste définitive **8 agents** (Matching · Logistique · Carbone&ESG · Compliance&KYC · Contrats&Finance · Fraude · IoT · Intelligence Globale/RAG). Partie 5 (5) / Ch.11 (7) = sous-ensembles. **Proposition** : retenir le superset **8** (Matching, Logistics, Carbon&ESG, Compliance&KYC, Fraud, Finance&Contract, IoT, Global/RAG), à figer en Ch.14. Non bloquant.
- 🔴 **C-004** (doc↔doc + doc↔réel) : Partie 6 §2.1 impose **Stripe Connect escrow** ; Ch.2 étape 3 exige **paiement adapté Cameroun** (Stripe indispo). Réel = **Mobile Money**. **Proposition** : MoMo API natif (Orange/MTN) + escrow simulé plateforme (V2), Stripe = international V4. → **ADR-011**. Non bloquant.
- 🔴 **C-006** (WF7 ↔ ADR-016/WF10) : WF7 « **libère automatiquement les fonds** » vs contrôle humain sur actions critiques (Ch.6.8/WF10). **Proposition** : libération auto **uniquement si** validation multi-signal 100% verte (QR+poids+qualité+conformité), sinon revue humaine. Non tranché (PO).
- 🔴 **C-005** (décision validée ↔ SSOT) : ordre de priorité utilisateur (v0.1 : archi>UX>valeur>évol>facilité) **≠** hiérarchie Ch.3.2 (Sécurité>Valeur>Fiabilité>Scalabilité>UX>Optim). Divergences : **Sécurité absente** de v0.1 ; **UX #2 vs N5**. **Non tranché** — les deux conservées → **ADR-014-R** (révision), arbitrage PO.

---

## REGISTRE ADR
> Format : ID · Décision · Justification · Alternatives · Impact · Statut. Révision = `ADR-00X-R`.

| ID | Décision | Justification | Alternatives | Impact | Statut |
|---|---|---|---|---|---|
| ADR-001 | Doc = SSOT (SRS+SAD+ADR+vision) | référence unique cohérente | code-as-truth · specs éparses | toute décision dérive du doc | ✅ Accepté |
| ADR-002 | 2 vues synchronisées Réel⇄Cible (Option A) | suivre l'écart en continu | vue cible seule (B) | registre d'écarts permanent | ✅ Accepté |
| ADR-003 | Architecture persistée en fichier versionné | survit au contexte (principe mémoire Ch.4) | maintien en chat | `docs/ARCHITECTURE.md` autorité | ✅ Accepté |
| ADR-004 | Roadmap phasée MVP→V1.5→V2→V3→V4 | résout l'écart d'échelle sans big-bang | tout construire d'un coup | livraison incrémentale, non-régression | ✅ Accepté |
| ADR-005 | Gouvernance ADR + classif [MVP/V2/LT] + fiche d'impact | décisions traçables/reproductibles (Ch.3) | décisions ad hoc | discipline sur chaque feature | ✅ Accepté |
| ADR-006 | Normaliser la taxonomie des matières (canonique) | prérequis matching sémantique + dédoublonnage marché | garder texte libre · IA seule au runtime | nouvelle table/enum étendu + mapping | 🟡 Proposé |
| ADR-007 | Couche d'abstraction providers (IA/paiement/carto/KYC/carbone) | intégrations remplaçables, MVP sans dépendance critique (Ch.5.6) | appels directs SDK | interfaces + adapters par domaine | 🟡 Proposé |
| ADR-008 | Modular monolith d'abord, microservices plus tard | résout C-002 · **confirmé par SSOT Ch.13.1** · réel MVP + simplicité (Ch.3.5) | microservices immédiats (Partie 4 §2.5) | garder NestJS modulaire, frontières nettes | ✅ Accepté |
| ADR-009 | pgvector (Neon/Postgres) pour embeddings, pas de vectorDB externe (MVP/V2) | pas de nouvelle infra · Neon supporte pgvector · réversible · simplicité (Ch.3.5) | Pinecone/Weaviate/Qdrant | extension pg + colonne vector + index | 🟡 Proposé |
| ADR-010 | Matching hybride : formule pondérée + score sémantique (blend), pas de remplacement | non-régression (Ch.4.5) · fallback si IA down (Ch.5.7) · explicabilité WHY (Ch.8) | remplacer par IA pure | étendre `calculateScore` + `ScoreBreakdown` | 🟡 Proposé |
| ADR-011 | Paiement Mobile Money natif via **agrégateurs (Campay/Fapshi/CinetPay/Paystack/Flutterwave/Wave)** (Orange/MTN) + escrow simulé ; Stripe = international V4 | résout C-004 · Cameroun-first (Ch.2) · Stripe indispo local · réel déjà MoMo | Stripe Connect immédiat (Partie 6) | intégration MoMo + retenue fonds + Transaction | 🟡 Proposé |
| ADR-012 | Baseline sécurité pragmatique : RBAC+JWT+ValidationPipe+**rate-limiting**+audit maintenant ; zero-trust/MFA-SMS/vault/mesh en V2+ | sécurité priorité #1 MAIS proportionnée MVP (Ch.3 décision équilibrée) · cheap+fort d'abord | zero-trust complet immédiat (over-eng) | +@nestjs/throttler +Dependabot +Sentry +MFA-TOTP admin | 🟡 Proposé |
| ADR-013 | Contrat comportemental IA : chaque décision IA/agent = explicable (WHY) + traçable (audit) + jamais d'action sans trace | Partie 10 §8 + Ch.8 + Ch.6.8 · renforce ADR-010 | IA « boîte noire » | rationale loggé + explication exposée UI | 🟡 Proposé |
| **ADR-014-R** | **Réviser** l'ordre de priorité v0.1 → adopter la hiérarchie Ch.3.2 (Sécurité N1…) | résout C-005 · Ch.3.2 = cadre officiel détaillé, ajoute Sécurité (Ch.1.3 « sécurité > facilité ») · UX N5 préserve l'atout réel | garder v0.1 · fusion hybride | change l'ordre de tranchage des conflits futurs | 🟡 Proposé (PO) |
| ADR-015 | Tests unitaires obligatoires sur modules critiques avant modif (paiement/carbone/contrats/matching) | Ch.4.8 stabilisation + 4.5 non-régression · finance = risque | tests plus tard / manuels | jest specs + gate CI | 🟡 Proposé |
| ADR-016 | Sécurité des agents IA : sandbox + validation humaine des actions critiques + décisions loggées + interdiction accès direct paiement/contrats | Ch.6.8 · étend ADR-013 · « agents puissants mais contrôlés » | agents pleinement autonomes | garde-fous couche agents (V3) | 🟡 Proposé |
| ADR-017 | **Pilier 6** : Économie Circulaire Citoyenne & Publique (B2C+B2G) = 6ᵉ pilier officiel, phasé (données municipales B2G d'abord, collecte citoyenne B2C ensuite) | relie citoyens/entreprises/recycleurs/public · Cameroun-first (collecte informelle) · effet réseau | rester B2B pur | nouveaux rôles (CITIZEN/PUBLIC), modèles collecte, portail municipal | 🟡 Proposé (attend confirmation périmètre + .docx) |
| ADR-018 | Moteur de valorisation (WF2) : **filières rules-based d'abord** (map catégorie→filières + heuristiques rendement/coût/CO₂/valeur), enrichissement IA ensuite | valeur immédiate sans IA/coût · Cameroun-first · extensible | full-AI immédiat (bloqué C-001/R8/coût) | nouveau module valorization + data filières | 🟡 Proposé |
| ADR-026 | **Bourse SCCEM** = étendre marketplace en 4 marchés (spot dynamique / contractuel / enchères / ESG-premium) + moteur pricing (spot heuristique now, LME/prédictif V2) ; settlement **off-chain** (MoMo/escrow), blockchain LT | réel a les germes (marketplace+carbone) · valeur éco · Cameroun-first | tout-blockchain immédiat (R9) | modèles Market/Order/Bid + pricing + matching pgvector | 🟡 Proposé |
| ADR-024 | DPP **standard-aligné** (GS1 Digital Link / CIRPASS / EPCIS 2.0 / W3C VC) au lieu de PDF+QR custom | interopérabilité + conformité EU + export · réutilise QR existant | garder format custom | +identifiant GS1 + schéma CIRPASS (garder PDF+QR MVP) | 🟡 Proposé |
| ADR-025 | Module **Smart Factory (SFITE)** = couche transformation (aval SCSRE) : filières + IA industrielle + Digital Twin + MES/SCADA (ISA-95/IEC62443/OPC-UA) | orchestre la transformation locale · industrialisation Cameroun | rester collecte/marketplace | très gros programme V2-V3 (Industry 4.0) | 🟡 Proposé |
| ADR-022 | Module **Centres Intelligents (SCSRE)** = backbone opérationnel Pilier 6 · modèles Center/Lot/Stock/Processing · MVP centres+pesage+paiement+stock+publication auto | opérationnalise le Pilier 6 · Cameroun-first · effet réseau national | rester marketplace pure | gros programme phasé (V2+) | 🟡 Proposé |
| ADR-023 | Stockage fichiers en **object storage** (Cloudflare R2 / Supabase) au lieu de base64 | **résout R10** (bande passante) · scalable · URLs · limite 15MB levée | garder base64 | migration upload → storage + URL en base | 🟡 Proposé |
| ADR-020 | Logistique temps réel (WF6) : sélection transporteur rules-based + **GPS-live via WebSocket** (étend Socket.io existant) ; ETA/géofencing/carrier-API en couche V2 | réel a déjà Socket.io+PoD · valeur démo forte · Cameroun-first | Kafka/event-stream lourd immédiat | gateway WS position + carte live + événements | 🟡 Proposé |
| ADR-021 | Apprentissage continu (WF9/10) **avec contrôle humain** : learning sur données validées, décisions critiques toujours validées + explicables + tracées | Ch.4 mémoire + ADR-013/016 · « jamais action non traçable » | auto-apprentissage sans garde-fou | pipeline feedback + human-in-loop critique | 🟡 Proposé |
| ADR-019 | Matching **7 scores** (WF3) : étendre `calculateScore`/`ScoreBreakdown` 4→7 (éco/carbone/régl/risque calculables maintenant) ; signaux IA (images/docs/marché) en couche V2 optionnelle | étend ADR-010 hybride · non-régression (tests présents) · explicabilité WHY (ADR-013) · socle sans dépendance IA | attendre l'IA complète | extend matching + tests | 🟡 Proposé |

---

## ROADMAP (dérivée réel + Ch.12 SSOT)
- **Phase 0 / MVP — FAIT** : auth · listings+catégories · matching pondéré · contrats+signature · Mobile Money · DPP(PDF/QR/verify/PoD/SOS) · carbon(certificat+marché) · messaging · notifications · dashboard(3D) · settings(7) · i18n · localisation Cameroun · résilience Neon.
- **V1.5 — Intelligence & Automatisation** : matching embeddings/RAG `[V2]` · OCR fiches `[V2]` · enrichissement listings auto `[V2]` · notif intelligentes `[LT]`.
- **V2 — Plateforme industrielle** : logistique optimisée (Maps/HERE+ETA) `[V2]` · carbone Scope1/2/3 + ESG/CSRD export `[V2]` · escrow (Stripe/Adyen) `[V2]` · KYC/KYB `[V2]` · DPP blockchain `[LT]` · IoT ingestion `[LT]`.
- **V3 — IA autonome** : 8 agents + Master Control `[LT]` · prédiction flux `[LT]` · digital twin `[LT]` · fraude IA `[LT]`.
- **V4 — Écosystème mondial** : multi-pays/devises `[LT]` · API publique partenaires `[LT]` · ERP (SAP/Oracle) `[LT]` · crédits carbone certifiés `[LT]`.

---

## REGISTRE DES RISQUES
| ID | Risque | Sévérité | Mitigation |
|---|---|---|---|
| R1 | Neon (free) veille → crash boot | 🟠 | ✅ retry `PrismaService.onModuleInit` (fait) |
| R2 | Dérive de scope (écart d'échelle) | 🔴 | roadmap phasée + gouvernance ADR |
| R3 | Matching non-IA = valeur limitée | 🟠 | P2 embeddings (V1.5) |
| R4 | Dépendances externes critiques (Stripe/IA/blockchain) | 🟠 | provider abstraction layer (Ch.5.6) |
| R5 | Pas de KYC/zero-trust → fraude B2B | 🔴 | P2 KYC + audit renforcé (V2) |
| R6 | Conformité normative absente (ISO 14001/14064/14067, CSRD) | 🟠 | module ESG + export audit-ready (V2) |
| R7 | Sur-ingénierie (microservices/CQRS/mesh trop tôt) | 🟠 | ADR-008 monolith-first · complexité justifiée seulement si scalabilité/sécu/perf le prouvent |
| R8 | Confidentialité : données industrielles/B2B envoyées à LLM tiers (OpenAI/Google) | 🔴 | anonymisation · modèles hébergés/EU · consentement · cohérence Ch.6 protection données |
| R9 | Blockchain prématurée (DPP immuable) = coût/complexité MVP | 🟠 | garder PDF+QR+verify (réel suffit) · blockchain LT si confiance l'exige (Ch.1 hedge) |
| R10 | Bande passante Cameroun : 3D (three/R3F) + photos base64 lourds | 🟠 | lazy-load 3D · photos en URL (pas base64) · budget assets (Ch.2 contraintes réseau) |
| R11 | ~~Pas de rate limiting~~ **RÉGLÉ** : throttler global 100/min + login 5/min (testé 429) | 🟢 | ✅ fait |
| R12 | Pas de DevSecOps (SAST/SCA) → vulns dépendances non détectées | 🟠 | Dependabot(gratuit)+Snyk (ADR-012) |
| R13 | ~~0 test~~ **3 modules critiques testés** (matching/carbon/contracts, 12/12 ✓) ; reste passport + gate CI | 🟡 | compléter + CI |

---

## PLAN D'ACTION PRIORISÉ (dérivé SSOT — rien implémenté sans validation)

**⛔ Décisions PO bloquantes d'abord** : C-005 (ordre priorité) · C-001 (Vercel SDK câbler/retirer) · C-004 (MoMo natif confirmé ?).

**P1 — Critique (avant prod/soutenance sérieuse)**
1. Rate limiting `@nestjs/throttler` (login+API) — R11/ADR-012.
2. Tests modules critiques (matching/carbon/contracts/passport) + gate CI — R13/ADR-015.

**P1.5 — Quick-wins (data déjà en base, coût ~nul, fort effet)**
3. Matching « WHY » : exposer `scoreBreakdown` UI — ADR-010/013.
4. Carbone : comparaison vierge/recyclé (`CO2_FACTORS` existants).
5. Dashboards par rôle (`Role` enum : TRANSPORTER/REGULATOR).
6. Prix suggéré (heuristique volume×catégorie×distance).
7. Perf Cameroun : photos en URL (pas base64) + lazy-load 3D — R10.
8. Dependabot (gratuit) + Sentry — R12/ADR-012.

**P2 — V1.5/V2**
9. Matching hybride : embeddings pgvector + blend — ADR-009/010.
10. OCR création listing (`chemicalProfile`).
11. MoMo API natif + escrow simulé + facturation PDF — ADR-011.
12. Email SendGrid · taxonomie normalisée (ADR-006) · KYC réel · staging env · résilience externe (retry/fallback).
13. ESG/CSRD export · carbone Scope 1/2/3 + empreinte transport.

**P3/P4 — Long terme**
14. Master Control + 8 agents (sandbox ADR-016) · GraphRAG · IoT/time-series · blockchain DPP · K8s/multi-région/WAF · ERP · digital twins.

---

## CHANGELOG
- **v0.1** : première synthèse dual-view (Partie 1), format chat.
- **v0.2** : persistance fichier · formalisation 2 vues Réel/Cible · registre d'écarts + priorités · règles SSOT actées.
- **v0.3** : gouvernance officielle — registre ADR (001–005) · classification [MVP/V2/LT] · fiche d'impact par feature · ADR de révision · Roadmap · Registre des risques · auto-update fin de section.
- **v0.4** : Partie 2 fusionnée — précisions Carbone (Scope1/2/3+LCA+transport), ESG/ISO/CSRD, taxonomie · ADR-006 (proposé, taxonomie) · risque R6 · écarts + dépendances enrichis. Note : `Transaction.currency @default("XAF")` déjà multi-devise-ready.
- **v0.5** : Partie 3 fusionnée — forte convergence doc↔réel (stack, modules, limites 3.1–3.6 = registre d'écarts). **C-001** : Vercel AI SDK dead dependency (installé, 0 usage) · **ADR-007** (proposé, couche providers). Constat : réel **dépasse** le snapshot doc sur DPP/Carbon/Settings/Mobile Money (Partie 3 = photo plus ancienne).
- **v0.6** : Partie 4 fusionnée — patterns entreprise (Clean/DDD 7 contexts/CQRS/event-driven/12 microservices/gateway/mesh/multi-tenant/observabilité) ajoutés à Vue B · 6 écarts (découpage, event bus, CQRS, microservices, gateway, observabilité) · **C-002** (doc↔doc microservices vs modular monolith) · **ADR-008** (proposé, monolith-first) · **R7** sur-ingénierie · chaîne d'événements ajoutée aux dépendances.
- **v0.7** : Partie 5 fusionnée — couche IA cible (multi-modèles, matching sémantique, RAG/GraphRAG, agents, OCR, vision, prédiction, négociation) · 6 écarts IA · **C-003** (agents 5 vs 8) · **ADR-009** (pgvector) · **ADR-010** (matching hybride) · **R8** (confidentialité données→LLM tiers). Rappel : consulter skill `claude-api` à l'implémentation IA.
- **v0.8** : Partie 6 fusionnée — finance/escrow, logistique(carrier/ETA), blockchain/smart contracts, IoT/time-series, KYC, notifications multi-canal · **C-004** (Stripe vs Mobile Money/Cameroun) · **ADR-011** (MoMo natif) · **R9** (blockchain prématurée). Réel **en avance** : PoD ✅ (§3.2), marché carbone ✅ (§5.2). Facturation data-ready (Transaction 4% XAF).
- **v0.9** : Partie 7 fusionnée (catalogue 15 modules, confirmatoire) — 5 écarts nouveaux (prix dynamique, classification auto, workflow engine, ERP/CRM, digital twins). Aucune contradiction/ADR nouveaux. Note : workflow engine dépend des événements de domaine (ADR-008).
- **v0.10** : Partie 8 fusionnée — UX = **couche la plus mûre** du réel (design system ✅ conforme §8, Socket.io ✅). Mapping rôles doc⇄`Role` enum validé. Écarts : dashboards par rôle, Matching « WHY », comparaison carbone (tous quick-wins, data déjà en base). **R10** bande passante Cameroun (3D+base64).
- **v0.11** : Partie 9 fusionnée — sécurité cible (zero-trust/MFA/DevSecOps/observabilité/WAF/vault/HA) vs posture réelle correcte MVP (JWT/bcrypt/RBAC/ValidationPipe/AuditLog/ApiKey-hash ✅). 9 écarts sécu · **R11** rate-limiting (🔴 P1) · **R12** DevSecOps · **ADR-012** (baseline sécu pragmatique). Tension sécurité#1↔MVP résolue par ADR-012.
- **v0.12** : Partie 10 fusionnée (synthèse) — **JALON : Master Prompt Parties 1–10 complet**. Contrat runtime IA (WHY+traçabilité, §8) → **ADR-013**. Aucun nouvel écart/contradiction. Bilan intermédiaire : 4 contradictions (C-001→004), 13 ADR (001–005 acceptés, 006–013 proposés), 12 risques (R1–R12), ~35 écarts. Reste : gouvernance AI-EOS Ch.1–15 (méta — déjà appliquée) + Bonus.
- **v0.13** : AI-EOS Ch.1 (Constitution) fusionné — section **Principes Directeurs** ajoutée (philosophie/valeurs/réussite/mentalité + règle de résolution de conflit). Confirme mes ADR (simplicité→ADR-008/012). Écart léger : Dashboard = KPIs d'impact partiels (1.5). Aucune contradiction.
- **v0.14** : AI-EOS Ch.2 (Gouvernance IA) fusionné — **méthode 10 étapes** + **checklist Cameroun-First** (gate) ajoutées aux Principes Directeurs. Valide rétroactivement ADR-011/R10 (Cameroun-First), ADR-010 (ne-casse-rien), ADR-008 (long-terme+simplicité). Méta, aucun composant/contradiction nouveau.
- **v0.15** : AI-EOS Ch.3 (Cadre de décision) fusionné — **C-005** (ordre priorité utilisateur ≠ hiérarchie Ch.3.2) → **ADR-014-R** (révision proposée, non tranchée, PO). Ajout grille multicritère 1–10 + test réalité industrielle aux Principes Directeurs. En-tête priorité annoté (deux ordres conservés).
- **v0.16** : AI-EOS Ch.4 (Mémoire & raisonnement) fusionné — ce fichier = incarnation mémoire architecturale+métier. Règles non-régression/BREAKING-CHANGE/stabilisation actées. **R13** : 0 test (vérifié) sur modules critiques · **ADR-015** (tests obligatoires modules critiques) · écart Tests ajouté.
- **v0.17** : AI-EOS Ch.5 (APIs & intégrations) fusionné — couche API réelle **conforme** (api/v1, Swagger, JWT, ValidationPipe ✅). **5.6 ⇒ ADR-007 devient exigence SSOT** (provider abstraction) · **5.8 ⇒ R11** confirmé · écart « résilience externe » (retries/circuit-breaker/fallback, prérequis intégrations). Aucune contradiction.
- **v0.18** : AI-EOS Ch.6 (Sécurité/DevSecOps) fusionné — recoupe Partie 9. Nouveau : **6.8 sécurité agents IA → ADR-016**. Baseline **OWASP OK** (Prisma/React/JWT-header ✅). Écarts : environnements (pas de staging), incident response. Reste des gaps sécu déjà en registre.
- **v0.19** : AI-EOS Ch.7 (Intelligence données) fusionné — **7.5 renforce ADR-006** (taxonomie=exigence SSOT). Écart « data governance » (qualité + cycle de vie + Knowledge Graph). Aucune contradiction/ADR nouveau.
- **v0.20** : AI-EOS Ch.8 (UX industrielle) fusionné — recoupe Partie 8. Nouveau : **8.7 assistant IA UX** = usage naturel du dead dep Vercel SDK (résout C-001). Confirme dashboards par rôle + R10. Aucune contradiction.
- **v0.21** : AI-EOS Ch.9 (DevSecOps/Infra) fusionné — recoupe Partie 9. Écarts mineurs : PostGIS (vs Haversine JS, OK MVP), Redis cache, IaC. Aucune contradiction/ADR nouveau.
- **v0.22** : AI-EOS Ch.10 (Business Model) fusionné — commission 4% data-ready ✅, marché carbone ✅, Cameroun-first confirmé (phases géo). Écart « monétisation » (SaaS/API-billing/logistics-margin). Aucune contradiction/ADR.
- **v0.23** : AI-EOS Ch.11 (Master Control) fusionné — Vue B : orchestrateur 5 couches + boucle décision. **11.8 confirme ADR-016**. C-003 précisé (5/7/8 agents). Aucune contradiction nouvelle.
- **v0.24** : AI-EOS Ch.12 (Roadmap) fusionné — **valide** la Roadmap existante (Phase0/MVP→V1.5→V2→V3→V4). Aucune contradiction/ADR/écart nouveau.
- **v0.25** : AI-EOS Ch.13 (Archi code) fusionné — **C-002 RÉSOLU** (Ch.13.1 = monolith-first) → **ADR-008 Accepté**. **13.7 pgvector confirme ADR-009**. Structure réelle alignée (apps/web,api + packages/shared) ; worker/ai-engine = à créer.
- **v0.26** : AI-EOS Ch.14 (Agents) fusionné — **C-003 RÉSOLU** (8 agents définitifs). **14.7 confirme ADR-010** (IA hybride), **14.9 confirme ADR-016** (sandbox agents). Aucune contradiction nouvelle.
- **v0.27** : AI-EOS Ch.15 (Déploiement) fusionné — recoupe Ch.9. Réel Vercel+Render+Neon aligné (frontend+DB managée+Cameroun-first). Cible K8s/multi-région/WAF/IaC déjà en registre. **JALON : AI-EOS Ch.1–15 complet.** Reste : Bonus.
- **v0.28** : Bonus fusionné — **SSOT 100% traitée**. Le réel **dépasse** le « MVP technique minimal » du doc (B4). Verdict doc « clé = exécution MVP » = ✅ atteint. Aucune contradiction/ADR nouveau.
- **v0.29** : ajout **Plan d'action priorisé** (P1 critique → P4 LT) dérivé de tout le registre. Gaté par les 3 décisions PO (C-001/004/005). Rien implémenté.
- **v0.30** : **P1.1 rate-limiting implémenté** (`@nestjs/throttler` : global 100/60s + login 5/60s) + testé runtime (429). R11 réglé. Reste P1.2 tests.
- **v0.31** : **P1.2 démarré** — jest/ts-jest/@types/jest installés (absents avant) + `jest.config.js` + `matches.service.spec.ts` (6 tests scoring, **6/6 ✓**). R13 passe 🔴→🟡. Reste : tests carbon/contracts/passport.
- **v0.32** : `carbon.service.spec.ts` (3 tests : calcul CO₂ 4t/180/24000, facteur défaut, idempotence). Total **9/9 ✓** (2 suites). Reste contracts/passport.
- **v0.33** : `contracts.service.spec.ts` (3 tests : totalPrice 260k, double-signature→SIGNED, signature simple). Total **12/12 ✓** (3 suites). R13 : 3 modules critiques couverts. Reste gate CI + passport.
- **v0.34** : lot P1 commité (69dfe7a). Matching-WHY constaté **déjà présent** (scoreBreakdown affiché) — registre corrigé.
- **v0.35** : **Pilier 6 — Économie Circulaire Citoyenne & Publique (B2C+B2G)** ajouté (mission→6 piliers + écart + **ADR-017 proposé**). Extension SSOT, rien écrasé. En attente : confirmation périmètre + décision régénération .docx.
- **v0.36** : **Workflows 1-3** (extension SSOT) intégrés — WF1 Acquisition IA (multi-input+OCR+Vision+DPP auto), WF2 Valorisation (filières+ranking, **ADR-018** rules-first), WF3 Matching 7-scores (**ADR-019** étend ADR-010). 4 écarts. WF2+WF3-socle implémentables sans IA ; WF1-OCR/Vision bloqué C-001/R8. Rien implémenté (attente validation).
- **v0.44** : **Master Execution Prompt Global** fusionné (synthèse) — **9 piliers officiels** cartographiés (section dédiée) ⇄ registre/ADR. Valide méthode (2 vues, Cameroun-first, WHY/traçable/simulé/human-validation = ADR-013/016/021). **JALON : toutes extensions stratégiques traitées.** Aucun ADR/contradiction nouveau.
- **v0.43** : **SCCEN** (spec B2C concrète du Pilier 6, MVP Douala) fusionné dans ADR-017 — app citoyen (photo→IA→prix→collecte→paiement→récompenses). Nouveaux écarts : récompenses/score citoyen, Edge-AI mobile. Wave ajouté à ADR-011. Confirme WF1/ADR-011/018.
- **v0.42** : **SGD-SCI Infra mondiale** fusionné — **duplique** Partie4/Ch9/Ch15 (K8s/multi-région/Kafka/edge/GPU/observabilité/zero-trust/IaC = déjà en registre). **Phase-1 Cameroun (1 région, stack simplifiée) = réel Vercel+Render+Neon ✅** (validé par SSOT). Aucune contradiction/ADR/écart nouveau.
- **v0.41** : **SGAADS Cerveau/IA autonome** intégré — re-spécifie Master Control (Ch.11)+agents(Ch.14)+WF9/10. Confirme **ADR-013/016/021** (explicabilité/sandbox/contrôle humain). Nouveau : Rule Engine + Moteur de simulation (2 écarts). Réel = règles hardcodées. Programme V2-V3.
- **v0.40** : **SCCEM Bourse** (extension marketplace) intégré — 4 marchés (spot/contractuel/enchères/ESG) + pricing dynamique + LME (**ADR-026**). Réel = germes ✅ (marketplace+contrats+marché carbone). Spot-heuristique+enchères MVP-able ; LME/blockchain LT (R9). Settlement off-chain (ADR-011).
- **v0.39** : **SFITE Usines Intelligentes** (couche transformation, aval SCSRE) intégré — filières détaillées (seed ADR-018), IA industrielle, Digital Twin, MES/SCADA/ISA-95 (**ADR-025**), **DPP standard** GS1/CIRPASS (**ADR-024**). Réel = 0 (Industry 4.0, V2-V3). Programme SCSRE+SFITE = gros → géré par roadmap (R2).
- **v0.38** : **SCSRE Centres Intelligents** (backbone Pilier 6) intégré — modèles Center/Lot/Stock/Processing, workflow 24, IoT/DigitalTwin (**ADR-022**). **ADR-023** object storage (résout R10). ADR-011 enrichi (agrégateurs Campay/Fapshi/CinetPay/Paystack). Réel = 0 centre (programme V2+).
- **v0.37** : **Workflows 4-10** intégrés — WF4 négociation IA, WF5 escrow+multi-paiement(Flutterwave)+calc taxes, WF6 logistique RT (**ADR-020** GPS-WebSocket), WF7 validation réception, WF8 MRV Scope1/2/3, WF9/10 IA-continue+apprentissage (**ADR-021** contrôle humain). **C-006** (libération auto fonds ↔ contrôle humain). Réel **partiel** sur WF6/7 (PoD/QR/Socket.io/DPP/crédit ✅). Rien implémenté.
