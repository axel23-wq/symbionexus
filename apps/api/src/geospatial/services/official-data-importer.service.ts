import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostGisRepository } from '../repositories/postgis.repository';
import { ImportGeoLocationDto } from '../dto/import-geo.dto';

@Injectable()
export class OfficialDataImporterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoRepo: PostGisRepository,
  ) {}

  /**
   * Importation stricte : pas de données inventées, traçabilité requise
   */
  async importOfficialData(dto: ImportGeoLocationDto) {
    if (!dto.officialSource) {
      throw new BadRequestException('La source officielle est obligatoire pour importer des données en production.');
    }

    // Vérifier les doublons
    const existing = await this.geoRepo.findByName(dto.officialName);
    if (existing) {
      throw new BadRequestException(`La structure "${dto.officialName}" existe déjà dans la base.`);
    }

    // Sauvegarder la donnée avec traçabilité
    const created = await this.geoRepo.save({
      ...dto,
      status: 'ACTIVE',
      importedAt: new Date(),
    });

    // Logger dans l'historique
    await this.prisma.geoHistory.create({
      data: {
        geoLocationId: created.id,
        changedFields: { action: 'INITIAL_IMPORT', source: dto.officialSource },
        updatedBySystem: true,
      },
    });

    return created;
  }
}
