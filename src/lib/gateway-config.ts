/**
 * Departmental Routine Gateway Configuration
 *
 * Configurable via the ROUTINE_GATEWAY_URL environment variable.
 * If not explicitly overridden, defaults to the private Cloudflare Worker routine API.
 */

// Base64 encoded: 'https://diu-routine-api.6ayzid.workers.dev'
const DEFAULT_GATEWAY_B64 = 'aHR0cHM6Ly9kaXUtcm91dGluZS1hcGkuNmF5emlkLndvcmtlcnMuZGV2';

function getDefaultGatewayUrl(): string {
  try {
    if (typeof atob === 'function') {
      return atob(DEFAULT_GATEWAY_B64);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(DEFAULT_GATEWAY_B64, 'base64').toString('utf-8');
    }
  } catch {
    // ignore
  }
  return '';
}

export function getRoutineGatewayUrl(): string | null {
  const envUrl = process.env.ROUTINE_GATEWAY_URL || process.env.NEXT_PUBLIC_ROUTINE_GATEWAY_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  const defaultUrl = getDefaultGatewayUrl();
  return defaultUrl || null;
}
