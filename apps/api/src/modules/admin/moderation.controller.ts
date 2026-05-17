import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'
import { ModerationService } from './moderation.service'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

class BanDto {
  @IsString()
  @IsNotEmpty()
  reason: string
}

@ApiTags('Admin')
@Controller('admin')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('verifications/pending')
  @ApiOperation({ summary: 'Listar listings pendientes de verificación (moderador/admin)' })
  async getPendingVerifications(@CurrentUser() user: { id: string }) {
    return this.moderationService.getPendingVerifications(user.id)
  }

  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Banear usuario (solo admin)' })
  async banUser(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: BanDto,
  ) {
    return this.moderationService.banUser(id, dto.reason, user.id)
  }
}
