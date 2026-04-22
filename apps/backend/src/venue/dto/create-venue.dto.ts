import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVenueDto {
  @ApiProperty({ description: 'Venue adı' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Açıklama' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Adres' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Şehir' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Enlem' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Boylam' })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'Görsel URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Kat bilgileri (JSONB)' })
  @IsOptional()
  @IsArray()
  floors?: any[];

  @ApiPropertyOptional({ description: 'Beacon listesi (JSONB)' })
  @IsOptional()
  @IsArray()
  beacons?: any[];

  @ApiPropertyOptional({ description: 'Aktif mi?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVenueDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() floors?: any[];
  @ApiPropertyOptional() @IsOptional() @IsArray() beacons?: any[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class AddBeaconDto {
  @ApiProperty() @IsString() id: string;
  @ApiProperty() @IsString() uuid: string;
  @ApiProperty() @IsNumber() major: number;
  @ApiProperty() @IsNumber() minor: number;
  @ApiProperty() @IsNumber() latitude: number;
  @ApiProperty() @IsNumber() longitude: number;
  @ApiProperty() @IsNumber() floor: number;
  @ApiProperty() @IsNumber() txPower: number;
  @ApiPropertyOptional() @IsOptional() @IsString() storeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() storeName?: string;
}
