export class FindInRadiusQuery {
  constructor(
    public readonly lat: number,
    public readonly lng: number,
    public readonly radiusKm: number,
    public readonly category?: string
  ) {}
}
