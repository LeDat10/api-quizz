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
import { ChapterStatus } from './enums/chapter.enum';
import { Course } from 'src/courses/course.entity';
import { Lesson } from 'src/lesson/lesson.entity';

@Entity()
export class Chapter {
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
    type: 'enum',
    enum: ChapterStatus,
    default: ChapterStatus.ACTIVE,
  })
  status: ChapterStatus;

  @Column({
    type: 'integer',
    nullable: false,
  })
  position: number;

  @Column({
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  slug: string;

  @ManyToOne(() => Course, (courses) => courses.chapters)
  course: Course;

  @OneToMany(() => Lesson, (lessons) => lessons.chapter)
  lessons: Lesson[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
