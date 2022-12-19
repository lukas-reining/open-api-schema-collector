import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use('/conf', (req, res) => {
    return res.send({
      urls: [
        {
          name: 'Master API',
          url: 'https://petstore.swagger.io/v2/swagger.json',
        },
        {
          name: 'Master API 2',
          url: 'https://rackerlabs.github.io/wadl2swagger/openstack/swagger/dbaas.json',
        },
      ],
    });
  });

  const config = new DocumentBuilder().build();
  const document1 = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document1, {
    explorer: true,
    swaggerOptions: { configUrl: '/open-api/swagger/config' },
  });

  await app.listen(3000);
}

bootstrap();
