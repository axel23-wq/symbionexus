import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindNearestQuery } from './find-nearest.query';
import { PostGisRepository } from '../repositories/postgis.repository';

@QueryHandler(FindNearestQuery)
export class FindNearestHandler implements IQueryHandler<FindNearestQuery> {
  constructor(private readonly repo: PostGisRepository) {}

  async execute(query: FindNearestQuery) {
    return this.repo.findNearest(query.lat, query.lng, query.category);
  }
}
