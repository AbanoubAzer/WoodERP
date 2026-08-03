import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  getPaymentMethods(@CurrentTenant() companyId: string) {
    return this.paymentMethodsService.getPaymentMethods(companyId);
  }

  @Post()
  createPaymentMethod(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.paymentMethodsService.createPaymentMethod(companyId, data);
  }

  @Put(':id')
  updatePaymentMethod(@CurrentTenant() companyId: string, @Param('id') id: string, @Body() data: any) {
    return this.paymentMethodsService.updatePaymentMethod(companyId, id, data);
  }

  @Delete(':id')
  deletePaymentMethod(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.paymentMethodsService.deletePaymentMethod(companyId, id);
  }
}
