import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

import { Config } from '../config';
import { fromBase64Url, toBase64Url } from '../discovery/encoding';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly proxyPathSigningSecret: string;

  constructor(config: ConfigService<Config>) {
    const secret = config.get('proxyPathSigningSecret', { infer: true });

    if (!secret) {
      this.logger.warn(
        'Missing user provided OASD_PROXY_PATH_SIGNING_SECRET, so a random secret will be used',
      );
    }

    this.proxyPathSigningSecret =
      secret || crypto.randomBytes(64).toString('hex');
  }

  public toOriginalUrl(url: string) {
    return url.replace(/\/proxy\/[\w\d]+\//, '/');
  }

  public toProxyUrl(url: string) {
    const token = jwt.sign({ url }, this.proxyPathSigningSecret);
    return `/proxy/${toBase64Url(token)}`;
  }

  public verifyProxyUrl(url: string) {
    try {
      const payload = jwt.verify(
        fromBase64Url(url),
        this.proxyPathSigningSecret,
      );
      return new URL(payload['url']);
    } catch (e) {
      throw new Error('The signature of the proxy URL is wrong');
    }
  }
}
