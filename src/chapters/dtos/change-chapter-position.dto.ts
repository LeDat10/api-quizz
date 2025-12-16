import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class ChangeChapterPositionDto {
  @IsUUID('4')
  @IsNotEmpty()
  @ApiProperty()
  id: string;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty()
  position: number;
}
