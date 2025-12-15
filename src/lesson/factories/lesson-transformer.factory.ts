import { LessonType } from '../enums/lesson.enum';
import { ILessonDataTransformer } from '../interfaces/lesson.interface';
import { ContentLessonTransformer } from '../transformers/content-lesson.transformer';
import { DefaultLessonTransformer } from '../transformers/default-lesson.transformer';

export class LessonTransformerFactory {
  private static transformers: Record<LessonType, ILessonDataTransformer> = {
    [LessonType.CONTENT]: new ContentLessonTransformer(),
    [LessonType.ASSIGNMENT]: new ContentLessonTransformer(),
    [LessonType.QUIZ]: new ContentLessonTransformer(),
    [LessonType.PDF]: new ContentLessonTransformer(),
  };

  static getTransformer(lessonType: LessonType): ILessonDataTransformer {
    return this.transformers[lessonType] || new DefaultLessonTransformer();
  }
}
