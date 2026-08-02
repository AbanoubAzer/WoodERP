import { Controller, Post, Body, HttpCode, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-company')
  register(@Body() body: any) {
    return this.authService.registerCompany(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(@Request() req: any, @Body() body: any) {
    return this.authService.changePassword(req.user.sub, body.oldPassword, body.newPassword);
  }
}
