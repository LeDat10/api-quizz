import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LessonStatus, LessonType } from '../enums/lesson.enum';

export class UpdateLessonDto {
  @ApiPropertyOptional({
    example: 'Advanced TypeScript Concepts',
    description: 'Updated title of the lesson (optional)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    enum: LessonType,
    example: LessonType.QUIZ,
    description: 'Updated lesson type (content, quiz, or assignment)',
  })
  @IsEnum(LessonType)
  @IsOptional()
  lessonType?: LessonType;

  @ApiPropertyOptional({
    enum: LessonStatus,
    example: LessonStatus.PUBLISHED,
    description:
      'Updated lesson status (draft, published, inactive, or archived)',
  })
  @IsEnum(LessonStatus)
  @IsOptional()
  lessonStatus?: LessonStatus;

  @ApiPropertyOptional({
    example: 3,
    description: 'Updated position/order of the lesson in the chapter',
  })
  @IsInt()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({
    example: 8,
    description:
      'Updated chapter ID if the lesson needs to be moved to another chapter',
  })
  @IsInt()
  @IsOptional()
  chapterId?: number;
}
