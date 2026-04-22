import { IsString, IsIn, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @IsString()
  @IsIn(['oto', 'emlak'])
  listingType: 'oto' | 'emlak';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  listingTitle?: string;

  @IsString()
  @IsNotEmpty()
  sellerUserId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
