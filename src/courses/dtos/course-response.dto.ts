import { Course } from '../course.entity';
import { CourseStatus, TypeCourse } from '../enums/type-course.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseResponseDto {
  constructor(entity: Course) {
    this.id = entity.id;
    this.title = entity.title;
    this.description = entity.description;
    this.thumbnail = entity.thumbnail;
    this.typeCourse = entity.typeCourse;
    this.status = entity.status;
    this.position = entity.position;
    this.slug = entity.slug;
    this.categoryId = entity.category?.id;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    this.deletedAt = entity.createdAt;
  }

  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the course',
  })
  id: number;

  @ApiProperty({
    example: 'Node.js Basics',
    description: 'Course title',
  })
  title: string;

  @ApiPropertyOptional({
    example: 'Learn Node.js from scratch',
    description: 'Detailed description of the course',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/thumbnail.png',
    description: 'Thumbnail image URL of the course',
  })
  thumbnail?: string;

  @ApiProperty({
    enum: TypeCourse,
    example: TypeCourse.FREE,
    description: 'Type of course (free)',
  })
  typeCourse: TypeCourse;

  @ApiProperty({
    enum: CourseStatus,
    example: CourseStatus.DRAFT,
    description: 'Status of the course',
  })
  status: CourseStatus;

  @ApiProperty({
    example: 1,
    description: 'Position of the course in the list (used for ordering)',
  })
  position: number;

  @ApiProperty({
    example: 'nodejs-basics',
    description: 'SEO-friendly slug of the course',
  })
  slug: string;

  @ApiProperty()
  categoryId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  static fromEntity(entity: Course): CourseResponseDto {
    return new CourseResponseDto(entity);
  }

  static fromEntities(entities: Course[]): CourseResponseDto[] {
    return entities.map((e) => new CourseResponseDto(e));
  }
}
