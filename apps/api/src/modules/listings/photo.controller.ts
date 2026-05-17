import {
  Controller,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { IsArray, IsString } from 'class-validator'
import { PhotoService } from './photo.service'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  order: string[]
}

@ApiTags('Listing Photos')
@Controller('listings')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post(':id/photos')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir foto a un listing' })
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async upload(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
    @Query('isVerification') isVerification?: string,
  ) {
    return this.photoService.uploadPhoto(
      id,
      user.id,
      { buffer: file.buffer, mimetype: file.mimetype },
      isVerification === 'true',
    )
  }

  @Delete(':id/photos/:photoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar foto de un listing' })
  async deletePhoto(
    @Param('id') _id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.photoService.deletePhoto(photoId, user.id)
  }

  @Patch(':id/photos/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reordenar fotos del listing' })
  async reorder(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReorderDto,
  ) {
    return this.photoService.reorderPhotos(id, user.id, dto.order)
  }

  @Patch(':id/photos/:photoId/cover')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar foto como portada' })
  async setCover(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.photoService.setCover(photoId, id, user.id)
  }
}
