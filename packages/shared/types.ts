// SymbioNexus — Shared Type Definitions
// Used across frontend and backend

// ===================== ENUMS =====================

export enum Role {
  SELLER = 'SELLER',
  BUYER = 'BUYER',
  TRANSPORTER = 'TRANSPORTER',
  REGULATOR = 'REGULATOR',
  ADMIN = 'ADMIN',
}

export enum KYBStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum MaterialCategory {
  METALS = 'METALS',
  PLASTICS = 'PLASTICS',
  BIOMASS = 'BIOMASS',
  CHEMICALS = 'CHEMICALS',
  TEXTILE = 'TEXTILE',
  CONSTRUCTION = 'CONSTRUCTION',
  THERMAL = 'THERMAL',
  GLASS = 'GLASS',
  PAPER = 'PAPER',
  ELECTRONIC = 'ELECTRONIC',
}

export enum Frequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ON_DEMAND = 'ON_DEMAND',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  MATCHED = 'MATCHED',
  CONTRACTED = 'CONTRACTED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum MatchStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED_SELLER = 'ACCEPTED_SELLER',
  ACCEPTED_BUYER = 'ACCEPTED_BUYER',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURES = 'PENDING_SIGNATURES',
  SIGNED = 'SIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TransportStatus {
  CREATED = 'CREATED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  NEAR_DESTINATION = 'NEAR_DESTINATION',
  DELIVERED = 'DELIVERED',
  CONFIRMED = 'CONFIRMED',
}

