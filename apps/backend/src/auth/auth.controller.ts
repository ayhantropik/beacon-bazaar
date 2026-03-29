import { Controller, Post, Put, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Kullanıcı girişi' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Token yenileme' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Çıkış' })
  async logout() {
    return { success: true, message: 'Çıkış başarılı' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil bilgilerini getir' })
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil bilgilerini güncelle' })
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: { name?: string; surname?: string; phone?: string },
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Post('social-login')
  @ApiOperation({ summary: 'Sosyal medya ile giriş' })
  async socialLogin(@Body() dto: { provider: string; email: string; name?: string; surname?: string; avatar?: string }) {
    return this.authService.socialLogin(dto.provider, dto);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Şifre değiştir' })
  async changePassword(
    @Request() req: { user: { id: string } },
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }
}
