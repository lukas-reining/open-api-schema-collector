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
    return this.openApiDiscoveryService.getOpenApiSchemas();
  }

  @Get('/open-api/schemas/:schemaSource')
  public async getOpenApiSchemaForSource(
    @Param('schemaSource') schemaSource: string,
  ) {
    const schemas = await this.openApiDiscoveryService.getOpenApiSchemas();

    const schema = schemas.find(
      ({ source }) =>
        source === Buffer.from(schemaSource, 'base64').toString('ascii'),
    );

    if (!schema) {
      throw new NotFoundException('The requested schema does not exist');
    }

    return schema.schema;
  }

  @Get('/open-api/swagger/config')
  public async getSwaggerConfig() {
    const schemas = await this.openApiDiscoveryService.getOpenApiSchemas();

    const urls = schemas.map(({ source }) => ({
      name: source,
      url: `/open-api/schemas/${Buffer.from(source).toString('base64')}`,
    }));

    return { urls };
  }
}
