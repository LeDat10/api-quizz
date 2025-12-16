import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapter } from '../chapter.entity';
import { In, IsNull, Not, Repository } from 'typeorm';

const TABLE_RELATIONS = { COURSE: 'course' } as const;
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

  async getNextPosition(): Promise<number> {
    const count = await this.repository.count();
    return count + 1;
  }

  async findSoftDeletedByIdWithRelations(id: string): Promise<Chapter | null> {
    return this.repository.findOne({
      where: { id, deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: [TABLE_RELATIONS.COURSE],
    });
  }
}
