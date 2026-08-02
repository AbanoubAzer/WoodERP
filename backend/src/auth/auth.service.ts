import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async registerCompany(data: any) {
    const { companyName, ownerName, email, password } = data;

    // Check if email exists
    const existingUser = await this.prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const companyCode = `COMP-${Date.now().toString().slice(-6)}`;

    // Create Company, Owner User, Default Role, and Default Settings in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      const company = await prisma.company.create({
        data: {
          name: companyName,
          code: companyCode,
          email: email,
        }
      });

      await prisma.companySetting.create({
        data: { companyId: company.id }
      });

      const role = await prisma.role.create({
        data: {
          companyId: company.id,
          name: 'Owner',
          permissions: ['ALL'],
          isDefault: true,
        }
      });

      const user = await prisma.user.create({
        data: {
          companyId: company.id,
          email,
          passwordHash: hashedPassword,
          name: ownerName,
          roleId: role.id,
          isOwner: true,
        }
      });

      return { company, user };
    });

    return {
      message: 'Company registered successfully',
      companyId: result.company.id,
      userId: result.user.id
    };
  }

  async login(data: any) {
    const { email, password } = data;
    const user = await this.prisma.user.findFirst({ 
      where: { email },
      include: { company: true }
    });

    if (!user) {
      console.log('Login failed: User not found for email', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log('Login failed: Password mismatch for user', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      console.log('Login failed: User deactivated', email);
      throw new UnauthorizedException('User account is deactivated');
    }

    if (user.company.status !== 'ACTIVE') {
      throw new UnauthorizedException('Company account is suspended');
    }

    const payload = { sub: user.id, email: user.email, companyId: user.companyId };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: user.companyId,
        isSuperAdmin: user.isSuperAdmin
      }
    };
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    const hashed = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashed }
    });

    return { message: 'Password changed successfully' };
  }
}
