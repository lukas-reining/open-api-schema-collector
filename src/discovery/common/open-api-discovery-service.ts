import { OpenApiSchemaSource } from './open-api-schema-source';

export abstract class OpenApiDiscoveryService {
  public abstract getOpenApiSchemas():
    | Promise<OpenApiSchemaSource[]>
    | OpenApiSchemaSource[];
}
