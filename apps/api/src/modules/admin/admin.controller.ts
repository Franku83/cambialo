import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
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

  @Get('users')
  @ApiOperation({ summary: 'Listar todos los usuarios (admin/owner)' })
  async listUsers(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers(
      page ? Number(page) : 1,
      limit ? Math.min(Number(limit), 100) : 50,
    )
  }

  @Post('users/:id/roles')
  @ApiOperation({ summary: 'Asignar rol a usuario' })
  async assignRole(
    @CurrentUser() user: User,
    @Param('id') targetId: string,
    @Body() body: { role: UserRole },
  ) {
    return this.adminService.assignRole(user.id, targetId, body.role)
  }

  @Delete('users/:id/roles/:role')
  @ApiOperation({ summary: 'Quitar rol a usuario' })
  async removeRole(
    @CurrentUser() user: User,
    @Param('id') targetId: string,
    @Param('role') role: string,
  ) {
    return this.adminService.removeRole(user.id, targetId, role as UserRole)
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Detalle de usuario' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id)
  }
}
