import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindInBboxQuery } from './find-in-bbox.query';
import { PostGisRepository } from '../repositories/postgis.repository';

@QueryHandler(FindInBboxQuery)
export class FindInBboxHandler implements IQueryHandler<FindInBboxQuery> {
  constructor(private readonly geoRepo: PostGisRepository) {}

  async execute(query: FindInBboxQuery): Promise<any[]> {
    return this.geoRepo.findInBoundingBox(
      query.minLng,
      query.minLat,
      query.maxLng,
      query.maxLat,
      query.categories
    );
  }
}
