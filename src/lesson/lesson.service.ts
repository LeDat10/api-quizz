import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Lesson } from './lesson.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonResponseDto } from './dtos/lesson-response.dto';
import { CreateLessonDto } from './dtos/create-lesson.dto';
import { ChaptersService } from 'src/chapters/chapters.service';
import {
  generateRadomString,
  generateSlug,
} from 'src/common/utils/course.util';
import { UpdateLessonDto } from './dtos/update-lesson.dto';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { ChangeLessonStatusDto } from './dtos/change-lesson-status.dto';
import { ChangeLessonPositionDto } from './dtos/change-lesson-position.dto';
import { LessonStatus } from './enums/lesson.enum';

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
  ) {}

  private transform = (lesson: Lesson) => ({
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
  });

  public async findLessonById(id: number) {
    const ctx = { method: 'findLessonById', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const lesson = await this.lessonRepository.findOne({
        where: { id },
        relations: ['chapter'],
      });

      if (!lesson) {
        const reason = 'Not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      this.logger.success(ctx, 'fetched');
      return lesson;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async getAllLessons(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllLessons', entity: this._entity };
    this.logger.start(ctx);

    try {
      this.logger.debug(ctx, 'start', 'Querying database for all lessons');

      const lessons = await this.paginationProvider.paginateQuery<
        Lesson,
        LessonResponseDto
      >(paginationQueryDto, this.lessonRepository, this.transform, {
        order: { position: 'ASC' },
        relations: ['chapter'],
      });

      this.logger.success(ctx, 'fetched');
      return lessons;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async getDetailLesson(id: number) {
    const ctx = { method: 'getDetailLesson', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      const lesson = await this.findLessonById(id);
      const lessonResponse = LessonResponseDto.fromEntity(lesson);

      this.logger.success(ctx, 'fetched');

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage('fetched', this._entity, id),
        lessonResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async createLesson(createLessonDto: CreateLessonDto) {
    const ctx = { method: 'createLesson', entity: this._entity };
    this.logger.start(ctx);

    try {
      this.logger.debug(
        ctx,
        'start',
        `Creating with title: ${createLessonDto.title}`,
      );

      // Find chapter
      const chapter = await this.chapterService.findChapterById(
        createLessonDto.chapterId,
      );

      if (!chapter) {
        const reason = `Chapter ID ${createLessonDto.chapterId} not found`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      this.logger.debug(ctx, 'start', `Chapter found: ${chapter.title}`);

      // Generate slug
      let slug = generateSlug(createLessonDto.title);
      const lessonWithSlugExist = await this.lessonRepository.findOneBy({
        slug,
      });

      if (lessonWithSlugExist) {
        this.logger.warn(
          ctx,
          'start',
          `Slug ${slug} exists, appending random string`,
        );
        slug = `${slug}-${generateRadomString()}`;
      }

      // Auto-increment position if not provided
      if (!createLessonDto.position) {
        const count = await this.lessonRepository.count();
        createLessonDto.position = count + 1;
        this.logger.debug(
          ctx,
          'start',
          `Auto-assigned position: ${createLessonDto.position}`,
        );
      }

      // Create and save
      const lesson = this.lessonRepository.create({
        ...createLessonDto,
        slug,
        chapter,
      });

      const lessonSaved = await this.lessonRepository.save(lesson);
      const lessonSavedResponse = LessonResponseDto.fromEntity(lessonSaved);

      this.logger.success(ctx, 'created');

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage('created', this._entity, lessonSaved.id),
        lessonSavedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async updateLesson(id: number, updateLessonDto: UpdateLessonDto) {
    const ctx = { method: 'updateLesson', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const lesson = await this.lessonRepository.findOne({
        where: { id },
        relations: ['chapter'],
      });

      if (!lesson) {
        const reason = 'Not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      // Update chapter if provided
      if (updateLessonDto.chapterId) {
        this.logger.debug(
          ctx,
          'start',
          `Looking for chapter ID: ${updateLessonDto.chapterId}`,
        );
        const chapter = await this.chapterService.findChapterById(
          updateLessonDto.chapterId,
        );

        if (chapter) {
          lesson.chapter = chapter;
          this.logger.debug(ctx, 'start', `Chapter found: ${chapter.title}`);
        }
      }

      // Update slug if title changed
      if (updateLessonDto.title && updateLessonDto.title !== lesson.title) {
        let slug = generateSlug(updateLessonDto.title);
        const lessonWithSlugExist = await this.lessonRepository.findOneBy({
          slug,
        });

        if (lessonWithSlugExist && lessonWithSlugExist.id !== id) {
          this.logger.warn(
            ctx,
            'start',
            `Slug ${slug} exists, generating new one`,
          );
          slug = `${slug}-${generateRadomString()}`;
        }

        lesson.slug = slug;
      }

      Object.assign(lesson, updateLessonDto);
      await this.lessonRepository.save(lesson);
      const lessonUpdated = await this.findLessonById(id);
      const lessonUpdatedResponse = LessonResponseDto.fromEntity(lessonUpdated);

      this.logger.success(ctx, 'updated');

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage('updated', this._entity, id),
        lessonUpdatedResponse,
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
        relations: ['chapter'],
      });

      if (!lessonsDeleted.data.length) {
        this.logger.warn(ctx, 'fetched', 'No deleted lessons found');
      } else {
        this.logger.success(ctx, 'fetched');
      }

      return lessonsDeleted;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async softDeleteLesson(id: number) {
    const ctx = { method: 'softDeleteLesson', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const lesson = await this.findLessonById(id);
      const lessonDeleted = await this.lessonRepository.softRemove(lesson);
      const lessonDeletedResponse = LessonResponseDto.fromEntity(lessonDeleted);

      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage('deleted', this._entity, id),
        lessonDeletedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async hardDeleteLesson(id: number) {
    const ctx = { method: 'hardDeleteLesson', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const lesson = await this.lessonRepository.findOne({
        where: { id, deletedAt: Not(IsNull()) },
        withDeleted: true,
        relations: ['chapter'],
      });

      if (!lesson) {
        const reason = 'Not found or not soft-deleted';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const lessonDeleted = await this.lessonRepository.remove(lesson);
      const lessonDeletedResponse = LessonResponseDto.fromEntity(lessonDeleted);

      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage('deleted', this._entity, id),
        lessonDeletedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async restoreLesson(id: number) {
    const ctx = { method: 'restoreLesson', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const result = await this.lessonRepository.restore(id);

      if (result.affected === 0) {
        const reason = 'Not found or already active';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const lesson = await this.findLessonById(id);
      if (!lesson) {
        const reason = 'Not found after restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const lessonResponse = LessonResponseDto.fromEntity(lesson);
      this.logger.success(ctx, 'restored');

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage('restored', this._entity, id),
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
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      this.logger.debug(ctx, 'start', `Restoring IDs: ${ids.join(', ')}`);

      const result = await this.lessonRepository.restore({ id: In(ids) });

      if (result.affected === 0) {
        const reason = 'No lessons found to restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      const lessons = await this.lessonRepository.find({
        where: { id: In(ids) },
        relations: ['chapter'],
      });

      if (!lessons.length) {
        const reason = 'Lessons not found after restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      const lessonsResponse = LessonResponseDto.fromEntities(lessons);
      this.logger.success(ctx, 'restored');

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
        'start',
        `Updating status for lessons with IDs: ${ids.join(', ')}, new status: ${status}`,
      );

      const lessons = await this.lessonRepository.find({
        where: { id: In(ids) },
        relations: ['chapter'],
      });

      if (!lessons.length) {
        const reason = `No lessons found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      for (const lesson of lessons) {
        lesson.lessonStatus = status;
      }

      await this.lessonRepository.save(lessons);
      const records = await this.lessonRepository.find({
        where: { id: In(ids) },
        relations: ['chapter'],
      });
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<LessonResponseDto[]>(
        generateMessage('updated', this._entity),
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
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('updated', this._entity, undefined, reason),
        );
      }

      const ids = changLessonPositionDtos.map((d) => d.id);
      this.logger.debug(
        ctx,
        'start',
        `Updating positions for lessons with IDs: ${ids.join(', ')}`,
      );
      const lessons = await this.lessonRepository.find({
        where: { id: In(ids) },
        relations: ['chapter'],
      });

      if (!lessons.length) {
        const reason = `No lessons found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, 'failed', reason);
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
        relations: ['chapter'],
      });
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<LessonResponseDto[]>(
        `Updated positions for ${records.length} lessons`,
        LessonResponseDto.fromEntities(records),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeLessonStatus(id: number, status: LessonStatus) {
    const ctx = { method: 'changeLessonStatus', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const lesson = await this.findLessonById(id);
      lesson.lessonStatus = status;
      const record = await this.lessonRepository.save(lesson);
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<LessonResponseDto>(
        generateMessage('updated', this._entity, id),
        LessonResponseDto.fromEntity(record),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }
}
