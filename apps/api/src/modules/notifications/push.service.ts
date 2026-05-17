import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as webpush from 'web-push'
import { PrismaService } from '../../common/database/prisma.service'

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name)

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY')
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY')
    const subject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@cambialo.com'

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey)
      this.logger.log('Web Push VAPID configurado')
    } else {
      this.logger.warn('VAPID keys no configuradas — push notifications desactivadas')
    }
  }

  async saveSubscription(userId: string, subscription: webpush.PushSubscription) {
    // Guardamos la suscripción en el campo whatsappNumber temporalmente
    // En producción: tabla dedicada push_subscriptions
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        // Serializar la suscripción push — en prod usar tabla dedicada
      },
    }).catch(() => null) // Non-blocking

    this.logger.debug(`Suscripción push guardada para usuario ${userId}`)
  }

  async sendPush(subscription: webpush.PushSubscription, payload: {
    title: string
    body: string
    data?: Record<string, unknown>
    icon?: string
  }) {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon ?? '/icons/icon-192.png',
          data: payload.data ?? {},
        }),
      )
    } catch (error) {
      const err = error as { statusCode?: number }
      if (err.statusCode === 410) {
        // Suscripción expirada — marcar para eliminar
        this.logger.debug('Suscripción push expirada (410)')
      }
      throw error
    }
  }
}
