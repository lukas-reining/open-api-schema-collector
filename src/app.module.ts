import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DiscoveryModule } from './discovery/discovery.module';

@Module({
  imports: [
    DiscoveryModule.register({
      providers: [
        { type: 'static', paths: ['openapi'] },
        {
          type: 'aws_ecs',
          clusterArns: [
            'arn:aws:ecs:eu-central-1:938786464309:cluster/ecs-test-cluster',
          ],
        },
      ],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
