import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    const { email, password, branchIds, ...rest } = data;
    
    const existing = await this.prisma.user.findFirst({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        companyId,
        email,
        passwordHash: hashedPassword,
        ...rest,
        branches: branchIds ? {
          connect: branchIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        role: true,
        branches: true
      }
    });
  }

  async findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      include: {
        role: true,
        branches: true
      }
    });
  }

  async findOne(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      include: { role: true, branches: true }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(companyId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    const { branchIds, password, ...rest } = data;

    let updateData: any = { ...rest };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        branches: branchIds ? {
          set: branchIds.map((id: string) => ({ id }))
        } : undefined
      },
    });
  }

  async activate(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async deactivate(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
