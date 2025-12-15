import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentLesson } from './content-lesson.entity';
import { In, IsNull, Repository } from 'typeorm';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { CreateContentLessonDto } from './dtos/create-content-lesson.dto';
import { UpdateContentlessonDto } from './dtos/update-content-lesson.dto';
import { ACTIONS } from 'src/common/common.type';

@Injectable()
export class ContentLessonService {
  private readonly logger = new LoggerHelper(ContentLessonService.name);
  private readonly errorHandler = new ErrorHandlerHelper(
    ContentLessonService.name,
  );
  private _entity = 'ContentLesson';
  constructor(
    @InjectRepository(ContentLesson)
    private readonly contentLessonRepository: Repository<ContentLesson>,
  ) {}

  public async findContentLessonById(id: number) {
    const ctx = { method: 'findContentLessonById', entity: this._entity, id };
    this.logger.start(ctx);
    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const record = await this.contentLessonRepository.findOne({
        where: { id },
      });

      if (!record) {
        const reason = 'Not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      this.logger.success(ctx, 'fetched');
      return record;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async findContentLessonByLessonId(lessonId: string) {
    const ctx = {
      method: 'findContentLessonByLessonId',
      entity: this._entity,
      lessonId,
    };
    this.logger.start(ctx);
    try {
      if (!lessonId) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, lessonId, reason),
        );
      }

      const record = await this.contentLessonRepository.findOne({
        where: { lesson: { id: lessonId } },
      });

      if (!record) {
        const reason = `Not found ContentLesson with Lesson Id: ${lessonId}`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, lessonId, reason),
        );
      }

      this.logger.success(ctx, 'fetched');
      return record;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, lessonId);
    }
  }

  public async createContentlesson(
    createContentLessonDto: CreateContentLessonDto,
  ) {
    const ctx = { method: 'createContentlesson', entity: this._entity };
    this.logger.start(ctx);
    try {
      const { lessonId, content } = createContentLessonDto;

      // if (!(lesson instanceof Lesson)) {
      //   const reason =
      //     'The "lesson" field is invalid or missing required data.';
      //   this.logger.warn(ctx, 'created', reason);
      //   throw new BadRequestException(
      //     generateMessage('created', this._entity, undefined, reason),
      //   );
      // }

      const contentLesson = this.contentLessonRepository.create({
        content,
        lesson: { id: lessonId },
      });

      const record = await this.contentLessonRepository.save(contentLesson);

      this.logger.success(ctx, 'created');
      return record;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async updateContentLesson(
    updateContentLessonDto: UpdateContentlessonDto,
  ) {
    const ctx = { method: 'updateContentLesson', entity: this._entity };
    this.logger.start(ctx);
    try {
      const contentLesson = await this.findContentLessonById(
        updateContentLessonDto.id,
      );
      contentLesson.content = updateContentLessonDto.content;

      this.logger.success(ctx, 'updated');
      await this.contentLessonRepository.save(contentLesson);
      return contentLesson;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async softDeleteContent(contentEntity: ContentLesson) {
    const ctx = { method: 'softDeleteContent', entity: this._entity };
    this.logger.start(ctx);
    try {
      const contentDeleted =
        await this.contentLessonRepository.softRemove(contentEntity);

      this.logger.success(ctx, 'deleted');
      return contentDeleted;
    } catch (error) {
      return this.errorHandler.handle(
        ctx,
        error,
        this._entity,
        contentEntity.id,
      );
    }
  }

  public async hardDeleteContent(contentEntity: ContentLesson) {
    const ctx = { method: 'hardDeleteContent', entity: this._entity };
    this.logger.start(ctx);
    try {
      const content = await this.contentLessonRepository.findOne({
        where: { id: contentEntity.id },
        withDeleted: true,
      });

      if (!content) {
        const reason = 'Not found or not soft-deleted';
        this.logger.warn(ctx, ACTIONS.FAILED, reason);
        throw new NotFoundException(
          generateMessage(
            ACTIONS.FAILED,
            this._entity,
            contentEntity.id,
            reason,
          ),
        );
      }

      const contentDeleted = await this.contentLessonRepository.remove(content);
      this.logger.success(ctx, 'deleted');
      return contentDeleted;
    } catch (error) {
      return this.errorHandler.handle(
        ctx,
        error,
        this._entity,
        contentEntity.id,
      );
    }
  }

  public async softDeleteManyContent(lessonIds: number[]) {
    const ctx = { method: 'softDeleteManyContent', entity: this._entity };
    this.logger.start(ctx);
    try {
      if (!lessonIds || !lessonIds.length) {
        const reason = 'lessonIds must not be empty';
        this.logger.warn(ctx, 'deleted', reason);
        throw new BadRequestException(reason);
      }

      const existingContents = await this.contentLessonRepository.find({
        where: {
          lesson: {
            id: In(lessonIds),
          },
          deletedAt: IsNull(),
        },
        select: ['id'],
      });

      if (!existingContents.length) {
        const reason =
          'No active content lessons found for the provided lesson IDs.';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      const contentLessonIds = existingContents.map((cl) => cl.id);

      const result = await this.contentLessonRepository
        .createQueryBuilder()
        .softDelete()
        .where('id IN (:...ids)', { ids: contentLessonIds })
        .execute();

      if (result.affected === 0) {
        const reason = 'No content lessons found for the given ids';
        this.logger.warn(ctx, 'deleted', reason);
        throw new NotFoundException(reason);
      }

      return result;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }
}
