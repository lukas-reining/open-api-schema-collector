import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ProxyModule } from '../proxy/proxy.module';
import { DiscoveryProvider } from './discovery-provider';
import { ConfigurableDiscoveryModule } from './discovery.module-definition';
import { DiscoveryService } from './discovery.service';

export type DiscoveryOptions = {
  providers?: DiscoveryProvider[];
  providersFile?: string;
  allowInternalProxy: boolean;
};

@Module({
  imports: [HttpModule, ProxyModule],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule extends ConfigurableDiscoveryModule {}
