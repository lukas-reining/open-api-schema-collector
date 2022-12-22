import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { DiscoveryModule } from './discovery/discovery.module';
import { ProxyModule } from './proxy/proxy.module';

const providerJsonPath = process.env.OASD_PROVIDERS_JSON_PATH;

@Module({
  imports: [
    ProxyModule,
    DiscoveryModule.register({
      providersFile: providerJsonPath ?? './example_providers.json',
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
