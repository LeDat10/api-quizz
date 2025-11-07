import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonStatus, LessonType } from '../enums/lesson.enum';

export class CreateLessonDto {
  @ApiProperty({
    example: 'Introduction to TypeScript',
    description: 'Title of the lesson',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    enum: LessonType,
    example: LessonType.CONTENT,
    description: 'Type of the lesson (content, quiz, or assignment)',
  })
  @IsEnum(LessonType)
  @IsOptional()
  lessonType?: LessonType;

  @ApiPropertyOptional({
    enum: LessonStatus,
    example: LessonStatus.DRAFT,
    description:
      'Status of the lesson (draft, published, inactive, or archived)',
  })
  @IsEnum(LessonStatus)
  @IsOptional()
  lessonStatus?: LessonStatus;

  @ApiPropertyOptional({
    example: 2,
    description: 'Position/order of the lesson within the chapter (optional)',
  })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiProperty({
    example: 5,
    description: 'Identifier of the chapter to which this lesson belongs',
  })
  @IsNumber()
  @IsNotEmpty()
  chapterId: number;
}
