import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';

class StatusDto {
  @ApiProperty({ example: 'running' })
  status: string;
}

@Controller()
@ApiTags('Example')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiResponse({
    schema: {
      type: 'string',
      example: 'Hello',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  @ApiResponse({ type: StatusDto })
  getIndex() {
    return {
      status: 'running',
    };
  }
}
