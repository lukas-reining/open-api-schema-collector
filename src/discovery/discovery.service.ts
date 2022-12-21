import { Inject, Injectable } from '@nestjs/common';
import { OpenApiDiscoveryService } from './common/open-api-discovery-service';
import {
  isOasV2Source,
  isOasV3_1Source,
  isOasV3Source,
  OpenApiDoc,
  OpenApiSchemaSource,
} from './common/open-api-schema-source';
import { DISCOVERY_SERVICES_TOKEN } from './discovery.module';
import {
  toOpenApiSchemaWithProxyOAS2,
  toOpenApiSchemaWithProxyOAS3,
} from './common/open-api-functions';
import { ProxyService } from '../proxy/proxy.service';

@Injectable()
export class DiscoveryService extends OpenApiDiscoveryService {
  constructor(
    @Inject(DISCOVERY_SERVICES_TOKEN)
    private services: OpenApiDiscoveryService[],
    private proxyService: ProxyService,
  ) {
    super();
  }

  private toOpenApiSchemaWithProxy<T extends OpenApiDoc>(
    schema: OpenApiSchemaSource<T>,
  ) {
    const generateProxyUrl = this.proxyService.toProxyUrl.bind(
      this.proxyService,
    );

    if (isOasV2Source(schema)) {
      return toOpenApiSchemaWithProxyOAS2(schema, generateProxyUrl);
    } else if (isOasV3Source(schema) || isOasV3_1Source(schema)) {
      return toOpenApiSchemaWithProxyOAS3(schema, generateProxyUrl);
    }

    return schema;
  }

  public async getOpenApiSchemas(): Promise<OpenApiSchemaSource[]> {
    const schemas = await Promise.all(
      this.services.map((serice) => serice.getOpenApiSchemas()),
    );

    return schemas.flat();
  }

  public async getOpenApiSchemasWithProxy(): Promise<OpenApiSchemaSource[]> {
    const schemas = await this.getOpenApiSchemas();
    return schemas.map(this.toOpenApiSchemaWithProxy.bind(this));
  }
}
