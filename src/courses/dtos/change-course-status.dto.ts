import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { CourseStatus } from '../enums/type-course.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from 'src/common/status/enums/status.enum';

export class ChangeCourseStatusDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  @ApiProperty({
    type: [Number],
  })
  ids: number[];

  @IsEnum(CourseStatus)
  @IsNotEmpty()
  @ApiProperty()
  status: Status;
}
