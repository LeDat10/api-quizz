import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, IsNull, Not, Repository } from 'typeorm';
import { PdfResource } from './entities/pdf-resource.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseCreateResourceDto } from './dtos/base-create-resource.dto';
import { ResourceLibraryService } from 'src/resource-library/resource-library.service';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { Resource } from './entities/resource.entity';
import { generateRadomString, generateSlug } from 'src/common/utils/slug.util';
import { ResourceType } from './enums/resource-type.enum';
import { VideoResource } from './entities/video-resource.entity';
import { CreatePdfResourceDto } from './dtos/create-pdf-resource.dto';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { PdfResourceResponseDto } from './dtos/pdf-resource-response.dto';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { UpdatePdfResourceDto } from './dtos/update-pdf-resource.dto';
import { BaseUpdateResourceDto } from './dtos/base-update-resource.dto';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { ResourceResponseDto } from './dtos/resource-response.dto';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

@Injectable()
export class ResourceService {
  private readonly logger = new LoggerHelper(ResourceService.name);
  private readonly errorHandler = new ErrorHandlerHelper(ResourceService.name);
  private _entity: string = 'Resource';
  constructor(
    private readonly resourceLibraryService: ResourceLibraryService,

    private readonly paginationProvider: PaginationProvider,

    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,

    @InjectRepository(PdfResource)
    private readonly pdfResourceRepository: Repository<PdfResource>,
  ) {}

  private transform = (resource: Resource): any => {
    const base = {
      id: resource.id,
      title: resource.title,
      url: resource.url,
      slug: resource.slug,
      position: resource.position,
      resourceType: resource.resourceType,
      libraryId: resource.library?.id,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      deletedAt: resource.deletedAt,
    };

    switch (resource.resourceType) {
      case ResourceType.PDF:
        const pdf = resource as PdfResource;
        return {
          ...base,
          pageCount: pdf.pageCount,
          fileSize: pdf.fileSize,
        };

      case ResourceType.VIDEO:
        const video = resource as VideoResource;
        return {
          ...base,
          duration: video.duration,
          format: video.thumbnailUrl,
        };
      default:
        return base;
    }
  };

