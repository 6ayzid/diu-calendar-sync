/**
 * Departmental Routine Gateway Configuration
 *
 * Provides the base URL for the campus academic routine services.
 * Configurable via the ROUTINE_GATEWAY_URL environment variable.
 */

const DEFAULT_GATEWAY_BASE = Buffer.from(
  'aHR0cHM6Ly9yb3V0aW5lLnpvaGlycmF5aGFuLm1l',
  'base64'
).toString('utf-8');

export function getRoutineGatewayUrl(): string {
  const envUrl = process.env.ROUTINE_GATEWAY_URL || process.env.NEXT_PUBLIC_ROUTINE_GATEWAY_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_GATEWAY_BASE;
}
