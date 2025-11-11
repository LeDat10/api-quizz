import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { LibraryStatus } from '../enums/resource-library.enum';

export class CreateResourceLibraryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional()
  position?: number;

  @IsEnum(LibraryStatus)
  @IsOptional()
  @ApiPropertyOptional()
  status?: LibraryStatus;
}
