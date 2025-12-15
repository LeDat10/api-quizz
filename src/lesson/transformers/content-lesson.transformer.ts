import { ContentLessonResponseDto } from 'src/content-lesson/dtos/content-lesson-response.dto';
import { ILessonDataTransformer } from '../interfaces/lesson.interface';
import { Lesson } from '../lesson.entity';

export class ContentLessonTransformer implements ILessonDataTransformer {
  transform(lesson: Lesson): ContentLessonResponseDto | null {
    if (!lesson.contentLesson) {
      return null;
    }
    return ContentLessonResponseDto.fromEntity(lesson.contentLesson);
  }
}
