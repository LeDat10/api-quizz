import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { LessonType } from '../enums/lesson.enum';
import { CreateLessonWithContentDto } from '../dtos/create-lesson-with-content.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// validation.pipe.ts
@Injectable()
export class LessonValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value.lessonType) {
      throw new BadRequestException('Lesson type is required');
    }

    const dtoClass = this.getDtoClass(value.type);

    const dto = plainToInstance(dtoClass, value, {
      excludeExtraneousValues: false, // Cho phép các field không có decorator
      enableImplicitConversion: true, // Auto convert types
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors.map((error) =>
        Object.values(error.constraints || {}).join(', '),
      );
      throw new BadRequestException(messages);
    }

    return dto;
  }

  private getDtoClass(type: string): any {
    switch (type) {
      case LessonType.CONTENT:
        return CreateLessonWithContentDto;

      //   case LessonType.TEXT:
      //     return CreateTextLessonDto;

      //   case LessonType.QUIZ:
      //     return CreateQuizLessonDto;

      default:
        throw new BadRequestException(
          `Invalid lesson type: ${type}. Allowed types: ${Object.values(LessonType).join(', ')}`,
        );
    }
  }
}
