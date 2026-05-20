import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar usuarios por username (para mark-sold modal)' })
  async searchUsers(@Query('q') q: string) {
    return this.usersService.searchByUsername(q)
  }

  @Get(':username')
  @ApiOperation({ summary: 'Obtener perfil público de un usuario' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.findPublicProfile(username)
  }

  @Put('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar perfil propio' })
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, dto)
  }

  @Post('me/identity-verification')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir documentos de verificación de identidad (KYC)' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'idDocument', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  async uploadKyc(
    @CurrentUser() user: { id: string },
    @UploadedFiles()
    files: {
      idDocument?: { buffer: Buffer; mimetype: string }[]
      selfie?: { buffer: Buffer; mimetype: string }[]
    },
  ) {
    if (!files.idDocument?.[0] || !files.selfie?.[0]) {
      return { error: 'Se requieren ambos archivos: documento de identidad y selfie' }
    }

    return this.usersService.startKycVerification(user.id, {
      idDocument: files.idDocument[0],
      selfie: files.selfie[0],
    })
  }
}
