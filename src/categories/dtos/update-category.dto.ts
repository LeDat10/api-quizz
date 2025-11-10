import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { CategoryStatus } from '../enums/category-status.enum';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  thumbnail?: string;

  @IsEnum(CategoryStatus)
  @ApiPropertyOptional()
  @IsOptional()
  status?: CategoryStatus;

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional()
  position?: number;
}
