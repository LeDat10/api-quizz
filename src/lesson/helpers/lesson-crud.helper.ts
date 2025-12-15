import {
  generateRadomString,
  generateSlug,
} from 'src/common/utils/course.util';
import { LessonCustomRepository } from '../repositories/lesson.repository';
import { BaseCreateLessonDto } from '../dtos/base-create-lesson.dto';
import { ChaptersService } from 'src/chapters/chapters.service';
import { Lesson } from '../lesson.entity';

export class LessonCrudHelper {
  static async generateUniqueSlug(
    title: string,
    repository: LessonCustomRepository,
    excludeId?: number,
  ): Promise<string> {
    let slug = generateSlug(title);
    const exists = await repository.isSlugExists(slug, excludeId);

    if (exists) {
      slug = `${slug}-${generateRadomString()}`;
    }

    return slug;
  }

  static async assignPositionIfNeeded(
    dto: BaseCreateLessonDto,
    repository: LessonCustomRepository,
  ): Promise<number> {
    if (!dto.position) {
      return await repository.getNextPosition();
    }
    return dto.position;
  }

  static async updateChapterIfProvided(
    lesson: Lesson,
    chapterId: number | undefined,
    chapterService: ChaptersService,
  ): Promise<void> {
    if (chapterId) {
      const chapter = await chapterService.findChapterById(chapterId);
      if (chapter) {
        lesson.chapter = chapter;
      }
    }
  }

  static async updateSlugIfTitleChanged(
    lesson: Lesson,
    newTitle: string | undefined,
    repository: LessonCustomRepository,
  ): Promise<void> {
    if (newTitle && newTitle !== lesson.title) {
      lesson.slug = await LessonCrudHelper.generateUniqueSlug(
        newTitle,
        repository,
        lesson.id,
      );
    }
  }
}
