import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateContentlessonDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
