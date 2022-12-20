import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DiscoveryModule } from './discovery/discovery.module';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    ProxyModule,
    DiscoveryModule.register({
      providers: [
        { type: 'static', paths: ['openapi'] },
        // {
        //   type: 'aws_ecs',
        //   clusterArns: [
        //     'arn:aws:ecs:eu-central-1:938786464309:cluster/ecs-test-cluster',
        //   ],
        // },
      ],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
