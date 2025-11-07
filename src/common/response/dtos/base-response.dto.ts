import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T> {
  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false })
  meta?: any;

  constructor(message: string, data?: T, meta?: any) {
    this.message = message;
    this.data = data;
    this.meta = meta;
  }
}
