import { LessonStatus, LessonType } from '../enums/lesson.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Lesson } from '../lesson.entity';

export class LessonResponseDto {
  constructor(entity: Lesson) {
    this.id = entity.id;
    this.title = entity.title;
    this.lessonType = entity.lessonType;
    this.lessonStatus = entity.lessonStatus;
    this.position = entity.position;
    this.slug = entity.slug;
    this.chapterId = entity.chapter.id;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    this.deletedAt = entity.deletedAt;
  }

  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the lesson',
  })
  id: number;

  @ApiProperty({
    example: 'Introduction to ReactJS',
    description: 'Title of the lesson',
  })
  title: string;

  @ApiProperty({
    enum: LessonType,
    example: LessonType.CONTENT,
    description: 'Type of the lesson: content, quiz, or assignment',
  })
  lessonType: LessonType;

  @ApiProperty({
    enum: LessonStatus,
    example: LessonStatus.PUBLISHED,
    description:
      'Status of the lesson: draft, published, inactive, or archived',
  })
  lessonStatus: LessonStatus;

  @ApiProperty({
    example: 1,
    description: 'Order position of the lesson within the chapter',
  })
  position: number;

  @ApiProperty({
    example: 'introduction-to-reactjs',
    description: 'Unique slug used for SEO-friendly URLs',
  })
  slug: string;

  @ApiProperty({
    example: 5,
    description: 'Identifier of the chapter that this lesson belongs to',
  })
  chapterId: number;

  @ApiProperty({
    example: '2025-10-28T08:45:00.000Z',
    description: 'Date and time when the lesson was created',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    example: '2025-10-29T10:12:00.000Z',
    description: 'Date and time when the lesson was last updated (if any)',
  })
  updatedAt?: Date;

  @ApiPropertyOptional({
    example: '2025-11-01T08:00:00.000Z',
    description: 'Date and time when the lesson was soft deleted (if any)',
  })
  deletedAt?: Date;

  static fromEntity(entity: Lesson): LessonResponseDto {
    return new LessonResponseDto(entity);
  }

  static fromEntities(entities: Lesson[]): LessonResponseDto[] {
    return entities.map((e) => new LessonResponseDto(e));
  }
}
