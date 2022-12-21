import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import * as url from 'url';

export type OpenApiDocV2 = OpenAPIV2.Document;
export type OpenApiDocV3 = OpenAPIV3.Document;
export type OpenApiDocV3_1 = OpenAPIV3_1.Document;

export type OpenApiDoc = OpenApiDocV2 | OpenApiDocV3 | OpenApiDocV3_1;

export interface OpenApiSchemaSource<
  T extends OpenApiDoc | null = OpenApiDoc | null,
> {
  id: string;
  source: string;
  schema: T;
  address: {
    internal: string | null;
    external: string | null;
  };
}

export function isOasV2(schema: OpenApiDoc | any): schema is OpenApiDocV2 {
  return schema?.swagger?.startsWith('2.0');
}

export function isOasV3(schema: OpenApiDoc | any): schema is OpenApiDocV3 {
  return schema?.openapi?.startsWith('3.0');
}

export function isOasV3_1(schema: OpenApiDoc | any): schema is OpenApiDocV3_1 {
  return schema?.openapi?.startsWith('3.1');
}

export function isOasV2Source(
  doc: OpenApiSchemaSource<any> | any,
): doc is OpenApiSchemaSource<OpenApiDocV2> {
  return isOasV2(doc.schema);
}

export function isOasV3Source(
  doc: OpenApiSchemaSource<any> | any,
): doc is OpenApiSchemaSource<OpenApiDocV3> {
  return isOasV3(doc.schema);
}

export function isOasV3_1Source(
  doc: OpenApiSchemaSource<any> | any,
): doc is OpenApiSchemaSource<OpenApiDocV3_1> {
  return isOasV3_1(doc.schema);
}

export function toBaseUrl(doc: OpenApiDoc): string | null {
  if (isOasV2(doc)) {
    const isHttp = doc.schemes?.includes('http');
    const isHttps = doc.schemes?.includes('https');
    const scheme = isHttps ? 'https' : isHttp ? 'http' : 'https';

    if (doc.host) {
      return new url.URL(
        doc.basePath ?? '',
        `${scheme}://${doc.host}${doc.basePath}`,
      ).href;
    }
  } else {
    const servers = doc.servers;
    return (servers && servers[0])?.url ?? null; // TODO Could use many servers
  }

  return null;
}
