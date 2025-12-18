import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { ChapterStatus } from '../enums/chapter.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from 'src/common/status/enums/status.enum';

export class ChangeChapterStatusDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayNotEmpty()
  @ApiProperty({
    type: [String],
  })
  ids: string[];

  @IsEnum(ChapterStatus)
  @IsNotEmpty()
  @ApiProperty()
  status: Status;
}
