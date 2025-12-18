import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChapterStatus } from '../enums/chapter.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from 'src/common/status/enums/status.enum';

export class CreateChapterDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional()
  position?: number;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  courseId: number;
}
