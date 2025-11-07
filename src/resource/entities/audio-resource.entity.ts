import { ChildEntity, Column } from 'typeorm';
import { Resource } from './resource.entity';
import { ResourceType } from '../enums/resource-type.enum';

@ChildEntity(ResourceType.AUDIO)
export class AudioResource extends Resource {
  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  bitrate: number;
}
