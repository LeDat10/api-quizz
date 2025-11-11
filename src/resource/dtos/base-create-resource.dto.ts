import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ResourceStatus } from '../enums/resource-type.enum';

export class BaseCreateResourceDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  url: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsEnum(ResourceStatus)
  @IsOptional()
  @ApiPropertyOptional()
  status?: ResourceStatus;

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional()
  libraryId?: number;
}
