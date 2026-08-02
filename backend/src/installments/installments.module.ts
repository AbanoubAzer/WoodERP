import { Module } from '@nestjs/common';
import { InstallmentsService } from './installments.service';
import { InstallmentsController } from './installments.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [InstallmentsController],
  providers: [InstallmentsService],
})
export class InstallmentsModule {}
