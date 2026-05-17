import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'
import { VerificationService } from './verification.service'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

class RejectDto {
  @IsString()
  @IsNotEmpty()
  reason: string
}

@ApiTags('Verification')
@Controller('verification')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post(':listingId/generate-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar código de verificación para el listing' })
  async generateCode(
    @Param('listingId') listingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.verificationService.generateCode(listingId, user.id)
  }

  @Post(':listingId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar listing a revisión' })
  async submit(
    @Param('listingId') listingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.verificationService.submitForReview(listingId, user.id)
  }

  @Post(':listingId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar verificación (moderador/admin)' })
  async approve(
    @Param('listingId') listingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.verificationService.approveVerification(listingId, user.id)
  }

  @Post(':listingId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar verificación (moderador/admin)' })
  async reject(
    @Param('listingId') listingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RejectDto,
  ) {
    return this.verificationService.rejectVerification(listingId, user.id, dto.reason)
  }
}
