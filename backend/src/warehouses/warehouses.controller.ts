import { Controller, Get, Post, Body, Patch, Param, UseGuards, UseInterceptors, Delete } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  create(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.warehousesService.create(companyId, data);
  }

  @Get()
  findAll(@CurrentTenant() companyId: string) {
    return this.warehousesService.findAll(companyId);
  }

  @Patch(':id')
  update(@CurrentTenant() companyId: string, @Param('id') id: string, @Body() data: any) {
    return this.warehousesService.update(companyId, id, data);
  }

  @Delete(':id')
  remove(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.warehousesService.remove(companyId, id);
  }
}
