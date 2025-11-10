import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { ChapterStatus } from '../enums/chapter.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeChapterStatusDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  @ApiProperty({
    type: [Number],
  })
  ids: number[];

  @IsEnum(ChapterStatus)
  @IsNotEmpty()
  @ApiProperty()
  status: ChapterStatus;
}
