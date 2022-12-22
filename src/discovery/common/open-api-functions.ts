import * as url from 'url';

import {
  OpenApiDocV2,
  OpenApiDocV3,
  OpenApiDocV3_1,
  OpenApiSchemaSource,
} from './open-api-schema-source';

export function toBaseUrlV2(
  { address }: OpenApiSchemaSource<OpenApiDocV2>,
  allowInternal: boolean,
): URL | null {
  if (address.internal && allowInternal) {
    return new URL(address.internal);
  } else if (address.external) {
    return new URL(address.external);
  } else {
    return null;
  }
}

export function toBaseUrlsV3<T extends OpenApiDocV3 | OpenApiDocV3_1>(
  { schema, address }: OpenApiSchemaSource<T>,
  allowInternal: boolean,
): URL[] | null {
  if (schema.servers?.length) {
    return schema.servers.map((server) => new url.URL(server.url));
  } else if (address.internal && allowInternal) {
    return [new URL(address.internal)];
  } else if (address.external) {
    return [new URL(address.external)];
  }

  return null;
}

export function toOpenApiSchemaWithProxyOAS2(
  schema: OpenApiSchemaSource<OpenApiDocV2>,
  createProxyUrl: (url: string) => string,
  allowInternal: boolean,
): OpenApiSchemaSource<OpenApiDocV2> {
  const baseUrl = toBaseUrlV2(schema, allowInternal)?.href;

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

export function toOpenApiSchemaWithProxyOAS3<
  T extends OpenApiDocV3 | OpenApiDocV3_1,
>(
  schema: OpenApiSchemaSource<T>,
  createProxyUrl: (url: string) => string,
  allowInternal: boolean,
): OpenApiSchemaSource<T> {
  const baseUrls = toBaseUrlsV3(schema, allowInternal);

  const servers = schema.schema.servers;
  const proxyServers = baseUrls?.map(({ href }) => ({
    description: 'Discovery Proxy',
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
