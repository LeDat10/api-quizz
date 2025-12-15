import { Module } from '@nestjs/common';
import { LessonService } from './services/lesson.service';
import { LessonController } from './lesson.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './lesson.entity';
import { ChaptersModule } from 'src/chapters/chapters.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { ContentLessonModule } from 'src/content-lesson/content-lesson.module';
import { LessonCustomRepository } from './repositories/lesson.repository';
import { LessonStrategyFactory } from './factories/lesson-strategy.factory';
import { LessonBulkService } from './services/lesson-bulk.service';

@Module({
  providers: [LessonService],
  controllers: [LessonController],
  imports: [
    TypeOrmModule.forFeature([Lesson]),
    ChaptersModule,
    PaginationModule,
    ContentLessonModule,
    LessonCustomRepository,
    LessonStrategyFactory,
    LessonBulkService,
  ],
  exports: [LessonService],
})
export class LessonModule {}
