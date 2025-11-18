import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, IsNull, Not, Repository } from 'typeorm';
import { ResourceLibrary } from './resource-library.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { ResourceLibraryResponseDto } from './dtos/resource-library-response.dto';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { CreateResourceLibraryDto } from './dtos/create-resource-library.dto';
import {
  generateRadomString,
  generateSlug,
} from 'src/common/utils/course.util';
import { UpdateResourceLibraryDto } from './dtos/update-resource-library.dto';
import { ChangeResourceLibraryPositionDto } from './dtos/change-resource-library-position.dto';
import { ChangeResourceLibraryStatusDto } from './dtos/change-resource-library-status.dto';
import { LibraryStatus } from './enums/resource-library.enum';

@Injectable()
export class ResourceLibraryService {
  private readonly logger = new LoggerHelper(ResourceLibraryService.name);
  private readonly errorHandler = new ErrorHandlerHelper(
    ResourceLibraryService.name,
  );
  private _entity: string = 'ResourceLibrary';

  private transform = (entity: ResourceLibrary) => ({
    id: entity.id,
    name: entity.name,
    description: entity.description,
    position: entity.position,
    slug: entity.slug,
    status: entity.status,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.createdAt,
  });

  constructor(
    @InjectRepository(ResourceLibrary)
    private readonly resourceLibraryRepository: Repository<ResourceLibrary>,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  public async findResourceLibraryById(id: number) {
    const ctx = { method: 'findResourceLibraryById', entity: this._entity, id };
    this.logger.start(ctx);
    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const resourceLibrary = await this.resourceLibraryRepository.findOne({
        where: { id },
      });

      if (!resourceLibrary) {
        const reason = 'Not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      this.logger.success(ctx, 'fetched');

      return resourceLibrary;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async getAllLibrary(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllLibrary', entity: this._entity };
    this.logger.start(ctx);

    try {
      this.logger.debug(
        ctx,
        'start',
        'Querying database for all resources library',
      );

      const records = await this.paginationProvider.paginateQuery<
        ResourceLibrary,
        ResourceLibraryResponseDto
      >(paginationQueryDto, this.resourceLibraryRepository, this.transform, {
        order: { position: 'DESC' },
      });
      this.logger.success(ctx, 'fetched');
      return records;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async getLibraryDetail(id: number) {
    const ctx = { method: 'getLibraryDetail', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      const record = await this.findResourceLibraryById(id);
      this.logger.success(ctx, 'fetched');

      return ResponseFactory.success<ResourceLibraryResponseDto>(
        generateMessage('fetched', this._entity, id),
        ResourceLibraryResponseDto.fromEntity(record),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async createLibrary(createLibraryDto: CreateResourceLibraryDto) {
    const ctx = { method: 'createLibrary', entity: this._entity };
    this.logger.start(ctx);

    try {
      this.logger.debug(
        ctx,
        'start',
        `Creating with name: ${createLibraryDto.name}`,
      );

      if (!createLibraryDto.position) {
        const count = await this.resourceLibraryRepository.count();
        createLibraryDto.position = count + 1;
        this.logger.debug(
          ctx,
          'start',
          `Auto-assigned position: ${createLibraryDto.position}`,
        );
      }

      let slug = generateSlug(createLibraryDto.name);
      const libraryWithSlugExist =
        await this.resourceLibraryRepository.findOneBy({
          slug,
        });

      if (libraryWithSlugExist) {
        this.logger.warn(
          ctx,
          'start',
          `Slug ${slug} exists, appending random string`,
        );
        slug = `${slug}-${generateRadomString()}`;
      }
      const library = this.resourceLibraryRepository.create({
        ...createLibraryDto,
        slug,
      });

      const record = await this.resourceLibraryRepository.save(library);

      return ResponseFactory.success<ResourceLibraryResponseDto>(
        generateMessage('created', this._entity, record.id),
        ResourceLibraryResponseDto.fromEntity(record),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async updateLibrary(
    id: number,
    updateLibraryDto: UpdateResourceLibraryDto,
  ) {
    const ctx = { method: 'updateLibrary', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const library = await this.findResourceLibraryById(id);

      if (updateLibraryDto.name && updateLibraryDto.name !== library.name) {
        let slug = generateSlug(updateLibraryDto.name);
        const libraryWithSlugExist =
          await this.resourceLibraryRepository.findOneBy({
            slug,
          });

        if (libraryWithSlugExist && libraryWithSlugExist.id !== id) {
          this.logger.warn(
            ctx,
            'start',
            `Slug ${slug} exists, generating new one`,
          );
          slug = `${slug}-${generateRadomString()}`;
        }

        library.slug = slug;
      }

      Object.assign(library, updateLibraryDto);
      await this.resourceLibraryRepository.save(library);
      const record = await this.findResourceLibraryById(id);
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<ResourceLibraryResponseDto>(
        generateMessage('updated', this._entity, id),
        ResourceLibraryResponseDto.fromEntity(record),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async getAllLibraryDeleted(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllLibraryDeleted', entity: this._entity };
    this.logger.start(ctx);

    try {
      const records = await this.paginationProvider.paginateQuery<
        ResourceLibrary,
        ResourceLibraryResponseDto
      >(paginationQueryDto, this.resourceLibraryRepository, this.transform, {
        where: {
          deletedAt: Not(IsNull()),
        },
        order: { position: 'DESC' },
        withDeleted: true,
      });

      if (!records.data.length) {
        this.logger.warn(ctx, 'fetched', 'No deleted library found');
      } else {
        this.logger.success(ctx, 'fetched');
      }

      return records;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async restoreLibrary(id: number) {
    const ctx = { method: 'restoreLibrary', entity: this._entity, id };
    this.logger.start(ctx);
    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const result = await this.resourceLibraryRepository.restore(id);
      if (result.affected === 0) {
        const reason = 'Not found or already active';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const record = await this.findResourceLibraryById(id);
      if (!record) {
        const reason = 'Not found after restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      return ResponseFactory.success<ResourceLibraryResponseDto>(
        generateMessage('restored', this._entity, id),
        ResourceLibraryResponseDto.fromEntity(record),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async restoreLibraryMultiple(ids: number[]) {
    const ctx = { method: 'restoreLibraryMultiple', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!ids || ids.length === 0) {
        const reason = 'No course IDs provided';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      this.logger.debug(ctx, 'start', `Restoring IDs: ${ids.join(', ')}`);

      const result = await this.resourceLibraryRepository.restore({
        id: In(ids),
      });

      if (result.affected === 0) {
        const reason = 'No resources library found to restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      const records = await this.resourceLibraryRepository.find({
        where: { id: In(ids) },
      });

      if (!records || records.length === 0) {
        const reason = 'Resources Library not found after restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      this.logger.success(ctx, 'restored');
      return ResponseFactory.success<ResourceLibraryResponseDto[]>(
        generateMessage('restored', this._entity),
        ResourceLibraryResponseDto.fromEntities(records),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async softDeletedLibrary(id: number) {
    const ctx = { method: 'softDeletedLibrary', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const library = await this.findResourceLibraryById(id);

      if (!library) {
        const reason = 'Resource library not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const libraryRemoved =
        await this.resourceLibraryRepository.softRemove(library);
      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success<ResourceLibraryResponseDto>(
        generateMessage('deleted', this._entity, id),
        ResourceLibraryResponseDto.fromEntity(libraryRemoved),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async hardDeletedLibrary(id: number) {
    const ctx = { method: 'hardDeletedLibrary', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        this.logger.warn(ctx, 'failed', 'Missing parameter id');
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, 'Missing parameter id'),
        );
      }

      const library = await this.resourceLibraryRepository.findOne({
        where: { id: id, deletedAt: Not(IsNull()) },
        withDeleted: true,
      });

      if (!library) {
        const reason = 'Resource Library not found or not soft-deleted';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const libraryRemoved =
        await this.resourceLibraryRepository.remove(library);

      return ResponseFactory.success<ResourceLibraryResponseDto>(
        generateMessage('deleted', this._entity, id),
        ResourceLibraryResponseDto.fromEntity(libraryRemoved),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async changeLibraryPositionMutiple(
    changeLibraryPositionDtos: ChangeResourceLibraryPositionDto[],
  ) {
    const ctx = {
      method: 'changeLibraryPositionMutiple',
      entity: this._entity,
    };
    this.logger.start(ctx);

    try {
      if (
        changeLibraryPositionDtos.length === 0 ||
        !changeLibraryPositionDtos
      ) {
        const reason = 'No resources library provided';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('updated', this._entity, undefined, reason),
        );
      }

      const ids = changeLibraryPositionDtos.map((d) => d.id);

      this.logger.debug(
        ctx,
        'start',
        `Updating positions for resources library with IDs: ${ids.join(', ')}`,
      );

      const records = await this.resourceLibraryRepository.find({
        where: { id: In(ids) },
      });

      if (!records || records.length === 0) {
        const reason = `No resources library found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      for (const record of records) {
        const dto = changeLibraryPositionDtos.find((d) => d.id === record.id);

        if (dto) {
          record.position = dto.position;
        }
      }

      await this.resourceLibraryRepository.save(records);
      const recordsSaved = await this.resourceLibraryRepository.find({
        where: { id: In(ids) },
      });
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<ResourceLibraryResponseDto[]>(
        generateMessage('updated', this._entity),
        ResourceLibraryResponseDto.fromEntities(recordsSaved),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeLibraryStatusMultiple(
    changeLibraryStatusDto: ChangeResourceLibraryStatusDto,
  ) {
    const ctx = { method: 'changeLibraryStatusMultiple', entity: this._entity };
    this.logger.start(ctx);

    try {
      const { ids, status } = changeLibraryStatusDto;
      this.logger.debug(
        ctx,
        'start',
        `Updating status for lessons with IDs: ${ids.join(', ')}, new status: ${status}`,
      );

      const libraries = await this.resourceLibraryRepository.find({
        where: { id: In(ids) },
      });

      if (!libraries || libraries.length === 0) {
        const reason = `No resource library found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      for (const library of libraries) {
        library.status = status;
      }

      await this.resourceLibraryRepository.save(libraries);

      const records = await this.resourceLibraryRepository.find({
        where: { id: In(ids) },
      });
      this.logger.success(ctx, 'updated');

      return ResponseFactory.success<ResourceLibraryResponseDto[]>(
        generateMessage('updated', this._entity),
        ResourceLibraryResponseDto.fromEntities(records),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeLibraryStatus(id: number, status: LibraryStatus) {
    const ctx = { method: 'changeLibraryStatus', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const library = await this.findResourceLibraryById(id);
      library.status = status;
      const record = await this.resourceLibraryRepository.save(library);
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<ResourceLibraryResponseDto>(
        generateMessage('updated', this._entity, id),
        ResourceLibraryResponseDto.fromEntity(record),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }
}
