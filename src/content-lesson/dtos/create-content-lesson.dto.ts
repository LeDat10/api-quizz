import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { IsNotBlank, Trim } from 'src/common/decorators';

export class CreateContentLessonDto {
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @Trim()
  content: string;

  @IsNumber()
  @IsNotEmpty()
  lessonId: number;
}
