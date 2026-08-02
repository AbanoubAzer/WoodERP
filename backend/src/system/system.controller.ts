import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('api/system/companies')
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly authService: AuthService
  ) {}

  @Get()
  getCompanies() {
    return this.systemService.getCompanies();
  }

  @Post()
  registerCompany(@Body() data: any) {
    return this.authService.registerCompany(data);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: 'ACTIVE' | 'SUSPENDED') {
    return this.systemService.updateCompanyStatus(id, status);
  }
}
