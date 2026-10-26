import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService, type LoginResponse } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): LoginResponse {
    return this.auth.login(dto.email, dto.password);
  }
}
