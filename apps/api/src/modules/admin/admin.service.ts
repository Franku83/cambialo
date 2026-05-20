import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common'
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

  private async assertOwnerOrAdmin(userId: string) {
    const ok = await this.isOwnerOrAdmin(userId)
    if (!ok) throw new ForbiddenException('Se requiere rol de admin u owner')
  }

  private async assertOwner(userId: string) {
    const role = await this.prisma.userRole_Assignment.findFirst({
      where: { userId, role: 'owner' },
    })
    if (!role) throw new ForbiddenException('Solo el owner puede realizar esta acción')
  }

  async listUsers(page = 1, limit = 50, search?: string, status?: string) {
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = {}

    if (search) {
      where['OR'] = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status === 'banned') where['isBanned'] = true
    if (status === 'suspended') where['isSuspended'] = true

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
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
          kycStatus: true,
          isBanned: true,
          isSuspended: true,
          suspendedUntil: true,
          reputationScore: true,
          totalSales: true,
          createdAt: true,
          roles: { select: { role: true } },
          _count: { select: { listings: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ])
    return { users, total, page, limit }
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
        kycStatus: true,
        isBanned: true,
        banReason: true,
        isSuspended: true,
        suspendedUntil: true,
        suspendReason: true,
        reputationScore: true,
        totalSales: true,
        totalPurchases: true,
        createdAt: true,
        roles: { select: { role: true } },
        listings: {
          where: { status: 'active' },
          select: { id: true, priceUsd: true, status: true, verificationStatus: true,
            deviceModel: { select: { brand: true, modelName: true } } },
          take: 10,
        },
        _count: { select: { listings: true, reviewsReceived: true } },
      },
    })
    if (!user) throw new NotFoundException('Usuario no encontrado')
    return user
  }

  async assignRole(adminId: string, targetUserId: string, role: UserRole) {
    if (role === 'owner') throw new ForbiddenException('El rol owner no puede asignarse por UI')
    await this.assertOwnerOrAdmin(adminId)

    // Solo owner puede asignar admin/moderator
    if (['admin', 'moderator'].includes(role)) {
      await this.assertOwner(adminId)
    }

    await this.prisma.userRole_Assignment.upsert({
      where: { userId_role: { userId: targetUserId, role } },
      create: { userId: targetUserId, role, grantedBy: adminId },
      update: { grantedBy: adminId },
    })

    // Usuarios con rol elevado quedan auto-verificados — no necesitan KYC
    if (['moderator', 'admin', 'owner'].includes(role)) {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: { idVerified: true, kycStatus: 'approved' },
      })
    }

    await this.auditLog(adminId, 'role.assign', targetUserId, 'user', { role })
    return { ok: true }
  }

  async removeRole(adminId: string, targetUserId: string, role: UserRole) {
    if (role === 'owner') throw new ForbiddenException('El rol owner no puede removerse por UI')
    await this.assertOwnerOrAdmin(adminId)

    await this.prisma.userRole_Assignment.deleteMany({
      where: { userId: targetUserId, role },
    })

    await this.auditLog(adminId, 'role.remove', targetUserId, 'user', { role })
    return { ok: true }
  }

  async suspendUser(adminId: string, userId: string, reason: string, days: number) {
    await this.assertOwnerOrAdmin(adminId)

    const suspendedUntil = new Date(Date.now() + days * 86_400_000)
    await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true, suspendedUntil, suspendReason: reason },
    })

    await this.auditLog(adminId, 'user.suspend', userId, 'user', { reason, days })
    return { suspended: true, until: suspendedUntil }
  }

  async unsuspendUser(adminId: string, userId: string) {
    await this.assertOwnerOrAdmin(adminId)

    await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false, suspendedUntil: null, suspendReason: null },
    })

    await this.auditLog(adminId, 'user.unsuspend', userId, 'user', {})
    return { unsuspended: true }
  }

  async banUser(adminId: string, userId: string, reason: string) {
    await this.assertOwnerOrAdmin(adminId)

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    if (!user) throw new NotFoundException('Usuario no encontrado')

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { isBanned: true, banReason: reason },
      }),
      this.prisma.listing.updateMany({
        where: { sellerId: userId, status: { in: ['active', 'paused'] } },
        data: { status: 'removed' },
      }),
      this.prisma.bannedEmail.upsert({
        where: { email: user.email },
        create: { email: user.email, reason },
        update: { reason },
      }),
    ])

    await this.auditLog(adminId, 'user.ban', userId, 'user', { reason })
    return { banned: true }
  }

  async unbanUser(adminId: string, userId: string) {
    await this.assertOwnerOrAdmin(adminId)

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, banReason: null },
    })

    await this.auditLog(adminId, 'user.unban', userId, 'user', {})
    return { unbanned: true }
  }

  async changeUsername(adminId: string, userId: string, username: string) {
    await this.assertOwnerOrAdmin(adminId)

    const clean = username.trim().toLowerCase()
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(clean)) {
      throw new BadRequestException('Username inválido: 3-20 caracteres, solo letras, números y _')
    }

    const existing = await this.prisma.user.findFirst({ where: { username: clean } })
    if (existing && existing.id !== userId) {
      throw new ConflictException('Ese username ya está en uso')
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { username: clean },
    })

    await this.auditLog(adminId, 'user.username_change', userId, 'user', { username: clean })
    return { ok: true, username: clean }
  }

  async verifyUser(adminId: string, userId: string) {
    await this.assertOwnerOrAdmin(adminId)

    await this.prisma.user.update({
      where: { id: userId },
      data: { idVerified: true, kycStatus: 'approved' },
    })

    await this.auditLog(adminId, 'user.verify_manual', userId, 'user', {})
    return { verified: true }
  }

  async deleteUserListing(adminId: string, listingId: string) {
    await this.assertOwnerOrAdmin(adminId)

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'removed' },
    })

    await this.auditLog(adminId, 'listing.delete', listingId, 'listing', {})
    return { deleted: true }
  }

  // ─── Owner-only ────────────────────────────────────────────────────────────

  async getAuditLog(ownerId: string, page = 1, limit = 50) {
    await this.assertOwner(ownerId)

    const skip = (page - 1) * limit
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ])
    return { logs, total, page, limit }
  }

  async getMetrics(ownerId: string) {
    await this.assertOwner(ownerId)

    const [totalUsers, verifiedUsers, totalListings, activeListings, totalSales] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { idVerified: true } }),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: 'active' } }),
      this.prisma.listing.count({ where: { status: 'sold' } }),
    ])

    return { totalUsers, verifiedUsers, totalListings, activeListings, totalSales }
  }

  async getPlatformConfig(ownerId: string) {
    await this.assertOwner(ownerId)
    return this.prisma.platformConfig.findMany()
  }

  async updatePlatformConfig(ownerId: string, key: string, value: string) {
    await this.assertOwner(ownerId)

    const config = await this.prisma.platformConfig.upsert({
      where: { key },
      create: { key, value, updatedBy: ownerId },
      update: { value, updatedBy: ownerId },
    })

    await this.auditLog(ownerId, 'config.update', key, 'config', { value })
    return config
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private async auditLog(
    actorId: string,
    action: string,
    targetId: string,
    targetType: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any,
  ) {
    const role = await this.prisma.userRole_Assignment.findFirst({
      where: { userId: actorId, role: { in: ['owner', 'admin', 'moderator'] } },
      orderBy: { role: 'asc' },
    })

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorRole: role?.role ?? 'user',
        action,
        targetId,
        targetType,
        metadata,
      },
    }).catch(() => null) // fire-and-forget, nunca bloquear
  }
}
