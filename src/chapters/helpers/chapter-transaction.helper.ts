import { QueryRunner } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { Chapter } from '../chapter.entity';
import {
  generateRadomString,
  generateSlug,
} from 'src/common/utils/course.util';

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
}
