import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanySettingsService {
  constructor(private prisma: PrismaService) {}

  async findOne(companyId: string) {
    let settings = await this.prisma.companySetting.findUnique({
      where: { companyId }
    });

    // Auto-create defaults if they don't exist yet
    if (!settings) {
      settings = await this.prisma.companySetting.create({
        data: { companyId }
      });
    }
    return settings;
  }

  update(companyId: string, data: any) {
    return this.prisma.companySetting.update({
      where: { companyId },
      data
    });
  }
}
