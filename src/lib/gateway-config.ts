/**
 * Departmental Routine Gateway Configuration
 *
 * Configurable via the ROUTINE_GATEWAY_URL environment variable.
 * If not provided, the application runs entirely in standalone/offline mode
 * using internal curated datasets and parsed routine stores.
 */

export function getRoutineGatewayUrl(): string | null {
  const envUrl = process.env.ROUTINE_GATEWAY_URL || process.env.NEXT_PUBLIC_ROUTINE_GATEWAY_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return null;
}
