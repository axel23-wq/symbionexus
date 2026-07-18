export class FindInBboxQuery {
  constructor(
    public readonly minLng: number,
    public readonly minLat: number,
    public readonly maxLng: number,
    public readonly maxLat: number,
    public readonly categories?: string[],
  ) {}
}
