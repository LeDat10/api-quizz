import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Lesson } from '../lesson.entity';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { LessonCustomRepository } from '../repositories/lesson.repository';
import { validateLessonIds } from '../helpers/lesson-validator.helper';
import { LessonType } from '../enums/lesson.enum';
import { ContentLesson } from 'src/content-lesson/content-lesson.entity';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { ChangeLessonPositionDto } from '../dtos/change-lesson-position.dto';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { ACTIONS } from 'src/common/common.type';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonResponseDto } from '../dtos/lesson-response.dto';

@Injectable()
export class LessonBulkService {
  private readonly logger = new LoggerHelper(LessonBulkService.name);
  private readonly errorHandler = new ErrorHandlerHelper(
    LessonBulkService.name,
  );
  private _entity = 'Lesson';

  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    private readonly connection: DataSource,
    private readonly lessonCustomRepository: LessonCustomRepository,
  ) {}

  async softDeleteMany(lessonIds: string[]) {
    const ctx = { method: 'softDeleteMany', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateLessonIds(lessonIds, ctx, this.logger);
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const uniqueLessonIds = [...new Set(lessonIds)];

      if (uniqueLessonIds.length !== lessonIds.length) {
        this.logger.warn(
          ctx,
          'start',
          `Removed ${lessonIds.length - uniqueLessonIds.length} duplicate IDs`,
        );
      }

      const existingLessons =
        await this.lessonCustomRepository.findByIdsNotRelations(
          uniqueLessonIds,
        );

      if (existingLessons.length === 0) {
        const reason = 'None of the provided lesson IDs exist';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      const existingLessonIds = existingLessons.map((l) => l.id);
      const nonExistingIds = uniqueLessonIds.filter(
        (id) => !existingLessonIds.includes(id),
      );

      if (nonExistingIds.length > 0) {
        this.logger.warn(
          ctx,
          'start',
          `Lessons not found: ${nonExistingIds.join(', ')}`,
        );
      }

      const lessonsByType = {
        [LessonType.CONTENT]: [],
        [LessonType.QUIZ]: [],
        [LessonType.ASSIGNMENT]: [],
      };

      existingLessons.forEach((lesson) => {
        lessonsByType[lesson.lessonType]?.push(lesson.id);
      });

      const deletionResults = {
        contents: 0,
        quizzes: 0,
        assignments: 0,
      };

      if (lessonsByType[LessonType.CONTENT].length > 0) {
        this.logger.debug(
          ctx,
          'start',
          `Soft deleting ${lessonsByType[LessonType.CONTENT].length} content lessons`,
        );

        const result = await queryRunner.manager
          .createQueryBuilder()
          .softDelete()
          .from(ContentLesson)
          .where('lessonId IN (:...ids)', {
            ids: lessonsByType[LessonType.CONTENT],
          })
          .execute();

        deletionResults.contents = result.affected || 0;
      }

      const result = await queryRunner.manager
        .createQueryBuilder()
        .softDelete()
        .from(Lesson)
        .where('id IN (:...ids)', { ids: existingLessonIds })
        .execute();

      await queryRunner.commitTransaction();

      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success(
        `Successfully soft deleted ${result.affected} lesson(s)`,
        {
          deletedIds: existingLessonIds,
          deletedAt: new Date(),
          summary: {
            requested: lessonIds.length,
            successful: result.affected || 0,
            failed: nonExistingIds.length,
            nonExistingIds,
          },
        },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return this.errorHandler.handle(ctx, error, this._entity);
    } finally {
      await queryRunner.release();
    }
  }

  public async hardDeleteMany(lessonIds: string[]) {
    const ctx = { method: 'hardDeleteMany', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateLessonIds(lessonIds, ctx, this.logger);
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const uniqueLessonIds = [...new Set(lessonIds)];

      if (uniqueLessonIds.length !== lessonIds.length) {
        this.logger.warn(
          ctx,
          'start',
          `Removed ${lessonIds.length - uniqueLessonIds.length} duplicate IDs`,
        );
      }

      const existingLessonDeleted =
        await this.lessonCustomRepository.findDeletedLessonWithIdsNotRelations(
          lessonIds,
        );

      if (existingLessonDeleted.length === 0) {
        const reason =
          'No soft-deleted lessons found for the provided lesson IDs';

        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      const existingLessonIds = existingLessonDeleted.map((l) => l.id);
      const nonExistingIds = uniqueLessonIds.filter(
        (id) => !existingLessonIds.includes(id),
      );

      if (nonExistingIds.length > 0) {
        this.logger.warn(
          ctx,
          'start',
          `Lessons not found: ${nonExistingIds.join(', ')}`,
        );
      }

      const lessonsByType = {
        [LessonType.CONTENT]: [],
        [LessonType.QUIZ]: [],
        [LessonType.ASSIGNMENT]: [],
      };

      existingLessonDeleted.forEach((lesson) => {
        lessonsByType[lesson.lessonType]?.push(lesson.id);
      });

      const deletionResults = {
        contents: 0,
        quizzes: 0,
        assignments: 0,
      };

      if (lessonsByType[LessonType.CONTENT].length > 0) {
        this.logger.debug(
          ctx,
          'start',
          `Hard deleting ${lessonsByType[LessonType.CONTENT].length} content lessons`,
        );

        const result = await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(ContentLesson)
          .where('lessonId IN (:...ids)', {
            ids: lessonsByType[LessonType.CONTENT],
          })
          .execute();

        deletionResults.contents = result.affected || 0;
      }

      const result = await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Lesson)
        .where('id IN (:...ids)', { ids: existingLessonIds })
        .execute();

      await queryRunner.commitTransaction();
      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success(
        `Successfully hard deleted ${result.affected} lesson(s)`,
        {
          deletedIds: existingLessonIds,
          deletedAt: new Date(),
          summary: {
            requested: lessonIds.length,
            successful: result.affected || 0,
            failed: nonExistingIds.length,
            nonExistingIds,
          },
        },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return this.errorHandler.handle(ctx, error, this._entity);
    } finally {
      await queryRunner.release();
    }
  }

  public async restoreMany(lessonIds: string[]) {
    const ctx = { method: 'restoreMany', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateLessonIds(lessonIds, ctx, this.logger);
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const uniqueLessonIds = [...new Set(lessonIds)];

      if (uniqueLessonIds.length !== lessonIds.length) {
        this.logger.warn(
          ctx,
          'start',
          `Removed ${lessonIds.length - uniqueLessonIds.length} duplicate IDs`,
        );
      }

      const existingDeleted =
        await this.lessonCustomRepository.findDeletedLessonWithIds(
          uniqueLessonIds,
        );

      if (existingDeleted.length === 0) {
        const reason =
          'No soft-deleted lessons found for the provided lesson IDs';

        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      const existingDeletedIds = existingDeleted.map((l) => l.id);
      const nonExistingIds = uniqueLessonIds.filter(
        (id) => !existingDeletedIds.includes(id),
      );

      if (nonExistingIds.length > 0) {
        this.logger.warn(
          ctx,
          'start',
          `Lessons not found: ${nonExistingIds.join(', ')}`,
        );
      }

      const lessonsByType = {
        [LessonType.CONTENT]: [],
        [LessonType.QUIZ]: [],
        [LessonType.ASSIGNMENT]: [],
      };

      existingDeleted.forEach((lesson) => {
        lessonsByType[lesson.lessonType]?.push(lesson.id);
      });

      if (lessonsByType[LessonType.CONTENT].length > 0) {
        this.logger.debug(
          ctx,
          'start',
          `restoring ${lessonsByType[LessonType.CONTENT].length} content lessons`,
        );

        await queryRunner.manager
          .createQueryBuilder()
          .restore()
          .from(ContentLesson)
          .where('lessonId IN (:...ids)', {
            ids: lessonsByType[LessonType.CONTENT],
          })
          .execute();
      }

      const result = await queryRunner.manager
        .createQueryBuilder()
        .restore()
        .from(Lesson)
        .where('id IN (:...ids)', { ids: existingDeletedIds })
        .execute();

      await queryRunner.commitTransaction();
      this.logger.success(ctx, 'restored');

      return ResponseFactory.success(
        `Successfully restore ${result.affected} lesson(s)`,
        {
          restoredIds: existingDeletedIds,
          updatedAt: new Date(),
          summary: {
            requested: lessonIds.length,
            successful: result.affected || 0,
            failed: nonExistingIds.length,
            nonExistingIds,
          },
        },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return this.errorHandler.handle(ctx, error, this._entity);
    } finally {
      await queryRunner.release();
    }
  }

  public async updatePositionMany(
    changLessonPositionDtos: ChangeLessonPositionDto[],
  ) {
    const ctx = {
      method: 'updatePositionMany',
      entity: this._entity,
    };
    this.logger.start(ctx);
    let lessonIds: string[] = [];
    try {
      if (!changLessonPositionDtos.length) {
        const reason = 'No lessons provided';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(
          generateMessage(ACTIONS.UPDATED, this._entity, undefined, reason),
        );
      }

      lessonIds = changLessonPositionDtos.map((d) => d.id);

      validateLessonIds(lessonIds, ctx, this.logger);
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }

    try {
      const existingLessons =
        await this.lessonCustomRepository.findByIds(lessonIds);

      if (existingLessons.length === 0) {
        const reason = `No lessons found with IDs: ${lessonIds.join(', ')}`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(reason);
      }

      for (const lesson of existingLessons) {
        const dto = changLessonPositionDtos.find((d) => d.id === lesson.id);
        if (dto) {
          lesson.position = dto.position;
        }
      }

      const updatedLessons = await this.lessonRepository.save(existingLessons);
      this.logger.success(ctx, ACTIONS.UPDATED);
      return ResponseFactory.success<LessonResponseDto[]>(
        `Updated positions for ${updatedLessons.length} lessons`,
        LessonResponseDto.fromEntities(updatedLessons),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }
}
