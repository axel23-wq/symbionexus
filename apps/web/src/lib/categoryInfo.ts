// Données enrichies par catégorie de matière (contexte économie circulaire, Cameroun).
// Images réelles keyword-matched via LoremFlickr (lock = image stable), repli géré côté UI.

export interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
  image: string;
  alt: string;
  description: string;
  examples: string[];
  priceRange: string;   // FCFA / kg
  industries: string[]; // débouchés / industries compatibles
}

const img = (kw: string, lock: number) => `https://loremflickr.com/640/420/${kw}?lock=${lock}`;

export const CATEGORY_INFO: Record<string, CategoryInfo> = {
  METALS: {
    id: 'METALS',
    label: 'Métaux',
    icon: '⚙️',
    image: 'https://loremflickr.com/800/600/steel,pipes,factory?lock=417',
    alt: 'Copeaux et chutes de métaux',
    description: 'Chutes, copeaux et rebuts de métaux ferreux et non-ferreux issus de l\'usinage et de la démolition, prêts pour la refonte.',
    examples: ['Copeaux d\'aluminium', 'Chutes de cuivre', 'Ferraille', 'Tournures d\'acier inox'],
    priceRange: '330 – 1 000 FCFA/kg',
    industries: ['Fonderies', 'Aciéries', 'Récupérateurs agréés'],
  },
  PLASTICS: {
    id: 'PLASTICS',
    label: 'Plastiques',
    icon: '🧪',
    image: img('plastic,bottles,waste', 102),
    alt: 'Plastiques de recyclage',
    description: 'Chutes et films plastiques industriels propres (PE, PP, PET) issus de la production, prêts pour la regranulation.',
    examples: ['Film PEBD', 'Chutes PP', 'Bouteilles PET', 'Big bags usagés'],
    priceRange: '130 – 400 FCFA/kg',
    industries: ['Régénérateurs plastiques', 'Plasturgistes', 'Fabricants d\'emballages'],
  },
  BIOMASS: {
    id: 'BIOMASS',
    label: 'Biomasse',
    icon: '🌱',
    image: img('coffee,grounds,compost', 33),
    alt: 'Biomasse organique',
    description: 'Sous-produits organiques valorisables en compost, substrat, alimentation animale ou biocarburant.',
    examples: ['Marc de café', 'Pellicule de grain', 'Coques de cacao', 'Résidus agricoles'],
    priceRange: '30 – 100 FCFA/kg',
    industries: ['Compostage', 'Méthanisation', 'Substrats agricoles', 'Alimentation animale'],
  },
  WOOD: {
    id: 'WOOD',
    label: 'Bois',
    icon: '🌲',
    image: img('wood,pallet,timber', 44),
    alt: 'Bois et palettes',
    description: 'Palettes, chutes et sciures de bois réutilisables ou valorisables en panneaux, paillage ou énergie.',
    examples: ['Palettes EUR usagées', 'Sciure', 'Chutes de coffrage', 'Cagettes'],
    priceRange: '20 – 90 FCFA/kg',
    industries: ['Panneautiers', 'Chaufferies biomasse', 'Paysagistes'],
  },
  TEXTILE: {
    id: 'TEXTILE',
    label: 'Textile',
    icon: '🧵',
    image: img('textile,fabric,rolls', 104),
    alt: 'Chutes textiles',
    description: 'Chutes de production et textiles post-consommation, recyclables en fibres, chiffons ou isolants.',
    examples: ['Chutes de coton', 'Fibres synthétiques', 'Vêtements usagés', 'Toiles techniques'],
    priceRange: '100 – 260 FCFA/kg',
    industries: ['Effilocheurs', 'Fabricants d\'isolants', 'Filatures'],
  },
  OILS: {
    id: 'OILS',
    label: 'Huiles',
    icon: '💧',
    image: 'https://loremflickr.com/800/600/engine,oil,bottle?lock=418',
    alt: 'Huiles usagées',
    description: 'Huiles minérales et de coupe usagées, collectées en fûts, nécessitant une régénération spécialisée.',
    examples: ['Huile de coupe', 'Huile moteur usagée', 'Lubrifiants hydrauliques'],
    priceRange: '15 – 60 FCFA/kg',
    industries: ['Régénérateurs d\'huiles', 'Cimenteries (combustible)', 'Collecteurs agréés'],
  },
  GLASS: {
    id: 'GLASS',
    label: 'Verre',
    icon: '🔮',
    image: img('glass,bottles,recycling', 77),
    alt: 'Calcin de verre',
    description: 'Calcin (verre broyé) et verre creux trié par couleur, refondu pour de nouveaux contenants.',
    examples: ['Calcin incolore', 'Verre brun', 'Bouteilles triées', 'Verre plat'],
    priceRange: '20 – 65 FCFA/kg',
    industries: ['Verreries', 'Fabricants de bouteilles', 'BTP (granulats)'],
  },
  CHEMICAL: {
    id: 'CHEMICAL',
    label: 'Chimique',
    icon: '⚗️',
    image: img('chemical,drums,barrels', 103),
    alt: 'Coproduits chimiques',
    description: 'Coproduits et solvants chimiques valorisables, manipulés avec FDS et traçabilité réglementaire.',
    examples: ['Solvants usagés', 'Bains de traitement', 'Réactifs excédentaires'],
    priceRange: '200 – 650 FCFA/kg',
    industries: ['Régénérateurs de solvants', 'Traitement spécialisé', 'Chimie fine'],
  },
};
