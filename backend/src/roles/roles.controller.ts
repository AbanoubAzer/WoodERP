import { Controller, Get, Post, Body, Patch, Param, UseGuards, UseInterceptors, Delete } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.rolesService.create(companyId, data);
  }

  @Get()
  findAll(@CurrentTenant() companyId: string) {
    return this.rolesService.findAll(companyId);
  }

  @Patch(':id')
  update(@CurrentTenant() companyId: string, @Param('id') id: string, @Body() data: any) {
    return this.rolesService.update(companyId, id, data);
  }

  @Delete(':id')
  remove(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.rolesService.remove(companyId, id);
  }
}
