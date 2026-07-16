export function detectModuleFromPath(pathname: string): string {
  if (pathname.includes('/marketplace')) return 'marketplace';
  if (pathname.includes('/matches')) return 'matchmaking';
  if (pathname.includes('/carbon')) return 'carbon';
  if (pathname.includes('/map') || pathname.includes('/control-room')) return 'geocore';
  if (pathname.includes('/listings')) return 'marketplace';
  if (pathname.includes('/contracts')) return 'contracts';
  if (pathname.includes('/passports')) return 'passports';

  return 'general';
}
