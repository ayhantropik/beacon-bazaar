import { IsString, IsIn, MinLength } from 'class-validator';

export class BroadcastNotificationDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsString()
  @IsIn(['system', 'promotion'])
  type: string;
}
