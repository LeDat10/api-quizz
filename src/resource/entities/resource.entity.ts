import { Lesson } from 'src/lesson/lesson.entity';
import { ResourceLibrary } from 'src/resource-library/resource-library.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn,
} from 'typeorm';
import { ResourceStatus, ResourceType } from '../enums/resource-type.enum';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'resourceType' } })
export abstract class Resource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  title: string;

  @Column({ nullable: false })
  url: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: false })
  position: number;

  @Column({ nullable: false })
  slug: string;

  @ManyToOne(() => ResourceLibrary, (library) => library.resources)
  library: ResourceLibrary;

  @ManyToMany(() => Lesson, (lesson) => lesson.resources, { nullable: true })
  lessons: Lesson[];

  @Column({ type: 'enum', enum: ResourceType })
  resourceType: ResourceType;

  @Column({
    type: 'enum',
    enum: ResourceStatus,
    default: ResourceStatus.DRAFT,
  })
  status: ResourceStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
