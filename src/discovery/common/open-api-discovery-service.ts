import { OpenApiSchema } from './open-api-schema';

export abstract class OpenApiDiscoveryService {
  public abstract getOpenApiSchemas():
    | Promise<OpenApiSchema[]>
    | OpenApiSchema[];
}
