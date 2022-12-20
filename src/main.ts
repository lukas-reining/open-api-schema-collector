import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder().build();
  const document1 = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document1, {
    explorer: true,
    swaggerOptions: { configUrl: '/open-api/swagger/config' },
  });

  await app.listen(3000);
}

bootstrap();
