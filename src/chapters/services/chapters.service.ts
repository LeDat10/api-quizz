import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { Chapter } from '../chapter.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChapterResponseDto } from '../dtos/chapter-response.dto';
import { CreateChapterDto } from '../dtos/creater-chapter.dto';
import { CoursesService } from 'src/courses/courses.service';
import { UpdateChapterDto } from '../dtos/update-chapter.dto';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { ChangeChapterStatusDto } from '../dtos/change-chapter-status.dto';
import { ChangeChapterPositionDto } from '../dtos/change-chapter-position.dto';
import { LessonResponseDto } from 'src/lesson/dtos/lesson-response.dto';
import { ChapterBulkService } from './chapter-bulk.service';
import { validateId } from 'src/lesson/helpers/lesson-validator.helper';
import { ACTIONS } from 'src/common/common.type';
import { ChapterCustomRepository } from '../repositories/chapter.repository';
import { Course } from 'src/courses/course.entity';
import {
  validateParentStatusChangeWithChildren,
  validateStatusHelper,
  validateStatusTransition,
} from 'src/common/status';
import { Status } from 'src/common/status/enums/status.enum';
import { validateAndSetChapterStatus } from '../helpers/validate-status.helper';
import { Action } from 'src/common/status/enums/action.enum';
import { Lesson } from 'src/lesson/lesson.entity';
import { ContentLesson } from 'src/content-lesson/content-lesson.entity';

