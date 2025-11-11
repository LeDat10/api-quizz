import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Course } from './course.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCourseDto } from './dtos/create-course.dto';
import { CategoriesService } from 'src/categories/categories.service';
import { generateRadomString, generateSlug } from 'src/common/utils/slug.util';
import { UpdateCourseDto } from './dtos/update-course.dto';
import { CourseResponseDto } from './dtos/course-response.dto';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { ChangeCourseStatusDto } from './dtos/change-course-status.dto';
import { ChangeCoursePositionDto } from './dtos/change-course-position.dto';

@Injectable()
export class CoursesService {
  private readonly logger = new LoggerHelper(CoursesService.name);
  private readonly errorHandler = new ErrorHandlerHelper(CoursesService.name);
  private _entity: string = 'Course';

  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    private readonly categoriesService: CategoriesService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  private transform = (course: Course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    typeCourse: course.typeCourse,
    status: course.status,
    position: course.position,
    slug: course.slug,
    categoryId: course.category?.id,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    deletedAt: course.deletedAt,
  });

  public async findCourseById(id: number) {
    const ctx = { method: 'findCourseById', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const course = await this.coursesRepository.findOne({
        where: { id },
        relations: ['category'],
      });

      if (!course) {
        const reason = 'Not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      this.logger.success(ctx, 'fetched');
      return course;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async createCourse(createCourseDto: CreateCourseDto) {
    const ctx = { method: 'createCourse', entity: this._entity };
    this.logger.start(ctx);

    try {
      this.logger.debug(
        ctx,
        'start',
        `Creating with title: ${createCourseDto.title}`,
      );

      // Find category if provided
      let category: any = null;
      if (createCourseDto.categoryId) {
        this.logger.debug(
          ctx,
          'start',
          `Looking for category ID: ${createCourseDto.categoryId}`,
        );
        category = await this.categoriesService.findCategoryById(
          createCourseDto.categoryId,
        );

        if (!category) {
          this.logger.warn(
            ctx,
            'start',
            `Category ID ${createCourseDto.categoryId} not found`,
          );
        } else {
          this.logger.debug(ctx, 'start', `Category found: ${category.title}`);
        }
      }

      // Auto-increment position if not provided
      if (!createCourseDto.position) {
        const count = await this.coursesRepository.count();
        createCourseDto.position = count + 1;
        this.logger.debug(
          ctx,
          'start',
          `Auto-assigned position: ${createCourseDto.position}`,
        );
      }

      // Generate slug
      let slug = generateSlug(createCourseDto.title);
      const courseWithSlugExist = await this.coursesRepository.findOneBy({
        slug,
      });

      if (courseWithSlugExist) {
        this.logger.warn(
          ctx,
          'start',
          `Slug ${slug} exists, appending random string`,
        );
        slug = `${slug}-${generateRadomString()}`;
      }

      // Create and save
      const course = this.coursesRepository.create({
        ...createCourseDto,
        category,
        slug,
      });

      const courseCreated = await this.coursesRepository.save(course);
      const courseCreatedResponse = CourseResponseDto.fromEntity(courseCreated);

      this.logger.success(ctx, 'created');
      return ResponseFactory.success<CourseResponseDto>(
        generateMessage('created', this._entity, courseCreated.id),
        courseCreatedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async getCourseDetail(id: number) {
    const ctx = { method: 'getCourseDetail', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      const course = await this.findCourseById(id);
      const courseResponse = CourseResponseDto.fromEntity(course);

      this.logger.success(ctx, 'fetched');

      return ResponseFactory.success<CourseResponseDto>(
        generateMessage('fetched', this._entity, id),
        courseResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async updateCourse(updateCourseDto: UpdateCourseDto, id: number) {
    const ctx = { method: 'updateCourse', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const course = await this.findCourseById(id);

      // Update category if provided
      if (updateCourseDto.categoryId) {
        this.logger.debug(
          ctx,
          'start',
          `Looking for category ID: ${updateCourseDto.categoryId}`,
        );
        const category = await this.categoriesService.findCategoryById(
          updateCourseDto.categoryId,
        );

        if (category) {
          course.category = category;
          this.logger.debug(ctx, 'start', `Category found: ${category.title}`);
        }
      }

      // Update slug if title changed
      if (updateCourseDto.title && updateCourseDto.title !== course.title) {
        let slug = generateSlug(updateCourseDto.title);
        const courseWithSlugExist = await this.coursesRepository.findOneBy({
          slug,
        });

        if (courseWithSlugExist && courseWithSlugExist.id !== id) {
          this.logger.warn(
            ctx,
            'start',
            `Slug ${slug} exists, generating new one`,
          );
          slug = `${slug}-${generateRadomString()}`;
        }

        course.slug = slug;
      }

      Object.assign(course, updateCourseDto);
      await this.coursesRepository.save(course);
      const updatedCourse = await this.findCourseById(id);
      const updatedCourseResponse = CourseResponseDto.fromEntity(updatedCourse);

      this.logger.success(ctx, 'updated');

      return ResponseFactory.success<CourseResponseDto>(
        generateMessage('updated', this._entity, id),
        updatedCourseResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async getAllCourses(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllCourses', entity: this._entity };
    this.logger.start(ctx);

    try {
      this.logger.debug(ctx, 'start', 'Querying database for all courses');

      const courses = await this.paginationProvider.paginateQuery<
        Course,
        CourseResponseDto
      >(paginationQueryDto, this.coursesRepository, this.transform, {
        relations: ['category'],
        order: { position: 'DESC' },
      });

      this.logger.success(ctx, 'fetched');
      return courses;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async getAllCourseDeleted(paginationQueryDto: PaginationQueryDto) {
    const ctx = { method: 'getAllCourseDeleted', entity: this._entity };
    this.logger.start(ctx);

    try {
      const coursesDeleted = await this.paginationProvider.paginateQuery<
        Course,
        CourseResponseDto
      >(paginationQueryDto, this.coursesRepository, this.transform, {
        withDeleted: true,
        where: {
          deletedAt: Not(IsNull()),
        },
        relations: ['category'],
        order: { position: 'DESC' },
      });

      if (!coursesDeleted.data.length) {
        this.logger.warn(ctx, 'fetched', 'No deleted courses found');
      } else {
        this.logger.success(ctx, 'fetched');
      }

      return coursesDeleted;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async softDeleteCourse(id: number) {
    const ctx = { method: 'softDeleteCourse', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const course = await this.coursesRepository.findOne({
        where: { id },
        relations: ['chapters', 'category'],
      });

      if (!course) {
        const reason = 'Not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      // Check if course has chapters
      if (course.chapters && course.chapters.length > 0) {
        const reason = `Has ${course.chapters.length} existing chapters`;
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const courseRemoved = await this.coursesRepository.softRemove(course);
      const courseRemovedResponse = CourseResponseDto.fromEntity(courseRemoved);

      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success<CourseResponseDto>(
        generateMessage('deleted', this._entity, id),
        courseRemovedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async hardDeleteCourse(id: number) {
    const ctx = { method: 'hardDeleteCourse', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const course = await this.coursesRepository.findOne({
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
        relations: ['category'],
      });

      if (!course) {
        const reason = 'Not found or not soft-deleted';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const courseRemoved = await this.coursesRepository.remove(course);
      const courseRemovedResponse = CourseResponseDto.fromEntity(courseRemoved);

      this.logger.success(ctx, 'deleted');

      return ResponseFactory.success<CourseResponseDto>(
        generateMessage('deleted', this._entity, id),
        courseRemovedResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async restoreCourse(id: number) {
    const ctx = { method: 'restoreCourse', entity: this._entity, id };
    this.logger.start(ctx);

    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const result = await this.coursesRepository.restore(id);

      if (result.affected === 0) {
        const reason = 'Not found or already active';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const course = await this.findCourseById(id);
      if (!course) {
        const reason = 'Not found after restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const courseResponse = CourseResponseDto.fromEntity(course);
      this.logger.success(ctx, 'restored');

      return ResponseFactory.success<CourseResponseDto>(
        generateMessage('restored', this._entity, id),
        courseResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }

  public async restoreCourseMultiple(ids: number[]) {
    const ctx = { method: 'restoreCourseMultiple', entity: this._entity };
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

      const result = await this.coursesRepository.restore({ id: In(ids) });

      if (result.affected === 0) {
        const reason = 'No courses found to restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      const courses = await this.coursesRepository.find({
        where: { id: In(ids) },
        relations: ['category'],
      });

      if (!courses.length) {
        const reason = 'Courses not found after restore';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, undefined, reason),
        );
      }

      const coursesResponse = CourseResponseDto.fromEntities(courses);
      this.logger.success(ctx, 'restored');

      return ResponseFactory.success<CourseResponseDto[]>(
        `${courses.length} courses restored successfully`,
        coursesResponse,
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeCourseStatusMultiple(
    changeCourseStatusDto: ChangeCourseStatusDto,
  ) {
    const ctx = {
      method: 'changeCourseStatusMultiple',
      entity: this._entity,
    };
    this.logger.start(ctx);
    try {
      const { ids, status } = changeCourseStatusDto;
      this.logger.debug(
        ctx,
        'start',
        `Updating status for courses with IDs: ${ids.join(', ')}, new status: ${status}`,
      );

      const courses = await this.coursesRepository.find({
        where: { id: In(ids) },
        relations: ['category'],
      });

      if (!courses.length) {
        const reason = `No courses found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      for (const course of courses) {
        course.status = status;
      }

      await this.coursesRepository.save(courses);
      const records = await this.coursesRepository.find({
        where: { id: In(ids) },
        relations: ['category'],
      });
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<CourseResponseDto[]>(
        `Updated status for ${records.length} courses`,
        CourseResponseDto.fromEntities(records),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  public async changeCoursePositionMultiple(
    changeCoursePositionDtos: ChangeCoursePositionDto[],
  ) {
    const ctx = {
      method: 'changeCoursePositionMultiple',
      entity: this._entity,
    };

    try {
      if (!changeCoursePositionDtos.length) {
        const reason = 'No courses provided';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('updated', this._entity, undefined, reason),
        );
      }

      const ids = changeCoursePositionDtos.map((d) => d.id);
      this.logger.debug(
        ctx,
        'start',
        `Updating positions for courses with IDs: ${ids.join(', ')}`,
      );

      const courses = await this.coursesRepository.find({
        where: { id: In(ids) },
        relations: ['category'],
      });

      if (!courses.length) {
        const reason = `No courses found with IDs: ${ids.join(', ')}`;
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(reason);
      }

      for (const course of courses) {
        const dto = changeCoursePositionDtos.find((d) => d.id === course.id);
        if (dto) {
          course.position = dto.position;
        }
      }

      await this.coursesRepository.save(courses);
      const records = await this.coursesRepository.find({
        where: { id: In(ids) },
        relations: ['category'],
      });
      this.logger.success(ctx, 'updated');
      return ResponseFactory.success<CourseResponseDto[]>(
        `Updated positions for ${records.length} courses`,
        CourseResponseDto.fromEntities(records),
      );
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }
}
