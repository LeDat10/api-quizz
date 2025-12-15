import { ContentLessonService } from 'src/content-lesson/content-lesson.service';
import { LessonType } from '../enums/lesson.enum';
import { LessonCreator } from '../interfaces/lesson.interface';
import { ContentLessonStrategy } from '../strategies/content-lesson.strategy';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LessonStrategyFactory {
  constructor(private contentLessonService: ContentLessonService) {}

  getStrategy(lessonType: LessonType): LessonCreator {
    const strategies: Record<LessonType, LessonCreator> = {
      [LessonType.CONTENT]: new ContentLessonStrategy(
        this.contentLessonService,
      ),
      [LessonType.ASSIGNMENT]: new ContentLessonStrategy(
        this.contentLessonService,
      ),
      [LessonType.QUIZ]: new ContentLessonStrategy(this.contentLessonService),
      [LessonType.PDF]: new ContentLessonStrategy(this.contentLessonService),
    };

    return strategies[lessonType];
  }
}
