import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class ChangeResourceLibraryPositionDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  id: number;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty()
  position: number;
}
