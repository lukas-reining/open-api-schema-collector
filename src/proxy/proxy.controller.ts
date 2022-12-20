import { Controller, Get, Next, Param, Req, Res } from '@nestjs/common';
import { Request } from 'express';
import { fromBase64Url } from '../discovery/encoding';
import * as proxy from 'express-http-proxy';

@Controller('proxy')
export class ProxyController {
  constructor() {}

  @Get('/:base64Url/*')
  public async proxy(
    @Param('base64Url') base64Url: string,
    @Req() req,
    @Res() res,
    @Next() next,
  ) {
    const url = new URL(fromBase64Url(base64Url));
    proxy(url.host, {
      proxyReqPathResolver: toOriginalPath,
    })(req, res, next);
  }
}

function toOriginalPath(request: Request) {
  return request.path.replace(/\/proxy\/[\w\d]+\//, '/');
}
