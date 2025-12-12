import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Lesson } from './lesson.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonResponseDto } from './dtos/lesson-response.dto';
import { ChaptersService } from 'src/chapters/chapters.service';
import {
  generateRadomString,
  generateSlug,
} from 'src/common/utils/course.util';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { ChangeLessonStatusDto } from './dtos/change-lesson-status.dto';
import { ChangeLessonPositionDto } from './dtos/change-lesson-position.dto';
import { LessonStatus, LessonType } from './enums/lesson.enum';
import { ContentLessonService } from 'src/content-lesson/content-lesson.service';
import { BaseCreateLessonDto } from './dtos/base-create-lesson.dto';
import { CreateLessonWithContentDto } from './dtos/create-lesson-with-content.dto';
import { ContentLessonResponseDto } from 'src/content-lesson/dtos/content-lesson-response.dto';
import { BaseUpdateLessonDto } from './dtos/base-update-lesson.dto';
import { UdpateLessonWithContentDto } from './dtos/update-lesson-with-content.dto';
import { v4 as uuidv4 } from 'uuid';

export const ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  RESTORED: 'restored',
  FETCHED: 'fetched',
  START: 'start',
  FAILED: 'failed',
} as const;

const TABLE_RELATIONS = {
  CONTENT: 'contentLesson',
  CHAPTER: 'chapter',
} as const;

// Transformer
interface ILessonDataTransformer {
  transform(lesson: Lesson): any;
}

class ContentLessonTransformer implements ILessonDataTransformer {
  transform(lesson: Lesson): ContentLessonResponseDto | null {
    if (!lesson.contentLesson) {
      return null;
    }
    return ContentLessonResponseDto.fromEntity(lesson.contentLesson);
  }
}

class QuizLessonTransformer implements ILessonDataTransformer {
  transform(lesson: Lesson): any {
    // TODO: Implement when QuizLesson feature is added
    // return QuizLessonResponseDto.fromEntity(lesson.quizLesson);
    return null;
  }
}

class AssignmentLessonTransformer implements ILessonDataTransformer {
  transform(lesson: Lesson): any {
    // TODO: Implement when VideoLesson feature is added
    // return AssignmentLessonTransformer.fromEntity(lesson.videoLesson);
    return null;
  }
}

class PdfLessonTransformer implements ILessonDataTransformer {
  transform(lesson: Lesson): any {
    // TODO: Implement when VideoLesson feature is added
    // return PdfLessonTransformer.fromEntity(lesson.videoLesson);
    return null;
  }
}

class DefaultLessonTransformer implements ILessonDataTransformer {
  transform(lesson: Lesson): null {
    return null;
  }
}

// Create Strategy Pattern
interface LessonCreator {
  validate(dto: BaseCreateLessonDto): void;
  prepareData(dto: BaseCreateLessonDto, lesson: Lesson): Promise<void>;
  updateData(dto: BaseUpdateLessonDto, lesson: Lesson): Promise<void>;
}

class ContentLessonCreator implements LessonCreator {
  constructor(private contentLessonService: ContentLessonService) {}

  validate(dto: BaseCreateLessonDto): void {
    const contentDto = dto as CreateLessonWithContentDto;
    if (!contentDto.content) {
      throw new BadRequestException(
        'Content is required for CONTENT type lesson',
      );
    }
  }

  async prepareData(dto: BaseCreateLessonDto, lesson: Lesson): Promise<void> {
    const contentDto = dto as CreateLessonWithContentDto;
    if (!contentDto.content) return;

    await this.contentLessonService.createContentlesson({
      lessonId: lesson.id,
      content: contentDto.content,
    });
  }

  async updateData(dto: BaseUpdateLessonDto, lesson: Lesson): Promise<void> {
    const contentDto = dto as UdpateLessonWithContentDto;

    if (!contentDto.content) {
      return;
    }

    if (lesson.contentLesson) {
      await this.contentLessonService.updateContentLesson({
        id: lesson.contentLesson.id,
        content: contentDto.content,
      });
    } else {
      await this.contentLessonService.createContentlesson({
        lessonId: lesson.id,
        content: contentDto.content,
      });
    }
  }
}

