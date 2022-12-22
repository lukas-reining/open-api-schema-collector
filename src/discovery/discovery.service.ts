import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import Ajv from 'ajv';
import * as Fs from 'fs';

import * as ProviderJsonSchema from '../../providers.schema.json';
import { ProxyService } from '../proxy/proxy.service';
import { AwsEcsOpenApiDiscoveryService } from './aws/ecs/ecs-open-api-discovery-service';
import { OpenApiDiscoveryService } from './common/open-api-discovery-service';
import {
  toOpenApiSchemaWithProxyOAS2,
  toOpenApiSchemaWithProxyOAS3,
} from './common/open-api-functions';
import {
  OpenApiDoc,
  OpenApiDocV3,
  OpenApiDocV3_1,
  OpenApiSchemaSource,
  isOasV2Source,
  isOasV3Source,
  isOasV3_1Source,
} from './common/open-api-schema-source';
import { DiscoveryProvider } from './discovery-provider';
import { DiscoveryOptions } from './discovery.module';
import { DISCOVERY_MODULE_OPTIONS } from './discovery.module-definition';
import { KubernetesOpenApiDiscoveryService } from './kubernetes/kubernetes-open-api-discovery-service';
import { StaticOpenApiDiscoveryService } from './static/static-open-api-discovery-service';

@Injectable()
export class DiscoveryService extends OpenApiDiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly services: OpenApiDiscoveryService[];
  private readonly allowInternalProxy: boolean;

  constructor(
    @Inject(DISCOVERY_MODULE_OPTIONS) private options: DiscoveryOptions,
    private httpService: HttpService,
    private proxyService: ProxyService,
  ) {
    super();
    const providers = this.loadProviders(options);
    this.services = providers.map(this.toService.bind(this));
    this.allowInternalProxy = options.allowInternalProxy;
  }

  private loadProviderFile(path: string): DiscoveryProvider[] {
    let file;
    try {
      file = Fs.readFileSync(path);
    } catch (e) {
      throw new Error(`Provider file ${path} does not exist`);
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

  private loadProviders(options: DiscoveryOptions): DiscoveryProvider[] {
    if (options.providers) {
      return options.providers;
    } else if (options.providersFile) {
      return this.loadProviderFile(options.providersFile);
    }

    throw new Error('Missing provider configuration');
  }

  private toService(provider: DiscoveryProvider) {
    switch (provider.type) {
      case 'aws_ecs':
        return new AwsEcsOpenApiDiscoveryService(this.httpService, {
          clusterArns: provider.clusterArns,
        });
      case 'kubernetes':
        return new KubernetesOpenApiDiscoveryService(this.httpService);
      case 'static':
        return new StaticOpenApiDiscoveryService(provider.path);
      default:
        throw new Error('Invalid provider');
    }
  }

  private toOpenApiSchemaWithProxy<T extends OpenApiDoc>(
    schema: OpenApiSchemaSource<T>,
  ) {
    const generateProxyUrl = this.proxyService.toProxyUrl.bind(
      this.proxyService,
    );

    if (isOasV2Source(schema)) {
      return toOpenApiSchemaWithProxyOAS2(
        schema,
        generateProxyUrl,
        this.allowInternalProxy,
      );
    } else if (isOasV3Source(schema)) {
      return toOpenApiSchemaWithProxyOAS3<OpenApiDocV3>(
        schema,
        generateProxyUrl,
        this.allowInternalProxy,
      );
    } else if (isOasV3_1Source(schema)) {
      return toOpenApiSchemaWithProxyOAS3<OpenApiDocV3_1>(
        schema,
        generateProxyUrl,
        this.allowInternalProxy,
      );
    }

    return schema;
  }

  public async getOpenApiSchemas(): Promise<OpenApiSchemaSource[]> {
    const schemas = await Promise.all(
      this.services.map((serice) => serice.getOpenApiSchemas()),
    );

    return schemas.flat();
  }

  public async getOpenApiSchemasWithProxy(): Promise<OpenApiSchemaSource[]> {
    const schemas = await this.getOpenApiSchemas();
    return schemas.map(this.toOpenApiSchemaWithProxy.bind(this));
  }
}
