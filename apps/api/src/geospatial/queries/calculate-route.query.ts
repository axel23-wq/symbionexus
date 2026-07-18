export class CalculateRouteQuery {
  constructor(
    public readonly originLat: number,
    public readonly originLng: number,
    public readonly destLat: number,
    public readonly destLng: number,
    public readonly vehicleType: 'truck' | 'van' | 'car' = 'truck',
  ) {}
}
