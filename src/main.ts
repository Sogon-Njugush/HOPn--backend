import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Validation
  app.useGlobalPipes(new ValidationPipe());

  // Enable CORS (Allows frontend at localhost:3000 to hit this API)
  app.enableCors({
    origin: ['http://localhost:3000', 'https://ho-pn-frontend.vercel.app'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type'],
  });

  // Listen on Port 4000
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
