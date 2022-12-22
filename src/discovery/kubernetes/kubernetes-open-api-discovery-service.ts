import * as k8s from '@kubernetes/client-node';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import * as dns from 'dns/promises';
import { firstValueFrom } from 'rxjs';

import { isDefined } from '../../common';
import { OpenApiDiscoveryService } from '../common/open-api-discovery-service';
import {
  OpenApiSchemaSource,
  toBaseUrl,
} from '../common/open-api-schema-source';
import { md5 } from '../encoding';
import { KubernetesOpenApiAdvertisement } from './open-api-advertisement';

export class KubernetesOpenApiDiscoveryService extends OpenApiDiscoveryService {
  private readonly logger = new Logger(KubernetesOpenApiDiscoveryService.name);
  private k8sClient: k8s.CoreV1Api;

  constructor(private httpService: HttpService) {
    super();
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.k8sClient = kc.makeApiClient(k8s.CoreV1Api);
  }

  public async discoverOpenApiSpecs(): Promise<
    KubernetesOpenApiAdvertisement[]
  > {
    const {
      body: { items: services },
    } = await this.k8sClient.listServiceForAllNamespaces(
      undefined,
      undefined,
      undefined,
      'open-api',
    );

    return services
      .map((service) => {
        const serviceName = service.metadata?.name!;
        const serviceFqdn = `${serviceName}.${service.metadata?.namespace}.svc`;
        const path = service.metadata?.annotations!['open-api/path'];
        const port = service.metadata?.annotations!['open-api/port'];

        if (!path) {
          this.logger.debug(
            `Skipping service because annotation "open-api/path" is missing`,
          );
          return null;
        }

        if (!port) {
          this.logger.debug(
            `Skipping service because annotation "open-api/port" is missing`,
          );
          return null;
        }

        return {
          source: serviceName,
          host: serviceFqdn,
          port,
          path,
        };
      })
      .filter(isDefined);
  }

  public async getOpenApiSchemas(): Promise<OpenApiSchemaSource[]> {
    const advertisements = await this.discoverOpenApiSpecs();
    return Promise.all(
      advertisements.map((advertisement) => {
        return this.schemaFor(advertisement);
      }),
    );
  }

  private async schemaFor(advertisement: KubernetesOpenApiAdvertisement) {
    const serviceUrl = `http://${advertisement.host}:${advertisement.port}`;
    const openApiUrl = `${serviceUrl}${advertisement.path}`;
    const id = md5(openApiUrl);

    try {
      const { data: schema } = await firstValueFrom(
        this.httpService.get(openApiUrl, { timeout: 10000 }),
      );
      this.logger.verbose(
        `Loaded OpenApi schema for source: ${advertisement.source}`,
      );
      return {
        id,
        source: advertisement.source,
        schema,
        address: { internal: serviceUrl, external: toBaseUrl(schema) },
      };
    } catch (e) {
      this.logger.error(
        `Error loading OpenApi schema for source: ${advertisement.source}`,
        e,
      );
      return {
        id,
        source: advertisement.source,
        schema: null,
        address: { internal: serviceUrl, external: null },
      };
    }
  }
}
