import { ECS, Tag, Task } from '@aws-sdk/client-ecs';
import { OpenApiDiscoveryService } from '../../common/open-api-discovery-service';
import { Injectable, Logger } from '@nestjs/common';
import { isDefined } from '../../../common';

import {
  OpenApiSchemaSource,
  toBaseUrl,
} from '../../common/open-api-schema-source';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { md5 } from '../../encoding';
import { EcsOpenApiAdvertisement } from './open-api-advertisement';

interface EcsOpenApiDiscoveryServiceConfig {
  clusterArn?: string;
  clusterArns?: string[];
  openApiSchemaAvailableTag?: string;
  openApiSchemaProtocolTag?: string;
  openApiSchemaHostTag?: string;
  openApiSchemaPortTag?: string;
  openApiSchemaPathTag?: string;
}

type Protocol = 'http' | 'https';

function isProtocol(value?: string): value is Protocol {
  return !!value && ['http', 'https'].includes(value);
}

@Injectable()
export class AwsEcsOpenApiDiscoveryService extends OpenApiDiscoveryService {
  private readonly logger = new Logger(AwsEcsOpenApiDiscoveryService.name);
  private readonly ecsClient: ECS;

  private readonly clusterArns: string[];
  private readonly openApiSchemaAvailableTag: string;
  private readonly openApiSchemaProtocolTag: string;
  private readonly openApiSchemaPortTag: string;
  private readonly openApiSchemaPathTag: string;

  constructor(
    private readonly httpService: HttpService,
    {
      clusterArn,
      clusterArns = [],
      openApiSchemaAvailableTag = 'OpenApiSchemaAvailable',
      openApiSchemaProtocolTag = 'OpenApiSchemaProtocol',
      openApiSchemaPortTag = 'OpenApiSchemaPort',
      openApiSchemaPathTag = 'OpenApiSchemaPath',
    }: EcsOpenApiDiscoveryServiceConfig,
  ) {
    super();
    this.ecsClient = new ECS({ apiVersion: '2014-11-13' });
    this.clusterArns = [clusterArn, ...clusterArns].filter(isDefined);

    if (!this.clusterArns.length) {
      this.logger.error(
        'You have to provide at least one ECS cluster ARN when initializing.',
      );
      throw Error('ECS Cluster ARN missing');
    }

    this.openApiSchemaAvailableTag = openApiSchemaAvailableTag;
    this.openApiSchemaProtocolTag = openApiSchemaProtocolTag;
    this.openApiSchemaPortTag = openApiSchemaPortTag;
    this.openApiSchemaPathTag = openApiSchemaPathTag;
  }

  private byKey(tagKey: string) {
    return (tag: Tag) => {
      return tag.key === tagKey;
    };
  }

  private getTagValue(
    tags: Tag[] | undefined,
    tag: string,
  ): string | undefined {
    return tags?.find(this.byKey(tag))?.value;
  }

  private openApiSchemaAvailable(task: Task) {
    return (
      this.getTagValue(task.tags, this.openApiSchemaAvailableTag) === 'true'
    );
  }

  private getSchemaProtocol(
    task: Task,
    defaultValue: 'http' | 'https' = 'http',
  ): string {
    return (
      this.getTagValue(task.tags, this.openApiSchemaProtocolTag) ?? defaultValue
    );
  }

  private getSchemaPort(task: Task) {
    return this.getTagValue(task.tags, this.openApiSchemaPortTag);
  }

  private getSchemaPath(task: Task) {
    return this.getTagValue(task.tags, this.openApiSchemaPathTag);
  }

  private getSchemaIp(task: Task): string | undefined {
    return (
      task?.attachments &&
      task?.attachments[0]?.details?.find(
        ({ name }) => name === 'privateIPv4Address',
      )?.value
    );
  }

  private getOpenApiAdvertisementForTask(
    task: Task,
  ): EcsOpenApiAdvertisement | undefined {
    if (!this.openApiSchemaAvailable(task)) {
      this.logger.debug(
        `Skipping task ${task.taskArn} because it has not declared OpenApi spec availability`,
      );
      return undefined;
    }

    this.logger.debug(
      `Using task ${task.taskArn} because it has declared OpenApi spec availability`,
    );

    const protocol = this.getSchemaProtocol(task);
    const host = this.getSchemaIp(task);
    const path = this.getSchemaPath(task);
    const port = this.getSchemaPort(task);

    if (!isProtocol(protocol)) {
      this.logger.debug(
        `Skipping task ${task.taskArn} because protocol ${protocol} is not valid`,
      );
      return undefined;
    }

    if (!host) {
      this.logger.debug(
        `Skipping task ${task.taskArn} because the IP of the task can not be found`,
      );
      return undefined;
    }

    if (!path) {
      this.logger.debug(
        `Skipping task ${task.taskArn} because path is not given`,
      );
      return undefined;
    }

    if (!port) {
      this.logger.debug(
        `Skipping task ${task.taskArn} because port is not given`,
      );
      return undefined;
    }

    return {
      source: task.taskArn!,
      protocol,
      host,
      port,
      path,
    };
  }

  public async discoverOpenApiSpecs(): Promise<EcsOpenApiAdvertisement[]> {
    const clusters = await this.ecsClient.describeClusters({
      clusters: this.clusterArns,
    });

    const clusterArn = clusters?.clusters && clusters.clusters[0]?.clusterArn;

    if (!clusters.clusters) {
      this.logger.warn('Could not load ECS clusters');
      return [];
    }

    this.logger.debug(`Discovering OpenApi specs in ECS cluster ${clusterArn}`);

    const taskList = await this.ecsClient.listTasks({
      cluster: clusterArn,
    });

    const { tasks } = await this.ecsClient.describeTasks({
      cluster: clusterArn,
      tasks: taskList.taskArns,
      include: ['TAGS'],
    });

    if (!tasks) {
      this.logger.warn(`Could not load tasks in ECS Cluster ${clusterArn}`);
      return [];
    }

    return tasks
      .map(this.getOpenApiAdvertisementForTask.bind(this))
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

  private async schemaFor(advertisement: EcsOpenApiAdvertisement) {
    const serviceUrl = `${advertisement.protocol}://${advertisement.host}:${advertisement.port}`;
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
