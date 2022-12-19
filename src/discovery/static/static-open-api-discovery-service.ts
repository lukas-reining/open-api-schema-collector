import { OpenApiDiscoveryService } from '../common/open-api-discovery-service';
import { OpenApiSchema } from '../common/open-api-schema';
import * as Fs from 'fs';
import * as Path from 'path';
import { Logger } from '@nestjs/common';

export class StaticOpenApiDiscoveryService extends OpenApiDiscoveryService {
  private readonly logger = new Logger(StaticOpenApiDiscoveryService.name);
  private readonly absolutePaths: string[];

  constructor(paths: string[]) {
    super();
    this.absolutePaths = this.toAbsolute(paths);
  }

  private toAbsolute(paths: string[]): string[] {
    return paths.map((current) => Path.resolve(current));
  }

  private exists(path: string) {
    return Fs.existsSync(path);
  }

  private notExists(path: string) {
    return !Fs.existsSync(path);
  }

  private loadSchemasForPath(path: string): OpenApiSchema[] {
    const dirCont = Fs.readdirSync(path);
    const files = dirCont.filter((elm) => elm.match(/.*\.(json)/gi));
    return files
      .map((file) => Path.join(path, file))
      .map<[string, Buffer]>((file) => [file, Fs.readFileSync(file)])
      .map(([fileName, buffer]) => ({
        source: fileName,
        schema: JSON.parse(buffer.toString()),
      }));
  }

  private loadSchemasForPaths(paths: string[]): OpenApiSchema[] {
    return paths.map(this.loadSchemasForPath).flat();
  }

  public async getOpenApiSchemas(): Promise<OpenApiSchema[]> {
    const nonExistingPaths = this.absolutePaths.filter(this.notExists);

    if (nonExistingPaths.length) {
      this.logger.warn(
        `The following paths do not exist and will not be discovered: \n${nonExistingPaths.join(
          '\n',
        )}`,
      );
    }

    return this.loadSchemasForPaths(this.absolutePaths.filter(this.exists));
  }
}
