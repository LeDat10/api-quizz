import { ApiProperty } from '@nestjs/swagger';
import { PdfResource } from '../entities/pdf-resource.entity';
import { ResourceResponseDto } from './resource-response.dto';

export class PdfResourceResponseDto extends ResourceResponseDto {
  constructor(entity: PdfResource) {
    super(entity);
    this.pageCount = entity.pageCount;
    this.fileSize = entity.fileSize;
  }

  @ApiProperty()
  pageCount?: number;

  @ApiProperty()
  fileSize?: number;

  static fromEntity(entity: PdfResource): PdfResourceResponseDto {
    return new PdfResourceResponseDto(entity);
  }

  static fromEntities(entities: PdfResource[]): PdfResourceResponseDto[] {
    return entities.map((e) => new PdfResourceResponseDto(e));
  }
}
