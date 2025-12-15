import { QueryRunner } from 'typeorm';
import { BaseCreateLessonDto } from '../dtos/base-create-lesson.dto';
import { BaseUpdateLessonDto } from '../dtos/base-update-lesson.dto';
import { Lesson } from '../lesson.entity';

export interface LessonCreator {
  validate(dto: BaseCreateLessonDto): void;
  prepareData(dto: BaseCreateLessonDto, lesson: Lesson): Promise<void>;
  updateData(dto: BaseUpdateLessonDto, lesson: Lesson): Promise<void>;
  cleanupData(lesson: Lesson, queryRunner: QueryRunner): Promise<void>;
  permanentDelete(lesson: Lesson, queryRunner: QueryRunner): Promise<void>;
}

// Transformer
export interface ILessonDataTransformer {
  transform(lesson: Lesson): any;
}
