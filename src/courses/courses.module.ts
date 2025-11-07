import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity';
import { CategoriesModule } from 'src/categories/categories.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService],
  imports: [
    TypeOrmModule.forFeature([Course]),
    CategoriesModule,
    PaginationModule,
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
