import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LibraryStatus } from '../enums/resource-library.enum';
import { Type } from 'class-transformer';

export class ChangeResourceLibraryStatusDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  @Type(() => Number)
  @ApiProperty({
    type: [Number],
  })
  ids: number[];

  @IsEnum(LibraryStatus)
  @IsNotEmpty()
  @ApiProperty()
  status: LibraryStatus;
}
