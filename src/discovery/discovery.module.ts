import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  ValueProvider,
} from '@nestjs/common/interfaces/modules/provider.interface';
import Ajv from 'ajv';
import * as Fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import * as ProviderJsonSchema from '../../providers.schema.json';
import { ProxyModule } from '../proxy/proxy.module';
import { AwsEcsOpenApiDiscoveryService } from './aws/ecs/ecs-open-api-discovery-service';
import {
  AwsEcsDiscoveryProvider,
  DiscoveryProvider,
  StaticDiscoveryProvider,
} from './discovery-provider';
import { DiscoveryService } from './discovery.service';
import { StaticOpenApiDiscoveryService } from './static/static-open-api-discovery-service';

export const DISCOVERY_SERVICES_TOKEN = 'OpenApiDiscoveryServices';
export const DISCOVERY_CONFIG_OPTIONS = 'DISCOVERY_CONFIG_OPTIONS';

export type DiscoveryOptions = {
  providers?: DiscoveryProvider[];
  providersFile?: string;
};

type NestProvider =
  | ClassProvider
  | ValueProvider
  | FactoryProvider
  | ExistingProvider;

@Module({
  imports: [HttpModule, ProxyModule],
})
export class DiscoveryModule {
  private static logger = new Logger(DiscoveryModule.name);

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

  private static loadProviderFile(path: string): DiscoveryProvider[] {
    let file;
    try {
      file = Fs.readFileSync(path);
    } catch (e) {
      throw new Error('Provider file does not exist');
    }

    const validator = new Ajv().compile<DiscoveryProvider[]>(
      ProviderJsonSchema,
    );
    const providerConfig = JSON.parse(file.toString());

    if (validator(providerConfig)) {
      return providerConfig;
    }

    const errorMessages = validator.errors?.map(({ message }) => message);
    this.logger.error(`Provider file is invalid: ${errorMessages?.join(', ')}`);
    throw new Error('Provider file is invalid');
  }

  private static loadProviders(options: DiscoveryOptions): DiscoveryProvider[] {
    if (options.providers) {
      return options.providers;
    } else if (options.providersFile) {
      return this.loadProviderFile(options.providersFile);
    }

    throw new Error('Missing provider configuration');
  }

  public static register(options: DiscoveryOptions): DynamicModule {
    const providers = this.toProviders(this.loadProviders(options));
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
