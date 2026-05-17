import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  })

  // CORS — solo dominios permitidos
  app.enableCors({
    origin: [
      process.env.NEXT_PUBLIC_APP_URL ?? 'https://cambialo.com',
      'http://localhost:3000', // dev
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  // Validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // Strip campos no declarados en DTO
      forbidNonWhitelisted: true,
      transform: true,         // Auto-transform tipos (string → number, etc.)
      transformOptions: { enableImplicitConversion: true },
    })
  )

  // Prefijo global de API
  app.setGlobalPrefix('api/v1')

  // Swagger solo en desarrollo/staging
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Cambialo API')
      .setDescription('API REST para la plataforma de smartphones verificados')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)
    logger.log('Swagger docs disponibles en /api/docs')
  }

  const port = process.env.PORT ?? 4000
  await app.listen(port)
  logger.log(`API corriendo en puerto ${port}`)
}

bootstrap()
