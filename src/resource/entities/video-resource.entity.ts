import { ChildEntity, Column } from 'typeorm';
import { Resource } from './resource.entity';
import { ResourceType } from '../enums/resource-type.enum';

@ChildEntity(ResourceType.VIDEO)
export class VideoResource extends Resource {
  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  thumbnailUrl: string;
}
