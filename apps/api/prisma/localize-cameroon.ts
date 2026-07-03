import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Migration non-destructive : localise les données existantes vers le Cameroun
// (villes, coordonnées, pays, prix en FCFA). Conserve les IDs et relations.

const COMPANY_UPDATES: {
  match: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lon: number;
  description?: string;
}[] = [
  { match: 'CaféVert Industries', name: 'CaféVert Cameroun', city: 'Douala', address: 'Zone Industrielle de Bassa', lat: 4.0511, lon: 9.7679, description: 'Torréfacteur et exportateur de café de la région du Littoral. Produit 5 tonnes de marc de café par semaine.' },
  { match: 'BioCompost Rhône', name: 'BioCompost Littoral', city: 'Douala', address: 'Quartier Bonabéri, Route de l\'Ouest', lat: 4.0800, lon: 9.7000, description: 'Spécialiste du compostage industriel et de la valorisation de biomasse organique dans le Littoral.' },
  { match: 'PlastiRecycle SAS', name: 'PlastiRecycle Cameroun', city: 'Yaoundé', address: 'Zone Industrielle de Mvan', lat: 3.8480, lon: 11.5021 },
  { match: 'Emballages Durand', name: 'Emballages du Grassfield', city: 'Bafoussam', address: 'Marché B, Zone Artisanale', lat: 5.4781, lon: 10.4176 },
  { match: 'MétalFonderie du Sud', name: 'MétalFonderie du Littoral', city: 'Kribi', address: 'Zone Portuaire', lat: 2.9391, lon: 9.9100 },
  { match: 'RecyMétal Provence', name: 'RecyMétal Centre', city: 'Edéa', address: 'Route Nationale N°3', lat: 3.8000, lon: 10.1333, description: 'Achat et recyclage de métaux ferreux et non-ferreux. Agréé par le MINEPDED.' },
  { match: 'TextiRenov', name: 'TextiRenov Bamenda', city: 'Bamenda', address: 'Commercial Avenue', lat: 5.9631, lon: 10.1591 },
  { match: 'TransEco Logistics', name: 'TransEco Logistics', city: 'Nkongsamba', address: 'Carrefour Ndokoti', lat: 4.9547, lon: 9.9404 },
  { match: 'SymbioNexus (Admin)', name: 'SymbioNexus (Admin)', city: 'Yaoundé', address: 'Quartier Bastos', lat: 3.8480, lon: 11.5021 },
];

const LISTING_UPDATES: { title: string; price: number; lat: number; lon: number }[] = [
  { title: 'Marc de café — 5 tonnes/semaine', price: 50, lat: 4.0511, lon: 9.7679 },
  { title: 'Chutes de film PE — 2 tonnes/semaine', price: 165, lat: 5.4781, lon: 10.4176 },
  { title: 'Copeaux d\'aluminium — 3 tonnes/mois', price: 800, lat: 2.9391, lon: 9.9100 },
  { title: 'Pellicule d\'argent des grains — 500 kg/mois', price: 100, lat: 4.0511, lon: 9.7679 },
  { title: 'Huile de coupe usagée — 1000 L/mois', price: 35, lat: 2.9391, lon: 9.9100 },
];

async function main() {
  console.log('🇨🇲 Localisation des données vers le Cameroun...\n');

  // 1. Pays : toutes les entreprises
  const country = await prisma.company.updateMany({ data: { companyCountry: 'Cameroun' } });
  console.log(`✅ ${country.count} entreprises → pays Cameroun`);

  // 2. Villes / coords / noms par entreprise
  for (const c of COMPANY_UPDATES) {
    const res = await prisma.company.updateMany({
      where: { name: c.match },
      data: {
        name: c.name,
        companyCity: c.city,
        companyAddress: c.address,
        companyLatitude: c.lat,
        companyLongitude: c.lon,
        ...(c.description ? { description: c.description } : {}),
      },
    });
    if (res.count) console.log(`   • ${c.match} → ${c.name} (${c.city})`);
  }

  // 3. Annonces : prix FCFA + coords
  for (const l of LISTING_UPDATES) {
    const res = await prisma.wasteListing.updateMany({
      where: { title: l.title },
      data: { pricePerKg: l.price, latitude: l.lat, longitude: l.lon },
    });
    if (res.count) console.log(`   • Annonce "${l.title}" → ${l.price} FCFA/kg`);
  }

  // 4. Contrats : convertir le prix € → FCFA (×~655) et recalculer le total
  const contracts = await prisma.contract.findMany({ select: { id: true, pricePerKg: true, volumeEngagedKg: true } });
  for (const ct of contracts) {
    // Prix stockés en € (petits décimaux) → FCFA entiers réalistes
    const priceFcfa = ct.pricePerKg < 10 ? Math.round(ct.pricePerKg * 655) : Math.round(ct.pricePerKg);
    const total = priceFcfa * ct.volumeEngagedKg;
    await prisma.contract.update({ where: { id: ct.id }, data: { pricePerKg: priceFcfa, totalPrice: total } });
  }
  console.log(`✅ ${contracts.length} contrat(s) → prix FCFA`);

  // 5. Passeports : recalage de l'itinéraire démo sur le Littoral (Douala → Bonabéri)
  const passports = await prisma.materialPassport.findMany({ select: { id: true } });
  for (const p of passports) {
    await prisma.materialPassport.update({
      where: { id: p.id },
      data: {
        currentLatitude: 4.0800,
        currentLongitude: 9.7000,
        routeWaypoints: [
          { companyLatitude: 4.0511, companyLongitude: 9.7679, label: 'Départ — CaféVert Cameroun, Douala' },
          { companyLatitude: 4.0620, companyLongitude: 9.7450, label: 'Point de transit 1' },
          { companyLatitude: 4.0720, companyLongitude: 9.7200, label: 'Point de transit 2' },
          { companyLatitude: 4.0800, companyLongitude: 9.7000, label: 'Arrivée — BioCompost Littoral, Douala (Bonabéri)' },
        ],
      },
    });
  }
  console.log(`✅ ${passports.length} passeport(s) → itinéraire Cameroun\n`);

  console.log('🌿 Localisation Cameroun terminée.');
}

main()
  .catch((e) => { console.error('❌ Erreur:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
