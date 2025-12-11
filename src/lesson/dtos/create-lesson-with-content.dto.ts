import { IsNotEmpty, IsString } from 'class-validator';
import { BaseCreateLessonDto } from './base-create-lesson.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotBlank, Trim } from 'src/common/decorators';

export class CreateLessonWithContentDto extends BaseCreateLessonDto {
  @ApiProperty({
    example: 'This is the lesson content',
    description: 'The full text content of the lesson',
  })
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  content: string;
}
