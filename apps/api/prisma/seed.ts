import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';

const prisma = new PrismaClient();

async function main() {
  console.log('🌿 Seeding SymbioNexus database...\n');

  // ============ COMPANIES ============
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'CaféVert Industries',
        // siret: '12345678901234',
        companySector: 'Agroalimentaire',
        companyAddress: '45 Rue de l\'Innovation',
        companyCity: 'Lyon',
        companyCountry: 'France',
        companyLatitude: 45.7578,
        companyLongitude: 4.8320,
        trustScore: 0.85,
        kybStatus: 'VERIFIED',
        description: 'Leader de la production de café torréfié en Auvergne-Rhône-Alpes. Produit 5 tonnes de marc de café par semaine.',
        certifications: '["ISO 14001", "Bio"]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'BioCompost Rhône',
        // siret: '23456789012345',
        companySector: 'Compostage',
        companyAddress: '12 Zone Industrielle Nord',
        companyCity: 'Villeurbanne',
        companyCountry: 'France',
        companyLatitude: 45.7676,
        companyLongitude: 4.8798,
        trustScore: 0.90,
        kybStatus: 'VERIFIED',
        description: 'Spécialiste du compostage industriel et de la valorisation de biomasse organique.',
        certifications: '["ISO 14001", "NF Compost"]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'PlastiRecycle SAS',
        // siret: '34567890123456',
        companySector: 'Recyclage plastique',
        companyAddress: '8 Boulevard des Usines',
        companyCity: 'Grenoble',
        companyCountry: 'France',
        companyLatitude: 45.1885,
        companyLongitude: 5.7245,
        trustScore: 0.75,
        kybStatus: 'VERIFIED',
        description: 'Recyclage de plastiques industriels : PE, PP, PET. Capacité de traitement : 200 tonnes/mois.',
        certifications: '["ISO 9001"]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Emballages Durand',
        // siret: '45678901234567',
        companySector: 'Plasturgie',
        companyAddress: '22 Rue des Artisans',
        companyCity: 'Saint-Étienne',
        companyCountry: 'France',
        companyLatitude: 45.4397,
        companyLongitude: 4.3872,
        trustScore: 0.70,
        kybStatus: 'VERIFIED',
        description: 'Fabrication d\'emballages alimentaires. Cherche à réduire ses coûts de matière première.',
        certifications: '[]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'MétalFonderie du Sud',
        // siret: '56789012345678',
        companySector: 'Métallurgie',
        companyAddress: '3 Impasse de la Forge',
        companyCity: 'Marseille',
        companyCountry: 'France',
        companyLatitude: 43.2965,
        companyLongitude: 5.3698,
        trustScore: 0.80,
        kybStatus: 'VERIFIED',
        description: 'Fonderie spécialisée dans les alliages aluminium et cuivre. Résidus de copeaux métalliques.',
        certifications: '["ISO 14001", "ISO 9001"]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'RecyMétal Provence',
        // siret: '67890123456789',
        companySector: 'Recyclage métaux',
        companyAddress: '15 Avenue de l\'Industrie',
        companyCity: 'Aix-en-Provence',
        companyCountry: 'France',
        companyLatitude: 43.5297,
        companyLongitude: 5.4474,
        trustScore: 0.88,
        kybStatus: 'VERIFIED',
        description: 'Achat et recyclage de métaux ferreux et non-ferreux. Agréé ICPE.',
        certifications: '["ISO 14001", "ICPE"]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'TextiRenov',
        // siret: '78901234567890',
        companySector: 'Recyclage textile',
        companyAddress: '7 Chemin des Tisseurs',
        companyCity: 'Toulouse',
        companyCountry: 'France',
        companyLatitude: 43.6047,
        companyLongitude: 1.4442,
        trustScore: 0.72,
        kybStatus: 'VERIFIED',
        description: 'Collecte et recyclage de textiles industriels et post-consommation.',
        certifications: '[]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'TransEco Logistics',
        // siret: '89012345678901',
        companySector: 'Transport',
        companyAddress: '50 Route Nationale',
        companyCity: 'Valence',
        companyCountry: 'France',
        companyLatitude: 44.9334,
        companyLongitude: 4.8924,
        trustScore: 0.82,
        kybStatus: 'VERIFIED',
        description: 'Transport spécialisé de matières recyclables et déchets industriels. Flotte éco-responsable.',
        certifications: '["Objectif CO2"]',
      },
    }),
    // Admin company
    prisma.company.create({
      data: {
        name: 'SymbioNexus (Admin)',
        companySector: 'Plateforme',
        companyAddress: '1 Place de l\'Économie Circulaire',
        companyCity: 'Paris',
        companyCountry: 'France',
        companyLatitude: 48.8566,
        companyLongitude: 2.3522,
        trustScore: 1.0,
        kybStatus: 'VERIFIED',
        description: 'Administration de la plateforme SymbioNexus.',
      },
    }),
  ]);

  console.log(`✅ Created ${companies.length} companies`);

  // ============ USERS ============
  const passwordHash = await bcrypt.hash('Demo2024!', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'seller@cafvert.fr',
        passwordHash,
        firstName: 'Marie',
        lastName: 'Dubois',
        role: 'SELLER',
        companyId: companies[0].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@biocompost.fr',
        passwordHash,
        firstName: 'Pierre',
        lastName: 'Martin',
        role: 'BUYER',
        companyId: companies[1].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@plastirecycle.fr',
        passwordHash,
        firstName: 'Sophie',
        lastName: 'Bernard',
        role: 'BUYER',
        companyId: companies[2].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller@durand.fr',
        passwordHash,
        firstName: 'Luc',
        lastName: 'Durand',
        role: 'SELLER',
        companyId: companies[3].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller@metalfonderie.fr',
        passwordHash,
        firstName: 'Jean',
        lastName: 'Moreau',
        role: 'SELLER',
        companyId: companies[4].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@recycmetal.fr',
        passwordHash,
        firstName: 'Claire',
        lastName: 'Petit',
        role: 'BUYER',
        companyId: companies[5].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@textirenov.fr',
        passwordHash,
        firstName: 'Antoine',
        lastName: 'Leroy',
        role: 'BUYER',
        companyId: companies[6].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'transport@transeco.fr',
        passwordHash,
        firstName: 'Marc',
        lastName: 'Faure',
        role: 'TRANSPORTER',
        companyId: companies[7].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@symbionexus.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'SymbioNexus',
        role: 'ADMIN',
        companyId: companies[8].id,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);
  console.log('   📧 All passwords: Demo2024!\n');

  // ============ WASTE LISTINGS ============
  const listings = await Promise.all([
    prisma.wasteListing.create({
      data: {
        companyId: companies[0].id,
        title: 'Marc de café — 5 tonnes/semaine',
        materialType: 'Marc de café usagé',
        materialCategory: 'BIOMASS',
        description: 'Marc de café séché et conditionné en big bags de 500kg. Idéal pour compostage, substrat de culture de champignons, ou biocarburant. Taux d\'humidité résiduel < 15%.',
        volumeKg: 5000,
        frequency: 'WEEKLY',
        chemicalProfile: { humidity: '12%', organicMatter: '85%', nitrogen: '2.3%', pH: 6.2 },
        pricePerKg: 0.08,
        latitude: 45.7578,
        longitude: 4.8320,
        status: 'PUBLISHED',
        photos: '[]',
      },
    }),
    prisma.wasteListing.create({
      data: {
        companyId: companies[3].id,
        title: 'Chutes de film PE — 2 tonnes/semaine',
        materialType: 'Polyéthylène (PE) — chutes de production',
        materialCategory: 'PLASTICS',
        description: 'Chutes de film polyéthylène basse densité (PEBD) issues de la production d\'emballages. Matière propre, non contaminée, prête pour regranulation.',
        volumeKg: 2000,
        frequency: 'WEEKLY',
        chemicalProfile: { polymer: 'PEBD', purity: '98%', color: 'transparent' },
        pricePerKg: 0.25,
        latitude: 45.4397,
        longitude: 4.3872,
        status: 'PUBLISHED',
        photos: '[]',
      },
    }),
    prisma.wasteListing.create({
      data: {
        companyId: companies[4].id,
        title: 'Copeaux d\'aluminium — 3 tonnes/mois',
        materialType: 'Copeaux et chutes d\'aluminium',
        materialCategory: 'METALS',
        description: 'Copeaux d\'aluminium série 6000 issus d\'usinage CNC. Non oxydés, stockés en benne couverte. Parfait pour refonte en fonderie.',
        volumeKg: 3000,
        frequency: 'MONTHLY',
        chemicalProfile: { alloy: 'Al 6061', purity: '95%', form: 'copeaux' },
        pricePerKg: 1.20,
        latitude: 43.2965,
        longitude: 5.3698,
        status: 'PUBLISHED',
        photos: '[]',
      },
    }),
    prisma.wasteListing.create({
      data: {
        companyId: companies[0].id,
        title: 'Pellicule d\'argent des grains — 500 kg/mois',
        materialType: 'Pellicule argentée de grain de café',
        materialCategory: 'BIOMASS',
        description: 'Sous-produit de la torréfaction. Riche en fibres et antioxydants. Valorisable en cosmétique, alimentation animale ou compostage.',
        volumeKg: 500,
        frequency: 'MONTHLY',
        pricePerKg: 0.15,
        latitude: 45.7578,
        longitude: 4.8320,
        status: 'PUBLISHED',
        photos: '[]',
      },
    }),
    prisma.wasteListing.create({
      data: {
        companyId: companies[4].id,
        title: 'Huile de coupe usagée — 1000 L/mois',
        materialType: 'Huile de coupe minérale usagée',
        materialCategory: 'CHEMICALS',
        description: 'Huile de coupe usagée issue des centres d\'usinage. Collecte en fûts de 200L. Nécessite traitement spécialisé.',
        volumeKg: 900,
        frequency: 'MONTHLY',
        pricePerKg: 0.05,
        latitude: 43.2965,
        longitude: 5.3698,
        status: 'PUBLISHED',
        photos: '[]',
      },
    }),
  ]);

  console.log(`✅ Created ${listings.length} waste listings`);

  // ============ PRE-COMPUTED MATCHES (for demo) ============
  const matches = await Promise.all([
    // CaféVert ↔ BioCompost (marc de café → compostage) — excellent match
    prisma.match.create({
      data: {
        listingId: listings[0].id,
        buyerCompanyId: companies[1].id,
        sellerCompanyId: companies[0].id,
        compatibilityScore: 92,
        scoreBreakdown: {
          materialScore: 100,
          distanceScore: 95,
          volumeScore: 85,
          trustScore: 90,
          totalScore: 92,
        },
        distanceKm: 4.2,
        status: 'CONFIRMED',
      },
    }),
    // Emballages Durand ↔ PlastiRecycle (chutes PE → recyclage) — great match
    prisma.match.create({
      data: {
        listingId: listings[1].id,
        buyerCompanyId: companies[2].id,
        sellerCompanyId: companies[3].id,
        compatibilityScore: 78,
        scoreBreakdown: {
          materialScore: 95,
          distanceScore: 60,
          volumeScore: 80,
          trustScore: 75,
          totalScore: 78,
        },
        distanceKm: 85.3,
        status: 'PROPOSED',
      },
    }),
    // MétalFonderie ↔ RecyMétal (copeaux alu → recyclage métaux) — excellent match
    prisma.match.create({
      data: {
        listingId: listings[2].id,
        buyerCompanyId: companies[5].id,
        sellerCompanyId: companies[4].id,
        compatibilityScore: 88,
        scoreBreakdown: {
          materialScore: 100,
          distanceScore: 90,
          volumeScore: 70,
          trustScore: 88,
          totalScore: 88,
        },
        distanceKm: 26.7,
        status: 'PROPOSED',
      },
    }),
  ]);

  console.log(`✅ Created ${matches.length} matches`);

  // ============ DEMO CONTRACT (CaféVert → BioCompost) ============
  const contract = await prisma.contract.create({
    data: {
      matchId: matches[0].id,
      sellerCompanyId: companies[0].id,
      buyerCompanyId: companies[1].id,
      volumeEngagedKg: 5000,
      pricePerKg: 0.08,
      totalPrice: 400,
      durationMonths: 12,
      frequency: 'WEEKLY',
      sellerSigned: true,
      buyerSigned: true,
      status: 'SIGNED',
      signedAt: new Date(),
      transportConditions: {
        pickupAddress: companies[0].companyAddress + ', ' + companies[0].companyCity,
        deliveryAddress: companies[1].companyAddress + ', ' + companies[1].companyCity,
        maxTransitDays: 1,
        vehicleType: 'Camion benne 10T',
      },
    },
  });

  console.log('✅ Created demo contract (CaféVert → BioCompost)');

  // ============ DEMO PASSPORT ============
  // Génère un vrai QR code (data URL) encodant les infos de traçabilité du passeport
  const demoQrData = await QRCode.toDataURL(
    JSON.stringify({ contractId: contract.id, type: 'material-passport', issuer: 'SymbioNexus' }),
    { width: 300, margin: 1, color: { dark: '#0f766e', light: '#ffffff' } },
  );
  const passport = await prisma.materialPassport.create({
    data: {
      contractId: contract.id,
      qrCodeData: demoQrData,
      transportStatus: 'CONFIRMED',
      currentLatitude: companies[1].companyLatitude,
      currentLongitude: companies[1].companyLongitude,
      routeWaypoints: [
        { companyLatitude: 45.7578, companyLongitude: 4.8320, timestamp: new Date().toISOString(), label: 'Départ — CaféVert Industries, Lyon' },
        { companyLatitude: 45.7600, companyLongitude: 4.8450, timestamp: new Date(Date.now() + 1800000).toISOString(), label: 'Point de transit 1' },
        { companyLatitude: 45.7650, companyLongitude: 4.8600, timestamp: new Date(Date.now() + 3600000).toISOString(), label: 'Point de transit 2' },
        { companyLatitude: 45.7676, companyLongitude: 4.8798, timestamp: new Date(Date.now() + 5400000).toISOString(), label: 'Arrivée — BioCompost Rhône, Villeurbanne' },
      ],
      estimatedArrival: new Date(Date.now() + 5400000),
      pickupAt: new Date(Date.now() - 7200000),
      deliveredAt: new Date(Date.now() - 1800000),
      deliveryProofAt: new Date(),
      deliverySignature: 'SIG-DEMO-2024',
    },
  });

  console.log('✅ Created demo material passport with route');

  // ============ DEMO CARBON CREDIT ============
  const carbonCredit = await prisma.carbonCredit.create({
    data: {
      passportId: passport.id,
      companyId: companies[0].id,
      co2AvoidedTonnes: 4.0, // (0.9 - 0.1) * 5 = 4.0 tonnes
      equivalentTrees: 180,
      equivalentCarKm: 24000,
      marketStatus: 'CERTIFIED',
    },
  });

  console.log('✅ Created demo carbon credit (4.0 tonnes CO₂ avoided)');

  // ============ DEMO NOTIFICATIONS ============
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[0].id,
        type: 'NEW_MATCH',
        title: 'Nouveau match trouvé !',
        message: 'BioCompost Rhône correspond à 92% avec votre annonce de marc de café.',
        data: { matchId: matches[0].id },
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[0].id,
        type: 'CARBON_CREDIT_EARNED',
        title: 'Crédit carbone gagné ! 🌱',
        message: 'Vous avez évité 4.0 tonnes de CO₂ grâce à votre dernière livraison.',
        data: { creditId: carbonCredit.id },
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id,
        type: 'DELIVERY_CONFIRMED',
        title: 'Livraison confirmée ✅',
        message: 'Le lot de 5000 kg de marc de café a été livré avec succès.',
        data: { passportId: passport.id },
      },
    }),
  ]);

  console.log('✅ Created demo notifications\n');

  // ============ SUMMARY ============
  console.log('═══════════════════════════════════════════');
  console.log('  🌿 SymbioNexus Database Seeded!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('  Demo Accounts (password: Demo2024!):');
  console.log('  ─────────────────────────────────────');
  console.log('  📦 Seller:      seller@cafvert.fr');
  console.log('  🛒 Buyer:       buyer@biocompost.fr');
  console.log('  🚛 Transporter: transport@transeco.fr');
  console.log('  🔑 Admin:       admin@symbionexus.com');
  console.log('');
  console.log('  Pre-built demo flow:');
  console.log('  CaféVert (seller) → BioCompost (buyer)');
  console.log('  Marc de café → Compostage');
  console.log('  Contract signed, passport delivered,');
  console.log('  4.0 tonnes CO₂ avoided ✅');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
