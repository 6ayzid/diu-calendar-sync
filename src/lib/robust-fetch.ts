import https from 'node:https';
import dns from 'node:dns';

// Public fallback DNS resolvers (Cloudflare & Google) to bypass local Windows ISP SERVFAIL
const resolver = new dns.promises.Resolver();
try {
  resolver.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1']);
} catch {
  // If setServers fails in restricted env, standard dns will be used
}

interface DnsCacheEntry {
  timestamp: number;
  addresses: string[];
}

const dnsCache = new Map<string, DnsCacheEntry>();
const DNS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

async function resolveHostIPv4(hostname: string): Promise<string[] | null> {
  const cached = dnsCache.get(hostname);
  if (cached && Date.now() - cached.timestamp < DNS_CACHE_TTL_MS) {
    return cached.addresses;
  }

  try {
    const addresses = await resolver.resolve4(hostname);
    if (addresses && addresses.length > 0) {
      dnsCache.set(hostname, { timestamp: Date.now(), addresses });
      return addresses;
    }
  } catch {
    // If public resolver fails, fallback to default dns
  }
  return null;
}

function resilientLookup(
  hostname: string,
  options: dns.LookupOptions | number,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void
): void {
  const cb = typeof options === 'function' ? options : callback;
  const isAll = typeof options === 'object' && options !== null && 'all' in options && options.all;

  resolveHostIPv4(hostname)
    .then((addresses) => {
      if (addresses && addresses.length > 0) {
        if (isAll) {
          cb(null, addresses.map((ip) => ({ address: ip, family: 4 })));
        } else {
          cb(null, addresses[0], 4);
        }
      } else {
        dns.lookup(hostname, options as dns.LookupOptions, cb);
      }
    })
    .catch(() => {
      dns.lookup(hostname, options as dns.LookupOptions, cb);
    });
}

export interface RobustResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText?: string;
  json: () => Promise<T>;
  text: () => Promise<string>;
}

export interface RobustFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

/**
 * Resilient HTTP client for scraping upstream university routine services.
 * Bypasses local network/ISP DNS SERVFAIL issues on Windows by utilizing
 * public DNS resolvers (1.1.1.1 / 8.8.8.8) with in-memory caching.
 */
export async function robustFetch<T = unknown>(
  url: string,
  options: RobustFetchOptions = {}
): Promise<RobustResponse<T>> {
  // If running in browser, delegate to native browser fetch
  if (typeof window !== 'undefined') {
    const nativeRes = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body,
    });
    return {
      ok: nativeRes.ok,
      status: nativeRes.status,
      statusText: nativeRes.statusText,
      json: () => nativeRes.json(),
      text: () => nativeRes.text(),
    };
  }

  // Server-side Node.js execution
  return new Promise<RobustResponse<T>>((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const method = options.method || 'GET';
      const body = options.body;
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        ...(options.headers || {}),
      };

      if (body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      if (body) {
        headers['Content-Length'] = String(Buffer.byteLength(body));
      }

      const req = https.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443,
          path: parsedUrl.pathname + parsedUrl.search,
          method,
          lookup: resilientLookup,
          headers,
          timeout: options.timeout || 8000,
        },
        (res) => {
          let responseBody = '';
          res.on('data', (chunk) => {
            responseBody += chunk;
          });
          res.on('end', () => {
            resolve({
              ok: (res.statusCode ?? 500) >= 200 && (res.statusCode ?? 500) < 300,
              status: res.statusCode ?? 500,
              statusText: res.statusMessage,
              json: async () => {
                try {
                  return JSON.parse(responseBody);
                } catch {
                  throw new Error(`Failed to parse JSON response: ${responseBody.slice(0, 100)}`);
                }
              },
              text: async () => responseBody,
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy(new Error(`Request timed out after ${options.timeout || 8000}ms`));
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (body) {
        req.write(body);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}
