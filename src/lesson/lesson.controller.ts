import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { LessonService } from './lesson.service';
import { UpdateLessonDto } from './dtos/update-lesson.dto';
import { LessonResponseDto } from './dtos/lesson-response.dto';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { PaginationResponse } from 'src/common/pagination/dtos/pagination-response.dto';
import { BaseResponseDto } from 'src/common/response/dtos/base-response.dto';
import { ChangeLessonStatusDto } from './dtos/change-lesson-status.dto';
import { ChangeLessonPositionDto } from './dtos/change-lesson-position.dto';
import { LessonStatus } from './enums/lesson.enum';
import { CreateLessonWithContentDto } from './dtos/create-lesson-with-content.dto';

@ApiTags('Lessons')
@Controller('lesson')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all lessons',
    description:
      'Retrieve a paginated list of all lessons sorted by their position.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of lessons fetched successfully.',
    type: PaginationResponse<LessonResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async GetAllLessons(@Query() paginationQueryDto: PaginationQueryDto) {
    return await this.lessonService.getAllLessons(paginationQueryDto);
  }

  // @Post()
  // @ApiOperation({
  //   summary: 'Create a new lesson',
  //   description: 'Create a new lesson and assign it to an existing chapter.',
  // })
  // @ApiBody({
  //   type: BaseCreateLessonDto,
  //   examples: {
  //     example1: {
  //       summary: 'Example payload',
  //       value: {
  //         title: 'Introduction to React',
  //         lessonType: 'video',
  //         lessonStatus: 'published',
  //         position: 1,
  //         chapterId: 2,
  //       },
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: 201,
  //   description: 'Lesson created successfully.',
  //   type: BaseResponseDto<LessonResponseDto>,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Invalid input or missing required fields',
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: 'Chapter not found (if chapterId is provided)',
  // })
  // @ApiResponse({ status: 500, description: 'Internal server error' })
  // public async createLesson(
  //   @Body()
  //   createLesson: BaseCreateLessonDto,
  // ) {
  //   return await this.lessonService.createLesson(createLesson);
  // }

  @Post('content')
  @ApiOperation({
    summary: 'Create a lesson with content',
    description: 'Create a new lesson and attach its content data.',
  })
  @ApiBody({
    type: CreateLessonWithContentDto,
    examples: {
      example1: {
        summary: 'Create a lesson with text content',
        value: {
          title: 'Introduction to React',
          lessonType: 'content',
          lessonStatus: 'published',
          position: 1,
          chapterId: 2,
          content: '<p>Hello React</p>',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Lesson with content created successfully.',
    type: BaseResponseDto<LessonResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or missing required fields.',
  })
  @ApiResponse({
    status: 404,
    description: 'Chapter not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Unexpected server error.',
  })
  @ApiOperation({
    summary: 'Create a content lesson',
    description:
      'Create a lesson with lesson type CONTENT and store its content in the database.',
  })
  public async CreateLessonContent(
    @Body() createLessonCotentDto: CreateLessonWithContentDto,
  ) {
    return await this.lessonService.createLessonWithContent(
      createLessonCotentDto,
    );
  }

  @Get('deleted')
  @ApiOperation({
    summary: 'Get deleted lessons',
    description:
      'Retrieve a list of lessons that have been soft-deleted (not permanently removed).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of deleted lessons fetched successfully.',
    type: PaginationResponse<LessonResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async GetAllLessonsDeleted(
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return await this.lessonService.getAllLessonDeleted(paginationQueryDto);
  }

  @Patch('restore-multiple')
  @ApiOperation({
    summary: 'Restore multiple lessons',
    description:
      'Restore multiple lessons that have been soft-deleted using a list of lesson IDs.',
  })
  @ApiBody({
    schema: {
      type: 'array',
      items: { type: 'number', example: 1 },
      example: [1, 2, 3],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Lessons restored successfully.',
    type: BaseResponseDto<LessonResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'No lesson IDs provided' })
  @ApiResponse({ status: 404, description: 'Some or all lesson not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async RestoreLessonMultiple(@Body() ids: number[]) {
    return await this.lessonService.restoreLessonMultiple(ids);
  }

  @Patch('status-multiple')
  @ApiOperation({ summary: 'Change status for multiple lessons' })
  @ApiBody({ type: ChangeLessonStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated lesson statuses',
    type: BaseResponseDto<LessonResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async changeLessonStatusMultiple(
    @Body() changeLessonStatusDto: ChangeLessonStatusDto,
  ) {
    return await this.lessonService.changeLessonStatusMultiple(
      changeLessonStatusDto,
    );
  }

  @Patch('position-multiple')
  @ApiOperation({ summary: 'Change position for multiple lessons' })
  @ApiBody({ type: ChangeLessonPositionDto, isArray: true })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated lesson positions',
    type: BaseResponseDto<LessonResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async changeLessonPositionMultiple(
    @Body() changeLessonPositionDto: ChangeLessonPositionDto[],
  ) {
    return await this.lessonService.changeLessonPositionMultiple(
      changeLessonPositionDto,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get lesson details by ID',
    description: 'Retrieve detailed information about a specific lesson.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Lesson ID to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson details fetched successfully.',
    type: BaseResponseDto<LessonResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Lesson not found.' })
  public async GetLessonDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.lessonService.getDetailLesson(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing lesson',
    description:
      'Update lesson information such as title, type, status, or position.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Lesson ID to update',
  })
  @ApiBody({
    type: UpdateLessonDto,
    examples: {
      example1: {
        summary: 'Example payload',
        value: {
          title: 'Updated React Basics',
          lessonStatus: 'draft',
          chapterId: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson updated successfully.',
    type: BaseResponseDto<LessonResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Lesson not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async UpdateLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return await this.lessonService.updateLesson(id, updateLessonDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update lesson status',
    description:
      'Change the status of a specific lesson by its ID. Status values include: DRAFT, ACTIVE, INACTIVE, ARCHIVED.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The ID of the lesson to update.',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(LessonStatus),
          example: 'draft',
          description: 'New status of the lesson.',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson status updated successfully.',
    type: BaseResponseDto<LessonResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status value or request body.',
  })
  @ApiResponse({
    status: 404,
    description: 'Lesson not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  public async ChangeLessonStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: LessonStatus,
  ) {
    return await this.lessonService.changeLessonStatus(id, status);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a lesson',
    description:
      'Restore a single lesson that has been soft-deleted by its ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 5,
    description: 'Lesson ID to restore',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson restored successfully.',
    type: BaseResponseDto<LessonResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Lesson not found or already active.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async Restorelesson(@Param('id', ParseIntPipe) id: number) {
    return await this.lessonService.restoreLesson(id);
  }

  @Delete(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete a lesson',
    description:
      'Soft delete a lesson (mark it as deleted without removing it from the database).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 5,
    description: 'Lesson ID to soft delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson soft deleted successfully.',
    type: BaseResponseDto<LessonResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Lesson not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async SoftDeleteLesson(@Param('id', ParseIntPipe) id: number) {
    return await this.lessonService.softDeleteLesson(id);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({
    summary: 'Permanently delete a lesson',
    description:
      'Permanently remove a lesson from the database (only for soft-deleted lessons).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 5,
    description: 'Lesson ID to permanently delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson permanently deleted successfully.',
    type: BaseResponseDto<LessonResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Lesson not found or not soft-deleted.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async HardDeleteLesson(@Param('id', ParseIntPipe) id: number) {
    return await this.lessonService.hardDeleteLesson(id);
  }
}