class AssignmentLessonCreator implements LessonCreator {
  constructor(private contentLessonService: ContentLessonService) {}
  updateData(dto: BaseUpdateLessonDto, lesson: Lesson): Promise<void> {
    throw new Error('Method not implemented.');
  }

  validate(dto: BaseCreateLessonDto): void {
    // const contentDto = dto as CreateLessonWithContentDto;
    // if (!contentDto.content) {
    //   throw new BadRequestException('Content is required for CONTENT type lesson');
    // }
  }

  async prepareData(dto: BaseCreateLessonDto, lesson: Lesson): Promise<void> {
    // const contentDto = dto as CreateLessonWithContentDto;
    // await this.contentLessonService.createContentlesson({
    //   lessonId: lesson.id,
    //   content: contentDto.content,
    // });
  }
}

class QuizLessonCreator implements LessonCreator {
  constructor(private contentLessonService: ContentLessonService) {}
  updateData(dto: BaseUpdateLessonDto, lesson: Lesson): Promise<void> {
    throw new Error('Method not implemented.');
  }

  validate(dto: BaseCreateLessonDto): void {
    // const contentDto = dto as CreateLessonWithContentDto;
    // if (!contentDto.content) {
    //   throw new BadRequestException('Content is required for CONTENT type lesson');
    // }
  }

  async prepareData(dto: BaseCreateLessonDto, lesson: Lesson): Promise<void> {
    // const contentDto = dto as CreateLessonWithContentDto;
    // await this.contentLessonService.createContentlesson({
    //   lessonId: lesson.id,
    //   content: contentDto.content,
    // });
  }
}

class PdfLessonCreator implements LessonCreator {
  constructor(private contentLessonService: ContentLessonService) {}
  updateData(dto: BaseUpdateLessonDto, lesson: Lesson): Promise<void> {
    throw new Error('Method not implemented.');
  }

  validate(dto: BaseCreateLessonDto): void {
    // const contentDto = dto as CreateLessonWithContentDto;
    // if (!contentDto.content) {
    //   throw new BadRequestException('Content is required for CONTENT type lesson');
    // }
  }

  async prepareData(dto: BaseCreateLessonDto, lesson: Lesson): Promise<void> {
    // const contentDto = dto as CreateLessonWithContentDto;
    // await this.contentLessonService.createContentlesson({
    //   lessonId: lesson.id,
    //   content: contentDto.content,
    // });
  }
}

@Injectable()
export class LessonService {
  private readonly logger = new LoggerHelper(LessonService.name);
  private readonly errorHandler = new ErrorHandlerHelper(LessonService.name);
  private _entity = 'Lesson';

  private readonly transformers: Record<LessonType, ILessonDataTransformer> = {
    [LessonType.CONTENT]: new ContentLessonTransformer(),
    [LessonType.ASSIGNMENT]: new AssignmentLessonTransformer(),
    [LessonType.QUIZ]: new QuizLessonTransformer(),
    [LessonType.PDF]: new PdfLessonTransformer(),
    // Add more lesson types here as needed
  };

  private readonly defaultTransformer = new DefaultLessonTransformer();

