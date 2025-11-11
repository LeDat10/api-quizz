import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { ResourceStatus } from '../enums/resource-type.enum';

export class ChangeResourceStatusDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  @ApiProperty({
    type: [Number],
  })
  ids: number[];

  @IsEnum(ResourceStatus)
  @IsNotEmpty()
  @ApiProperty()
  status: ResourceStatus;
}
