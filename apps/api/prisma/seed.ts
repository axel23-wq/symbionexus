import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';

const prisma = new PrismaClient();

async function main() {
  console.log('🌿 Seeding SymbioNexus database (Cameroun)...\n');

  // ============ COMPANIES ============
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'CaféVert Cameroun',
        // niu: 'M081512345678A',
        companySector: 'Agroalimentaire',
        companyAddress: 'Zone Industrielle de Bassa',
        companyCity: 'Douala',
        companyCountry: 'Cameroun',
        companyLatitude: 4.0511,
        companyLongitude: 9.7679,
        trustScore: 0.85,
        kybStatus: 'VERIFIED',
        description: 'Torréfacteur et exportateur de café de la région du Littoral. Produit 5 tonnes de marc de café par semaine.',
        certifications: '["ISO 14001", "Bio"]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'BioCompost Littoral',
        // niu: 'M081523456789B',
        companySector: 'Compostage',
        companyAddress: 'Quartier Bonabéri, Route de l\'Ouest',
        companyCity: 'Douala',
        companyCountry: 'Cameroun',
        companyLatitude: 4.0800,
        companyLongitude: 9.7000,
        trustScore: 0.90,
        kybStatus: 'VERIFIED',
        description: 'Spécialiste du compostage industriel et de la valorisation de biomasse organique dans le Littoral.',
        certifications: '["ISO 14001"]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'PlastiRecycle Cameroun',
        // niu: 'M081534567890C',
        companySector: 'Recyclage plastique',
        companyAddress: 'Zone Industrielle de Mvan',
        companyCity: 'Yaoundé',
        companyCountry: 'Cameroun',
        companyLatitude: 3.8480,
        companyLongitude: 11.5021,
        trustScore: 0.75,
        kybStatus: 'VERIFIED',
        description: 'Recyclage de plastiques industriels : PE, PP, PET. Capacité de traitement : 200 tonnes/mois.',
        certifications: '["ISO 9001"]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Emballages du Grassfield',
        // niu: 'M081545678901D',
        companySector: 'Plasturgie',
        companyAddress: 'Marché B, Zone Artisanale',
        companyCity: 'Bafoussam',
        companyCountry: 'Cameroun',
        companyLatitude: 5.4781,
        companyLongitude: 10.4176,
        trustScore: 0.70,
        kybStatus: 'VERIFIED',
        description: 'Fabrication d\'emballages alimentaires. Cherche à réduire ses coûts de matière première.',
        certifications: '[]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'MétalFonderie du Littoral',
        // niu: 'M081556789012E',
        companySector: 'Métallurgie',
        companyAddress: 'Zone Portuaire',
        companyCity: 'Kribi',
        companyCountry: 'Cameroun',
        companyLatitude: 2.9391,
        companyLongitude: 9.9100,
        trustScore: 0.80,
        kybStatus: 'VERIFIED',
        description: 'Fonderie spécialisée dans les alliages aluminium et cuivre. Résidus de copeaux métalliques.',
        certifications: '["ISO 14001", "ISO 9001"]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'RecyMétal Centre',
        // niu: 'M081567890123F',
        companySector: 'Recyclage métaux',
        companyAddress: 'Route Nationale N°3',
        companyCity: 'Edéa',
        companyCountry: 'Cameroun',
        companyLatitude: 3.8000,
        companyLongitude: 10.1333,
        trustScore: 0.88,
        kybStatus: 'VERIFIED',
        description: 'Achat et recyclage de métaux ferreux et non-ferreux. Agréé par le MINEPDED.',
        certifications: '["ISO 14001"]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'TextiRenov Bamenda',
        // niu: 'M081578901234G',
        companySector: 'Recyclage textile',
        companyAddress: 'Commercial Avenue',
        companyCity: 'Bamenda',
        companyCountry: 'Cameroun',
        companyLatitude: 5.9631,
        companyLongitude: 10.1591,
        trustScore: 0.72,
        kybStatus: 'VERIFIED',
        description: 'Collecte et recyclage de textiles industriels et post-consommation.',
        certifications: '[]',
      },
    }),
    prisma.company.create({
      data: {
        name: 'TransEco Logistics',
        // niu: 'M081589012345H',
        companySector: 'Transport',
        companyAddress: 'Carrefour Ndokoti',
        companyCity: 'Nkongsamba',
        companyCountry: 'Cameroun',
        companyLatitude: 4.9547,
        companyLongitude: 9.9404,
        trustScore: 0.82,
        kybStatus: 'VERIFIED',
        description: 'Transport spécialisé de matières recyclables et déchets industriels. Flotte éco-responsable.',
        certifications: '[]',
      },
    }),
    // Admin company
    prisma.company.create({
      data: {
        name: 'SymbioNexus (Admin)',
        companySector: 'Plateforme',
        companyAddress: 'Quartier Bastos',
        companyCity: 'Yaoundé',
        companyCountry: 'Cameroun',
        companyLatitude: 3.8480,
        companyLongitude: 11.5021,
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
        lastName: 'Ngo',
        role: 'SELLER',
        companyId: companies[0].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@biocompost.fr',
        passwordHash,
        firstName: 'Pierre',
        lastName: 'Mbarga',
        role: 'BUYER',
        companyId: companies[1].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@plastirecycle.fr',
        passwordHash,
        firstName: 'Sophie',
        lastName: 'Fotso',
        role: 'BUYER',
        companyId: companies[2].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller@durand.fr',
        passwordHash,
        firstName: 'Luc',
        lastName: 'Kamga',
        role: 'SELLER',
        companyId: companies[3].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller@metalfonderie.fr',
        passwordHash,
        firstName: 'Jean',
        lastName: 'Essomba',
        role: 'SELLER',
        companyId: companies[4].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@recycmetal.fr',
        passwordHash,
        firstName: 'Claire',
        lastName: 'Nkoulou',
        role: 'BUYER',
        companyId: companies[5].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@textirenov.fr',
        passwordHash,
        firstName: 'Antoine',
        lastName: 'Tabi',
        role: 'BUYER',
        companyId: companies[6].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'transport@transeco.fr',
        passwordHash,
        firstName: 'Marc',
        lastName: 'Ekwalla',
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

  // ============ WASTE LISTINGS (prix en FCFA / kg) ============
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
        pricePerKg: 50,
        latitude: 4.0511,
        longitude: 9.7679,
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
        pricePerKg: 165,
        latitude: 5.4781,
        longitude: 10.4176,
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
        pricePerKg: 800,
        latitude: 2.9391,
        longitude: 9.9100,
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
        pricePerKg: 100,
        latitude: 4.0511,
        longitude: 9.7679,
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
        pricePerKg: 35,
        latitude: 2.9391,
        longitude: 9.9100,
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
        distanceKm: 8.4,
        status: 'CONFIRMED',
      },
    }),
    // Emballages du Grassfield ↔ PlastiRecycle (chutes PE → recyclage) — great match
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
        distanceKm: 232.5,
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
        distanceKm: 98.2,
        status: 'PROPOSED',
      },
    }),
  ]);

  console.log(`✅ Created ${matches.length} matches`);

  // ============ DEMO CONTRACT (CaféVert → BioCompost) — prix FCFA ============
  const contract = await prisma.contract.create({
    data: {
      matchId: matches[0].id,
      sellerCompanyId: companies[0].id,
      buyerCompanyId: companies[1].id,
      volumeEngagedKg: 5000,
      pricePerKg: 50,
      totalPrice: 250000,
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
        { companyLatitude: 4.0511, companyLongitude: 9.7679, timestamp: new Date().toISOString(), label: 'Départ — CaféVert Cameroun, Douala' },
        { companyLatitude: 4.0620, companyLongitude: 9.7450, timestamp: new Date(Date.now() + 1800000).toISOString(), label: 'Point de transit 1' },
        { companyLatitude: 4.0720, companyLongitude: 9.7200, timestamp: new Date(Date.now() + 3600000).toISOString(), label: 'Point de transit 2' },
        { companyLatitude: 4.0800, companyLongitude: 9.7000, timestamp: new Date(Date.now() + 5400000).toISOString(), label: 'Arrivée — BioCompost Littoral, Douala (Bonabéri)' },
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
        message: 'BioCompost Littoral correspond à 92% avec votre annonce de marc de café.',
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
  console.log('  🌿 SymbioNexus Database Seeded! (Cameroun)');
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
  console.log('  CaféVert (Douala) → BioCompost (Douala)');
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
