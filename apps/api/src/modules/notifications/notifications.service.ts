import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/database/prisma.service'

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      data,
      total,
      unreadCount,
      page,
      limit,
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createNotification(data: {
    userId: string
    type: string
    title: string
    body: string
    payload?: Record<string, unknown>
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as never,
        title: data.title,
        body: data.body,
        data: (data.payload ?? {}) as never,
      },
    })
  }
}
