import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { LessonStatus } from '../enums/lesson.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeLessonStatusDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  @ApiProperty({
    type: [Number],
  })
  ids: number[];

  @IsEnum(LessonStatus)
  @IsNotEmpty()
  @ApiProperty()
  status: LessonStatus;
}
