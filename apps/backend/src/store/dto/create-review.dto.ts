import { IsInt, Min, Max, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5, description: 'Açıklama doğruluğu puanı' })
  @IsInt()
  @Min(1)
  @Max(5)
  descriptionAccuracy: number;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'İade kolaylığı puanı' })
  @IsInt()
  @Min(1)
  @Max(5)
  returnEase: number;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'Ürün-görsel uyumu puanı' })
  @IsInt()
  @Min(1)
  @Max(5)
  imageMatch: number;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'Teslimat tutarlılığı puanı' })
  @IsInt()
  @Min(1)
  @Max(5)
  deliveryConsistency: number;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'Soru-cevap hızı puanı' })
  @IsInt()
  @Min(1)
  @Max(5)
  qaSpeed: number;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'Sorun çözme başarısı puanı' })
  @IsInt()
  @Min(1)
  @Max(5)
  problemResolution: number;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({ description: 'Sipariş ID (teslim edilmiş sipariş gerekli)' })
  @IsOptional()
  @IsUUID()
  orderId?: string;
}
