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
import { Status } from 'src/common/status/enums/status.enum';

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
    default: Status.DRAFT,
    enum: Status,
  })
  status: Status;

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

  @Column({
    nullable: false,
    unique: true,
    type: 'varchar',
  })
  courseCode: string;

  @ManyToOne(() => Category, (category) => category.courses, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  category?: Category | null;

  @OneToMany(() => Chapter, (chapter) => chapter.course)
  chapters: Chapter[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
