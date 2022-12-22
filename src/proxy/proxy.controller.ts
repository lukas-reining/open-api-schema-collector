import {
  All,
  Controller,
  Next,
  Param,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import * as proxy from 'express-http-proxy';

import { ProxyService } from './proxy.service';

@Controller('proxy')
export class ProxyController {
  constructor(private proxyService: ProxyService) {}

  @All('/:base64Url/*')
  public async proxy(
    @Param('base64Url') base64Url: string,
    @Req() req,
    @Res() res,
    @Next() next,
  ) {
    let url: URL;

    try {
      url = this.proxyService.verifyProxyUrl(base64Url);
    } catch (e) {
      throw new UnauthorizedException('Invalid path signature');
    }

    proxy(url.host, {
      proxyReqPathResolver: ({ path }) => this.proxyService.toOriginalUrl(path),
    })(req, res, next);
  }
}
