import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { WoodTypesService } from './wood-types.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/wood-types')
export class WoodTypesController {
  constructor(private readonly woodTypesService: WoodTypesService) {}

  @Post()
  create(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.woodTypesService.create(companyId, data);
  }

  @Get()
  findAll(@CurrentTenant() companyId: string) {
    return this.woodTypesService.findAll(companyId);
  }

  @Patch(':id')
  update(
    @CurrentTenant() companyId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.woodTypesService.update(companyId, id, data);
  }

  @Delete(':id')
  remove(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.woodTypesService.remove(companyId, id);
  }
}
