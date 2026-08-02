import { Controller, Get, Post, Patch, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@CurrentTenant() companyId: string, @CurrentUser() user: any) {
    return this.notificationsService.getNotifications(companyId, user.sub);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentTenant() companyId: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, companyId, user.sub);
  }

  @Post('trigger-low-stock')
  triggerLowStockAlerts(@CurrentTenant() companyId: string) {
    return this.notificationsService.triggerLowStockAlerts(companyId);
  }
}
