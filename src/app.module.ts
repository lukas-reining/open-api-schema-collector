import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { Config, parseConfig } from './config';
import { DiscoveryModule } from './discovery/discovery.module';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    ProxyModule,
    ConfigModule.forRoot({
      load: [parseConfig],
      isGlobal: true,
      expandVariables: true,
    }),
    DiscoveryModule.registerAsync({
      useFactory: (config: ConfigService<Config, true>) => ({
        providersFile: config.get('discoveryJsonPath'),
        allowInternalProxy: config.get('proxyInternal'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
