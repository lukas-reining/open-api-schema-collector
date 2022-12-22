import { Logger } from '@nestjs/common';
import * as Fs from 'fs';
import * as Path from 'path';

import { OpenApiDiscoveryService } from '../common/open-api-discovery-service';
import {
  OpenApiSchemaSource,
  toBaseUrl,
} from '../common/open-api-schema-source';
import { md5 } from '../encoding';

export class StaticOpenApiDiscoveryService extends OpenApiDiscoveryService {
  private readonly logger = new Logger(StaticOpenApiDiscoveryService.name);
  private readonly absolutePath: string;

  constructor(path: string) {
    super();
    this.absolutePath = this.toAbsolute(path);
  }

  private toAbsolute(path: string): string {
    return Path.resolve(path);
  }

  private notExists(path: string) {
    return !Fs.existsSync(path);
  }

  private loadSchemasForPath(path: string): OpenApiSchemaSource[] {
    const dirCont = Fs.readdirSync(path);
    const files = dirCont.filter((elm) => elm.match(/.*\.(json)/gi));
    return files
      .map((file) => Path.join(path, file))
      .map<[string, Buffer]>((file) => [file, Fs.readFileSync(file)])
      .map(([fileName, buffer]) => {
        const schema = JSON.parse(buffer.toString());

        return {
          id: md5(fileName),
          source: fileName,
          address: {
            internal: null,
            external: toBaseUrl(schema),
          },
          schema: schema,
        };
      });
  }

  private loadSchemasForPaths(paths: string[]): OpenApiSchemaSource[] {
    return paths.map(this.loadSchemasForPath).flat();
  }

  public async getOpenApiSchemas(): Promise<OpenApiSchemaSource[]> {
    if (this.notExists(this.absolutePath)) {
      this.logger.warn(
        `The following path does not exist and will not be discovered: \n${this.absolutePath}`,
      );

      return [];
    }

    return this.loadSchemasForPaths([this.absolutePath]);
  }
}
