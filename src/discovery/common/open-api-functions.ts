import * as url from 'url';

import {
  OpenApiDocV2,
  OpenApiDocV3,
  OpenApiDocV3_1,
  OpenApiSchemaSource,
} from './open-api-schema-source';

export function toBaseUrlV2({
  address,
}: OpenApiSchemaSource<OpenApiDocV2>): URL | null {
  if (address.internal) {
    return new URL(address.internal);
  } else if (address.external) {
    return new URL(address.external);
  } else {
    return null;
  }
}

export function toBaseUrlsV3<T extends OpenApiDocV3 | OpenApiDocV3_1>({
  schema,
  address,
}: OpenApiSchemaSource<T>): URL[] | null {
  if (schema.servers?.length) {
    return schema.servers.map((server) => new url.URL(server.url));
  } else if (address.internal) {
    return [new URL(address.internal)];
  } else if (address.external) {
    return [new URL(address.external)];
  }

  return null;
}

export function toOpenApiSchemaWithProxyOAS2(
  schema: OpenApiSchemaSource<OpenApiDocV2>,
  createProxyUrl: (url: string) => string,
): OpenApiSchemaSource<OpenApiDocV2> {
  const baseUrl = toBaseUrlV2(schema)?.href;

  if (!baseUrl) {
    return schema;
  }

  return {
    ...schema,
    schema: {
      ...schema.schema,
      schemes: undefined, // TODO Check what to do
      host: undefined,
      basePath: createProxyUrl(baseUrl),
    },
  };
}

export function toOpenApiSchemaWithProxyOAS3(
  schema: OpenApiSchemaSource<OpenApiDocV3 | OpenApiDocV3_1>,
  createProxyUrl: (url: string) => string,
): OpenApiSchemaSource<OpenApiDocV3 | OpenApiDocV3_1> {
  const baseUrls = toBaseUrlsV3(schema);

  const servers = schema.schema.servers;
  const proxyServers = baseUrls?.map(({ href }) => ({
    url: createProxyUrl(href),
  }));

  if (!proxyServers) {
    return schema;
  }

  return {
    ...schema,
    schema: {
      ...schema.schema,
      servers: servers ? [...proxyServers, ...servers] : proxyServers,
    },
  };
}
