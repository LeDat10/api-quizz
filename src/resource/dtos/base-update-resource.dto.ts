import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ResourceStatus } from '../enums/resource-type.enum';

export class BaseUpdateResourceDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  url?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsEnum(ResourceStatus)
  @IsOptional()
  status?: ResourceStatus;

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional()
  libraryId?: number;
}
