import { ChildEntity, Column } from 'typeorm';
import { Resource } from './resource.entity';
import { ResourceType } from '../enums/resource-type.enum';

@ChildEntity(ResourceType.PDF)
export class PdfResource extends Resource {
  @Column({ nullable: true })
  pageCount: number;

  @Column({ nullable: true })
  fileSize: number; // MB
}
