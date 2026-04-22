import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserEntity } from '../database/entities';
import { EmailService } from '../common/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Hesabınız henüz onaylanmamış. Lütfen e-posta adresinize gönderilen onay linkine tıklayın.');
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
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      isActive: false,
      preferences: { verificationToken, verified: false },
    });
    const saved = await this.userRepo.save(user);

    // Onay maili gönder
    await this.emailService.sendVerificationEmail(
      saved.email,
      saved.name,
      verificationToken,
      'user',
    );

    const { password: _, ...userWithoutPassword } = saved;
    return {
      success: true,
      message: 'Kayıt başarılı! E-posta adresinize gönderilen onay linkine tıklayarak hesabınızı aktifleştirin.',
      data: { user: userWithoutPassword },
    };
  }

  async verifyEmail(token: string) {
    if (!token) return { success: false, message: 'Token gerekli' };
    const users = await this.userRepo.find();
    const user = users.find((u: any) => u.preferences?.verificationToken === token);
    if (!user) return { success: false, message: 'Geçersiz veya süresi dolmuş onay bağlantısı' };

    await this.userRepo.update(user.id, {
      isActive: true,
      preferences: { ...(user as any).preferences, verified: true, verificationToken: null } as any,
    });
    return { success: true, message: 'Hesabınız onaylandı! Artık giriş yapabilirsiniz.' };
  }

  async resendVerification(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');
    if (user.isActive) return { success: true, message: 'Hesabınız zaten aktif.' };

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.userRepo.update(user.id, {
      preferences: { ...(user as any).preferences, verificationToken } as any,
    });

    await this.emailService.sendVerificationEmail(user.email, user.name, verificationToken, 'user');
    return { success: true, message: 'Onay e-postası tekrar gönderildi.' };
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

  async updateProfile(userId: string, dto: { name?: string; surname?: string; phone?: string }) {
    await this.userRepo.update(userId, dto);
    return this.getProfile(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new UnauthorizedException('Mevcut şifre hatalı');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(userId, { password: hashedPassword });
    return { success: true, message: 'Şifre değiştirildi' };
  }

  async socialLogin(provider: string, payload: { email: string; name?: string; surname?: string; avatar?: string }) {
    let user = await this.userRepo.findOne({ where: { email: payload.email } });
    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 12);
      user = this.userRepo.create({
        email: payload.email,
        password: randomPassword,
        name: payload.name || provider,
        surname: payload.surname || 'User',
        avatar: payload.avatar || undefined,
        isActive: true, // Sosyal giriş ile doğrulanmış kabul edilir
        preferences: { verified: true },
      });
      user = await this.userRepo.save(user);
    }
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, data: { user: userWithoutPassword, tokens, provider } };
  }

  // Eski endpoint uyumluluğu için
  async verifyStoreOwner(token: string) {
    return this.verifyEmail(token);
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
