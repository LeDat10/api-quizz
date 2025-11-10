import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { CategoryStatus } from '../enums/category-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeCategoryStatusDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  @ApiProperty({
    type: [Number],
  })
  ids: number[];

  @IsEnum(CategoryStatus)
  @IsNotEmpty()
  @ApiProperty()
  status: CategoryStatus;
}
