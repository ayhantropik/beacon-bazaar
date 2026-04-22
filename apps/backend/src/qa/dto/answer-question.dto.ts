import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
