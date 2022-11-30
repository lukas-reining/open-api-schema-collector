export interface OpenApiAdvertisement {
  source: string;
  protocol: 'http' | 'https';
  host: string;
  port: number | string;
  path: string;
}
