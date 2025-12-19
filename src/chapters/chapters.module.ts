import { forwardRef, Module } from '@nestjs/common';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './services/chapters.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter } from './chapter.entity';
import { CoursesModule } from 'src/courses/courses.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { ChapterBulkService } from './services/chapter-bulk.service';
import { ChapterCustomRepository } from './repositories/chapter.repository';
import { LessonModule } from 'src/lesson/lesson.module';

@Module({
  controllers: [ChaptersController],
  providers: [ChaptersService, ChapterBulkService, ChapterCustomRepository],
  imports: [
    TypeOrmModule.forFeature([Chapter]),
    CoursesModule,
    PaginationModule,
  ],
  exports: [ChaptersService],
})
export class ChaptersModule {}
