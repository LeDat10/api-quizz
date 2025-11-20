import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ResourceType } from 'cloudinary';

export class UploadSignatureDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  folder: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  resourceType?: ResourceType;
}
