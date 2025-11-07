import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CategoryStatus } from '../enums/category-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  description?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  thumbnail?: string;

  @IsEnum(CategoryStatus)
  @ApiProperty()
  @IsOptional()
  status?: CategoryStatus;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  position?: number;
}
