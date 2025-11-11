import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { LibraryStatus } from '../enums/resource-library.enum';

export class UpdateResourceLibraryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  name?: string;

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
