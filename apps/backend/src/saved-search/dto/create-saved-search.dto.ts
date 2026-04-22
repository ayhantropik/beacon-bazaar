import { IsString, IsIn, IsObject, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsIn(['oto', 'emlak'])
  context: 'oto' | 'emlak';

  @IsObject()
  filters: Record<string, any>;
}
