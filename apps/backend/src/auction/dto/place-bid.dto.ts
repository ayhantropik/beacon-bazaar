import { IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceBidDto {
  @ApiProperty({ description: 'Açık artırma ürün ID' })
  @IsUUID()
  auctionItemId: string;

  @ApiProperty({ description: 'Teklif fiyatı (TRY)', example: 150.00 })
  @IsNumber()
  @Min(1)
  bidPrice: number;

  @ApiProperty({ description: 'Teklif edilen adet', example: 1 })
  @IsNumber()
  @Min(1)
  bidQuantity: number;
}
