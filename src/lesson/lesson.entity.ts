import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LessonType } from './enums/lesson.enum';
import { Chapter } from 'src/chapters/chapter.entity';
import { Resource } from 'src/resource/entities/resource.entity';
import { ContentLesson } from 'src/content-lesson/content-lesson.entity';
import { Status } from 'src/common/status/enums/status.enum';

@Entity()
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
    enum: Status,
    default: Status.DRAFT,
  })
  lessonStatus: Status;

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

  @OneToOne(() => ContentLesson, (contentLesson) => contentLesson.lesson, {
    nullable: true,
  })
  contentLesson: ContentLesson;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
