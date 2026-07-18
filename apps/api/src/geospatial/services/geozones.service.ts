import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ZoneType } from '@prisma/client';

@Injectable()
export class GeoZonesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère la hiérarchie complète (ex: de la région jusqu'aux quartiers)
   */
  async getHierarchy(parentId?: string) {
    return this.prisma.geoZone.findMany({
      where: {
        parentId: parentId || null, // Si pas de parentId, on récupère les racines (ex: Country/Region)
      },
      include: {
        _count: {
          select: { children: true, locations: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Récupère une zone spécifique avec ses enfants et POIs (paginés)
   */
  async getZoneDetails(id: string) {
    const zone = await this.prisma.geoZone.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { name: 'asc' }
        },
        locations: {
          take: 50,
          orderBy: { rating: 'desc' }
        },
        parent: true
      }
    });

    if (!zone) throw new NotFoundException('Zone non trouvée');
    return zone;
  }
}
