import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator'
import { FraudReportsService } from './fraud-reports.service'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

class CreateFraudReportDto {
  @IsString() reportedUserId: string
  @IsString() @IsOptional() listingId?: string
  @IsString() reason: string
  @IsArray() @IsOptional() evidenceUrls?: string[]
}

class UpdateFraudReportDto {
  @IsEnum(['open','reviewing','resolved','dismissed']) status: string
  @IsString() @IsOptional() adminNotes?: string
}

@ApiTags('Fraud Reports')
@Controller()
export class FraudReportsController {
  constructor(private readonly fraudReportsService: FraudReportsService) {}

  @Post('fraud-reports')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear reporte de fraude' })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateFraudReportDto) {
    return this.fraudReportsService.create(user.id, dto)
  }

  @Get('admin/fraud-reports')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar reportes (moderadores)' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.fraudReportsService.findAll(Number(page), Number(limit))
  }

  @Patch('admin/fraud-reports/:id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar status de reporte' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateFraudReportDto,
  ) {
    return this.fraudReportsService.updateStatus(id, user.id, dto.status, dto.adminNotes)
  }
}
