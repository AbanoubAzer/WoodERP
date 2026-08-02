import { Controller, Get, Post, Put, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { InstallmentsService } from './installments.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/installments')
export class InstallmentsController {
  constructor(private readonly installmentsService: InstallmentsService) {}

  @Post('plans')
  createPlan(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.installmentsService.createPlan(companyId, data);
  }

  @Get('plans')
  findAllPlans(@CurrentTenant() companyId: string) {
    return this.installmentsService.findAllPlans(companyId);
  }

  @Get('plans/:id')
  findOnePlan(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.installmentsService.findOnePlan(companyId, id);
  }

  @Put('plans/:id/notes')
  async updatePlanNotes(@Param('id') id: string, @Body() body: { notes: string }) {
    return this.installmentsService.updatePlanNotes(id, body.notes);
  }

  @Post(':id/pay')
  payInstallment(
    @CurrentTenant() companyId: string, 
    @Param('id') id: string,
    @Body() data: any
  ) {
    return this.installmentsService.payInstallment(companyId, id, data);
  }

  @Post('plans/:id/settle')
  settlePlanEarly(
    @CurrentTenant() companyId: string, 
    @Param('id') planId: string,
    @Body() data: any
  ) {
    return this.installmentsService.settlePlanEarly(companyId, planId, data);
  }
}
