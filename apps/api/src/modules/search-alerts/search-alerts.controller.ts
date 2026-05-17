import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { SearchAlertsService } from './search-alerts.service'
import { CreateSearchAlertDto } from './dto/create-search-alert.dto'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Search Alerts')
@Controller('search-alerts')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class SearchAlertsController {
  constructor(private readonly searchAlertsService: SearchAlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mis alertas de búsqueda' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.searchAlertsService.findForUser(user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Crear alerta de búsqueda' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateSearchAlertDto) {
    return this.searchAlertsService.create(user.id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar alerta de búsqueda' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.searchAlertsService.delete(id, user.id)
  }
}
