import { IsInt, IsNumber, IsOptional } from 'class-validator';
import { BaseUpdateResourceDto } from './base-update-resource.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePdfResourceDto extends BaseUpdateResourceDto {
  @IsInt()
  @IsOptional()
  @ApiPropertyOptional()
  pageCount?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  fileSize?: number;
}
