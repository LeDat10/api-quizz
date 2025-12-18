import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChapterCustomRepository } from '../repositories/chapter.repository';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { ACTIONS } from 'src/common/common.type';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { DataSource, In } from 'typeorm';
import { Chapter } from '../chapter.entity';
import { ChangeChapterPositionDto } from '../dtos/change-chapter-position.dto';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { ChapterResponseDto } from '../dtos/chapter-response.dto';
import { ChangeChapterStatusDto } from '../dtos/change-chapter-status.dto';
import { validateUUIDArray } from 'src/common/helpers/validators/validator.helper';
import { ChapterStatus } from '../enums/chapter.enum';
import { TABLE_RELATIONS } from 'src/constants/constants';
import { validateAndSetChapterStatus } from '../helpers/validate-status.helper';
import { Status } from 'src/common/status/enums/status.enum';
import { Action, validateStatusHelper } from 'src/common/status';
import { LessonType } from 'src/lesson/enums/lesson.enum';
import { Lesson } from 'src/lesson/lesson.entity';
import { ContentLesson } from 'src/content-lesson/content-lesson.entity';

@Injectable()
export class ChapterBulkService {
  private readonly logger = new LoggerHelper(ChapterBulkService.name);
  private readonly errorHandler = new ErrorHandlerHelper(
    ChapterBulkService.name,
  );
  private _entity = 'Chapter';
  constructor(
    private readonly chapterCustomRepository: ChapterCustomRepository,
    private readonly connection: DataSource,
  ) {}

  async updateChapterPositionMany(
    changeChapterPositionDtos: ChangeChapterPositionDto[],
  ) {
    const ctx = {
      method: 'updateChapterPositionMany',
      entity: this._entity,
    };
    this.logger.start(ctx);
    try {
      if (!changeChapterPositionDtos.length) {
        const reason = 'No lessons provided';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(
          generateMessage(ACTIONS.UPDATED, this._entity, undefined, reason),
        );
      }

      const ids = changeChapterPositionDtos.map((d) => d.id);

      validateUUIDArray(ids, ctx, this.logger, {
        max: 100,
        name: 'chapterIds',
      });

      const uniqueIds = new Set(ids);
      if (uniqueIds.size !== ids.length) {
        const reason = 'Duplicate chapter IDs in request';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(reason);
      }

      // Check for duplicate positions in request
      const positions = changeChapterPositionDtos.map((d) => d.position);
      const uniquePositions = new Set(positions);
      if (uniquePositions.size !== positions.length) {
        const reason =
          'Duplicate positions detected in request. Each chapter must have a unique position.';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(reason);
      }

      const invalidPositions = positions.filter((p) => p < 1);
      if (invalidPositions.length > 0) {
        const reason = `Invalid positions: ${invalidPositions.join(', ')}. Positions must be >= 1`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(reason);
      }
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ids = changeChapterPositionDtos.map((d) => d.id);

      // Fetch chapters with lock to prevent race conditions
      const chapters = await queryRunner.manager.find(Chapter, {
        where: { id: In(ids) },
        relations: [TABLE_RELATIONS.COURSE, TABLE_RELATIONS.LESSON],
        lock: { mode: 'pessimistic_write' },
      });

      if (!chapters.length) {
        const reason = `No chapters found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(reason);
      }

      if (chapters.length !== ids.length) {
        const foundIds = chapters.map((c) => c.id);
        const missingIds = ids.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Chapters not found: ${missingIds.join(', ')}`,
        );
      }

      // Validate all chapters belong to the same course
      const courseIds = [...new Set(chapters.map((c) => c.course.id))];
      if (courseIds.length > 1) {
        throw new BadRequestException(
          'All chapters must belong to the same course. ' +
            `Found chapters from ${courseIds.length} different courses.`,
        );
      }

      const courseId = courseIds[0];

      // Get all chapters in the same course to validate positions
      const allChaptersInCourse = await queryRunner.manager.find(Chapter, {
        where: { course: { id: courseId } },
        order: { position: 'ASC' },
      });

      // Create map of new positions
      const positionMap = new Map(
        changeChapterPositionDtos.map((dto) => [dto.id, dto.position]),
      );

      // Validate new positions don't conflict with other chapters
      const otherChapters = allChaptersInCourse.filter(
        (c) => !ids.includes(c.id),
      );

      const newPositions = Array.from(positionMap.values());
      const conflictingChapters = otherChapters.filter((c) =>
        newPositions.includes(c.position),
      );

      if (conflictingChapters.length > 0) {
        const reason =
          `Position conflict detected. Positions ${conflictingChapters.map((c) => c.position).join(', ')} ` +
          `are already used by other chapters in this course.`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(reason);
      }

      // Validate positions are within valid range
      const maxPosition = allChaptersInCourse.length;
      const invalidPositions = newPositions.filter(
        (p) => p < 1 || p > maxPosition,
      );

      if (invalidPositions.length > 0) {
        const reason =
          `Invalid positions: ${invalidPositions.join(', ')}. ` +
          `Valid range is 1-${maxPosition} for this course.`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(reason);
      }

      // Update positions
      const updatedChapters = chapters.map((chapter) => {
        const newPosition = positionMap.get(chapter.id);
        if (newPosition !== undefined) {
          chapter.position = newPosition;
        }
        return chapter;
      });

      // Save all changes atomically
      await queryRunner.manager.save(Chapter, updatedChapters);

      await queryRunner.commitTransaction();

      this.logger.success(ctx, ACTIONS.UPDATED);

      return ResponseFactory.success<ChapterResponseDto[]>(
        generateMessage(ACTIONS.UPDATED, this._entity),
        ChapterResponseDto.fromEntities(updatedChapters),
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return this.errorHandler.handle(ctx, error, this._entity);
    } finally {
      await queryRunner.release();
    }
  }

