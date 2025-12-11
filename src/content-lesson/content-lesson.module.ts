import { Module } from '@nestjs/common';
import { ContentLessonService } from './content-lesson.service';
import { ContentLessonController } from './content-lesson.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentLesson } from './content-lesson.entity';

@Module({
  providers: [ContentLessonService],
  controllers: [ContentLessonController],
  imports: [TypeOrmModule.forFeature([ContentLesson])],
  exports: [ContentLessonService],
})
export class ContentLessonModule {}
