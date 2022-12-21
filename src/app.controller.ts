import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { DiscoveryService } from './discovery/discovery.service';

@Controller()
export class AppController {
  constructor(private readonly openApiDiscoveryService: DiscoveryService) {}

  @Get()
  public async health() {
    return 'Running...';
  }

  @Get('/open-api/schemas')
  public async getOpenApiSchemas() {
    return this.openApiDiscoveryService.getOpenApiSchemasWithProxy();
  }

  @Get('/open-api/schemas/:schemaSource')
  public async getOpenApiSchemaForSource(
    @Param('schemaSource') schemaSource: string,
  ) {
    const schemas =
      await this.openApiDiscoveryService.getOpenApiSchemasWithProxy();

    const schema = schemas.find(({ id }) => id === schemaSource);

    if (!schema?.schema) {
      throw new NotFoundException('The requested schema does not exist');
    }

    return schema.schema;
  }

  @Get('/open-api/swagger/config')
  public async getSwaggerConfig() {
    const schemas =
      await this.openApiDiscoveryService.getOpenApiSchemasWithProxy();

    const urls = schemas.map(({ id, schema }) => ({
      name: schema?.info?.title ?? 'No Title',
      url: `/open-api/schemas/${id}`,
    }));

    return { urls };
  }
}
