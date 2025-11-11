import { Resource } from 'src/resource/entities/resource.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LibraryStatus } from './enums/resource-library.enum';

@Entity()
export class ResourceLibrary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  name: string;

  @Column({
    nullable: true,
  })
  description?: string;

  @Column({
    nullable: false,
  })
  position: number;

  @Column({
    type: 'enum',
    enum: LibraryStatus,
    default: LibraryStatus.DRAFT,
  })
  status: LibraryStatus;

  @Column({
    nullable: false,
  })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Resource, (resource) => resource.library)
  resources: Resource[];
}
