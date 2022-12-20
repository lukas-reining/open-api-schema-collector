import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type OpenApiDocV2 = OpenAPIV2.Document;
export type OpenApiDocV3 = OpenAPIV3.Document;
export type OpenApiDocV3_1 = OpenAPIV3_1.Document;

export type OpenApiDoc = OpenApiDocV2 | OpenApiDocV3 | OpenApiDocV3_1;

export interface OpenApiSchema<
  T extends OpenApiDoc | null = OpenApiDoc | null,
> {
  id: string;
  source: string;
  schema: T;
}

export function isOasV2(
  doc: OpenApiSchema<any> | any,
): doc is OpenApiSchema<OpenApiDocV2> {
  return doc.schema?.swagger?.startsWith('2.0');
}

export function isOasV3(
  doc: OpenApiSchema<any> | any,
): doc is OpenApiSchema<OpenApiDocV3> {
  return doc.schema?.openapi.startsWith('3.0');
}

export function isOasV3_1(
  doc: OpenApiSchema<any> | any,
): doc is OpenApiSchema<OpenApiDocV3_1> {
  return doc.schema?.openapi.startsWith('3.1');
}
