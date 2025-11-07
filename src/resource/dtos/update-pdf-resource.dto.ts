import { IsNumber, IsOptional } from 'class-validator';
import { BaseUpdateResourceDto } from './base-update-resource.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePdfResourceDto extends BaseUpdateResourceDto {
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  pageCount?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  fileSize?: number;
}
