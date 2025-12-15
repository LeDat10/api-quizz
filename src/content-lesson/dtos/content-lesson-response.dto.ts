import { ApiProperty } from '@nestjs/swagger';
import { ContentLesson } from '../content-lesson.entity';

export class ContentLessonResponseDto {
  constructor(entity: ContentLesson) {
    this.id = entity.id;
    this.content = entity.content;
  }

  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  static fromEntity(entity: ContentLesson): ContentLessonResponseDto {
    return new ContentLessonResponseDto(entity);
  }
}
