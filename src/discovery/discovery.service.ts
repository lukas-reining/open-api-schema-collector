import { Inject, Injectable } from '@nestjs/common';
import { OpenApiDiscoveryService } from './common/open-api-discovery-service';
import {
  isOasV2,
  isOasV3,
  isOasV3_1,
  OpenApiDoc,
  OpenApiDocV2,
  OpenApiDocV3,
  OpenApiDocV3_1,
  OpenApiSchema,
} from './common/open-api-schema';
import { DISCOVERY_SERVICES_TOKEN } from './discovery.module';
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { toBase64Url } from './encoding';
import * as url from 'url';

@Injectable()
export class DiscoveryService extends OpenApiDiscoveryService {
  constructor(
    @Inject(DISCOVERY_SERVICES_TOKEN)
    private services: OpenApiDiscoveryService[],
  ) {
    super();
  }

  private toBaseUrlV2({ schema }: OpenApiSchema<OpenApiDocV2>) {
    const isHttp = schema.schemes?.includes('http');
    const isHttps = schema.schemes?.includes('https');
    const scheme = isHttps ? 'https' : isHttp ? 'http' : 'https';

    return new url.URL(
      schema.basePath ?? '',
      `${scheme}://${schema.host}${schema.basePath}`,
    ).href;
  }

  private toOpenApiSchemaWithProxyOAS2(
    schema: OpenApiSchema<OpenApiDocV2>,
  ): OpenApiSchema<OpenApiDocV2> {
    return {
      ...schema,
      schema: {
        ...schema.schema,
        schemes: undefined, // TODO Check what to do
        host: undefined,
        basePath: `/proxy/${toBase64Url(this.toBaseUrlV2(schema))}`,
      },
    };
  }

  private calculateProxyUrl<
    T extends OpenAPIV3.ServerObject | OpenAPIV3_1.ServerObject,
  >(servers?: T[]): OpenAPIV3.ServerObject[] {
    return (
      servers?.reduce((newServers, server) => {
        return [
          ...newServers,
          { ...server, url: `/proxy/${server.url}` },
          server,
        ];
      }, new Array<T>()) ?? []
    );
  }

  private toOpenApiSchemaWithProxyOAS3(
    schema: OpenApiSchema<OpenApiDocV3 | OpenApiDocV3_1>,
  ): OpenApiSchema<OpenApiDocV3 | OpenApiDocV3_1> {
    if (isOasV3(schema)) {
      return {
        ...schema,
        schema: {
          ...schema.schema,
          servers: this.calculateProxyUrl(schema.schema.servers),
        },
      };
    } else if (isOasV3(schema)) {
      return {
        ...schema,
        schema: {
          ...schema.schema,
          servers: this.calculateProxyUrl(schema.schema.servers),
        },
      };
    } else {
      throw new Error('Invalid schema');
    }
  }

  private toOpenApiSchemaWithProxy<T extends OpenApiDoc>(
    schema: OpenApiSchema<T>,
  ) {
    if (isOasV2(schema)) {
      return this.toOpenApiSchemaWithProxyOAS2(schema);
    } else if (isOasV3(schema) || isOasV3_1(schema)) {
      return this.toOpenApiSchemaWithProxyOAS3(schema);
    }

    return schema;
  }

  public async getOpenApiSchemas(): Promise<OpenApiSchema[]> {
    const schemas = await Promise.all(
      this.services.map((serice) => serice.getOpenApiSchemas()),
    );

    return schemas.flat();
  }

  public async getOpenApiSchemasWithProxy(): Promise<OpenApiSchema[]> {
    const schemas = await this.getOpenApiSchemas();
    return schemas.map(this.toOpenApiSchemaWithProxy.bind(this));
  }
}
