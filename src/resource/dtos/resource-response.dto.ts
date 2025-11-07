import { ApiProperty } from '@nestjs/swagger';
import { ResourceType } from '../enums/resource-type.enum';
import { Resource } from '../entities/resource.entity';

export class ResourceResponseDto {
  constructor(entity: Resource) {
    this.id = entity.id;
    this.title = entity.title;
    this.url = entity.url;
    this.slug = entity.slug;
    this.position = entity.position;
    this.resourceType = entity.resourceType;
    this.libraryId = entity.library?.id;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    this.deletedAt = entity.deletedAt;
  }

  @ApiProperty() id: number;
  @ApiProperty() title: string;
  @ApiProperty() url: string;
  @ApiProperty() slug: string;
  @ApiProperty() position: number;
  @ApiProperty({ enum: ResourceType }) resourceType: ResourceType;
  @ApiProperty() libraryId: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() deletedAt: Date;
}
