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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CategoryResponseDto } from './dtos/category-response.dto';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { BaseResponseDto } from 'src/common/response/dtos/base-response.dto';
import { PaginationResponse } from 'src/common/pagination/dtos/pagination-response.dto';
import { ChangeCategoryStatusDto } from './dtos/change-category-status.dto';
import { ChangeCategoryPositionDto } from './dtos/change-category-position.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly cateogriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description:
      'Retrieve all categories with pagination and optional filters.',
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
    description: 'Successfully retrieved categories list',
    type: PaginationResponse<CategoryResponseDto>,
    isArray: false,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async GetAllCategories(
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return await this.cateogriesService.getAllCategories(paginationQueryDto);
  }

  @Get('deleted')
  @ApiOperation({
    summary: 'Get all deleted categories',
    description:
      'Retrieve all soft-deleted categories for administrative or restoration purposes.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved deleted categories',
    type: PaginationResponse<CategoryResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async GetAllCategoriesDeleted(
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return await this.cateogriesService.getAllCategoriesDeleted(
      paginationQueryDto,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a Category',
    description: 'Upload and create a new Category in the system.',
  })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category successfully created',
    type: BaseResponseDto<CategoryResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing required fields',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async CreateCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.cateogriesService.createCategory(createCategoryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Category detail',
    description:
      'Retrieve detailed information about a specific Category by its ID, including metadata and related information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the Category',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved Category details',
    type: BaseResponseDto<CategoryResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID parameter or unsupported resource type',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found or has been deleted',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  public async GetDetailCategory(@Param('id', ParseIntPipe) id: number) {
    return await this.cateogriesService.getCategoryDetail(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a Category',
    description: 'Update the details of an existing Category by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Category',
    example: 1,
  })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'Category successfully updated',
    type: BaseResponseDto<CategoryResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or unsupported resource type',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async UpdateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return await this.cateogriesService.updateOneCategory(
      id,
      updateCategoryDto,
    );
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted category',
    description: 'Restore a previously soft-deleted category by its ID.',
  })
  @ApiParam({ name: 'id', description: 'ID of the category', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'category successfully restored',
    type: BaseResponseDto<CategoryResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'category not found or already active',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async RestoreCategory(@Param('id', ParseIntPipe) id: number) {
    return await this.cateogriesService.restoreCategory(id);
  }

  @Patch('restore-multiple')
  @ApiOperation({
    summary: 'Restore multiple Category',
    description:
      'Restore several soft-deleted Category at once by providing a list of IDs.',
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
    description: 'Multiple Category successfully restored',
    type: BaseResponseDto<CategoryResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'No category IDs provided' })
  @ApiResponse({ status: 404, description: 'Some or all categories not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async RestoreCategoryMultiple(@Body() ids: number[]) {
    return await this.cateogriesService.restoreCategoryMultiple(ids);
  }

  @Patch('change-status')
  @ApiOperation({ summary: 'Change status for multiple lessons' })
  @ApiBody({ type: ChangeCategoryStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated lesson statuses',
    type: BaseResponseDto<CategoryResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async ChangeCategoryStatusMultiple(
    changeCategoryStatusDto: ChangeCategoryStatusDto,
  ) {
    return await this.cateogriesService.changeCategoryStatusMultiple(
      changeCategoryStatusDto,
    );
  }

  @Patch('change-position')
  @ApiOperation({ summary: 'Change position for multiple categories' })
  @ApiBody({ type: ChangeCategoryPositionDto, isArray: true })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated category positions',
    type: BaseResponseDto<CategoryResponseDto[]>,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async ChangeCategoryPositionMultiple(
    changeCategoryPositionDtos: ChangeCategoryPositionDto[],
  ) {
    return await this.cateogriesService.changeCategoryPositionMultiple(
      changeCategoryPositionDtos,
    );
  }

  @Delete(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete a Category',
    description:
      'Mark a Category as deleted without removing it permanently from the database.',
  })
  @ApiParam({ name: 'id', description: 'ID of the Category', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Category successfully soft deleted',
    type: BaseResponseDto<CategoryResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async SoftDeleteCategory(@Param('id', ParseIntPipe) id: number) {
    return await this.cateogriesService.softDeleteCategory(id);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({
    summary: 'Permanently delete a Category',
    description:
      'Completely remove a Category from the database (cannot be restored afterwards).',
  })
  @ApiParam({ name: 'id', description: 'ID of the Category', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Category successfully deleted permanently',
    type: BaseResponseDto<CategoryResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async HardDeleteCategory(@Param('id', ParseIntPipe) id: number) {
    return await this.cateogriesService.hardDeleteCategory(id);
  }
}