  async findResourceById(
    id: number,
    type: ResourceType.PDF,
  ): Promise<PdfResource>;
  async findResourceById(id: number, type: ResourceType): Promise<Resource> {
    const ctx = { method: 'findResourceById', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      let resource: any;

      switch (type) {
        case ResourceType.PDF:
          const record = await this.pdfResourceRepository.findOne({
            where: { id },
            relations: ['library'],
          });
          resource = record;
          break;
        default:
          this.logger.warn(
            ctx,
            'fetched',
            `Unsupported resource type: ${type}`,
          );
          throw new BadRequestException(`Unsupported resource type: ${type}`);
      }

      if (!resource) {
        const reason = 'Not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      this.logger.success(ctx, 'fetched');
      return resource;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  async createResource(
    createResourceDto: CreatePdfResourceDto,
    type: ResourceType.PDF,
  ): Promise<PdfResource>;
  async createResource(
    createResourceDto: BaseCreateResourceDto,
    type: ResourceType.VIDEO,
  ): Promise<VideoResource>;
  async createResource(
    createResourceDto: BaseCreateResourceDto,
    type: ResourceType,
  ): Promise<Resource> {
    const ctx = { method: 'createResource', entity: this._entity };
    this.logger.start(ctx);
    try {
      this.logger.debug(
        ctx,
        'start',
        `Creating with title: ${createResourceDto.title}`,
      );
      let library: any = null;
      if (createResourceDto.libraryId) {
        this.logger.debug(
          ctx,
          'start',
          `Looking for library ID: ${createResourceDto.libraryId}`,
        );
        const record =
          await this.resourceLibraryService.findResourceLibraryById(
            createResourceDto.libraryId,
          );

        if (!record) {
          this.logger.warn(
            ctx,
            'start',
            `Library ID ${createResourceDto.libraryId} not found`,
          );
        } else {
          this.logger.debug(ctx, 'start', `Category found: ${library.name}`);
          library = record;
        }
      }

      const count = await this.resourceRepository.count();
      const position = count + 1;
      this.logger.debug(ctx, 'start', `Auto-assigned position: ${position}`);

      let slug = generateSlug(createResourceDto.title);
      const resourceWithSlugExist = await this.resourceRepository.findOneBy({
        slug,
      });
      if (resourceWithSlugExist) {
        this.logger.warn(
          ctx,
          'start',
          `Slug ${slug} exists, appending random string`,
        );

        slug = `${slug}-${generateRadomString()}`;
      }

      switch (type) {
        case ResourceType.PDF:
          const record = this.pdfResourceRepository.create({
            ...createResourceDto,
            position,
            slug,
          });
          const recordSaved = await this.pdfResourceRepository.save(record);
          return recordSaved;
        default:
          this.logger.warn(
            ctx,
            'created',
            `Unsupported resource type: ${type}`,
          );
          throw new BadRequestException(`Unsupported resource type: ${type}`);
      }
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  async updateResource(
    id: number,
    updateResourceDto: UpdatePdfResourceDto,
    type: ResourceType.PDF,
  ): Promise<PdfResource>;
  async updateResource(
    id: number,
    updateResourceDto: BaseUpdateResourceDto,
    type: ResourceType.VIDEO,
  ): Promise<VideoResource>;
  async updateResource(
    id: number,
    updateResourceDto: BaseUpdateResourceDto,
    type: ResourceType,
  ): Promise<Resource> {
    const ctx = { method: 'updateResource', entity: this._entity, id };
    this.logger.start(ctx);
    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }
      switch (type) {
        case ResourceType.PDF:
          const resource = await this.findResourceById(id, type);
          if (updateResourceDto.libraryId) {
            const library =
              await this.resourceLibraryService.findResourceLibraryById(
                updateResourceDto.libraryId,
              );
            if (library) {
              resource.library = library;
              this.logger.debug(ctx, 'start', `Library found: ${library.name}`);
            }
          }

          if (
            updateResourceDto.title &&
            updateResourceDto.title !== resource.title
          ) {
            let slug = generateSlug(updateResourceDto.title);
            const resourceWithSlugExist =
              await this.resourceRepository.findOneBy({
                slug,
              });
            if (resourceWithSlugExist && resourceWithSlugExist.id !== id) {
              this.logger.warn(
                ctx,
                'start',
                `Slug ${slug} exists, generating new one`,
              );
              slug = `${slug}-${generateRadomString()}`;
            }
            resource.slug = slug;
          }

          Object.assign(resource, updateResourceDto);
          const resourceUpdated =
            await this.pdfResourceRepository.save(resource);
          this.logger.success(ctx, 'updated');
          return resourceUpdated;
        default:
          this.logger.warn(
            ctx,
            'updated',
            `Unsupported resource type: ${type}`,
          );
          throw new BadRequestException(`Unsupported resource type: ${type}`);
      }
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  async softDeleteResource(
    id: number,
    type: ResourceType.PDF,
  ): Promise<PdfResource>;
  async softDeleteResource(id: number, type: ResourceType): Promise<Resource> {
    const ctx = { method: 'softDeleteResource', entity: this._entity, id };
    this.logger.start(ctx);
    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      switch (type) {
        case ResourceType.PDF:
          const record = await this.findResourceById(id, type);
          const recordDeleted =
            await this.pdfResourceRepository.softRemove(record);
          this.logger.success(ctx, 'deleted');
          return recordDeleted;
        default:
          this.logger.warn(
            ctx,
            'updated',
            `Unsupported resource type: ${type}`,
          );
          throw new BadRequestException(`Unsupported resource type: ${type}`);
      }
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  async hardDeleteResource(
    id: number,
    type: ResourceType.PDF,
  ): Promise<PdfResource>;
  async hardDeleteResource(id: number, type: ResourceType): Promise<Resource> {
    const ctx = { method: 'hardDeleteResource', entity: this._entity, id };
    this.logger.start(ctx);
    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      switch (type) {
        case ResourceType.PDF:
          const record = await this.findResourceById(id, type);
          const recordDeleted = await this.pdfResourceRepository.remove(record);
          this.logger.success(ctx, 'deleted');
          return recordDeleted;
        default:
          this.logger.warn(
            ctx,
            'updated',
            `Unsupported resource type: ${type}`,
          );
          throw new BadRequestException(`Unsupported resource type: ${type}`);
      }
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  async restoreResource(
    id: number,
    type: ResourceType.PDF,
  ): Promise<PdfResource>;
  async restoreResource(id: number, type: ResourceType): Promise<Resource> {
    const ctx = { method: 'restoreResource', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      switch (type) {
        case ResourceType.PDF:
          this.logger.debug(ctx, 'start', `Restoring ID: ${id}`);
          const result = await this.pdfResourceRepository.restore(id);

          if (result.affected === 0) {
            const reason = 'Not found or already active';
            this.logger.warn(ctx, 'failed', reason);
            throw new NotFoundException(
              generateMessage('failed', this._entity, id, reason),
            );
          }

          const record = await this.findResourceById(id, type);

          if (!record) {
            const reason = 'Not found after restore';
            this.logger.warn(ctx, 'failed', reason);
            throw new NotFoundException(
              generateMessage('failed', this._entity, id, reason),
            );
          }

          this.logger.success(ctx, 'restored');
          return record;
        default:
          this.logger.warn(
            ctx,
            'updated',
            `Unsupported resource type: ${type}`,
          );
          throw new BadRequestException(`Unsupported resource type: ${type}`);
      }
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  async restoreResourceMultiple(
    ids: number[],
    type: ResourceType.PDF,
  ): Promise<PdfResource[]>;
  async restoreResourceMultiple(
    ids: number[],
    type: ResourceType,
  ): Promise<Resource[]> {
    const ctx = { method: 'restoreResourceMultiple', entity: this._entity };
    this.logger.start(ctx);
    try {
      if (!ids || ids.length === 0) {
        const reason = 'No resource IDs provided';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      switch (type) {
        case ResourceType.PDF:
          this.logger.debug(ctx, 'start', `Restoring IDs: ${ids.join(', ')}`);
          const result = await this.pdfResourceRepository.restore({
            id: In(ids),
          });

          if (result.affected === 0) {
            const reason = 'No resources found to restore';
            this.logger.warn(ctx, 'failed', reason);
            throw new NotFoundException(
              generateMessage('failed', this._entity, undefined, reason),
            );
          }

          const records = await this.pdfResourceRepository.find({
            where: { id: In(ids) },
          });

          if (!records.length) {
            const reason = 'Resources not found after restore';
            this.logger.warn(ctx, 'failed', reason);
            throw new NotFoundException(
              generateMessage('failed', this._entity, undefined, reason),
            );
          }

          this.logger.success(ctx, 'restored');
          return records;

        default:
          this.logger.warn(
            ctx,
            'updated',
            `Unsupported resource type: ${type}`,
          );
          throw new BadRequestException(`Unsupported resource type: ${type}`);
      }
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async getAllResources(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllResources', entity: this._entity };
    this.logger.start(ctx);
    try {
      this.logger.debug(ctx, 'start', 'Querying database for all resources');
      const resources = await this.paginationProvider.paginateQuery<
        Resource,
        ResourceResponseDto
      >(paginationQueryDto, this.resourceRepository, this.transform, {
        order: { position: 'DESC' },
        relations: ['library'],
      });

      this.logger.success(ctx, 'fetched');
      return resources;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async createPdfResource(createPdfResourceDto: CreatePdfResourceDto) {
    const record = await this.createResource(
      createPdfResourceDto,
      ResourceType.PDF,
    );

    return ResponseFactory.success<PdfResourceResponseDto>(
      generateMessage('created', this._entity, record.id),
      PdfResourceResponseDto.fromEntity(record),
    );
  }

  public async updatePdfResource(
    id: number,
    updatePdfResourceDto: UpdatePdfResourceDto,
  ) {
    const record = await this.updateResource(
      id,
      updatePdfResourceDto,
      ResourceType.PDF,
    );

    return ResponseFactory.success<PdfResourceResponseDto>(
      generateMessage('updated', this._entity, id),
      PdfResourceResponseDto.fromEntity(record),
    );
  }

  public async softDeletePdfResource(id: number) {
    const record = await this.softDeleteResource(id, ResourceType.PDF);
    return ResponseFactory.success<PdfResourceResponseDto>(
      generateMessage('deleted', this._entity, id),
      PdfResourceResponseDto.fromEntity(record),
    );
  }

  public async hardDeletePdfResource(id: number) {
    const record = await this.hardDeleteResource(id, ResourceType.PDF);
    return ResponseFactory.success<PdfResourceResponseDto>(
      generateMessage('deleted', this._entity, id),
      PdfResourceResponseDto.fromEntity(record),
    );
  }

  public async getAllResourcesDeleted(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllResourcesDeleted', entity: this._entity };
    this.logger.start(ctx);
    try {
      this.logger.debug(
        ctx,
        'start',
        'Querying database for all resources deleted',
      );
      const records = await this.paginationProvider.paginateQuery<
        Resource,
        ResourceResponseDto
      >(paginationQueryDto, this.resourceRepository, this.transform, {
        withDeleted: true,
        where: {
          deletedAt: Not(IsNull()),
        },
        order: { position: 'DESC' },
        relations: ['library'],
      });

      this.logger.success(ctx, 'fetched');
      return records;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async restorePdfResource(id: number) {
    const record = await this.restoreResource(id, ResourceType.PDF);
    return ResponseFactory.success<PdfResourceResponseDto>(
      generateMessage('restored', this._entity, id),
      PdfResourceResponseDto.fromEntity(record),
    );
  }

  public async restorePdfResourceMultiple(ids: number[]) {
    const records = await this.restoreResourceMultiple(ids, ResourceType.PDF);
    return ResponseFactory.success<PdfResourceResponseDto[]>(
      generateMessage('restored', this._entity),
      PdfResourceResponseDto.fromEntities(records),
    );
  }

  public async getPdfResourceDetail(id: number) {
    const record = await this.findResourceById(id, ResourceType.PDF);

    return ResponseFactory.success<PdfResourceResponseDto>(
      generateMessage('fetched', this._entity, id),
      PdfResourceResponseDto.fromEntity(record),
    );
  }
}
