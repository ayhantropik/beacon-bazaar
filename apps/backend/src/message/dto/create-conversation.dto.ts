import { IsString, IsOptional, IsIn, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  sellerUserId: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['oto', 'emlak', 'product'])
  listingType?: 'oto' | 'emlak' | 'product';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  listingTitle?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
