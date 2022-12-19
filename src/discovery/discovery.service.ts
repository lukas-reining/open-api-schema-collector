import { Inject, Injectable } from '@nestjs/common';
import { OpenApiDiscoveryService } from './common/open-api-discovery-service';
import { OpenApiSchema } from './common/open-api-schema';
import { DISCOVERY_SERVICES_TOKEN } from './discovery.module';

@Injectable()
export class DiscoveryService extends OpenApiDiscoveryService {
  constructor(
    @Inject(DISCOVERY_SERVICES_TOKEN)
    private services: OpenApiDiscoveryService[],
  ) {
    super();
  }

  public async getOpenApiSchemas(): Promise<OpenApiSchema[]> {
    const schemas = await Promise.all(
      this.services.map((serice) => serice.getOpenApiSchemas()),
    );

    return schemas.flat();
  }
}
