import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus } from '../enums/category-status.enum';
import { Category } from '../category.entity';

export class CategoryResponseDto {
  constructor(entity: Category) {
    this.id = entity.id;
    this.title = entity.title;
    this.description = entity.description;
    this.thumbnail = entity.thumbnail;
    this.status = entity.status;
    this.position = entity.position;
    this.slug = entity.slug;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    this.deletedAt = entity.createdAt;
  }

  @ApiProperty({ example: 1, description: 'Unique identifier of the category' })
  id: number;

  @ApiProperty({ example: 'Frontend Basics', description: 'Category title' })
  title: string;

  @ApiPropertyOptional({
    example: 'Introduction to HTML, CSS, and JavaScript',
    description: 'Optional description of the category',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/v12345/frontend.jpg',
    description: 'Optional thumbnail image URL of the category',
  })
  thumbnail?: string;

  @ApiProperty({
    enum: CategoryStatus,
    example: CategoryStatus.DRAFT,
    description: 'Status of the category (ACTIVE or INACTIVE)',
  })
  status: CategoryStatus;

  @ApiProperty({
    example: 1,
    description: 'Display order of the category',
  })
  position: number;

  @ApiProperty({
    example: 'introduction-to-nodejs',
    description: 'SEO-friendly slug for the chapter',
  })
  slug: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  static fromEntity(entity: Category): CategoryResponseDto {
    return new CategoryResponseDto(entity);
  }

  static fromEntities(entities: Category[]): CategoryResponseDto[] {
    return entities.map((e) => new CategoryResponseDto(e));
  }
}
