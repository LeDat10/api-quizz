import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { LessonStatus } from '../enums/lesson.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeLessonStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  @ApiProperty({
    type: [String],
    format: 'uuid',
    example: [
      'ce40c3c2-6340-4662-a397-5ee78b3ef671',
      '9c77096e-f7b4-41a2-9fa2-2adad6295ead',
    ],
  })
  ids: string[];

  @IsEnum(LessonStatus)
  @IsNotEmpty()
  @ApiProperty()
  status: LessonStatus;
}
