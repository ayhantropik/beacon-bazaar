import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../database/entities';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, data: { user: userWithoutPassword, tokens } };
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({ ...dto, password: hashedPassword });
    const saved = await this.userRepo.save(user);
    const tokens = await this.generateTokens(saved.id, saved.email, saved.role);
    const { password: _, ...userWithoutPassword } = saved;
    return { success: true, data: { user: userWithoutPassword, tokens } };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const tokens = await this.generateTokens(payload.sub, payload.email, payload.role);
      return { success: true, data: tokens };
    } catch {
      throw new UnauthorizedException('Geçersiz refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);
    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
