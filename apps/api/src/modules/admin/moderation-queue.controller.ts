import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ModerationService } from './moderation.service'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { User } from '@supabase/supabase-js'

@ApiTags('Moderation')
@Controller('moderation')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ModerationQueueController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Cola de listings pendientes de verificación' })
  async getQueue(@CurrentUser() user: User) {
    return this.moderationService.getPendingVerifications(user.id)
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprobar listing' })
  async approve(@CurrentUser() user: User, @Param('id') id: string) {
    return this.moderationService.approveListing(id, user.id)
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rechazar listing' })
  async reject(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.moderationService.rejectListing(id, user.id, body.reason)
  }
}
