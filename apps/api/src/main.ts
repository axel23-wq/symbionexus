import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Larger body limit to allow base64 photos in listings
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ limit: '15mb', extended: true }));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('SymbioNexus API')
    .setDescription('La Marketplace Industrielle Intelligente de l\'Économie Circulaire')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Registration')
    .addTag('companies', 'Company Management')
    .addTag('listings', 'Waste Listings / Marketplace')
    .addTag('matches', 'AI Matchmaking')
    .addTag('contracts', 'Contract Management')
    .addTag('passports', 'Material Passport & Traceability')
    .addTag('carbon', 'Carbon Credits & Certificates')
    .addTag('messages', 'Internal Messaging')
    .addTag('notifications', 'Notification System')
    .addTag('dashboard', 'Dashboard & Analytics')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   🌿 SymbioNexus API is running on port ${port}            ║
  ║   📚 Swagger docs: http://localhost:${port}/api/docs       ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
}
bootstrap();
