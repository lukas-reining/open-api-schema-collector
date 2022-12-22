import { ConfigurableModuleBuilder } from '@nestjs/common';

import { DiscoveryOptions } from './discovery.module';

export const {
  ConfigurableModuleClass: ConfigurableDiscoveryModule,
  MODULE_OPTIONS_TOKEN: DISCOVERY_MODULE_OPTIONS,
} = new ConfigurableModuleBuilder<DiscoveryOptions>().build();
