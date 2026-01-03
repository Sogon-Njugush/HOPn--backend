import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable Validation
  app.useGlobalPipes(new ValidationPipe());

  // 2. Enable CORS (Allows frontend at localhost:3000 to hit this API)
  app.enableCors({
    origin: 'http://localhost:3000', // Adjust if your Next.js runs on a different port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type'],
  });

  // 3. Listen on Port 4000
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
