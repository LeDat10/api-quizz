import { Lesson } from 'src/lesson/lesson.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ContentLesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'text',
    nullable: false,
  })
  content: string;

  @OneToOne(() => Lesson, (lesson) => lesson.contentLesson, {
    onDelete: 'CASCADE',
    cascade: ['insert', 'update'],
  })
  @JoinColumn()
  lesson: Lesson;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
