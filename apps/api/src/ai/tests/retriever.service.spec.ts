import { Test, TestingModule } from '@nestjs/testing';
import { RetrieverService } from '../rag/retriever.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RetrieverService', () => {
  let service: RetrieverService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetrieverService,
        {
          provide: PrismaService,
          useValue: {
            codeChunk: {
              findMany: jest.fn(async () => [
                {
                  id: '1',
                  filePath: 'test.ts',
                  content: 'function matchmaking() {}',
                  startLine: 1,
                  endLine: 5,
                },
              ]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RetrieverService>(RetrieverService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve chunks matching query', async () => {
    const results = await service.retrieve('matchmaking', 'matchmaking', 3);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].filePath).toBeDefined();
  });

  it('should return results with required fields', async () => {
    const results = await service.retrieve('function', 'general', 3);

    expect(results.length).toBeGreaterThan(0);
    const result = results[0];
    expect(result).toHaveProperty('filePath');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('startLine');
    expect(result).toHaveProperty('endLine');
    expect(result).toHaveProperty('similarity');
  });

  it('should respect topK limit', async () => {
    (prisma.codeChunk.findMany as jest.Mock).mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        filePath: `test${i}.ts`,
        content: `content ${i}`,
        startLine: i * 5,
        endLine: i * 5 + 5,
      }))
    );

    const results = await service.retrieve('content', 'general', 3);

    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('should call prisma codeChunk.findMany', async () => {
    await service.retrieve('test', 'general', 3);

    expect(prisma.codeChunk.findMany).toHaveBeenCalled();
  });

  it('should handle empty results', async () => {
    (prisma.codeChunk.findMany as jest.Mock).mockResolvedValueOnce([]);

    const results = await service.retrieve('nonexistent', 'general', 3);

    expect(results).toEqual([]);
  });
});
