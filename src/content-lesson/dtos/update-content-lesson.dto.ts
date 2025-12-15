import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class UpdateContentlessonDto {
  @IsUUID('4')
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
