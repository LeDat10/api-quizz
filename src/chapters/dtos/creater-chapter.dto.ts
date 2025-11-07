import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChapterStatus } from '../enums/chapter.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChapterDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsEnum({
    enum: ChapterStatus,
  })
  @IsOptional()
  @ApiPropertyOptional()
  status?: ChapterStatus;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  position?: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  courseId: number;
}
