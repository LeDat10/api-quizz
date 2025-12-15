import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Lesson } from '../lesson.entity';
import { In, IsNull, Not, Repository } from 'typeorm';

const TABLE_RELATIONS = {
  CONTENT: 'contentLesson',
  CHAPTER: 'chapter',
} as const;

@Injectable()
export class LessonCustomRepository {
  constructor(
    @InjectRepository(Lesson)
    private readonly repository: Repository<Lesson>,
  ) {}

  async findByIdWithRelations(id: string): Promise<Lesson | null> {
    return this.repository.findOne({
      where: { id },
      relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findDeletedLessons(): Promise<Lesson[]> {
    return this.repository.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
      order: { position: 'ASC' },
      relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
    });
  }

  async findDeletedLessonWithIds(ids: string[]): Promise<Lesson[]> {
    return this.repository.find({
      withDeleted: true,
      where: {
        id: In(ids),
        deletedAt: Not(IsNull()),
      },
      order: { position: 'ASC' },
      relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
    });
  }

  async findDeletedLessonWithIdsNotRelations(ids: string[]): Promise<Lesson[]> {
    return this.repository.find({
      withDeleted: true,
      where: {
        id: In(ids),
        deletedAt: Not(IsNull()),
      },
      order: { position: 'ASC' },
    });
  }

  async findByIds(ids: number[]): Promise<Lesson[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
    });
  }

  async findByIdsNotRelations(ids: string[]): Promise<Lesson[]> {
    return this.repository.find({
      where: { id: In(ids) },
    });
  }

  async isSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const lesson = await this.repository.findOneBy({ slug });
    return !!lesson && (!excludeId || lesson.id !== excludeId);
  }

  async getNextPosition(): Promise<number> {
    const count = await this.repository.count();
    return count + 1;
  }

  async findSoftDeletedById(id: string): Promise<Lesson | null> {
    return this.repository.findOne({
      where: { id, deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
    });
  }
}
