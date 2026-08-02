import { Module } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { TreasuryController } from './treasury.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TreasuryController],
  providers: [TreasuryService],
})
export class TreasuryModule {}