  async updateChapterStatusMany(
    changeChapterStatusDto: ChangeChapterStatusDto,
  ) {
    const ctx = { method: 'updateChapterStatusMany', entity: this._entity };
    this.logger.start(ctx);
    try {
      const { ids, status } = changeChapterStatusDto;

      validateUUIDArray(ids, ctx, this.logger);

      if (!Object.values(Status).includes(status)) {
        const reason = `Invalid status: ${status}. Valid values: ${Object.values(ChapterStatus).join(', ')}`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(reason);
      }

      const uniqueIds = [...new Set(ids)];
      if (uniqueIds.length !== ids.length) {
        this.logger.warn(
          ctx,
          ACTIONS.START,
          `Removed ${ids.length - uniqueIds.length} duplicate IDs`,
        );
      }
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { ids, status } = changeChapterStatusDto;
      const uniqueIds = [...new Set(ids)];

      // Fetch chapters with relations
      const chapters = await queryRunner.manager.find(Chapter, {
        where: { id: In(uniqueIds) },
        relations: [TABLE_RELATIONS.COURSE],
      });

      const foundIds = chapters.map((c) => c.id);
      const notFoundIds = uniqueIds.filter((id) => !foundIds.includes(id));

      if (notFoundIds.length > 0) {
        this.logger.warn(
          ctx,
          ACTIONS.START,
          `Chapters not found: ${notFoundIds.join(', ')}`,
        );
      }

      if (chapters.length === 0) {
        const reason = `No chapters found with provided IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(reason);
      }

      // Validate business rules
      const validationErrors: string[] = [];
      const chaptersToUpdate: Chapter[] = [];
      const skippedChapters: Array<{ id: string; reason: string }> = [];

      for (const chapter of chapters) {
        const { canUpdate, reason } = validateAndSetChapterStatus(
          chapter,
          status,
        );

        if (!canUpdate) {
          if (reason?.startsWith('Already has')) {
            skippedChapters.push({ id: chapter.id, reason });
          } else {
            validationErrors.push(reason as string);
          }
          continue;
        }

        chaptersToUpdate.push(chapter);
      }

      // If there are validation errors but some chapters can be updated
      if (validationErrors.length > 0 && chaptersToUpdate.length > 0) {
        this.logger.warn(
          ctx,
          ACTIONS.UPDATED,
          `Validation errors: ${validationErrors.join('; ')}`,
        );
      }

      // If ALL chapters failed validation
      if (validationErrors.length > 0 && chaptersToUpdate.length === 0) {
        const reason = `Cannot update status: ${validationErrors.join('; ')}`;
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new BadRequestException(reason);
      }

      // Update status for valid chapters
      if (chaptersToUpdate.length > 0) {
        chaptersToUpdate.forEach((chapter) => {
          chapter.status = status;
        });

        await queryRunner.manager.save(Chapter, chaptersToUpdate);
      }

      await queryRunner.commitTransaction();

      this.logger.success(ctx, 'updated');

      return ResponseFactory.success(
        `Successfully updated ${chaptersToUpdate.length} chapter(s) to ${status}`,
        {
          updatedChapters: ChapterResponseDto.fromEntities(chaptersToUpdate),
          updatedAt: new Date(),
          summary: {
            requested: ids.length,
            successful: chaptersToUpdate.length,
            skipped: skippedChapters.length,
            notFound: notFoundIds.length,
            failed: validationErrors.length,
            notFoundIds,
            skippedChapters,
            validationErrors:
              validationErrors.length > 0 ? validationErrors : undefined,
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

  async restoreMany(ids: string[]) {
    const ctx = { method: 'restoreMany', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateUUIDArray(ids, ctx, this.logger);
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const uniqueIds = [...new Set(ids)];
      if (uniqueIds.length !== ids.length) {
        this.logger.warn(
          ctx,
          'start',
          `Removed ${ids.length - uniqueIds.length} duplicate IDs`,
        );
      }

      this.logger.debug(ctx, 'start', `Restoring ${uniqueIds.length} chapters`);

      const chapters =
        await this.chapterCustomRepository.findAllSoftDeletedWithQueryRunner(
          uniqueIds,
          queryRunner,
        );

      const foundIds = chapters.map((c) => c.id);
      const notFoundIds = uniqueIds.filter((id) => !foundIds.includes(id));

      if (notFoundIds.length > 0) {
        this.logger.warn(
          ctx,
          'start',
          `Chapters not found or not deleted: ${notFoundIds.join(', ')}`,
        );
      }

      if (chapters.length === 0) {
        const reason = 'No soft-deleted chapters found with provided IDs';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      const invalidChapters: Array<{ id: string; reason: string }> = [];
      const validChapters: Chapter[] = [];
      const chaptersWithLessons: Map<string, Lesson[]> = new Map();

      for (const chapter of chapters) {
        const validation = validateStatusHelper(
          chapter.course.status,
          chapter.status,
          Action.RESTORE,
          { entityName: 'Chapter', parentName: 'Course' },
        );

        if (!validation.allowed) {
          invalidChapters.push({
            id: chapter.id,
            reason: validation.reason as string,
          });
          continue;
        }
        validChapters.push(chapter);

        if (chapter.lessons && chapter.lessons.length > 0) {
          const softDeletedLessons = chapter.lessons.filter(
            (l) => l.deletedAt !== null,
          );
          if (softDeletedLessons.length > 0) {
            chaptersWithLessons.set(chapter.id, softDeletedLessons);
          }
        }
      }

      if (validChapters.length === 0) {
        const reason = 'No chapters can be restored';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          `${reason}. Reasons: ${invalidChapters.map((c) => c.reason).join('; ')}`,
        );
      }

      const validIds = validChapters.map((c) => c.id);
      const restoreResult = await queryRunner.manager
        .createQueryBuilder()
        .restore()
        .from(Chapter)
        .where('id IN (:...ids)', { ids: validIds })
        .execute();

      this.logger.debug(
        ctx,
        'start',
        `Restored ${restoreResult.affected} chapters`,
      );

      const lessonsByType = {
        [LessonType.CONTENT]: [],
        [LessonType.QUIZ]: [],
        [LessonType.ASSIGNMENT]: [],
      };

      for (const lessons of chaptersWithLessons.values()) {
        for (const lesson of lessons) {
          lessonsByType[lesson.lessonType].push(lesson.id);
        }
      }

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

      await queryRunner.commitTransaction();
      this.logger.success(ctx, 'restored');

      return ResponseFactory.success(
        `Successfully restored ${restoreResult.affected} chapter(s)`,
        {
          restoredIds: validIds,
          restoredAt: new Date(),
          summary: {
            requested: ids.length,
            successful: restoreResult.affected || 0,
            failed: invalidChapters.length,
            notFound: notFoundIds.length,
            // cascadeRestoredLessons: totalLessonsRestored,
            notFoundIds,
            invalidChapters,
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
}
