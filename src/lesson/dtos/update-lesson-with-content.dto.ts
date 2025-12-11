import { IsOptional, IsString } from 'class-validator';
import { BaseUpdateLessonDto } from './base-update-lesson.dto';

export class UdpateLessonWithContentDto extends BaseUpdateLessonDto {
  @IsOptional()
  @IsString()
  content?: string;
}
