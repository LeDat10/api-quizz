import {
  generateRadomString,
  generateSlug,
} from 'src/common/utils/course.util';
import { ChapterCustomRepository } from '../repositories/chapter.repository';
import { CreateChapterDto } from '../dtos/creater-chapter.dto';
import { Chapter } from '../chapter.entity';

export class ChapterCrudHelper {
  static async generateUniqueSlug(
    title: string,
    repository: ChapterCustomRepository,
    excludeId?: string,
  ) {
    let slug = generateSlug(title);
    const exists = await repository.isSlugExists(slug, excludeId);

    if (exists) {
      slug = `${slug}-${generateRadomString()}`;
    }

    return slug;
  }

  static async assignPositionIfNeeded(
    dto: CreateChapterDto,
    repository: ChapterCustomRepository,
  ): Promise<number> {
    if (!dto.position) {
      return await repository.getNextPosition(dto.courseId);
    }

    return dto.position;
  }

  static async updateSlugIfTitleChanged(
    chapter: Chapter,
    newTitle: string | undefined,
    repository: ChapterCustomRepository,
  ) {
    if (newTitle && newTitle !== chapter.title) {
      chapter.slug = await ChapterCrudHelper.generateUniqueSlug(
        newTitle,
        repository,
        chapter.id,
      );
    }
  }
}
