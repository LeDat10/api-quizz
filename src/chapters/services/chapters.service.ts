import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Chapter } from '../chapter.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChapterResponseDto } from '../dtos/chapter-response.dto';
import { CreateChapterDto } from '../dtos/creater-chapter.dto';
import { CoursesService } from 'src/courses/courses.service';
import {
  generateRadomString,
  generateSlug,
} from 'src/common/utils/course.util';
import { UpdateChapterDto } from '../dtos/update-chapter.dto';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { ChangeChapterStatusDto } from '../dtos/change-chapter-status.dto';
import { ChangeChapterPositionDto } from '../dtos/change-chapter-position.dto';
import { ChapterStatus } from '../enums/chapter.enum';
import { LessonResponseDto } from 'src/lesson/dtos/lesson-response.dto';
import { ChapterBulkService } from './chapter-bulk.service';

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

    try {
      this.logger.debug(
        ctx,
        'start',
        `Creating with title: ${createChapterDto.title}`,
      );

      // Find course
      const course = await this.coursesService.findCourseById(
        createChapterDto.courseId,
      );

      if (!course) {
        const reason = `Course ID ${createChapterDto.courseId} not found`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      this.logger.debug(ctx, 'start', `Course found: ${course.title}`);

      // Generate slug
      let slug = generateSlug(createChapterDto.title);
      const chapterWithSlugExist = await this.chapterRepository.findOneBy({
        slug,
      });

      if (chapterWithSlugExist) {
        this.logger.warn(
          ctx,
          'start',
          `Slug ${slug} exists, appending random string`,
        );
        slug = `${slug}-${generateRadomString()}`;
      }

      // Auto-increment position if not provided
      if (!createChapterDto.position) {
        const count = await this.chapterRepository.count();
        createChapterDto.position = count + 1;
        this.logger.debug(
          ctx,
          'start',
          `Auto-assigned position: ${createChapterDto.position}`,
        );
      }

      // Create and save
      const chapter = this.chapterRepository.create({
        ...createChapterDto,
        slug,
        course,
      });

      const chapterSaved = await this.chapterRepository.save(chapter);
      const chapterSavedResponse = ChapterResponseDto.fromEntity(chapterSaved);

      this.logger.success(ctx, 'created');

      return ResponseFactory.success<ChapterResponseDto>(
        generateMessage('created', this._entity, chapterSaved.id),
        chapterSavedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async updateChapter(id: string, updateChapterDto: UpdateChapterDto) {
    const ctx = { method: 'updateChapter', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const chapter = await this.findChapterById(id);

      // Update course if provided
      if (updateChapterDto.courseId) {
        this.logger.debug(
          ctx,
          'start',
          `Looking for course ID: ${updateChapterDto.courseId}`,
        );
        const course = await this.coursesService.findCourseById(
          updateChapterDto.courseId,
        );

        if (course) {
          chapter.course = course;
          this.logger.debug(ctx, 'start', `Course found: ${course.title}`);
        }
      }

      // Update slug if title changed
      if (updateChapterDto.title && updateChapterDto.title !== chapter.title) {
        let slug = generateSlug(updateChapterDto.title);
        const chapterWithSlugExist = await this.chapterRepository.findOneBy({
          slug,
        });

        if (chapterWithSlugExist && chapterWithSlugExist.id !== id) {
          this.logger.warn(
            ctx,
            'start',
            `Slug ${slug} exists, generating new one`,
          );
          slug = `${slug}-${generateRadomString()}`;
        }

        chapter.slug = slug;
      }

      Object.assign(chapter, updateChapterDto);
      await this.chapterRepository.save(chapter);
      const chapterUpdated = await this.findChapterById(id);
      const chapterUpdatedResponse =
        ChapterResponseDto.fromEntity(chapterUpdated);

      this.logger.success(ctx, 'updated');

      return ResponseFactory.success<ChapterResponseDto>(
        generateMessage('updated', this._entity, id),
        chapterUpdatedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
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

      // Check if chapter has lessons
      if (chapter.lessons && chapter.lessons.length > 0) {
        const reason = `Has ${chapter.lessons.length} existing lessons`;
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const chapterDeleted = await this.chapterRepository.softRemove(chapter);
      const chapterDeletedResponse =
        ChapterResponseDto.fromEntity(chapterDeleted);

      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success<ChapterResponseDto>(
        generateMessage('deleted', this._entity, id),
        chapterDeletedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async hardDeleteChapter(id: string) {
    const ctx = { method: 'hardDeleteChapter', entity: this._entity };
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
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
        relations: ['course'],
      });

      if (!chapter) {
        const reason = 'Not found or not soft-deleted';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const chapterDeleted = await this.chapterRepository.remove(chapter);
      const chapterDeletedResponse =
        ChapterResponseDto.fromEntity(chapterDeleted);

      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success<ChapterResponseDto>(
        generateMessage('deleted', this._entity, id),
        chapterDeletedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
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
    const ctx = { method: 'changeChapterStatusMultiple', entity: this._entity };
    this.logger.start(ctx);
    try {
      const { ids, status } = changeChapterStatusDto;
      const chapters = await this.chapterRepository.find({
        where: { id: In(ids) },
        relations: ['course'],
      });

      if (!chapters.length) {
        const reason = `No chapters found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      for (const chapter of chapters) {
        chapter.status = status;
      }

      await this.chapterRepository.save(chapters);
      const records = await this.chapterRepository.find({
        where: { id: In(ids) },
        relations: ['course'],
      });
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<ChapterResponseDto[]>(
        generateMessage('updated', this._entity),
        ChapterResponseDto.fromEntities(records),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeChapterPositionMultiple(
    changeChapterPositionDtos: ChangeChapterPositionDto[],
  ) {
    return await this.chapterBulkSerice.updateChapterPositionMany(
      changeChapterPositionDtos,
    );
  }

  public async changeChapterStatus(id: string, status: ChapterStatus) {
    const ctx = { method: 'changeChapterStatus', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const chapter = await this.findChapterById(id);
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
