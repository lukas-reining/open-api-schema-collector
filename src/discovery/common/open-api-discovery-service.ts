import { OpenApiAdvertisement } from './open-api-advertisement';

export abstract class OpenApiDiscoveryService {
  public abstract discoverOpenApiSpecs():
    | Promise<OpenApiAdvertisement[]>
    | OpenApiAdvertisement[];
}
