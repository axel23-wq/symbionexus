/**
 * PORT — moteur de Vision IA. L'architecture dépend de cette interface, pas d'un
 * fournisseur précis. Adaptateur réel (Claude Vision) ou fallback heuristique dev
 * interchangeables via VISION_PROVIDER, sans modifier le service métier.
 */
export const VISION_PROVIDER = 'VISION_PROVIDER';

// Catégories tarifées (doivent matcher PRICE_FCFA côté service).
export const WASTE_CATEGORIES = ['METALS', 'PLASTICS', 'BIOMASS', 'WOOD', 'TEXTILE', 'OILS', 'GLASS', 'CHEMICAL'] as const;
export type WasteCategory = (typeof WASTE_CATEGORIES)[number];

export interface DetectedObject {
  label: string;
  confidence: number; // 0..1
}

export interface VisionAnalysis {
  category: WasteCategory;   // catégorie déchet principale
  material: string;          // matière fine (ex: "PET", "aluminium", "carton")
  objects: DetectedObject[]; // détection multi-objets
  quality: number;           // 0..1 état de la matière
  recyclability: number;     // 0..1 potentiel de recyclage
  contamination: string[];   // contaminants détectés (souillures, mélanges)
  estimatedWeightKg: number; // pré-estimation (confirmée à la pesée réelle)
  confidence: number;        // 0..1 confiance globale
  provider: string;          // 'claude' | 'heuristic'
  notes?: string;
}

export interface VisionProvider {
  readonly name: string;
  analyze(imageBase64: string): Promise<VisionAnalysis>;
}
