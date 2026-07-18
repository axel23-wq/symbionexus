export class FindNearestQuery {
  constructor(
    public readonly lat: number,
    public readonly lng: number,
    public readonly category: string
  ) {}
}
