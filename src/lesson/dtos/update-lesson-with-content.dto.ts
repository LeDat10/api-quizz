import { IsNotEmpty, IsString } from 'class-validator';
import { BaseUpdateLessonDto } from './base-update-lesson.dto';
import { IsNotBlank, Trim } from 'src/common/decorators';

export class UdpateLessonWithContentDto extends BaseUpdateLessonDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @IsNotBlank()
  content: string;
}
