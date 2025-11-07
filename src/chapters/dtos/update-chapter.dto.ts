import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ChapterStatus } from '../enums/chapter.enum';

export class UpdateChapterDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum({
    enum: ChapterStatus,
  })
  @IsOptional()
  status?: ChapterStatus;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsOptional()
  @IsString()
  courseId?: number;
}
