import { ILessonDataTransformer } from '../interfaces/lesson.interface';
import { Lesson } from '../lesson.entity';

export class DefaultLessonTransformer implements ILessonDataTransformer {
  transform(lesson: Lesson): null {
    return null;
  }
}
