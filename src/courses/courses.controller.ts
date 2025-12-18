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
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dtos/create-course.dto';
import { UpdateCourseDto } from './dtos/update-course.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CourseResponseDto } from './dtos/course-response.dto';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { PaginationResponse } from 'src/common/pagination/dtos/pagination-response.dto';
import { BaseResponseDto } from 'src/common/response/dtos/base-response.dto';
import { ChangeCourseStatusDto } from './dtos/change-course-status.dto';
import { ChangeCoursePositionDto } from './dtos/change-course-position.dto';
import { CourseStatus } from './enums/type-course.enum';
import { Status } from 'src/common/status/enums/status.enum';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all courses',
    description: 'Retrieve all courses with pagination and optional filters.',
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
    description: 'Successfully retrieved courses list',
    type: PaginationResponse<CourseResponseDto>,
    isArray: false,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async getAllCourses(@Query() paginationQueryDto: PaginationQueryDto) {
    return await this.coursesService.getAllCourses(paginationQueryDto);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a Course',
    description: 'Upload and create a new Course in the system.',
  })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({
    status: 201,
    description: 'Course successfully created',
    type: BaseResponseDto<CourseResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing required fields',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found (if categoryId is provided)',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async createCourse(@Body() createCourseDto: CreateCourseDto) {
    return await this.coursesService.createCourse(createCourseDto);
  }

  @Get('deleted')
  @ApiOperation({
    summary: 'Get all deleted courses',
    description:
      'Retrieve all soft-deleted courses for administrative or restoration purposes.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved deleted courses',
    type: PaginationResponse<CourseResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async getAllCoursesDeleted(
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return this.coursesService.getAllCourseDeleted(paginationQueryDto);
  }

  @Patch('restore-multiple')
  @ApiOperation({
    summary: 'Restore multiple Course',
    description:
      'Restore several soft-deleted Course at once by providing a list of IDs.',
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
    description: 'Multiple courses successfully restored',
    type: BaseResponseDto<CourseResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'No course IDs provided' })
  @ApiResponse({ status: 404, description: 'Some or all courses not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async restoreCourseMultiple(@Body() ids: number[]) {
    return this.coursesService.restoreCourseMultiple(ids);
  }

  @Patch('status-multiple')
  @ApiOperation({ summary: 'Change status for multiple courses' })
  @ApiBody({ type: ChangeCourseStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated course statuses',
    type: BaseResponseDto<CourseResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async ChangeCourseStatusMultiple(
    @Body() changeCourseStatusDto: ChangeCourseStatusDto,
  ) {
    return await this.coursesService.changeCourseStatusMultiple(
      changeCourseStatusDto,
    );
  }

  @Patch('position-multiple')
  @ApiOperation({ summary: 'Change position for multiple courses' })
  @ApiBody({ type: ChangeCoursePositionDto, isArray: true })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated course positions',
    type: BaseResponseDto<CourseResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async ChangeCoursePositionMulitple(
    @Body() changeCoursePositionDtos: ChangeCoursePositionDto[],
  ) {
    return await this.coursesService.changeCoursePositionMultiple(
      changeCoursePositionDtos,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Course detail',
    description:
      'Retrieve detailed information about a specific Course by its ID, including metadata and related information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the Course',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved Course details',
    type: BaseResponseDto<CourseResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID parameter or unsupported resource type',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found or has been deleted',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  public async getCourseDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.coursesService.getCourseDetail(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a Course',
    description: 'Update the details of an existing Course by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Course',
    example: 1,
  })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({
    status: 200,
    description: 'Course successfully updated',
    type: BaseResponseDto<CourseResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return await this.coursesService.updateCourse(updateCourseDto, id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update course status',
    description:
      'Change the status of a specific course by its ID. Status values include: DRAFT, ACTIVE, INACTIVE, ARCHIVED.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The ID of the course to update.',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(CourseStatus),
          example: 'draft',
          description: 'New status of the course.',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Course status updated successfully.',
    type: BaseResponseDto<CourseResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status value or request body.',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  public async ChangeCourseStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: Status,
  ) {
    return await this.coursesService.changeCourseStatus(id, status);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted Course',
    description: 'Restore a previously soft-deleted Course by its ID.',
  })
  @ApiParam({ name: 'id', description: 'ID of the Course', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Course successfully restored',
    type: BaseResponseDto<CourseResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found or already active',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async restoreCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.restoreCourse(id);
  }

  @Delete(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete a Course',
    description:
      'Mark a Course as deleted without removing it permanently from the database.',
  })
  @ApiParam({ name: 'id', description: 'ID of the Course', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Course successfully soft deleted',
    type: BaseResponseDto<CourseResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async softDeleteCourse(@Param('id', ParseIntPipe) id: number) {
    return await this.coursesService.softDeleteCourse(id);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({
    summary: 'Permanently delete a Course',
    description:
      'Completely remove a Course from the database (cannot be restored afterwards).',
  })
  @ApiParam({ name: 'id', description: 'ID of the Course', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Course successfully deleted permanently',
    type: BaseResponseDto<CourseResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async hardDeleteCourse(@Param('id', ParseIntPipe) id: number) {
    return await this.coursesService.hardDeleteCourse(id);
  }
}
