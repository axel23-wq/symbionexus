import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PostGisRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Trouve les entités géographiques dans un rayon donné (en km)
   * Utilise PostGIS (ST_DWithin et ST_Distance) en construisant les points géographiques à la volée.
   */
  async findInRadius(lat: number, lng: number, radiusKm: number, category?: string) {
    let query = `
      SELECT id, "officialName", category, district, latitude, longitude,
      (
        ST_Distance(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint($2, $1)::geography
        ) / 1000.0
      ) AS distance
      FROM "GeoLocation"
      WHERE status = 'ACTIVE'
        AND ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint($2, $1)::geography,
          $3 * 1000.0 -- ST_DWithin prend des mètres pour le type geography
        )
    `;

    const params: any[] = [lat, lng, radiusKm];

    if (category) {
      query += ` AND category::text = $4`;
      params.push(category);
    }

    query += ` ORDER BY distance ASC LIMIT 50;`;

    return this.prisma.$queryRawUnsafe<any[]>(query, ...params);
  }

  /**
   * Trouve l'entité la plus proche d'une catégorie donnée.
   * Utilise l'opérateur KNN géospatial de PostGIS (<->) pour un tri ultra-rapide.
   */
  async findNearest(lat: number, lng: number, category: string) {
    const query = `
      SELECT id, "officialName", category, district, latitude, longitude,
      (
        ST_Distance(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint($2, $1)::geography
        ) / 1000.0
      ) AS distance
      FROM "GeoLocation"
      WHERE status = 'ACTIVE'
        AND category::text = $3
      ORDER BY ST_MakePoint(longitude, latitude)::geography <-> ST_MakePoint($2, $1)::geography
      LIMIT 1;
    `;

    const results = await this.prisma.$queryRawUnsafe<any[]>(query, lat, lng, category);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Trouve toutes les entités géographiques situées à l'intérieur d'une Bounding Box (Viewport de la carte).
   * C'est essentiel pour charger des milliers de POIs de façon optimale.
   */
  async findInBoundingBox(minLng: number, minLat: number, maxLng: number, maxLat: number, categories?: string[]) {
    let query = `
      SELECT id, "officialName", category, district, latitude, longitude, rating, "geoZoneId"
      FROM "GeoLocation"
      WHERE status = 'ACTIVE'
        AND ST_Within(
          ST_MakePoint(longitude, latitude)::geometry,
          ST_MakeEnvelope($1, $2, $3, $4, 4326)
        )
    `;

    const params: any[] = [minLng, minLat, maxLng, maxLat];

    if (categories && categories.length > 0) {
      const placeholders = categories.map((_, i) => `$${i + 5}`).join(', ');
      query += ` AND category::text IN (${placeholders})`;
      params.push(...categories);
    }

    // Limiter le nombre de résultats pour éviter de faire crasher le navigateur si on dé-zoome trop
    query += ` LIMIT 15000;`;

    return this.prisma.$queryRawUnsafe<any[]>(query, ...params);
  }

  /**
   * Sauvegarde une entité GeoLocation (Utilisé par l'importeur)
   */
  async save(data: any) {
    return this.prisma.geoLocation.create({
      data,
    });
  }

  /**
   * Trouve une entité par son officialName (utilisé pour éviter les doublons lors de l'import)
   */
  async findByName(officialName: string) {
    return this.prisma.geoLocation.findFirst({
      where: { officialName }
    });
  }

  /**
   * Calcule la distance géographique exacte entre deux points (en kilomètres)
   * Utilise PostGIS ST_DistanceSphere pour une très haute précision.
   */
  async calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
    const query = `
      SELECT (
        ST_DistanceSphere(
          ST_MakePoint($2, $1)::geometry,
          ST_MakePoint($4, $3)::geometry
        ) / 1000.0
      ) AS "distanceKm";
    `;
    const result = await this.prisma.$queryRawUnsafe<any[]>(query, lat1, lng1, lat2, lng2);
    return result[0]?.distanceKm || 0;
  }
}
