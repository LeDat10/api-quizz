import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { Lesson } from '../lesson.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonResponseDto } from '../dtos/lesson-response.dto';
import { ChaptersService } from 'src/chapters/chapters.service';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { ChangeLessonStatusDto } from '../dtos/change-lesson-status.dto';
import { ChangeLessonPositionDto } from '../dtos/change-lesson-position.dto';
import { LessonStatus } from '../enums/lesson.enum';
import { BaseCreateLessonDto } from '../dtos/base-create-lesson.dto';
import { BaseUpdateLessonDto } from '../dtos/base-update-lesson.dto';
import { ACTIONS } from 'src/common/common.type';
import { validateId } from '../helpers/lesson-validator.helper';
import { LessonTransformerFactory } from '../factories/lesson-transformer.factory';
import { LessonStrategyFactory } from '../factories/lesson-strategy.factory';
import { LessonCustomRepository } from '../repositories/lesson.repository';
import { LessonBulkService } from './lesson-bulk.service';
import { LessonCrudHelper } from '../helpers/lesson-crud.helper';

const TABLE_RELATIONS = {
  CONTENT: 'contentLesson',
  CHAPTER: 'chapter',
} as const;

@Injectable()
export class LessonService {
  private readonly logger = new LoggerHelper(LessonService.name);
  private readonly errorHandler = new ErrorHandlerHelper(LessonService.name);
  private _entity = 'Lesson';

  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    private readonly chapterService: ChaptersService,
    private readonly paginationProvider: PaginationProvider,
    private readonly connection: DataSource,
    private readonly strategyFactory: LessonStrategyFactory,
    private readonly lessonCustomRepository: LessonCustomRepository,
    private readonly lessonBulkService: LessonBulkService,
  ) {}

  private transform = (lesson: Lesson) => {
    const transformer = LessonTransformerFactory.getTransformer(
      lesson.lessonType,
    );
    const data = lesson.contentLesson ? transformer.transform(lesson) : null;
    return {
      id: lesson.id,
      title: lesson.title,
      lessonType: lesson.lessonType,
      lessonStatus: lesson.lessonStatus,
      position: lesson.position,
      slug: lesson.slug,
      chapterId: lesson.chapter?.id,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      deletedAt: lesson.deletedAt,
      data,
    };
  };

  public async findLessonById(id: string) {
    const ctx = { method: 'findLessonById', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateId(id, ctx, this.logger);

      const lesson =
        await this.lessonCustomRepository.findByIdWithRelations(id);

      if (!lesson) {
        const reason = 'Not found';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(ACTIONS.FAILED, this._entity, id, reason),
        );
      }

      this.logger.success(ctx, ACTIONS.FETCHED);
      return lesson;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async getAllLessons(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllLessons', entity: this._entity };
    this.logger.start(ctx);

    try {
      const lessons = await this.paginationProvider.paginateQuery<
        Lesson,
        LessonResponseDto
      >(paginationQueryDto, this.lessonRepository, this.transform, {
        order: { position: 'ASC' },
        relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
      });

      this.logger.success(ctx, ACTIONS.FETCHED);
      return lessons;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async getDetailLesson(id: string) {
    const ctx = { method: 'getDetailLesson', entity: this._entity };
    this.logger.start(ctx);

    try {
      const lesson = await this.findLessonById(id);
      const lessonResponse = LessonResponseDto.fromEntity(lesson);

      this.logger.success(ctx, ACTIONS.FETCHED);

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage(ACTIONS.FETCHED, this._entity, id),
        lessonResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async createLesson(createLessonDto: BaseCreateLessonDto) {
    const ctx = { method: 'createLesson', entity: this._entity };
    this.logger.start(ctx);

    try {
      const strategy = this.strategyFactory.getStrategy(
        createLessonDto.lessonType,
      );

      // Find chapter
      const chapter = await this.chapterService.findChapterById(
        createLessonDto.chapterId,
      );

      if (!chapter) {
        const reason = `Chapter ID ${createLessonDto.chapterId} not found`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(ACTIONS.FAILED, this._entity, undefined, reason),
        );
      }

      // Generate slug
      const slug = await LessonCrudHelper.generateUniqueSlug(
        createLessonDto.title,
        this.lessonCustomRepository,
      );

      // Auto-increment position if not provided
      const position = await LessonCrudHelper.assignPositionIfNeeded(
        createLessonDto,
        this.lessonCustomRepository,
      );

      // Create and save
      const lesson = this.lessonRepository.create({
        ...createLessonDto,
        chapter,
        slug,
        position,
      });

      const savedLesson = await this.lessonRepository.save(lesson);

      await strategy.prepareData(createLessonDto, savedLesson);

      const record = await this.findLessonById(savedLesson.id);
      this.logger.success(ctx, ACTIONS.CREATED);
      return ResponseFactory.success<LessonResponseDto>(
        generateMessage('created', this._entity, record.id),
        LessonResponseDto.fromEntity(record),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async updateLesson(id: string, updateLessonDto: BaseUpdateLessonDto) {
    const ctx = { method: 'updateLesson', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateId(id, ctx, this.logger);

      const lesson =
        await this.lessonCustomRepository.findByIdWithRelations(id);

      if (!lesson) {
        const reason = 'Not found';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(ACTIONS.FAILED, this._entity, id, reason),
        );
      }

      const strategy = this.strategyFactory.getStrategy(lesson.lessonType);

      // Update chapter if provided
      if (updateLessonDto.chapterId) {
        await LessonCrudHelper.updateChapterIfProvided(
          lesson,
          updateLessonDto.chapterId,
          this.chapterService,
        );
      }

      // Update slug if title changed
      if (updateLessonDto.title && updateLessonDto.title !== lesson.title) {
        const slug = await LessonCrudHelper.generateUniqueSlug(
          updateLessonDto.title,
          this.lessonCustomRepository,
        );

        lesson.slug = slug;
      }

      const data = Object.fromEntries(
        Object.entries(updateLessonDto).filter(([_, v]) => v !== undefined),
      );

      Object.assign(lesson, data);

      await this.lessonRepository.save(lesson);
      await strategy.updateData(updateLessonDto, lesson);
      const lessonUpdated = await this.findLessonById(id);
      this.logger.success(ctx, ACTIONS.UPDATED);

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage('updated', this._entity, id),
        LessonResponseDto.fromEntity(lessonUpdated),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async getAllLessonDeleted(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllLessonDeleted', entity: this._entity };
    this.logger.start(ctx);

    try {
      const lessonsDeleted = await this.paginationProvider.paginateQuery<
        Lesson,
        LessonResponseDto
      >(paginationQueryDto, this.lessonRepository, this.transform, {
        withDeleted: true,
        where: {
          deletedAt: Not(IsNull()),
        },
        order: { position: 'ASC' },
        relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
      });

      if (!lessonsDeleted.data.length) {
        this.logger.warn(ctx, ACTIONS.FETCHED, 'No deleted lessons found');
      } else {
        this.logger.success(ctx, ACTIONS.FETCHED);
      }

      return lessonsDeleted;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async softDeleteLesson(id: string) {
    const ctx = { method: 'softDeleteLesson', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateId(id, ctx, this.logger);
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingLesson = await this.findLessonById(id);

      const strategy = this.strategyFactory.getStrategy(
        existingLesson.lessonType,
      );

      await strategy.cleanupData(existingLesson, queryRunner);

      await queryRunner.manager
        .createQueryBuilder()
        .softDelete()
        .from(Lesson)
        .where('id = :id', { id: existingLesson.id })
        .execute();

      await queryRunner.commitTransaction();

      const deletedLesson =
        await this.lessonCustomRepository.findSoftDeletedById(
          existingLesson.id,
        );
      this.logger.success(ctx, ACTIONS.DELETED);
      return ResponseFactory.success(
        generateMessage(ACTIONS.DELETED, this._entity, id),
        {
          id: existingLesson.id,
          title: existingLesson.title,
          deletedAt: new Date(),
        },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return this.errorHandler.handle(ctx, error, this._entity, id);
    } finally {
      await queryRunner.release();
    }
  }

  public async softDeleteManyLessons(lessonIds: string[]) {
    return await this.lessonBulkService.softDeleteMany(lessonIds);
  }

  public async hardDeleteLesson(id: string) {
    const ctx = { method: 'hardDeleteLesson', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateId(id, ctx, this.logger);
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      validateId(id, ctx, this.logger);

      const existingLesson =
        await this.lessonCustomRepository.findByIdWithRelations(id);

      if (!existingLesson) {
        const reason = 'Not found or not soft-deleted';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(ACTIONS.FAILED, this._entity, id, reason),
        );
      }

      const strategy = this.strategyFactory.getStrategy(
        existingLesson.lessonType,
      );
      await strategy.permanentDelete(existingLesson, queryRunner);

      this.logger.success(ctx, ACTIONS.DELETED);
      return ResponseFactory.success(
        generateMessage(ACTIONS.DELETED, this._entity, id),
        { id, title: existingLesson.title, deletedAt: new Date() },
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async hardDeleteManyLessons(lessonIds: string[]) {
    return await this.lessonBulkService.hardDeleteMany(lessonIds);
  }

  public async restoreLesson(id: string) {
    const ctx = { method: 'restoreLesson', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateId(id, ctx, this.logger);

      const result = await this.lessonRepository.restore(id);

      if (result.affected === 0) {
        const reason = 'Not found or already active';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(ACTIONS.FAILED, this._entity, id, reason),
        );
      }

      const lesson = await this.findLessonById(id);
      if (!lesson) {
        const reason = 'Not found after restore';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(ACTIONS.FAILED, this._entity, id, reason),
        );
      }

      const lessonResponse = LessonResponseDto.fromEntity(lesson);
      this.logger.success(ctx, ACTIONS.RESTORED);

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage(ACTIONS.RESTORED, this._entity, id),
        lessonResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async restoreLessonMultiple(ids: number[]) {
    const ctx = { method: 'restoreLessonMultiple', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!ids || ids.length === 0) {
        const reason = 'No lesson IDs provided';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(
          generateMessage(ACTIONS.FAILED, this._entity, undefined, reason),
        );
      }

      this.logger.debug(ctx, ACTIONS.START, `Restoring IDs: ${ids.join(', ')}`);

      const result = await this.lessonRepository.restore({ id: In(ids) });

      if (result.affected === 0) {
        const reason = 'No lessons found to restore';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(ACTIONS.FAILED, this._entity, undefined, reason),
        );
      }

      const lessons = await this.lessonRepository.find({
        where: { id: In(ids) },
        relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
      });

      if (!lessons.length) {
        const reason = 'Lessons not found after restore';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(ACTIONS.FAILED, this._entity, undefined, reason),
        );
      }

      const lessonsResponse = LessonResponseDto.fromEntities(lessons);
      this.logger.success(ctx, ACTIONS.RESTORED);

      return ResponseFactory.success<LessonResponseDto[]>(
        `${lessons.length} lessons restored successfully`,
        lessonsResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeLessonStatusMultiple(
    changeLessonStatusDto: ChangeLessonStatusDto,
  ) {
    const ctx = { method: 'changeLessonStatusMultiple', entity: this._entity };
    this.logger.start(ctx);
    try {
      const { ids, status } = changeLessonStatusDto;
      this.logger.debug(
        ctx,
        ACTIONS.START,
        `Updating status for lessons with IDs: ${ids.join(', ')}, new status: ${status}`,
      );

      const lessons = await this.lessonRepository.find({
        where: { id: In(ids) },
        relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
      });

      if (!lessons.length) {
        const reason = `No lessons found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(reason);
      }

      for (const lesson of lessons) {
        lesson.lessonStatus = status;
      }

      await this.lessonRepository.save(lessons);
      const records = await this.lessonRepository.find({
        where: { id: In(ids) },
        relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
      });
      this.logger.success(ctx, ACTIONS.UPDATED);
      return ResponseFactory.success<LessonResponseDto[]>(
        generateMessage(ACTIONS.UPDATED, this._entity),
        LessonResponseDto.fromEntities(records),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeLessonPositionMultiple(
    changLessonPositionDtos: ChangeLessonPositionDto[],
  ) {
    const ctx = {
      method: 'changelessonPositionMultiple',
      entity: this._entity,
    };
    this.logger.start(ctx);
    try {
      if (!changLessonPositionDtos.length) {
        const reason = 'No lessons provided';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(
          generateMessage(ACTIONS.UPDATED, this._entity, undefined, reason),
        );
      }

      const ids = changLessonPositionDtos.map((d) => d.id);
      this.logger.debug(
        ctx,
        ACTIONS.START,
        `Updating positions for lessons with IDs: ${ids.join(', ')}`,
      );
      const lessons = await this.lessonRepository.find({
        where: { id: In(ids) },
        relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
      });

      if (!lessons.length) {
        const reason = `No lessons found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(reason);
      }

      for (const lesson of lessons) {
        const dto = changLessonPositionDtos.find((d) => d.id === lesson.id);
        if (dto) {
          lesson.position = dto.position;
        }
      }

      await this.lessonRepository.save(lessons);
      const records = await this.lessonRepository.find({
        where: { id: In(ids) },
        relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
      });
      this.logger.success(ctx, ACTIONS.UPDATED);
      return ResponseFactory.success<LessonResponseDto[]>(
        `Updated positions for ${records.length} lessons`,
        LessonResponseDto.fromEntities(records),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeLessonStatus(id: string, status: LessonStatus) {
    const ctx = { method: 'changeLessonStatus', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateId(id, ctx, this.logger);

      const lesson = await this.findLessonById(id);
      lesson.lessonStatus = status;
      const record = await this.lessonRepository.save(lesson);
      this.logger.success(ctx, ACTIONS.UPDATED);
      return ResponseFactory.success<LessonResponseDto>(
        generateMessage(ACTIONS.UPDATED, this._entity, id),
        LessonResponseDto.fromEntity(record),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }
}
