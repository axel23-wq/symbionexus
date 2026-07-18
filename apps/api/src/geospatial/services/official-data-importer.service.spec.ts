import { Test, TestingModule } from '@nestjs/testing';
import { OfficialDataImporterService } from './official-data-importer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PostGisRepository } from '../repositories/postgis.repository';
import { BadRequestException } from '@nestjs/common';
import { GeoCategory } from '@prisma/client';
import { ImportGeoLocationDto } from '../dto/import-geo.dto';

describe('OfficialDataImporterService', () => {
  let service: OfficialDataImporterService;
  let prisma: PrismaService;
  let repo: PostGisRepository;

  const mockPrisma = {
    geoHistory: {
      create: jest.fn(),
    },
  };

  const mockRepo = {
    findByName: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfficialDataImporterService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PostGisRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<OfficialDataImporterService>(OfficialDataImporterService);
    prisma = module.get<PrismaService>(PrismaService);
    repo = module.get<PostGisRepository>(PostGisRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait rejeter l\'import si aucune source officielle n\'est fournie', async () => {
    const dto = {
      officialName: 'Test Mairie',
      category: GeoCategory.MUNICIPALITY,
      district: 'Douala I',
      latitude: 4.0,
      longitude: 9.7,
      officialSource: '',
    } as ImportGeoLocationDto;

    await expect(service.importOfficialData(dto)).rejects.toThrow(BadRequestException);
  });

  it('devrait rejeter l\'import si la structure existe déjà', async () => {
    const dto = {
      officialName: 'Mairie de Douala',
      category: GeoCategory.MUNICIPALITY,
      district: 'Douala I',
      latitude: 4.0,
      longitude: 9.7,
      officialSource: 'CUD',
    } as ImportGeoLocationDto;

    mockRepo.findByName.mockResolvedValueOnce({ id: '123', officialName: 'Mairie de Douala' });

    await expect(service.importOfficialData(dto)).rejects.toThrow(BadRequestException);
  });

  it('devrait sauvegarder et tracer la nouvelle donnée', async () => {
    const dto = {
      officialName: 'Mairie de Douala',
      category: GeoCategory.MUNICIPALITY,
      district: 'Douala I',
      latitude: 4.0,
      longitude: 9.7,
      officialSource: 'CUD',
    } as ImportGeoLocationDto;

    mockRepo.findByName.mockResolvedValueOnce(null);
    mockRepo.save.mockResolvedValueOnce({ id: 'new-id', ...dto });

    const result = await service.importOfficialData(dto);

    expect(result.id).toBe('new-id');
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockPrisma.geoHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        geoLocationId: 'new-id',
        changedFields: { action: 'INITIAL_IMPORT', source: 'CUD' },
      }),
    });
  });
});
