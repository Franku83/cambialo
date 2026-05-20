import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { User } from '@supabase/supabase-js'

type UserRole = 'user' | 'moderator' | 'admin' | 'owner'

@ApiTags('Admin')
@Controller('admin')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Users ────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'Listar usuarios con búsqueda y filtros' })
  async listUsers(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listUsers(
      page ? Number(page) : 1,
      limit ? Math.min(Number(limit), 100) : 50,
      search,
      status,
    )
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Detalle completo de usuario' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id)
  }

  @Post('users/:id/roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar rol a usuario' })
  async assignRole(
    @CurrentUser() user: User,
    @Param('id') targetId: string,
    @Body() body: { role: UserRole },
  ) {
    return this.adminService.assignRole(user.id, targetId, body.role)
  }

  @Delete('users/:id/roles/:role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar rol a usuario' })
  async removeRole(
    @CurrentUser() user: User,
    @Param('id') targetId: string,
    @Param('role') role: string,
  ) {
    return this.adminService.removeRole(user.id, targetId, role as UserRole)
  }

  @Patch('users/:id/username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar username de un usuario' })
  async changeUsername(
    @CurrentUser() user: User,
    @Param('id') targetId: string,
    @Body() body: { username: string },
  ) {
    return this.adminService.changeUsername(user.id, targetId, body.username)
  }

  @Post('users/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar manualmente a un usuario sin KYC' })
  async verifyUser(@CurrentUser() user: User, @Param('id') targetId: string) {
    return this.adminService.verifyUser(user.id, targetId)
  }

  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspender usuario temporalmente' })
  async suspendUser(
    @CurrentUser() user: User,
    @Param('id') targetId: string,
    @Body() body: { reason: string; days: number },
  ) {
    return this.adminService.suspendUser(user.id, targetId, body.reason, body.days)
  }

  @Post('users/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Levantar suspensión' })
  async unsuspendUser(@CurrentUser() user: User, @Param('id') targetId: string) {
    return this.adminService.unsuspendUser(user.id, targetId)
  }

  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Banear usuario permanentemente' })
  async banUser(
    @CurrentUser() user: User,
    @Param('id') targetId: string,
    @Body() body: { reason: string },
  ) {
    return this.adminService.banUser(user.id, targetId, body.reason)
  }

  @Post('users/:id/unban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desbanear usuario' })
  async unbanUser(@CurrentUser() user: User, @Param('id') targetId: string) {
    return this.adminService.unbanUser(user.id, targetId)
  }

  @Delete('users/:userId/listings/:listingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar listing de un usuario' })
  async deleteUserListing(
    @CurrentUser() user: User,
    @Param('listingId') listingId: string,
  ) {
    return this.adminService.deleteUserListing(user.id, listingId)
  }

  // ─── Owner-only ────────────────────────────────────────────────────────────

  @Get('owner/metrics')
  @ApiOperation({ summary: 'Métricas globales de la plataforma (owner)' })
  async getMetrics(@CurrentUser() user: User) {
    return this.adminService.getMetrics(user.id)
  }

  @Get('owner/audit-log')
  @ApiOperation({ summary: 'Log de acciones de admins y mods (owner)' })
  async getAuditLog(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLog(user.id, Number(page ?? 1), Number(limit ?? 50))
  }

  @Get('owner/config')
  @ApiOperation({ summary: 'Configuración global de la plataforma (owner)' })
  async getConfig(@CurrentUser() user: User) {
    return this.adminService.getPlatformConfig(user.id)
  }

  @Put('owner/config/:key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar valor de configuración (owner)' })
  async updateConfig(
    @CurrentUser() user: User,
    @Param('key') key: string,
    @Body() body: { value: string },
  ) {
    return this.adminService.updatePlatformConfig(user.id, key, body.value)
  }
}
