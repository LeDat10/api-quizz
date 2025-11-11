import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Category } from './category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { generateRadomString, generateSlug } from 'src/common/utils/slug.util';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { CategoryResponseDto } from './dtos/category-response.dto';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { ChangeCategoryStatusDto } from './dtos/change-category-status.dto';
import { ChangeCategoryPositionDto } from './dtos/change-category-position.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new LoggerHelper(CategoriesService.name);
  private readonly errorHandler = new ErrorHandlerHelper(
    CategoriesService.name,
  );

  private _entity = 'Category';
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  private transform = (category: Category) => ({
    id: category.id,
    title: category.title,
    description: category.description,
    thumbnail: category.thumbnail,
    status: category.status,
    position: category.position,
    slug: category.slug,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    deletedAt: category.deletedAt,
  });

  public async findCategoryById(id: number) {
    const ctx = { method: 'findCategoryById', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const category = await this.categoryRepository.findOneBy({ id });

      if (!category) {
        const reason = 'Not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      this.logger.success(ctx, 'fetched');
      return category;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async createCategory(createCategoryDto: CreateCategoryDto) {
    const ctx = { method: 'createCategory', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!createCategoryDto.position) {
        const totalCategories = await this.categoryRepository.count();
        createCategoryDto.position = totalCategories + 1;
      }

      this.logger.info(
        ctx,
        'start',
        `Creating category with title: ${createCategoryDto.title}`,
      );

      let slug = generateSlug(createCategoryDto.title);
      const categoryWithSlugExist = await this.categoryRepository.findOneBy({
        slug,
      });

      if (categoryWithSlugExist) {
        this.logger.warn(
          ctx,
          'start',
          `Slug ${slug} already exists, appending random string`,
        );
        slug = slug + generateRadomString();
      }

      const category = this.categoryRepository.create({
        ...createCategoryDto,
        slug,
      });
      const categoryCreated = await this.categoryRepository.save(category);

      const categoryResponse = CategoryResponseDto.fromEntity(categoryCreated);

      this.logger.success(ctx, 'created');

      return ResponseFactory.success<CategoryResponseDto>(
        generateMessage('created', this._entity, categoryCreated.id),
        categoryResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async getAllCategories(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllCategories', entity: this._entity };
    this.logger.start(ctx);

    try {
      this.logger.debug(
        ctx,
        'start',
        'Sending query to database to get all categories',
      );

      const categoriesResponse = await this.paginationProvider.paginateQuery<
        Category,
        CategoryResponseDto
      >(paginationQueryDto, this.categoryRepository, this.transform, {
        order: { position: 'DESC' },
      });

      this.logger.success(ctx, 'fetched');

      return categoriesResponse;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async updateOneCategory(id: number, updateData: UpdateCategoryDto) {
    const ctx = { method: 'updateOneCategory', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const category = await this.findCategoryById(id);
      if (!category) {
        const reason = 'Category not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      if (updateData.title && updateData.title !== category.title) {
        let slug = generateSlug(updateData.title);
        const categoryWithSlugExist = await this.categoryRepository.findOneBy({
          slug,
        });

        if (categoryWithSlugExist && categoryWithSlugExist.id !== id) {
          const reason = `Slug ${slug} already exists, generating new one`;
          this.logger.warn(ctx, 'start', reason);
          slug = `${slug}-${generateRadomString()}`;
        }

        category.slug = slug;
      }

      Object.assign(category, updateData);
      await this.categoryRepository.save(category);

      const updatedCategory = await this.findCategoryById(id);
      const updatedCategoryResponse =
        CategoryResponseDto.fromEntity(updatedCategory);

      this.logger.success(ctx, 'updated');

      return ResponseFactory.success<CategoryResponseDto>(
        generateMessage('updated', this._entity, id),
        updatedCategoryResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async softDeleteCategory(id: number) {
    const ctx = { method: 'softDeleteCategory', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const category = await this.findCategoryById(id);
      if (!category) {
        const reason = 'Category not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const categoryDeleted =
        await this.categoryRepository.softRemove(category);
      const categoryDeletedResponse =
        CategoryResponseDto.fromEntity(categoryDeleted);

      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success<CategoryResponseDto>(
        generateMessage('deleted', this._entity, id),
        categoryDeletedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async getCategoryDetail(id: number) {
    const ctx = { method: 'getCategoryDetail', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      const category = await this.findCategoryById(id);

      const categoryResponse = CategoryResponseDto.fromEntity(category);

      this.logger.success(ctx, 'fetched');

      return ResponseFactory.success<CategoryResponseDto>(
        generateMessage('fetched', this._entity, id),
        categoryResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async getAllCategoriesDeleted(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllCategoriesDeleted', entity: this._entity };
    this.logger.start(ctx);

    try {
      const categoriesDeletedResponse =
        await this.paginationProvider.paginateQuery<
          Category,
          CategoryResponseDto
        >(paginationQueryDto, this.categoryRepository, this.transform, {
          withDeleted: true,
          where: {
            deletedAt: Not(IsNull()),
          },
          order: { position: 'DESC' },
        });

      if (!categoriesDeletedResponse.data.length) {
        this.logger.warn(ctx, 'failed', 'No deleted categories found');
      } else {
        this.logger.success(ctx, 'fetched');
      }

      return categoriesDeletedResponse;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async hardDeleteCategory(id: number) {
    const ctx = { method: 'hardDeleteCategory', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        this.logger.warn(ctx, 'failed', 'Missing parameter id');
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, 'Missing parameter id'),
        );
      }

      const category = await this.categoryRepository.findOne({
        where: { id: id, deletedAt: Not(IsNull()) },
        withDeleted: true,
      });

      if (!category) {
        const reason = 'Category not found or not soft-deleted';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const categoryDeleted = await this.categoryRepository.remove(category);
      const categoryDeletedResponse =
        CategoryResponseDto.fromEntity(categoryDeleted);

      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success<CategoryResponseDto>(
        generateMessage('deleted', this._entity, id),
        categoryDeletedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async restoreCategory(id: number) {
    const ctx = { method: 'restoreCategory', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        this.logger.warn(ctx, 'failed', 'Missing parameter id');
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, 'Missing parameter id'),
        );
      }

      const result = await this.categoryRepository.restore(id);

      if (result.affected === 0) {
        this.logger.warn(ctx, 'failed', 'No category affected');
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, 'Not found'),
        );
      }

      const category = await this.categoryRepository.findOneBy({ id });
      if (!category) {
        this.logger.warn(ctx, 'failed', 'Not found after restore');
        throw new NotFoundException(
          generateMessage(
            'failed',
            this._entity,
            id,
            'Not found after restore',
          ),
        );
      }

      this.logger.success(ctx, 'restored');

      const categoryResponse = CategoryResponseDto.fromEntity(category);
      return ResponseFactory.success<CategoryResponseDto>(
        generateMessage('restored', this._entity, id),
        categoryResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async restoreCategoryMultiple(ids: number[]) {
    const ctx = { method: 'restoreCategoryMultiple', entity: this._entity };
    this.logger.start(ctx);

    try {
      if (!ids || ids.length === 0) {
        this.logger.warn(ctx, 'failed', 'No category IDs provided');
        throw new BadRequestException(
          generateMessage(
            'failed',
            this._entity,
            undefined,
            'No category IDs provided',
          ),
        );
      }

      this.logger.debug(ctx, 'start', `Restoring IDs: ${ids.join(', ')}`);

      const result = await this.categoryRepository.restore({ id: In(ids) });

      if (result.affected === 0) {
        this.logger.warn(
          ctx,
          'failed',
          'No categories restored (possibly not found or already active)',
        );
        throw new NotFoundException(
          generateMessage(
            'failed',
            this._entity,
            undefined,
            'No categories found to restore',
          ),
        );
      }

      const categories = await this.categoryRepository.find({
        where: { id: In(ids) },
      });

      if (!categories.length) {
        this.logger.warn(ctx, 'failed', 'Categories not found after restore');
        throw new NotFoundException(
          generateMessage(
            'failed',
            this._entity,
            undefined,
            'Categories not found after restore',
          ),
        );
      }

      this.logger.success(ctx, 'restored');

      const categoriesResponse = CategoryResponseDto.fromEntities(categories);
      return ResponseFactory.success<CategoryResponseDto[]>(
        `${categories.length} categories restored successfully`,
        categoriesResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeCategoryStatusMultiple(
    changeCategoryStatusDto: ChangeCategoryStatusDto,
  ) {
    const ctx = {
      method: 'changeCategoryStatusMultiple',
      entity: this._entity,
    };
    this.logger.start(ctx);
    try {
      const { ids, status } = changeCategoryStatusDto;
      const categories = await this.categoryRepository.find({
        where: { id: In(ids) },
      });

      if (!categories.length) {
        const reason = `No categories found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      for (const category of categories) {
        category.status = status;
      }

      await this.categoryRepository.save(categories);
      const records = await this.categoryRepository.find({
        where: { id: In(ids) },
      });
      this.logger.success(ctx, 'updated');

      return ResponseFactory.success<CategoryResponseDto[]>(
        generateMessage('updated', this._entity),
        CategoryResponseDto.fromEntities(records),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeCategoryPositionMultiple(
    changeCategoryPositionDtos: ChangeCategoryPositionDto[],
  ) {
    const ctx = {
      method: 'changeCategoryPositionMultiple',
      entity: this._entity,
    };
    this.logger.start(ctx);
    try {
      if (!changeCategoryPositionDtos.length) {
        const reason = 'No categories provided';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('updated', this._entity, undefined, reason),
        );
      }

      const ids = changeCategoryPositionDtos.map((d) => d.id);
      this.logger.debug(
        ctx,
        'start',
        `Updating positions for categories with IDs: ${ids.join(', ')}`,
      );

      const categories = await this.categoryRepository.find({
        where: { id: In(ids) },
      });

      if (!categories.length) {
        const reason = `No categories found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      for (const category of categories) {
        const dto = changeCategoryPositionDtos.find(
          (d) => d.id === category.id,
        );

        if (dto) {
          category.position = dto.position;
        }
      }

      await this.categoryRepository.save(categories);
      const records = await this.categoryRepository.find({
        where: { id: In(ids) },
      });
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<CategoryResponseDto[]>(
        generateMessage('updated', this._entity),
        CategoryResponseDto.fromEntities(records),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }
}
