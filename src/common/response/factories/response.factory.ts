import { BaseResponseDto } from '../dtos/base-response.dto';

export class ResponseFactory {
  static success<T>(message: string, data?: T, meta?: any): BaseResponseDto<T> {
    return new BaseResponseDto<T>(message, data, meta);
  }

  static error<T>(message: string, meta?: any): BaseResponseDto<T> {
    return new BaseResponseDto<T>(message, undefined, meta);
  }
}
