import { Module } from '@nestjs/common';
import { CompanySettingsService } from './company-settings.service';
import { CompanySettingsController } from './company-settings.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CompanySettingsController],
  providers: [CompanySettingsService],
})
export class CompanySettingsModule {}
