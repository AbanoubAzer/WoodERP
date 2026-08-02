import { Controller, Get, Post, Body, Patch, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  create(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.branchesService.create(companyId, data);
  }

  @Get()
  findAll(@CurrentTenant() companyId: string) {
    return this.branchesService.findAll(companyId);
  }

  @Get(':id')
  findOne(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.branchesService.findOne(companyId, id);
  }

  @Patch(':id')
  update(@CurrentTenant() companyId: string, @Param('id') id: string, @Body() data: any) {
    return this.branchesService.update(companyId, id, data);
  }

  @Patch(':id/activate')
  activate(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.branchesService.activate(companyId, id);
  }

  @Patch(':id/deactivate')
  deactivate(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.branchesService.deactivate(companyId, id);
  }
}
