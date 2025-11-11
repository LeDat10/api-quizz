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
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dtos/creater-chapter.dto';
import { UpdateChapterDto } from './dtos/update-chapter.dto';
import { ChapterResponseDto } from './dtos/chapter-response.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { PaginationResponse } from 'src/common/pagination/dtos/pagination-response.dto';
import { BaseResponseDto } from 'src/common/response/dtos/base-response.dto';
import { ChangeChapterStatusDto } from './dtos/change-chapter-status.dto';
import { ChangeChapterPositionDto } from './dtos/change-chapter-position.dto';

@ApiTags('Chapters')
@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all chapters',
    description: 'Retrieve all chapters with pagination and optional filters.',
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
    description: 'Successfully retrieved chapters list',
    type: PaginationResponse<ChapterResponseDto>,
    isArray: false,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async GetAllChapter(@Query() paginationQueryDto: PaginationQueryDto) {
    return this.chaptersService.getAllChapter(paginationQueryDto);
  }

  @Get('deleted')
  @ApiOperation({
    summary: 'Get all deleted chapters',
    description:
      'Retrieve all soft-deleted chapters for administrative or restoration purposes.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved deleted chapters',
    type: PaginationResponse<ChapterResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async GetAllChapterDeleted(
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return this.chaptersService.getAllChapterDeleted(paginationQueryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Chapter detail',
    description:
      'Retrieve detailed information about a specific Chapter by its ID, including metadata and related information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the Chapter',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved Chapter details',
    type: BaseResponseDto<ChapterResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID parameter or unsupported resource type',
  })
  @ApiResponse({
    status: 404,
    description: 'Chapter not found or has been deleted',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  public async GetChapterDetail(@Param('id', ParseIntPipe) id: number) {
    return this.chaptersService.getChapterDetail(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a Chapter',
    description: 'Upload and create a new Chapter in the system.',
  })
  @ApiBody({ type: CreateChapterDto })
  @ApiResponse({
    status: 201,
    description: 'Chapter successfully created',
    type: BaseResponseDto<ChapterResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing required fields',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found (if courseId is provided)',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async CreateChapter(@Body() createChapterDto: CreateChapterDto) {
    return this.chaptersService.createChapter(createChapterDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a Chapter',
    description: 'Update the details of an existing Chapter by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Chapter',
    example: 1,
  })
  @ApiBody({ type: UpdateChapterDto })
  @ApiResponse({
    status: 200,
    description: 'Chapter successfully updated',
    type: BaseResponseDto<ChapterResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async UpdateChapter(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChapterDto: UpdateChapterDto,
  ) {
    return this.chaptersService.updateChapter(id, updateChapterDto);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted Chapter',
    description: 'Restore a previously soft-deleted Chapter by its ID.',
  })
  @ApiParam({ name: 'id', description: 'ID of the Chapter', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Chapter successfully restored',
    type: BaseResponseDto<ChapterResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Chapter not found or already active',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async RestoreChapter(@Param('id', ParseIntPipe) id: number) {
    return this.chaptersService.restoreChapter(id);
  }

  @Patch('restore-multiple')
  @ApiOperation({
    summary: 'Restore multiple Chapter',
    description:
      'Restore several soft-deleted Chapter at once by providing a list of IDs.',
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
    description: 'Multiple Chapter successfully restored',
    type: BaseResponseDto<ChapterResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'No chapter IDs provided' })
  @ApiResponse({ status: 404, description: 'Some or all chapters not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async RestoreChapterMultiple(@Body() ids: number[]) {
    return this.chaptersService.restoreChapterMultiple(ids);
  }

  @Patch('status-multiple')
  @ApiOperation({ summary: 'Change status for multiple chapters' })
  @ApiBody({ type: ChangeChapterStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated lesson statuses',
    type: BaseResponseDto<ChapterResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async ChangeChapterStatusMultiple(
    changeChapterStatusDto: ChangeChapterStatusDto,
  ) {
    return await this.chaptersService.changeChapterStatusMultiple(
      changeChapterStatusDto,
    );
  }

  @Patch('position-multiple')
  @ApiOperation({ summary: 'Change position for multiple chapters' })
  @ApiBody({ type: ChangeChapterPositionDto, isArray: true })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated chapter positions',
    type: BaseResponseDto<ChapterResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async changeChapterPositionMultiple(
    @Body()
    changeChapterPositionDtos: ChangeChapterPositionDto[],
  ) {
    return await this.chaptersService.changeChapterPositionMultiple(
      changeChapterPositionDtos,
    );
  }

  @Delete(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete a Chapter',
    description:
      'Mark a Chapter as deleted without removing it permanently from the database.',
  })
  @ApiParam({ name: 'id', description: 'ID of the Chapter', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Chapter successfully soft deleted',
    type: BaseResponseDto<ChapterResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async SoftDeleteChapter(@Param('id', ParseIntPipe) id: number) {
    return this.chaptersService.softDeleteChapter(id);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({
    summary: 'Permanently delete a Chapter',
    description:
      'Completely remove a Chapter from the database (cannot be restored afterwards).',
  })
  @ApiResponse({
    status: 200,
    description: 'Chapter successfully deleted permanently',
    type: BaseResponseDto<ChapterResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async HardDeleteChapter(@Param('id', ParseIntPipe) id: number) {
    return this.chaptersService.hardDeleteChapter(id);
  }
}
