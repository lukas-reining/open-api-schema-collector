import * as crypto from 'crypto';

export function toBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

export function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('ascii');
}

export function md5(value: string) {
  return crypto.createHash('md5').update(value).digest('hex');
}
