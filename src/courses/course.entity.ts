import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseStatus, TypeCourse } from './enums/type-course.enum';
import { Category } from '../categories/category.entity';
import { Chapter } from 'src/chapters/chapter.entity';

@Entity()
export class Course {
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
    default: TypeCourse.FREE,
    enum: TypeCourse,
  })
  typeCourse: TypeCourse;

  @Column({
    type: 'enum',
    default: CourseStatus.DRAFT,
    enum: CourseStatus,
  })
  status: CourseStatus;

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

  @ManyToOne(() => Category, (category) => category.courses, {
    onDelete: 'RESTRICT',
  })
  category: Category;

  @OneToMany(() => Chapter, (chapter) => chapter.course)
  chapters: Chapter[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
