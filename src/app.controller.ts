import { Controller, Get } from '@nestjs/common';
import { AwsEcsOpenApiDiscoveryService } from './discovery/aws/ecs/ecs-open-api-discovery-service';
import { HttpOpenApiSchemaService } from './discovery/common/open-api-schema-service';

@Controller()
export class AppController {
  constructor(
    private readonly openApiSchemaService: HttpOpenApiSchemaService,
    private readonly awsEcsOpenApiDiscoveryService: AwsEcsOpenApiDiscoveryService,
  ) {}

  @Get()
  public async health() {
    return 'Running...';
  }

  @Get('/open-api/advertisements')
  public async getOpenApiAdvertisements() {
    return this.awsEcsOpenApiDiscoveryService.discoverOpenApiSpecs();
  }

  @Get('/open-api/schemas')
  public async getOpenApiSchemas() {
    const advertisements =
      await this.awsEcsOpenApiDiscoveryService.discoverOpenApiSpecs();
    return this.openApiSchemaService.getOpenApiSchemaFor(advertisements);
  }
}
