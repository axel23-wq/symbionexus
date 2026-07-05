import { MatchesService } from './matches.service';

// Tests unitaires du moteur de scoring (module critique — ADR-015 / R13).
// calculateScore est pur : ne dépend ni de Prisma ni de ListingsService.
describe('MatchesService.calculateScore', () => {
  const svc = new MatchesService({} as any, {} as any);
  const score = (listing: any, buyer: any, distanceKm: number) =>
    (svc as any).calculateScore(listing, buyer, distanceKm);

  const listing = (sector: string) => ({ company: { companySector: sector } });

  it('secteur lié → matériau 100, total pondéré correct', () => {
    const r = score(listing('Agroalimentaire'), { companySector: 'Compostage', trustScore: 0.85 }, 0);
    expect(r.materialScore).toBe(100);
    expect(r.distanceScore).toBe(100);
    expect(r.volumeScore).toBe(70);
    expect(r.trustScore).toBe(85);
    expect(r.totalScore).toBe(92); // 1*.4 + 1*.25 + .7*.2 + .85*.15 = .9175
  });

  it('même secteur → matériau 80', () => {
    expect(score(listing('Plasturgie'), { companySector: 'Plasturgie', trustScore: 0.5 }, 0).materialScore).toBe(80);
  });

  it('acheteur "recycl…" → matériau 70', () => {
    expect(score(listing('Métallurgie'), { companySector: 'Recyclage divers', trustScore: 0.5 }, 0).materialScore).toBe(70);
  });

  it('secteur non lié → matériau 30 (base)', () => {
    expect(score(listing('BTP'), { companySector: 'Cosmétique', trustScore: 0.5 }, 0).materialScore).toBe(30);
  });

  it('distance : 250 km → 50, 500 km (cutoff) → 0', () => {
    expect(score(listing('BTP'), { companySector: 'X', trustScore: 0.5 }, 250).distanceScore).toBe(50);
    expect(score(listing('BTP'), { companySector: 'X', trustScore: 0.5 }, 500).distanceScore).toBe(0);
  });

  it('trustScore absent → défaut 50', () => {
    expect(score(listing('BTP'), { companySector: 'X' }, 0).trustScore).toBe(50);
  });
});
