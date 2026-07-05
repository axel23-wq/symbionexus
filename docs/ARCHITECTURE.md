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

**Version : v0.33** · SSOT 100% ✓ · Plan ✓ · **P1.1 rate-limiting ✓** · **P1.2 tests : matching+carbon+contracts (12/12 ✓)** (reste : gate CI + passport).
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

## VUE B — VISION CIBLE (SSOT)

**Positionnement** : infrastructure numérique **mondiale** de l'économie circulaire industrielle. Nexus 6 acteurs : producteurs déchets · consommateurs matières secondaires · logisticiens · régulateurs · certificateurs · marchés carbone.

**Mission (5 piliers)** : ① connecter (IA matching) ② structurer/standardiser (taxonomie universelle) ③ tracer (DPP complet) ④ optimiser logistique (coût+CO₂+délai) ⑤ automatiser conformité (ESG/CSRD/GHG, Scope 1/2/3).

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
- **Master Control System (Ch.11)** — 5 couches : Perception → Intelligence → Reasoning → Execution → Monitoring · boucle décision continue · autonomie contrôlée (11.8 = ADR-016). Réel = flux synchrone, pas d'orchestrateur.
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
| Matching UI « WHY » | score affiché | exposer `scoreBreakdown` (explicabilité) | 🟢 | P2 |
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
| ADR-011 | Paiement Mobile Money natif (Orange/MTN MoMo API) + escrow simulé plateforme ; Stripe = international V4 | résout C-004 · Cameroun-first (Ch.2) · Stripe indispo local · réel déjà MoMo | Stripe Connect immédiat (Partie 6) | intégration MoMo + retenue fonds + Transaction | 🟡 Proposé |
| ADR-012 | Baseline sécurité pragmatique : RBAC+JWT+ValidationPipe+**rate-limiting**+audit maintenant ; zero-trust/MFA-SMS/vault/mesh en V2+ | sécurité priorité #1 MAIS proportionnée MVP (Ch.3 décision équilibrée) · cheap+fort d'abord | zero-trust complet immédiat (over-eng) | +@nestjs/throttler +Dependabot +Sentry +MFA-TOTP admin | 🟡 Proposé |
| ADR-013 | Contrat comportemental IA : chaque décision IA/agent = explicable (WHY) + traçable (audit) + jamais d'action sans trace | Partie 10 §8 + Ch.8 + Ch.6.8 · renforce ADR-010 | IA « boîte noire » | rationale loggé + explication exposée UI | 🟡 Proposé |
| **ADR-014-R** | **Réviser** l'ordre de priorité v0.1 → adopter la hiérarchie Ch.3.2 (Sécurité N1…) | résout C-005 · Ch.3.2 = cadre officiel détaillé, ajoute Sécurité (Ch.1.3 « sécurité > facilité ») · UX N5 préserve l'atout réel | garder v0.1 · fusion hybride | change l'ordre de tranchage des conflits futurs | 🟡 Proposé (PO) |
| ADR-015 | Tests unitaires obligatoires sur modules critiques avant modif (paiement/carbone/contrats/matching) | Ch.4.8 stabilisation + 4.5 non-régression · finance = risque | tests plus tard / manuels | jest specs + gate CI | 🟡 Proposé |
| ADR-016 | Sécurité des agents IA : sandbox + validation humaine des actions critiques + décisions loggées + interdiction accès direct paiement/contrats | Ch.6.8 · étend ADR-013 · « agents puissants mais contrôlés » | agents pleinement autonomes | garde-fous couche agents (V3) | 🟡 Proposé |

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
