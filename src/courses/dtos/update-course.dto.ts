import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus, TypeCourse } from '../enums/type-course.enum';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @ApiPropertyOptional()
  thumbnail?: string;

  @IsEnum(TypeCourse)
  @IsOptional()
  @ApiPropertyOptional()
  typeCourse?: TypeCourse;

  @IsEnum(CourseStatus)
  @IsOptional()
  @ApiPropertyOptional()
  status?: CourseStatus;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  position?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  categoryId?: number;
}
