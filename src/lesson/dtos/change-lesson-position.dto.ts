import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class ChangeLessonPositionDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  id: string;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty()
  position: number;
}
