import {
  IsEnum,
  IsInt,
  IsNotEmpty,
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

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional()
  position?: number;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  courseId: number;
}
