import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindInRadiusQuery } from './find-in-radius.query';
import { PostGisRepository } from '../repositories/postgis.repository';

@QueryHandler(FindInRadiusQuery)
export class FindInRadiusHandler implements IQueryHandler<FindInRadiusQuery> {
  constructor(private readonly repo: PostGisRepository) {}

  async execute(query: FindInRadiusQuery) {
    return this.repo.findInRadius(query.lat, query.lng, query.radiusKm, query.category);
  }
}
