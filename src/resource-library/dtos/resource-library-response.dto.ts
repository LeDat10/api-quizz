import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceLibrary } from '../resource-library.entity';

export class ResourceLibraryResponseDto {
  constructor(entity: ResourceLibrary) {
    this.id = entity.id;
    this.name = entity.name;
    this.description = entity.description;
    this.position = entity.position;
    this.slug = entity.slug;
    this.status = entity.status;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    this.deletedAt = entity.createdAt;
  }
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  position: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  static fromEntity(entity: ResourceLibrary): ResourceLibraryResponseDto {
    return new ResourceLibraryResponseDto(entity);
  }

  static fromEntities(
    entities: ResourceLibrary[],
  ): ResourceLibraryResponseDto[] {
    return entities.map((e) => new ResourceLibraryResponseDto(e));
  }
}
