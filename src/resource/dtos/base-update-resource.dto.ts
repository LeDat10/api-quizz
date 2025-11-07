import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BaseUpdateResourceDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  url?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  libraryId?: number;
}