export enum CarbonCreditStatus {
  GENERATED = 'GENERATED',
  CERTIFIED = 'CERTIFIED',
  LISTED_FOR_SALE = 'LISTED_FOR_SALE',
  SOLD = 'SOLD',
  RETIRED = 'RETIRED',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// ===================== INTERFACES =====================

export interface Company {
  id: string;
  name: string;
  siret?: string;
  sector: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  trustScore: number;
  kybStatus: KYBStatus;
  description?: string;
  logoUrl?: string;
  certifications: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  companyId: string;
  company?: Company;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WasteListing {
  id: string;
  companyId: string;
  company?: Company;
  title: string;
  materialType: string;
  materialCategory: MaterialCategory;
  description: string;
  volumeKg: number;
  frequency: Frequency;
  chemicalProfile?: Record<string, unknown>;
  pricePerKg?: number;
  latitude: number;
  longitude: number;
  status: ListingStatus;
  photos: string[];
  availableFrom?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  listingId: string;
  listing?: WasteListing;
  buyerCompanyId: string;
  buyerCompany?: Company;
  sellerCompanyId: string;
  sellerCompany?: Company;
  compatibilityScore: number;
  scoreBreakdown: ScoreBreakdown;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreBreakdown {
  materialScore: number;
  distanceScore: number;
  volumeScore: number;
  trustScore: number;
  totalScore: number;
}

export interface Contract {
  id: string;
  matchId: string;
  match?: Match;
  sellerCompanyId: string;
  buyerCompanyId: string;
  volumeEngagedKg: number;
  pricePerKg: number;
  totalPrice: number;
  durationMonths: number;
  frequency: Frequency;
  transportConditions?: Record<string, unknown>;
  sellerSigned: boolean;
  buyerSigned: boolean;
  status: ContractStatus;
  signedAt?: string;
  createdAt: string;
}

export interface MaterialPassport {
  id: string;
  contractId: string;
  contract?: Contract;
  qrCodeData: string;
  transportStatus: TransportStatus;
  currentLatitude?: number;
  currentLongitude?: number;
  routeWaypoints: RouteWaypoint[];
  estimatedArrival?: string;
  deliveryProofAt?: string;
  deliverySignature?: string;
  deliveryPhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RouteWaypoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  label?: string;
}

export interface CarbonCredit {
  id: string;
  passportId: string;
  passport?: MaterialPassport;
  companyId: string;
  co2AvoidedTonnes: number;
  equivalentTrees: number;
  equivalentCarKm: number;
  certificateUrl?: string;
  marketStatus: CarbonCreditStatus;
  pricePerTonne?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  contractId: string;
  amount: number;
  commission: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  matchId?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export enum NotificationType {
  NEW_MATCH = 'NEW_MATCH',
  MATCH_ACCEPTED = 'MATCH_ACCEPTED',
  CONTRACT_READY = 'CONTRACT_READY',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  DELIVERY_UPDATE = 'DELIVERY_UPDATE',
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
  CARBON_CREDIT_EARNED = 'CARBON_CREDIT_EARNED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
  SYSTEM = 'SYSTEM',
}

// ===================== API TYPES =====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  companyName: string;
  companySiret?: string;
  companySector: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyLatitude: number;
  companyLongitude: number;
  companyDescription?: string;
}

export interface CreateListingRequest {
  title: string;
  materialType: string;
  materialCategory: MaterialCategory;
  description: string;
  volumeKg: number;
  frequency: Frequency;
  chemicalProfile?: Record<string, unknown>;
  pricePerKg?: number;
  latitude: number;
  longitude: number;
  photos?: string[];
}

export interface MatchmakingRequest {
  listingId: string;
  maxResults?: number;
  maxDistanceKm?: number;
}

export interface MatchmakingResult {
  buyerCompanyId: string;
  buyerCompany: Company;
  score: ScoreBreakdown;
  distanceKm: number;
}

// ===================== CONSTANTS =====================

export const MATERIAL_CATEGORIES_FR: Record<MaterialCategory, string> = {
  [MaterialCategory.METALS]: 'Métaux',
  [MaterialCategory.PLASTICS]: 'Plastiques',
  [MaterialCategory.BIOMASS]: 'Biomasse',
  [MaterialCategory.CHEMICALS]: 'Chimiques',
  [MaterialCategory.TEXTILE]: 'Textile',
  [MaterialCategory.CONSTRUCTION]: 'Construction / BTP',
  [MaterialCategory.THERMAL]: 'Énergie Thermique',
  [MaterialCategory.GLASS]: 'Verre',
  [MaterialCategory.PAPER]: 'Papier / Carton',
  [MaterialCategory.ELECTRONIC]: 'Électronique / DEEE',
};

export const FREQUENCY_FR: Record<Frequency, string> = {
  [Frequency.DAILY]: 'Quotidien',
  [Frequency.WEEKLY]: 'Hebdomadaire',
  [Frequency.BIWEEKLY]: 'Bimensuel',
  [Frequency.MONTHLY]: 'Mensuel',
  [Frequency.QUARTERLY]: 'Trimestriel',
  [Frequency.ON_DEMAND]: 'À la demande',
};

/** CO₂ emission factors (kg CO₂ per kg of material) for standard disposal */
export const CO2_EMISSION_FACTORS: Record<MaterialCategory, { disposal: number; recycling: number }> = {
  [MaterialCategory.METALS]: { disposal: 1.8, recycling: 0.4 },
  [MaterialCategory.PLASTICS]: { disposal: 2.9, recycling: 0.7 },
  [MaterialCategory.BIOMASS]: { disposal: 0.9, recycling: 0.1 },
  [MaterialCategory.CHEMICALS]: { disposal: 3.2, recycling: 1.1 },
  [MaterialCategory.TEXTILE]: { disposal: 2.1, recycling: 0.5 },
  [MaterialCategory.CONSTRUCTION]: { disposal: 0.6, recycling: 0.15 },
  [MaterialCategory.THERMAL]: { disposal: 0.0, recycling: 0.0 },
  [MaterialCategory.GLASS]: { disposal: 0.8, recycling: 0.3 },
  [MaterialCategory.PAPER]: { disposal: 1.1, recycling: 0.3 },
  [MaterialCategory.ELECTRONIC]: { disposal: 4.5, recycling: 1.5 },
};
