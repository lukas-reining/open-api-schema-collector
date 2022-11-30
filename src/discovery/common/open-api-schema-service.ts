import { OpenApiAdvertisement } from './open-api-advertisement';
import { OpenApiSchema } from './open-api-schema';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export abstract class OpenApiSchemaService {
  public abstract getOpenApiSchemaFor(
    advertisements: OpenApiAdvertisement[],
  ): Promise<OpenApiSchema[]> | OpenApiSchema[];
}

@Injectable()
export class HttpOpenApiSchemaService extends OpenApiSchemaService {
  private readonly logger = new Logger(HttpOpenApiSchemaService.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  public getOpenApiSchemaFor(
    advertisements: OpenApiAdvertisement[],
  ): Promise<OpenApiSchema[]> | OpenApiSchema[] {
    return Promise.all(
      advertisements.map((advertisement) => {
        return this.schemaFor(advertisement);
      }),
    );
  }

  private async schemaFor(advertisement: OpenApiAdvertisement) {
    const url = `${advertisement.protocol}://${advertisement.host}:${advertisement.port}${advertisement.path}`;

    try {
      const { data: schema } = await firstValueFrom(
        this.httpService.get(url, { timeout: 10000 }),
      );
      this.logger.verbose(
        `Loaded OpenApi schema for source: ${advertisement.source}`,
      );
      return { source: advertisement.source, schema };
    } catch (e) {
      this.logger.error(
        `Error loading OpenApi schema for source: ${advertisement.source}`,
        e,
      );
      return { source: advertisement.source, schema: null };
    }
  }
}
