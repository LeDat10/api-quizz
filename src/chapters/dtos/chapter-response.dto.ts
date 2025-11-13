import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChapterStatus } from '../enums/chapter.enum';
import { Chapter } from '../chapter.entity';

export class ChapterResponseDto {
  constructor(entity: Chapter) {
    this.id = entity.id;
    this.title = entity.title;
    this.description = entity.description;
    this.status = entity.status;
    this.position = entity.position;
    this.slug = entity.slug;
    this.courseId = entity.course.id;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    this.deletedAt = entity.deletedAt;
  }
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the chapter',
  })
  id: number;

  @ApiProperty({
    example: 'Introduction to Node.js',
    description: 'Title of the chapter',
  })
  title: string;

  @ApiPropertyOptional({
    example: 'This chapter covers the basics of Node.js',
    description: 'Description of the chapter',
  })
  description?: string;

  @ApiProperty({
    enum: ChapterStatus,
    example: ChapterStatus.DRAFT,
    description: 'Current status of the chapter',
  })
  status: ChapterStatus;

  @ApiProperty({
    example: 1,
    description: 'Position/order of the chapter in the course',
  })
  position: number;

  @ApiProperty({
    example: 'introduction-to-nodejs',
    description: 'SEO-friendly slug for the chapter',
  })
  slug: string;

  @ApiProperty()
  courseId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  static fromEntity(entity: Chapter): ChapterResponseDto {
    return new ChapterResponseDto(entity);
  }

  static fromEntities(entities: Chapter[]): ChapterResponseDto[] {
    return entities.map((e) => new ChapterResponseDto(e));
  }
}
