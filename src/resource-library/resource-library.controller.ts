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
import { ResourceLibraryResponseDto } from './dtos/resource-library-response.dto';
import { ResourceLibraryService } from './resource-library.service';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PaginationResponse } from 'src/common/pagination/dtos/pagination-response.dto';
import { BaseResponseDto } from 'src/common/response/dtos/base-response.dto';
import { CreateResourceLibraryDto } from './dtos/create-resource-library.dto';
import { UpdateResourceLibraryDto } from './dtos/update-resource-library.dto';
import { ChangeResourceLibraryPositionDto } from './dtos/change-resource-library-position.dto';
import { ChangeResourceLibraryStatusDto } from './dtos/change-resource-library-status.dto';

@Controller('resource-library')
export class ResourceLibraryController {
  constructor(
    private readonly resourceLibraryService: ResourceLibraryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all resources library',
    description:
      'Retrieve all resources library with pagination and optional filters.',
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
    description: 'Successfully retrieved resources library list',
    type: PaginationResponse<ResourceLibraryResponseDto>,
    isArray: false,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async GetAllLibrary(@Query() paginationQueryDto: PaginationQueryDto) {
    return await this.resourceLibraryService.getAllLibrary(paginationQueryDto);
  }

  @Get('deleted')
  @ApiOperation({
    summary: 'Get all deleted resources library',
    description:
      'Retrieve all soft-deleted resources library for administrative or restoration purposes.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved deleted resources library',
    type: PaginationResponse<ResourceLibraryResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async GetAllLibraryDeleted(
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return await this.resourceLibraryService.getAllLibraryDeleted(
      paginationQueryDto,
    );
  }

  @Patch('status-multiple')
  @ApiOperation({ summary: 'Change status for multiple resources library' })
  @ApiBody({ type: ChangeResourceLibraryStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated resource library statuses',
    type: BaseResponseDto<ResourceLibraryResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async ChangeLibraryStatusMultiple(
    @Body() changeLibraryStatusDto: ChangeResourceLibraryStatusDto,
  ) {
    return await this.resourceLibraryService.changeLibraryStatusMultiple(
      changeLibraryStatusDto,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Resource Library detail',
    description:
      'Retrieve detailed information about a specific Resource Library by its ID, including metadata and related information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the Resource Library',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved Resource Library details',
    type: BaseResponseDto<ResourceLibraryResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID parameter or unsupported resource type',
  })
  @ApiResponse({
    status: 404,
    description: 'Resource Library not found or has been deleted',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  public async GetLibraryDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.resourceLibraryService.getLibraryDetail(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a Resource Library',
    description: 'Upload and create a new Resource Library in the system.',
  })
  @ApiBody({ type: CreateResourceLibraryDto })
  @ApiResponse({
    status: 201,
    description: 'Resource Library successfully created',
    type: BaseResponseDto<ResourceLibraryResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing required fields',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async CreateLibrary(
    @Body() createLibraryDto: CreateResourceLibraryDto,
  ) {
    return await this.resourceLibraryService.createLibrary(createLibraryDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a Resource Library',
    description:
      'Update the details of an existing Resource Library by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Resource Library',
    example: 1,
  })
  @ApiBody({ type: UpdateResourceLibraryDto })
  @ApiResponse({
    status: 200,
    description: 'Resource Library successfully updated',
    type: BaseResponseDto<ResourceLibraryResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or unsupported resource type',
  })
  @ApiResponse({ status: 404, description: 'Resource Library not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async UpdateLibrary(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLibraryDto: UpdateResourceLibraryDto,
  ) {
    return await this.resourceLibraryService.updateLibrary(
      id,
      updateLibraryDto,
    );
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted resource library',
    description:
      'Restore a previously soft-deleted resource library by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the resource library',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'resource library successfully restored',
    type: BaseResponseDto<ResourceLibraryResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'resource library not found or already active',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async RestoreLibrary(@Param('id', ParseIntPipe) id: number) {
    return await this.resourceLibraryService.restoreLibrary(id);
  }

  @Patch('restore-multiple')
  @ApiOperation({
    summary: 'Restore multiple Resource Library',
    description:
      'Restore several soft-deleted Resource Library at once by providing a list of IDs.',
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
    description: 'Multiple Resource Library successfully restored',
    type: BaseResponseDto<ResourceLibraryResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'No Resource Library IDs provided' })
  @ApiResponse({ status: 404, description: 'Some or all categories not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async RestoreLibraryMultiple(@Body() ids: number[]) {
    return await this.resourceLibraryService.restoreLibraryMultiple(ids);
  }

  @Delete(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete a Resource Library',
    description:
      'Mark a Resource Library as deleted without removing it permanently from the database.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the Resource Library',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Resource Library successfully soft deleted',
    type: BaseResponseDto<ResourceLibraryResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Resource Library not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async SoftDeleteLibrary(@Param('id', ParseIntPipe) id: number) {
    return await this.resourceLibraryService.softDeletedLibrary(id);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({
    summary: 'Permanently delete a Resource Library',
    description:
      'Completely remove a Resource Library from the database (cannot be restored afterwards).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the Resource Library',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Resource Library successfully deleted permanently',
    type: BaseResponseDto<ResourceLibraryResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Resource Library not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async HardDeleteLibrary(@Param('id', ParseIntPipe) id: number) {
    return await this.resourceLibraryService.hardDeletedLibrary(id);
  }

  @Patch('position-multiple')
  @ApiOperation({ summary: 'Change position for multiple resources library' })
  @ApiBody({ type: ChangeResourceLibraryPositionDto, isArray: true })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated resource library positions',
    type: BaseResponseDto<ResourceLibraryResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async ChangeLibraryPositionMultiple(
    @Body() changeLibraryPositionDtos: ChangeResourceLibraryPositionDto[],
  ) {
    return await this.resourceLibraryService.changeLibraryPositionMutiple(
      changeLibraryPositionDtos,
    );
  }
}
