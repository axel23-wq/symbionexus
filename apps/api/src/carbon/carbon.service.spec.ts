import { CarbonService } from './carbon.service';

// Tests du calcul carbone (module critique — ADR-015 / R13). Prisma mocké.
describe('CarbonService.generateCreditFromPassport', () => {
  const makePrisma = (passport: any, created = jest.fn().mockResolvedValue({})) => ({
    materialPassport: { findUnique: jest.fn().mockResolvedValue(passport) },
    carbonCredit: { create: created },
    __created: created,
  });

  const passport = (category: string, volumeKg: number, carbonCredit: any = null) => ({
    contract: { volumeEngagedKg: volumeKg, match: { listing: { materialCategory: category } }, sellerCompany: { id: 'c1' } },
    carbonCredit,
  });

  it('BIOMASS 5t → 4t CO₂, 180 arbres, 24000 km', async () => {
    const prisma = makePrisma(passport('BIOMASS', 5000));
    await new CarbonService(prisma as any).generateCreditFromPassport('p1');
    const data = prisma.__created.mock.calls[0][0].data;
    expect(data.co2AvoidedTonnes).toBe(4); // (0.9-0.1)*5
    expect(data.equivalentTrees).toBe(180); // 4*45
    expect(data.equivalentCarKm).toBe(24000); // 4*6000
    expect(data.companyId).toBe('c1');
    expect(data.marketStatus).toBe('GENERATED');
  });

  it('catégorie inconnue → facteur défaut (1.0-0.3)=0.7 × volume', async () => {
    const prisma = makePrisma(passport('INCONNU', 10000));
    await new CarbonService(prisma as any).generateCreditFromPassport('p1');
    expect(prisma.__created.mock.calls[0][0].data.co2AvoidedTonnes).toBe(7); // 0.7*10
  });

  it('idempotent : crédit déjà existant → pas de create', async () => {
    const prisma = makePrisma(passport('METALS', 1000, { id: 'existing' }));
    const r = await new CarbonService(prisma as any).generateCreditFromPassport('p1');
    expect(prisma.__created).not.toHaveBeenCalled();
    expect(r).toEqual({ id: 'existing' });
  });
});