  private readonly lessonCreators: Record<LessonType, LessonCreator>;

  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    private readonly chapterService: ChaptersService,
    private readonly paginationProvider: PaginationProvider,
    private readonly contentLessonService: ContentLessonService,
  ) {
    this.lessonCreators = {
      [LessonType.CONTENT]: new ContentLessonCreator(this.contentLessonService),
      [LessonType.ASSIGNMENT]: new ContentLessonCreator(
        this.contentLessonService,
      ),
      [LessonType.QUIZ]: new ContentLessonCreator(this.contentLessonService),
      [LessonType.PDF]: new ContentLessonCreator(this.contentLessonService),

      // [LessonType.VIDEO]: new VideoLessonCreator(this.videoLessonService),
    };
  }

  private transform = (lesson: Lesson) => {
    const transformer =
      this.transformers[lesson.lessonType] || this.defaultTransformer;
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

  private validateId(id: number, ctx: any) {
    if (!id) {
      const reason = 'Missing parameter id';
      this.logger.warn(ctx, ACTIONS.FAILED, reason);
      throw new BadRequestException(
        generateMessage(ACTIONS.FAILED, this._entity, id, reason),
      );
    }
  }

  public async findLessonById(id: number) {
    const ctx = { method: 'findLessonById', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      this.validateId(id, ctx);

      const lesson = await this.lessonRepository.findOne({
        where: { id },
        relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
      });

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
      this.logger.debug(
        ctx,
        ACTIONS.START,
        'Querying database for all lessons',
      );

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

  public async getDetailLesson(id: number) {
    const ctx = { method: 'getDetailLesson', entity: this._entity, id };
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
      const creator = this.lessonCreators[createLessonDto.lessonType];

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
      let slug = generateSlug(createLessonDto.title);
      const lessonWithSlugExist = await this.lessonRepository.findOneBy({
        slug,
      });

      if (lessonWithSlugExist) {
        this.logger.warn(
          ctx,
          ACTIONS.START,
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
          ACTIONS.START,
          `Auto-assigned position: ${createLessonDto.position}`,
        );
      }

      // Create and save
      const lesson = this.lessonRepository.create({
        ...createLessonDto,
        chapter,
        slug,
      });

      const savedLesson = await this.lessonRepository.save(lesson);

      await creator.prepareData(createLessonDto, savedLesson);

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

  public async updateLesson(id: number, updateLessonDto: BaseUpdateLessonDto) {
    const ctx = { method: 'updateLesson', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      this.validateId(id, ctx);

      const lesson = await this.lessonRepository.findOne({
        where: { id },
        relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
      });

      if (!lesson) {
        const reason = 'Not found';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(ACTIONS.FAILED, this._entity, id, reason),
        );
      }

      const creator = this.lessonCreators[lesson.lessonType];

      // Update chapter if provided
      if (updateLessonDto.chapterId) {
        this.logger.debug(
          ctx,
          ACTIONS.START,
          `Looking for chapter ID: ${updateLessonDto.chapterId}`,
        );
        const chapter = await this.chapterService.findChapterById(
          updateLessonDto.chapterId,
        );

        if (chapter) {
          lesson.chapter = chapter;
          this.logger.debug(
            ctx,
            ACTIONS.START,
            `Chapter found: ${chapter.title}`,
          );
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
            ACTIONS.START,
            `Slug ${slug} exists, generating new one`,
          );
          slug = `${slug}-${generateRadomString()}`;
        }

        lesson.slug = slug;
      }

      const data = Object.fromEntries(
        Object.entries(updateLessonDto).filter(([_, v]) => v !== undefined),
      );

      Object.assign(lesson, data);

      await this.lessonRepository.save(lesson);
      await creator.updateData(updateLessonDto, lesson);
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

  public async softDeleteLesson(id: number) {
    const ctx = { method: 'softDeleteLesson', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      this.validateId(id, ctx);

      const lesson = await this.findLessonById(id);
      const lessonDeleted = await this.lessonRepository.softRemove(lesson);
      const lessonDeletedResponse = LessonResponseDto.fromEntity(lessonDeleted);

      this.logger.success(ctx, ACTIONS.DELETED);

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage(ACTIONS.DELETED, this._entity, id),
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
      this.validateId(id, ctx);

      const lesson = await this.lessonRepository.findOne({
        where: { id, deletedAt: Not(IsNull()) },
        withDeleted: true,
        relations: [TABLE_RELATIONS.CHAPTER, TABLE_RELATIONS.CONTENT],
      });

      if (!lesson) {
        const reason = 'Not found or not soft-deleted';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(ACTIONS.FAILED, this._entity, id, reason),
        );
      }

      const lessonDeleted = await this.lessonRepository.remove(lesson);
      const lessonDeletedResponse = LessonResponseDto.fromEntity(lessonDeleted);

      this.logger.success(ctx, ACTIONS.DELETED);

      return ResponseFactory.success<LessonResponseDto>(
        generateMessage(ACTIONS.DELETED, this._entity, id),
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
      this.validateId(id, ctx);

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

  public async changeLessonStatus(id: number, status: LessonStatus) {
    const ctx = { method: 'changeLessonStatus', entity: this._entity };
    this.logger.start(ctx);

    try {
      this.validateId(id, ctx);

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
