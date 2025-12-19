import { In, QueryRunner } from 'typeorm';
import { Chapter } from '../chapter.entity';
import {
  generateRadomString,
  generateSlug,
} from 'src/common/utils/course.util';
import { ContentLesson } from 'src/content-lesson/content-lesson.entity';
import { LessonType } from 'src/lesson/enums/lesson.enum';
import { Lesson } from 'src/lesson/lesson.entity';

export class ChapterTransactionHelper {
  static async generateUniqueSlug(
    title: string,
    queryRunner: QueryRunner,
  ): Promise<string> {
    const baseSlug = generateSlug(title);
    let slug = baseSlug;

    const existing = await queryRunner.manager.findOne(Chapter, {
      where: { slug },
      lock: { mode: 'pessimistic_read' },
    });

    if (existing) {
      slug = `${baseSlug}-${generateRadomString()}`;
    }

    return slug;
  }

  static async getNextPosition(
    courseId: number,
    queryRunner: QueryRunner,
  ): Promise<number> {
    const result = await queryRunner.manager
      .createQueryBuilder(Chapter, 'chapter')
      .select('MAX(chapter.position)', 'maxPosition')
      .where('chapter.courseId = :courseId', { courseId })
      .getRawOne();

    return (result?.maxPosition || 0) + 1;
  }

  static async softDeleteLessons(lessons: Lesson[], queryRunner: QueryRunner) {
    if (!lessons.length) return;

    const contentIds = lessons
      .filter((l) => l.lessonType === LessonType.CONTENT)
      .map((l) => l.id);

    if (contentIds.length) {
      await queryRunner.manager.softDelete(ContentLesson, {
        lessonId: In(contentIds),
      });
    }

    await queryRunner.manager.softDelete(Lesson, {
      id: In(lessons.map((l) => l.id)),
    });
  }

  static async restoreLessons(lessons: Lesson[], queryRunner: QueryRunner) {
    const lessonIds = lessons.filter((l) => l.deletedAt).map((l) => l.id);

    if (!lessonIds.length) return;

    await queryRunner.manager.restore(Lesson, { id: In(lessonIds) });
  }
}
