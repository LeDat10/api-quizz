import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class ChangeLessonPositionDto {
  @IsUUID('4')
  @IsNotEmpty()
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty()
  position: number;
}
