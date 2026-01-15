import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn', 'log']
          : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    // Railway provides PORT env var - read it directly from process.env
    // If not set, Railway will auto-assign one, so we use 3001 as fallback for local dev only
    const port = parseInt(process.env.PORT || '3001', 10);
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');

    // Enhanced security middleware with comprehensive headers
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              'https://cdnjs.cloudflare.com',
            ],
            scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        permittedCrossDomainPolicies: false,
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
      }),
    );

    // Compression middleware
    app.use(compression());

    // Cookie parser middleware
    app.use(cookieParser());

    // Global validation pipe with enhanced security
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: nodeEnv === 'production',
        validateCustomDecorators: true,
      }),
    );

    // CORS configuration with enhanced security
    const allowedOrigins =
      nodeEnv === 'production'
        ? configService
            .get<string>('ALLOWED_ORIGINS', '')
            .split(',')
            .filter(Boolean)
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:4200',
          ];

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Tenant-ID',
        'X-API-Key',
      ],
      exposedHeaders: ['Set-Cookie'],
    });

    // API prefix
    app.setGlobalPrefix('api/v1');

    // Swagger documentation (only in non-production)
    if (nodeEnv !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Marketplace API')
        .setDescription('Enterprise marketplace API')
        .setVersion('1.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
          },
          'JWT-auth',
        )
        .addServer('http://localhost:3001', 'Development server')
        .build();

      const document = SwaggerModule.createDocument(app, config, {
        operationIdFactory: (controllerKey: string, methodKey: string) =>
          methodKey,
      });

      SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          docExpansion: 'none',
          filter: true,
          showRequestHeaders: true,
          tryItOutEnabled: true,
        },
        customSiteTitle: 'Marketplace API Documentation',
      });
    }

    // Graceful shutdown
    app.enableShutdownHooks();

    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 NestJS API running on http://0.0.0.0:${port}`);
    logger.log(`📚 Environment: ${nodeEnv}`);
    logger.log(`🔌 Port: ${port} (Railway PORT env: ${process.env.PORT || 'not set, using default'})`);
    logger.log(
      `🔒 Security headers enabled with CSP, HSTS, and XSS protection`,
    );

    if (nodeEnv !== 'production') {
      logger.log(
        `📚 Swagger docs available at http://localhost:${port}/api/docs`,
      );
    }
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
