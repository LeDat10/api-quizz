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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreatePdfResourceDto } from './dtos/create-pdf-resource.dto';
import { UpdatePdfResourceDto } from './dtos/update-pdf-resource.dto';
import { ResourceService } from './resource.service';
import { BaseResponseDto } from 'src/common/response/dtos/base-response.dto';
import { PdfResourceResponseDto } from './dtos/pdf-resource-response.dto';
import { ResourceResponseDto } from './dtos/resource-response.dto';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { PaginationResponse } from 'src/common/pagination/dtos/pagination-response.dto';
import { ChangeResourcePositionDto } from './dtos/change-resource-position.dto';

@ApiTags('Resources')
@Controller('resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all resources',
    description:
      'Retrieve all resources (both PDF and video) with pagination and optional filters.',
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
    description: 'Successfully retrieved resources list',
    type: PaginationResponse<PdfResourceResponseDto>,
    isArray: false,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async GetAllResources(
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return await this.resourceService.getAllResources(paginationQueryDto);
  }

  @Get('deleted')
  @ApiOperation({
    summary: 'Get all deleted resources',
    description:
      'Retrieve all soft-deleted resources for administrative or restoration purposes.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved deleted resources',
    type: PaginationResponse<ResourceResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async GetAllResouresDeleted(
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return await this.resourceService.getAllResourcesDeleted(
      paginationQueryDto,
    );
  }

  @Post('pdf')
  @ApiOperation({
    summary: 'Create a PDF resource',
    description: 'Upload and create a new PDF resource in the system.',
  })
  @ApiBody({ type: CreatePdfResourceDto })
  @ApiResponse({
    status: 201,
    description: 'PDF resource successfully created',
    type: BaseResponseDto<PdfResourceResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing required fields',
  })
  @ApiResponse({
    status: 404,
    description: 'Library not found (if libraryId is provided)',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async CreatePdfResource(
    @Body() createPdfResourceDto: CreatePdfResourceDto,
  ) {
    return await this.resourceService.createPdfResource(createPdfResourceDto);
  }

  @Get('pdf/:id')
  @ApiOperation({
    summary: 'Get PDF resource detail',
    description:
      'Retrieve detailed information about a specific PDF resource by its ID, including metadata and related information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the PDF resource',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved PDF resource details',
    type: BaseResponseDto<PdfResourceResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID parameter or unsupported resource type',
  })
  @ApiResponse({
    status: 404,
    description: 'PDF resource not found or has been deleted',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  public async GetPdfResourceDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.resourceService.getPdfResourceDetail(id);
  }

  @Patch('pdf/:id')
  @ApiOperation({
    summary: 'Update a PDF resource',
    description: 'Update the details of an existing PDF resource by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the PDF resource',
    example: 1,
  })
  @ApiBody({ type: UpdatePdfResourceDto })
  @ApiResponse({
    status: 200,
    description: 'PDF resource successfully updated',
    type: BaseResponseDto<PdfResourceResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or unsupported resource type',
  })
  @ApiResponse({ status: 404, description: 'PDF resource not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async UpdatePdfResource(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePdfResourceDto: UpdatePdfResourceDto,
  ) {
    return await this.resourceService.updatePdfResource(
      id,
      updatePdfResourceDto,
    );
  }

  @Delete('pdf/:id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete a PDF resource',
    description:
      'Mark a PDF resource as deleted without removing it permanently from the database.',
  })
  @ApiParam({ name: 'id', description: 'ID of the PDF resource', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'PDF resource successfully soft deleted',
    type: BaseResponseDto<PdfResourceResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'PDF resource not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async SoftDeletePdfResource(@Param('id', ParseIntPipe) id: number) {
    return await this.resourceService.softDeletePdfResource(id);
  }

  @Delete('pdf/:id/hard-delete')
  @ApiOperation({
    summary: 'Permanently delete a PDF resource',
    description:
      'Completely remove a PDF resource from the database (cannot be restored afterwards).',
  })
  @ApiParam({ name: 'id', description: 'ID of the PDF resource', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'PDF resource successfully deleted permanently',
    type: BaseResponseDto<PdfResourceResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'PDF resource not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async HardDeletePdfResource(@Param('id', ParseIntPipe) id: number) {
    return await this.resourceService.hardDeletePdfResource(id);
  }

  @Patch('pdf/:id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted PDF resource',
    description: 'Restore a previously soft-deleted PDF resource by its ID.',
  })
  @ApiParam({ name: 'id', description: 'ID of the PDF resource', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'PDF resource successfully restored',
    type: BaseResponseDto<PdfResourceResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'PDF resource not found or already active',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async RestoreResource(@Param('id', ParseIntPipe) id: number) {
    return await this.resourceService.restorePdfResource(id);
  }

  @Patch('pdf/restore-multiple')
  @ApiOperation({
    summary: 'Restore multiple PDF resources',
    description:
      'Restore several soft-deleted PDF resources at once by providing a list of IDs.',
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
    description: 'Multiple PDF resources successfully restored',
    type: BaseResponseDto<PdfResourceResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'No resource IDs provided' })
  @ApiResponse({ status: 404, description: 'Some or all resources not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async RestoreResourceMultiple(@Body() ids: number[]) {
    return await this.resourceService.restorePdfResourceMultiple(ids);
  }

  @Patch('position-multiple')
  @ApiOperation({ summary: 'Change position for multiple resources' })
  @ApiBody({ type: ChangeResourcePositionDto, isArray: true })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated resource positions',
    type: BaseResponseDto<ResourceResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async ChangeResourcePositionMultiple(
    changeResourcePositionDtos: ChangeResourcePositionDto[],
  ) {
    return await this.resourceService.changeResourcePositionMultiple(
      changeResourcePositionDtos,
    );
  }
}
