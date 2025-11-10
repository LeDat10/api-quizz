import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ChapterStatus } from '../enums/chapter.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateChapterDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  title?: string;

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

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional()
  courseId?: number;
}
