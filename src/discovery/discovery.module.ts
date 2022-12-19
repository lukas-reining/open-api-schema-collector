import { DynamicModule, Module } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AwsEcsOpenApiDiscoveryService } from './aws/ecs/ecs-open-api-discovery-service';
import { StaticOpenApiDiscoveryService } from './static/static-open-api-discovery-service';
import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  ValueProvider,
} from '@nestjs/common/interfaces/modules/provider.interface';

import { v4 as uuidv4 } from 'uuid';

import { DiscoveryService } from './discovery.service';
import {
  AwsEcsDiscoveryProvider,
  DiscoveryProvider,
  StaticDiscoveryProvider,
} from './discovery-provider';

export const DISCOVERY_SERVICES_TOKEN = 'OpenApiDiscoveryServices';
export const DISCOVERY_CONFIG_OPTIONS = 'DISCOVERY_CONFIG_OPTIONS';

export type DiscoveryOptions = {
  providers: DiscoveryProvider[];
};

type NestProvider =
  | ClassProvider
  | ValueProvider
  | FactoryProvider
  | ExistingProvider;

@Module({
  imports: [HttpModule],
})
export class DiscoveryModule {
  private static awsEcsDiscoveryProvider(
    provider: AwsEcsDiscoveryProvider,
  ): NestProvider {
    return {
      inject: [HttpService],
      provide: uuidv4(),
      useFactory: (httpService: HttpService) =>
        new AwsEcsOpenApiDiscoveryService(httpService, {
          clusterArns: provider.clusterArns,
        }),
    };
  }

  private static staticDiscoveryProvider(
    provider: StaticDiscoveryProvider,
  ): NestProvider {
    return {
      provide: uuidv4(),
      useFactory: () => new StaticOpenApiDiscoveryService(provider.paths),
    };
  }

  private static toProvider(provider: DiscoveryProvider): NestProvider {
    switch (provider.type) {
      case 'aws_ecs':
        return this.awsEcsDiscoveryProvider(provider);
      case 'static':
        return this.staticDiscoveryProvider(provider);
      default:
        throw new Error('Invalid provider');
    }
  }

  private static toProviders(providers: DiscoveryProvider[]) {
    return providers.map(DiscoveryModule.toProvider.bind(this));
  }

  public static register(options: DiscoveryOptions): DynamicModule {
    const providers = this.toProviders(options.providers);
    const providerTokens = providers.map(({ provide }) => provide);

    return {
      module: DiscoveryModule,
      providers: [
        {
          provide: DISCOVERY_CONFIG_OPTIONS,
          useValue: options,
        },
        ...providers,
        {
          provide: DISCOVERY_SERVICES_TOKEN,
          useFactory: (...services) => services,
          inject: providerTokens,
        },
        DiscoveryService,
      ],
      exports: [DiscoveryService],
    };
  }
}
