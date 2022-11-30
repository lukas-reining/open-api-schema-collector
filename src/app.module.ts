import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DiscoveryModule } from './discovery/discovery.module';

@Module({
  imports: [DiscoveryModule],
  controllers: [AppController],
})
export class AppModule {}
