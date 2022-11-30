import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AwsEcsOpenApiDiscoveryService } from './aws/ecs/ecs-open-api-discovery-service';
import { HttpOpenApiSchemaService } from './common/open-api-schema-service';

@Module({
  imports: [HttpModule],
  providers: [
    HttpOpenApiSchemaService,
    {
      provide: AwsEcsOpenApiDiscoveryService,
      useFactory: () =>
        new AwsEcsOpenApiDiscoveryService({
          clusterArns: [
            'arn:aws:ecs:eu-central-1:938786464309:cluster/ecs-test-cluster',
          ],
        }),
    },
  ],
  exports: [HttpOpenApiSchemaService, AwsEcsOpenApiDiscoveryService],
})
export class DiscoveryModule {}