@Injectable()
export class ChaptersService {
  private readonly logger = new LoggerHelper(ChaptersService.name);
  private readonly errorHandler = new ErrorHandlerHelper(ChaptersService.name);
  private _entity = 'Chapter';
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    private readonly coursesService: CoursesService,
    private readonly paginationProvider: PaginationProvider,
    private readonly chapterBulkSerice: ChapterBulkService,
    private readonly chapterCustomRepository: ChapterCustomRepository,
    private readonly connection: DataSource,
  ) {}

  private transform = (chapter: Chapter) => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    status: chapter.status,
    position: chapter.position,
    slug: chapter.slug,
    courseId: chapter.course?.id,
    lessons: chapter.lessons
      ? LessonResponseDto.fromEntities(chapter.lessons)
      : null,
    createdAt: chapter.createdAt,
    updatedAt: chapter.updatedAt,
    deletedAt: chapter.deletedAt,
  });

  public async findChapterById(id: string) {
    const ctx = { method: 'findChapterById', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const chapter = await this.chapterRepository.findOne({
        where: { id },
        relations: ['course'],
      });

      if (!chapter) {
        const reason = 'Not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      this.logger.success(ctx, 'fetched');
      return chapter;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async getAllChapter(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllChapter', entity: this._entity };
    this.logger.start(ctx);

    try {
      this.logger.debug(ctx, 'start', 'Querying database for all chapters');

      const chapters = await this.paginationProvider.paginateQuery<
        Chapter,
        ChapterResponseDto
      >(paginationQueryDto, this.chapterRepository, this.transform, {
        order: { position: 'ASC' },
        relations: ['course'],
      });

      if (!chapters.data.length) {
        this.logger.warn(ctx, 'fetched', 'No chapters found');
      } else {
        this.logger.success(ctx, 'fetched');
      }

      return chapters;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async getChapterDetail(id: string) {
    const ctx = { method: 'getChapterDetail', entity: this._entity };
    this.logger.start(ctx);

    try {
      const chapter = await this.findChapterById(id);
      const chapterResponse = ChapterResponseDto.fromEntity(chapter);

      this.logger.success(ctx, 'fetched');

      return ResponseFactory.success<ChapterResponseDto>(
        generateMessage('fetched', this._entity, id),
        chapterResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async createChapter(createChapterDto: CreateChapterDto) {
    const ctx = { method: 'createChapter', entity: this._entity };
    this.logger.start(ctx);

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.debug(
        ctx,
        'start',
        `Creating with title: ${createChapterDto.title}`,
      );

      // Find course
      const course = await queryRunner.manager.findOne(Course, {
        where: { id: createChapterDto.courseId },
        lock: { mode: 'pessimistic_write' }, // Lock course row
      });

      if (!course) {
        const reason = `Course with ID ${createChapterDto.courseId} not found`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      this.logger.debug(ctx, 'start', `Found course: "${course.title}"`);
      const { allowed, reason } = validateStatusHelper(
        course.status, // parent status
        null, // child status (null for CREATE)
        Action.CREATE,
        {
          entityName: 'Chapter',
          parentName: 'Course',
        },
      );

      if (!allowed) {
        this.logger.warn(ctx, ACTIONS.FAILED, reason); // Fix: 'failed' not ACTIONS.CREATED
        throw new BadRequestException(reason);
      }

      // Generate slug
      const slug =
        await this.chapterCustomRepository.generateUniqueSlugWithQueryRunner(
          createChapterDto.title,
          queryRunner,
        );

      this.logger.debug(ctx, 'start', `Generated slug: "${slug}"`);

      // Auto-increment position if not provided
      const position =
        await this.chapterCustomRepository.getNextPositionWithQueryRunner(
          createChapterDto.courseId,
          queryRunner,
        );

      this.logger.debug(ctx, 'start', `Assigned position: ${position}`);

      // Create and save
      const chapter = queryRunner.manager.create(Chapter, {
        ...createChapterDto,
        slug,
        course,
        position,
      });

      const saved = await queryRunner.manager.save(Chapter, chapter);
      await queryRunner.commitTransaction();
      const chapterSavedResponse = ChapterResponseDto.fromEntity(saved);

      this.logger.success(ctx, 'created');

      return ResponseFactory.success<ChapterResponseDto>(
        generateMessage('created', this._entity, saved.id),
        chapterSavedResponse,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return this.errorHandler.handle(ctx, error, this._entity);
    } finally {
      await queryRunner.release();
    }
  }

  public async updateChapter(id: string, updateChapterDto: UpdateChapterDto) {
    const ctx = { method: 'updateChapter', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateId(id, ctx, this.logger);
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chapter =
        await this.chapterCustomRepository.findChapterByIdWithQueryRunner(
          id,
          queryRunner,
        );
      if (!chapter) {
        const reason = 'Chapter not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }
      this.logger.debug(
        ctx,
        'start',
        `Updating chapter: "${chapter.title}" in course: "${chapter.course.title}"`,
      );

      const { allowed, reason } = validateStatusHelper(
        chapter.course.status,
        chapter.status,
        Action.UPDATE,
      );

      if (!allowed) {
        this.logger.warn(ctx, ACTIONS.UPDATED, reason);
        throw new BadRequestException(reason);
      }

      const originalCourseId = chapter.course.id;
      const originalTitle = chapter.title;

      const newPosition =
        await this.chapterCustomRepository.getNextPositionWithQueryRunner(
          originalCourseId,
          queryRunner,
        );

      chapter.position = newPosition;

      if (updateChapterDto.status) {
        const { allowed, reason } = validateStatusTransition(
          chapter.status,
          updateChapterDto.status,
          {
            parentStatus: chapter.course.status,
            entityName: 'Chapter',
            parentName: 'Course',
          },
        );

        if (!allowed) {
          this.logger.warn(ctx, ACTIONS.UPDATED, reason);
          throw new BadRequestException(reason);
        }

        // if (chapter.lessons && chapter.lessons.length > 0) {
        //   const childStatuses = chapter.lessons.map((l) => l.lessonStatus);
        //   const { allowed, reason } = validateParentStatusChangeWithChildren(
        //     chapter.status,
        //     updateChapterDto.status,
        //     childStatuses,
        //   );
        // }
        chapter.status = updateChapterDto.status;
      }

      // Update slug if title changed
      if (updateChapterDto.title && updateChapterDto.title !== chapter.title) {
        this.logger.debug(
          ctx,
          'start',
          `Updating title from "${originalTitle}" to "${updateChapterDto.title}"`,
        );
        const slug =
          await this.chapterCustomRepository.generateUniqueSlugWithQueryRunner(
            originalTitle,
            queryRunner,
          );
        chapter.title = updateChapterDto.title;
        chapter.slug = slug;
      }

      if (updateChapterDto.description !== undefined) {
        chapter.description = updateChapterDto.description;
      }
      const saved = await queryRunner.manager.save(Chapter, chapter);
      await queryRunner.commitTransaction();

      // const chapterUpdated = await this.findChapterById(id);
      const chapterUpdatedResponse = ChapterResponseDto.fromEntity(saved);
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<ChapterResponseDto>(
        generateMessage('updated', this._entity, id),
        chapterUpdatedResponse,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return this.errorHandler.handle(ctx, error, this._entity, id);
    } finally {
      await queryRunner.release();
    }
  }

  public async getAllChapterDeleted(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllChapterDeleted', entity: this._entity };
    this.logger.start(ctx);
    try {
      const chaptersDeleted = await this.paginationProvider.paginateQuery<
        Chapter,
        ChapterResponseDto
      >(paginationQueryDto, this.chapterRepository, this.transform, {
        withDeleted: true,
        where: {
          deletedAt: Not(IsNull()),
        },
        relations: ['course'],
        order: { position: 'ASC' },
      });
      if (!chaptersDeleted.data.length) {
        this.logger.warn(ctx, 'fetched', 'No deleted chapters found');
      } else {
        this.logger.success(ctx, 'fetched');
      }
      return chaptersDeleted;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async softDeleteChapter(id: string) {
    const ctx = { method: 'softDeleteChapter', entity: this._entity };
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
      const chapter =
        await this.chapterCustomRepository.findChapterByIdWithQueryRunner(
          id,
          queryRunner,
        );

      if (!chapter) {
        const reason = 'Chapter not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      this.logger.debug(
        ctx,
        'start',
        `Soft deleting chapter: "${chapter.title}" from course: "${chapter.course.title}"`,
      );

      const validation = validateStatusHelper(
        chapter.course.status,
        chapter.status,
        Action.DELETE,
        { entityName: 'Chapter', parentName: 'Course' },
      );
      if (!validation.allowed) {
        this.logger.warn(ctx, 'failed', validation.reason);
        throw new BadRequestException(validation.reason);
      }

      // Check if chapter has lessons
      if (chapter.lessons && chapter.lessons.length > 0) {
        this.logger.debug(
          ctx,
          'start',
          `Chapter has ${chapter.lessons.length} lessons`,
        );

        const lessonIds = chapter.lessons.map((l) => l.id);
        await queryRunner.manager
          .createQueryBuilder()
          .softDelete()
          .from(Lesson)
          .where('id IN (:...ids)', { ids: lessonIds })
          .execute();
        this.logger.debug(
          ctx,
          'start',
          `Cascade soft deleted ${lessonIds.length} lessons`,
        );
      }

      const result = await queryRunner.manager
        .createQueryBuilder()
        .softDelete()
        .from(Chapter)
        .where('id = :id', { id })
        .execute();

      if (result.affected === 0) {
        throw new NotFoundException('Chapter not found or already deleted');
      }

      await queryRunner.commitTransaction();
      this.logger.success(ctx, 'deleted');
      return ResponseFactory.success(
        generateMessage('deleted', this._entity, id),
        {
          id: chapter.id,
          title: chapter.title,
          courseId: chapter.course.id,
          deletedAt: new Date(),
          cascadeDeletedLessons: chapter.lessons?.length || 0,
        },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return this.errorHandler.handle(ctx, error, this._entity, id);
    } finally {
      await queryRunner.release();
    }
  }

  public async hardDeleteChapter(id: string) {
    const ctx = { method: 'hardDeleteChapter', entity: this._entity };
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
      const chapter =
        await this.chapterCustomRepository.findSoftDeletedChapterWithQueryRunner(
          id,
          queryRunner,
        );

      if (!chapter) {
        const reason = 'Not found or not soft-deleted';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      this.logger.debug(
        ctx,
        'start',
        `Hard deleting chapter: "${chapter.title}" from course: "${chapter.course.title}"`,
      );

      if (chapter.course.status === Status.PUBLISHED) {
        const reason =
          'Cannot permanently delete chapter from published course';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          `${reason}. Archive the course first, or use soft delete.`,
        );
      }

      const chapterInfo = {
        id: chapter.id,
        title: chapter.title,
        courseId: chapter.course.id,
        courseTitle: chapter.course.title,
        position: chapter.position,
        lessonsCount: chapter.lessons?.length || 0,
      };

      if (chapter.lessons && chapter.lessons.length > 0) {
        this.logger.debug(
          ctx,
          'start',
          `Hard deleting ${chapter.lessons.length} lessons`,
        );

        const lessonIds = chapter.lessons.map((l) => l.id);

        await queryRunner.manager.delete(ContentLesson, {
          lessonId: In(lessonIds),
        });

        await queryRunner.manager.delete(Lesson, {
          id: In(lessonIds),
        });

        this.logger.debug(
          ctx,
          'start',
          `Cascade deleted ${lessonIds.length} lessons and their content`,
        );
      }

      await queryRunner.manager.delete(Chapter, { id });

      // Reorder remaining chapters
      await this.chapterCustomRepository.reorderChaptersAfterDeletion(
        chapter.course.id,
        chapter.position,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      this.logger.success(ctx, 'deleted');
      return ResponseFactory.success(
        generateMessage('deleted', this._entity, id),
        {
          id: chapterInfo.id,
          title: chapterInfo.title,
          courseId: chapterInfo.courseId,
          deletedAt: new Date(),
          permanentlyDeleted: true,
          cascadeDeletedLessons: chapterInfo.lessonsCount,
        },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return this.errorHandler.handle(ctx, error, this._entity, id);
    } finally {
      await queryRunner.release();
    }
  }

  public async restoreChapter(id: string) {
    const ctx = { method: 'restoreChapter', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const result = await this.chapterRepository.restore(id);

      if (result.affected === 0) {
        const reason = 'Not found or already active';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const chapter = await this.findChapterById(id);
      if (!chapter) {
        const reason = 'Not found after restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const chapterResponse = ChapterResponseDto.fromEntity(chapter);
      this.logger.success(ctx, 'restored');

      return ResponseFactory.success<ChapterResponseDto>(
        generateMessage('restored', this._entity, id),
        chapterResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async restoreChapterMultiple(ids: number[]) {
    const ctx = { method: 'restoreChapterMultiple', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!ids || ids.length === 0) {
        const reason = 'No chapter IDs provided';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      this.logger.debug(ctx, 'start', `Restoring IDs: ${ids.join(', ')}`);

      const result = await this.chapterRepository.restore({ id: In(ids) });

      if (result.affected === 0) {
        const reason = 'No chapters found to restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      const chapters = await this.chapterRepository.find({
        where: { id: In(ids) },
        relations: ['course'],
      });

      if (!chapters.length) {
        const reason = 'Chapters not found after restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      const chaptersResponse = ChapterResponseDto.fromEntities(chapters);
      this.logger.success(ctx, 'restored');

      return ResponseFactory.success<ChapterResponseDto[]>(
        `${chapters.length} chapters restored successfully`,
        chaptersResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeChapterStatusMultiple(
    changeChapterStatusDto: ChangeChapterStatusDto,
  ) {
    return await this.chapterBulkSerice.updateChapterStatusMany(
      changeChapterStatusDto,
    );
  }

  public async changeChapterPositionMultiple(
    changeChapterPositionDtos: ChangeChapterPositionDto[],
  ) {
    return await this.chapterBulkSerice.updateChapterPositionMany(
      changeChapterPositionDtos,
    );
  }

  public async changeChapterStatus(id: string, status: Status) {
    const ctx = { method: 'changeChapterStatus', entity: this._entity };
    this.logger.start(ctx);

    try {
      validateId(id, ctx, this.logger);

      const chapter = await this.findChapterById(id);
      const { canUpdate, reason } = validateAndSetChapterStatus(
        chapter,
        status,
      );

      if (!canUpdate) {
        this.logger.warn(ctx, ACTIONS.UPDATED, `Validation error: ${reason}`);
        throw new BadRequestException(reason);
      }

      chapter.status = status;
      const record = await this.chapterRepository.save(chapter);
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<ChapterResponseDto>(
        generateMessage('updated', this._entity, id),
        ChapterResponseDto.fromEntity(record),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async getChaptersByCourseId(courseId: number) {
    const ctx = { method: 'getChaptersByCourseId', entity: this._entity };
    this.logger.start(ctx);
    try {
      if (!courseId) {
        const reason = 'Missing parameter courseId';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      const course = await this.coursesService.findCourseById(courseId);

      if (!course) {
        const reason = `Can not found course by ${courseId}`;
        this.logger.fail(ctx, reason, 'fetched');
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      const chapters = await this.chapterRepository.find({
        where: { course },
        order: { position: 'asc' },
        relations: ['course'],
      });

      this.logger.success(ctx, 'fetched');
      return ResponseFactory.success<ChapterResponseDto[]>(
        generateMessage('fetched', this._entity),
        ChapterResponseDto.fromEntities(chapters),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }
}
