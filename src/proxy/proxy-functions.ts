import { toBase64Url } from '../discovery/encoding';

export function toProxyUrl(url: string) {
  return `/proxy/${toBase64Url(url)}`;
}

export function toOriginalUrl(url: string) {
  return url.replace(/\/proxy\/[\w\d]+\//, '/');
}
