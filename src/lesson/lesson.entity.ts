import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LessonStatus, LessonType } from './enums/lesson.enum';
import { Chapter } from 'src/chapters/chapter.entity';
import { Resource } from 'src/resource/entities/resource.entity';

@Entity()
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  title: string;

  @Column({
    type: 'enum',
    default: LessonType.CONTENT,
    enum: LessonType,
  })
  lessonType: LessonType;

  @Column({
    type: 'enum',
    enum: LessonStatus,
    default: LessonStatus.DRAFT,
  })
  lessonStatus: LessonStatus;

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

  @ManyToOne(() => Chapter, (chapter) => chapter.lessons)
  chapter: Chapter;

  @ManyToMany(() => Resource, (resource) => resource.lessons, {
    nullable: true,
  })
  resources: Resource[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
