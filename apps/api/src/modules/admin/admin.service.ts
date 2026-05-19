import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/database/prisma.service'

type UserRole = 'user' | 'moderator' | 'admin' | 'owner'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async isOwnerOrAdmin(userId: string): Promise<boolean> {
    const roles = await this.prisma.userRole_Assignment.findMany({
      where: { userId, role: { in: ['owner', 'admin'] } },
    })
    return roles.length > 0
  }

  async listUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          idVerified: true,
          isBanned: true,
          createdAt: true,
          roles: {
            select: { role: true, createdAt: true },
          },
        },
      }),
      this.prisma.user.count(),
    ])
    return { users, total, page, limit }
  }

  async assignRole(adminId: string, targetUserId: string, role: UserRole) {
    const isAuthorized = await this.isOwnerOrAdmin(adminId)
    if (!isAuthorized) throw new ForbiddenException('Sin permisos')

    await this.prisma.userRole_Assignment.upsert({
      where: { userId_role: { userId: targetUserId, role } },
      create: { userId: targetUserId, role, grantedBy: adminId },
      update: { grantedBy: adminId },
    })
    return { ok: true }
  }

  async removeRole(adminId: string, targetUserId: string, role: UserRole) {
    const isAuthorized = await this.isOwnerOrAdmin(adminId)
    if (!isAuthorized) throw new ForbiddenException('Sin permisos')

    await this.prisma.userRole_Assignment.deleteMany({
      where: { userId: targetUserId, role },
    })
    return { ok: true }
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        idVerified: true,
        isBanned: true,
        createdAt: true,
        roles: { select: { role: true } },
      },
    })
    if (!user) throw new NotFoundException('Usuario no encontrado')
    return user
  }
}
