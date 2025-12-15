import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseCreateLessonDto } from '../dtos/base-create-lesson.dto';
import { Lesson } from '../lesson.entity';
import { ContentLessonService } from 'src/content-lesson/content-lesson.service';
import { LessonCreator } from '../interfaces/lesson.interface';
import { BaseUpdateLessonDto } from '../dtos/base-update-lesson.dto';
import { UdpateLessonWithContentDto } from '../dtos/update-lesson-with-content.dto';
import { CreateLessonWithContentDto } from '../dtos/create-lesson-with-content.dto';
import { QueryRunner } from 'typeorm';
import { ContentLesson } from 'src/content-lesson/content-lesson.entity';

@Injectable()
export class ContentLessonStrategy implements LessonCreator {
  constructor(private contentLessonService: ContentLessonService) {}
  async permanentDelete(
    lesson: Lesson,
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (lesson.contentLesson) {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(ContentLesson)
        .where('lessonId = :id', { id: lesson.id })
        .execute();
    }
  }

  validate(dto: BaseCreateLessonDto): void {
    const contentDto = dto as CreateLessonWithContentDto;
    if (!contentDto.content) {
      throw new BadRequestException(
        'Content is required for CONTENT type lesson',
      );
    }
  }

  async prepareData(dto: BaseCreateLessonDto, lesson: Lesson): Promise<void> {
    const contentDto = dto as CreateLessonWithContentDto;
    if (!contentDto.content) return;

    await this.contentLessonService.createContentlesson({
      lessonId: lesson.id,
      content: contentDto.content,
    });
  }

  async updateData(dto: BaseUpdateLessonDto, lesson: Lesson): Promise<void> {
    const contentDto = dto as UdpateLessonWithContentDto;

    if (!contentDto.content) {
      return;
    }

    if (lesson.contentLesson) {
      await this.contentLessonService.updateContentLesson({
        id: lesson.contentLesson.id,
        content: contentDto.content,
      });
    } else {
      await this.contentLessonService.createContentlesson({
        lessonId: lesson.id,
        content: contentDto.content,
      });
    }
  }

  async cleanupData(lesson: Lesson, queryRunner: QueryRunner): Promise<void> {
    if (lesson.contentLesson) {
      await queryRunner.manager
        .createQueryBuilder()
        .softDelete()
        .from(ContentLesson)
        .where('lessonId = :id', { id: lesson.id })
        .execute();
    }
  }

  async cleanupManyData(lessonIds: number[]): Promise<void> {
    if (lessonIds.length) {
      await this.contentLessonService.softDeleteManyContent(lessonIds);
    }
  }

  async restoreData(lesson: Lesson, queryRunner: QueryRunner): Promise<void> {
    if (lesson.contentLesson) {
      await queryRunner.manager
        .createQueryBuilder()
        .restore()
        .from(ContentLesson)
        .where('id = :id', { id: lesson.contentLesson.id })
        .execute();
    }
  }
}
