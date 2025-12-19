import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapter } from '../chapter.entity';
import { In, IsNull, Not, QueryRunner, Repository } from 'typeorm';
import {
  generateRadomString,
  generateSlug,
} from 'src/common/utils/course.util';
import { Lesson } from 'src/lesson/lesson.entity';

enum TABLE_RELATIONS {
  COURSE = 'course',
  LESSONS = 'lessons',
}

@Injectable()
export class ChapterCustomRepository {
  constructor(
    @InjectRepository(Chapter)
    private readonly repository: Repository<Chapter>,
  ) {}

  async findDeletedChapters(): Promise<Chapter[]> {
    return this.repository.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
      order: { position: 'ASC' },
      relations: [TABLE_RELATIONS.COURSE],
    });
  }

  async findDeletedChapterWithIds(ids: string[]): Promise<Chapter[]> {
    return this.repository.find({
      withDeleted: true,
      where: {
        id: In(ids),
        deletedAt: Not(IsNull()),
      },
      order: { position: 'ASC' },
      relations: [TABLE_RELATIONS.COURSE],
    });
  }

  async findByIdWithRelations(id: string): Promise<Chapter | null> {
    return this.repository.findOne({
      where: { id },
      relations: [TABLE_RELATIONS.COURSE],
    });
  }

  async isSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const lesson = await this.repository.findOneBy({ slug });
    return !!lesson && (!excludeId || lesson.id !== excludeId);
  }

  async getNextPosition(courseId: number): Promise<number> {
    const count = await this.repository.count({
      where: { course: { id: courseId } },
    });
    return count + 1;
  }

  async findSoftDeletedByIdWithRelations(id: string): Promise<Chapter | null> {
    return this.repository.findOne({
      where: { id, deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: [TABLE_RELATIONS.COURSE],
    });
  }

  async findChapterByIdWithQueryRunner(
    id: string,
    queryRunner: QueryRunner,
  ): Promise<Chapter | null> {
    return queryRunner.manager
      .createQueryBuilder(Chapter, 'chapter')
      .leftJoinAndSelect('chapter.course', 'course')
      .leftJoinAndSelect('chapter.lessons', 'lessons')
      .where('chapter.id = :id', { id })
      .setLock('pessimistic_write', undefined, ['chapter'])
      .getOne();
  }

  async getNextPositionWithQueryRunner(
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

  async generateUniqueSlugWithQueryRunner(
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

  async findSoftDeletedChapterWithQueryRunner(
    id: string,
    queryRunner: QueryRunner,
  ): Promise<Chapter | null> {
    const chapter = await queryRunner.manager
      .createQueryBuilder(Chapter, 'chapter')
      .leftJoinAndSelect('chapter.course', 'course')
      .where('chapter.id = :id', { id })
      .andWhere('chapter.deletedAt IS NOT NULL')
      .withDeleted()
      .setLock('pessimistic_write', undefined, ['chapter'])
      .getOne();

    if (!chapter) return null;

    chapter.lessons = await queryRunner.manager
      .createQueryBuilder(Lesson, 'lesson')
      .where('lesson.chapterId = :chapterId', { chapterId: chapter.id })
      .andWhere('lesson.deletedAt IS NOT NULL')
      .withDeleted()
      .getMany();

    return chapter;
  }

  async reorderChaptersAfterDeletion(
    courseId: number,
    deletedPosition: number,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .update(Chapter)
      .set({
        position: () => '"position" - 1',
      })
      .where('"courseId" = :courseId', { courseId })
      .andWhere('"position" > :deletedPosition', {
        deletedPosition,
      })
      .execute();
  }

  async findAllSoftDeletedWithQueryRunner(
    ids: string[],
    queryRunner: QueryRunner,
  ): Promise<Chapter[]> {
    return queryRunner.manager
      .createQueryBuilder(Chapter, 'chapter')
      .leftJoinAndSelect('chapter.course', 'course')
      .leftJoinAndSelect('chapter.lessons', 'lessons')
      .where('chapter.id IN (:...ids)', { ids })
      .andWhere('chapter.deletedAt IS NOT NULL')
      .withDeleted()
      .setLock('pessimistic_write', undefined, ['chapter'])
      .getMany();
  }
}
