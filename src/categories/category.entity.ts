import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryStatus } from './enums/category-status.enum';
import { Course } from '../courses/course.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  thumbnail?: string;

  @Column({
    type: 'enum',
    default: CategoryStatus.ACTIVE,
    enum: CategoryStatus,
  })
  status: CategoryStatus;

  @Column({
    nullable: false,
    type: 'integer',
  })
  position: number;

  @Column({
    nullable: false,
    unique: true,
    type: 'varchar',
  })
  slug: string;

  @OneToMany(() => Course, (course) => course.category)
  courses: Course[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
