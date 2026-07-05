import { ContractsService } from './contracts.service';

// Tests contrats (module critique — ADR-015 / R13). Prisma mocké.
describe('ContractsService', () => {
  it('generateFromMatch : totalPrice = volume × prix, statut PENDING_SIGNATURES', async () => {
    const created = jest.fn().mockResolvedValue({});
    const prisma: any = {
      match: { findUnique: jest.fn().mockResolvedValue({
        id: 'm1', sellerCompanyId: 's', buyerCompanyId: 'b',
        listing: { volumeKg: 5000, pricePerKg: 52, frequency: 'WEEKLY' },
        sellerCompany: { companyAddress: 'A' }, buyerCompany: { companyAddress: 'B' },
      }) },
      contract: { findUnique: jest.fn().mockResolvedValue(null), create: created },
    };
    await new ContractsService(prisma).generateFromMatch('m1');
    const data = created.mock.calls[0][0].data;
    expect(data.totalPrice).toBe(260000); // 5000 × 52
    expect(data.status).toBe('PENDING_SIGNATURES');
  });

  const signSetup = (contract: any, userCompanyId: string) => {
    const updated = jest.fn().mockResolvedValue({});
    const prisma: any = {
      contract: { findUnique: jest.fn().mockResolvedValue(contract), update: updated },
      user: { findUnique: jest.fn().mockResolvedValue({ companyId: userCompanyId }) },
      __updated: updated,
    };
    return prisma;
  };

  it('signContract : 2ᵉ signature (vendeur) → statut SIGNED', async () => {
    const prisma = signSetup({ id: 'c1', sellerCompanyId: 's', buyerCompanyId: 'b', sellerSigned: false, buyerSigned: true }, 's');
    await new ContractsService(prisma).signContract('c1', 'u1');
    const data = prisma.__updated.mock.calls[0][0].data;
    expect(data.sellerSigned).toBe(true);
    expect(data.status).toBe('SIGNED');
  });

  it('signContract : 1ʳᵉ signature seule → pas de SIGNED', async () => {
    const prisma = signSetup({ id: 'c1', sellerCompanyId: 's', buyerCompanyId: 'b', sellerSigned: false, buyerSigned: false }, 's');
    await new ContractsService(prisma).signContract('c1', 'u1');
    const data = prisma.__updated.mock.calls[0][0].data;
    expect(data.sellerSigned).toBe(true);
    expect(data.status).toBeUndefined();
  });
});
