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
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
    default: ChapterStatus.DRAFT,
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

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  inactivedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
