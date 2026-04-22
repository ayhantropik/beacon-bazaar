import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta girin' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalı' })
  password: string;

  @ApiProperty({ example: 'Ahmet' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Yılmaz' })
  @IsString()
  surname: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'customer', enum: ['customer', 'store_owner'] })
  @IsOptional()
  @IsIn(['customer', 'store_owner'], { message: 'Geçersiz rol' })
  role?: 'customer' | 'store_owner';
}
