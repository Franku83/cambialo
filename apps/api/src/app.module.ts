import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { BullModule } from '@nestjs/bullmq'

import { PrismaModule } from './common/database/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { ListingsModule } from './modules/listings/listings.module'
import { VerificationModule } from './modules/verification/verification.module'
import { ReviewsModule } from './modules/reviews/reviews.module'
import { SafeZonesModule } from './modules/safe-zones/safe-zones.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { PaymentsModule } from './modules/payments/payments.module'
import { ImeiModule } from './modules/imei/imei.module'
import { AdminModule } from './modules/admin/admin.module'
import { FraudReportsModule } from './modules/fraud-reports/fraud-reports.module'
import { SearchAlertsModule } from './modules/search-alerts/search-alerts.module'

@Module({
  imports: [
    // Config global — .env disponible en toda la app
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting global (NestJS Throttler)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        throttlers: [
          { name: 'short', ttl: 1000, limit: 10 },    // 10 req/segundo
          { name: 'medium', ttl: 60000, limit: 100 },  // 100 req/minuto
          { name: 'long', ttl: 3600000, limit: 500 },  // 500 req/hora
        ],
      }),
    }),

    // Cron jobs y tasks programadas
    ScheduleModule.forRoot(),

    // BullMQ — jobs async
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL')!,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      }),
    }),

    // Módulos de dominio
    PrismaModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    VerificationModule,
    ReviewsModule,
    SafeZonesModule,
    NotificationsModule,
    PaymentsModule,
    ImeiModule,
    AdminModule,
    FraudReportsModule,
    SearchAlertsModule,
  ],
})
export class AppModule {}
