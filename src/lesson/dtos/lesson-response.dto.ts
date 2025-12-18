import { LessonType } from '../enums/lesson.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Lesson } from '../lesson.entity';
import { ContentLessonResponseDto } from 'src/content-lesson/dtos/content-lesson-response.dto';
import { Status } from 'src/common/status/enums/status.enum';

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

    switch (entity.lessonType) {
      case LessonType.CONTENT:
        this.data = entity.contentLesson
          ? ContentLessonResponseDto.fromEntity(entity.contentLesson)
          : null;
        break;

      default:
        break;
    }
  }

  @ApiProperty({
    example: '',
    description: 'Unique identifier of the lesson',
  })
  id: string;

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
    enum: Status,
    example: Status.DRAFT,
    description:
      'Status of the lesson: draft, published, inactive, or archived',
  })
  lessonStatus: Status;

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
  chapterId: string;

  @ApiProperty()
  data: ContentLessonResponseDto | null;

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
