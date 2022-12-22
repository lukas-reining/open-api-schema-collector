export function parseConfig() {
  return {
    port: parseInt(process.env.OASD_PORT ?? '3000', 10),
    proxyInternal:
      (process.env.OASD_PROXY_INTERNAL ?? 'true').toLowerCase() === 'true',
    proxyPathSigningSecret: process.env.OASD_PROXY_PATH_SIGNING_SECRET,
    discoveryJsonPath: process.env.OASD_DISCOVERY_JSON_PATH,
  };
}

export type Config = ReturnType<typeof parseConfig>;
