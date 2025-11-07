import { IsNumber, IsOptional } from 'class-validator';
import { BaseCreateResourceDto } from './base-create-resource.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePdfResourceDto extends BaseCreateResourceDto {
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  pageCount?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  fileSize?: number;
}
