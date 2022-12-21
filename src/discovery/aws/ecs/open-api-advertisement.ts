export interface EcsOpenApiAdvertisement {
  source: string;
  protocol: 'http' | 'https';
  host: string;
  port: number | string;
  path: string;
}
