import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';

@Module({
  imports: [],
  controllers: [ProxyController],
})
export class ProxyModule {}
