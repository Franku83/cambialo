import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { KycService } from './kyc.service'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estado de verificación KYC del usuario autenticado' })
  async getStatus(@CurrentUser() user: { id: string }) {
    return this.kycService.getStatus(user.id)
  }

  @Post('submit')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar solicitud KYC con fotos' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'documentFront', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ], {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Solo se aceptan imágenes'), false)
        } else {
          cb(null, true)
        }
      },
    }),
  )
  async submit(
    @CurrentUser() user: { id: string },
    @UploadedFiles() files: { documentFront?: Express.Multer.File[]; selfie?: Express.Multer.File[] },
    @Body() body: { whatsappNumber?: string },
  ) {
    const docFile = files.documentFront?.[0]
    const selfieFile = files.selfie?.[0]

    if (!docFile) throw new BadRequestException('Se requiere foto del documento')
    if (!selfieFile) throw new BadRequestException('Se requiere selfie')
    if (!body.whatsappNumber?.trim()) throw new BadRequestException('Se requiere número de WhatsApp')

    return this.kycService.submit(
      user.id,
      docFile.buffer,
      selfieFile.buffer,
      docFile.mimetype,
      selfieFile.mimetype,
      body.whatsappNumber,
    )
  }

  @Get('pending')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista de solicitudes KYC pendientes (admin)' })
  async getPending(@CurrentUser() user: { id: string }) {
    return this.kycService.getPending(user.id)
  }

  @Post(':id/approve')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar solicitud KYC (admin)' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.kycService.approve(id, user.id)
  }

  @Post(':id/reject')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar solicitud KYC (admin)' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { reason: string },
  ) {
    return this.kycService.reject(id, user.id, body.reason)
  }
}
