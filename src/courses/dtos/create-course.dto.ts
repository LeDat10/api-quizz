import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CourseStatus, TypeCourse } from '../enums/type-course.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
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
