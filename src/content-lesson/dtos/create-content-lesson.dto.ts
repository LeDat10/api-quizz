import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { IsNotBlank, Trim } from 'src/common/decorators';

export class CreateContentLessonDto {
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @Trim()
  content: string;

  @IsUUID('4')
  @IsNotEmpty()
  lessonId: string;
}
