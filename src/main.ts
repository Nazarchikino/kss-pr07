import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = configureApp(
    await NestFactory.create(AppModule, {
      logger: new ConsoleLogger({ json: isProd }),
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
