import { IsString, IsOptional, IsArray, IsNumber, IsIn, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'Tekno Market' })
  @IsString()
  @MinLength(2, { message: 'Mağaza adı en az 2 karakter olmalı' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'En iyi teknoloji ürünleri' })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ example: 'shopping', enum: ['shopping', 'automotive', 'realestate', 'food'] })
  @IsOptional()
  @IsString()
  @IsIn(['shopping', 'automotive', 'realestate', 'food', 'producer'], { message: 'Geçersiz mağaza tipi' })
  storeType?: 'shopping' | 'automotive' | 'realestate' | 'food' | 'producer';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: ['Elektronik', 'Teknoloji'] })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @ApiPropertyOptional({ example: 41.0082 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 28.9784 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  address?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  contactInfo?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  openingHours?: Record<string, unknown>[];
}
