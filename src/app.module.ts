import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoursesModule } from './courses/courses.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from './categories/categories.module';
import { Course } from './courses/course.entity';
import { Category } from './categories/category.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChaptersModule } from './chapters/chapters.module';
import databaseConfig from './config/database.config';
import { Chapter } from './chapters/chapter.entity';
import { LessonModule } from './lesson/lesson.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { Lesson } from './lesson/lesson.entity';
import { PaginationModule } from './common/pagination/pagination.module';
import { ResourceModule } from './resource/resource.module';
import { ResourceLibraryModule } from './resource-library/resource-library.module';
import { Resource } from './resource/entities/resource.entity';
import { PdfResource } from './resource/entities/pdf-resource.entity';
import { AudioResource } from './resource/entities/audio-resource.entity';
import { VideoResource } from './resource/entities/video-resource.entity';
import { ResourceLibrary } from './resource-library/resource-library.entity';
import { PemService } from './common/pem/pem.service';
import { PemModule } from './common/pem/pem.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    CoursesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env' : `.env.${ENV.trim()}`,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, PemModule],
      inject: [ConfigService, PemService],
      useFactory: async (
        configService: ConfigService,
        pemService: PemService,
      ) => {
        const sslEnabled = configService.get<string>('database.ssl') === 'true';
        const pem = sslEnabled
          ? await pemService.getPem(
              configService.get<string>('database.bucket') || '',
              configService.get<string>('database.key') || '',
            )
          : undefined;
        return {
          type: 'postgres',
          ssl: sslEnabled ? { ca: pem } : false,
          synchronize: configService.get<boolean>('database.synchronize'),
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          entities: [
            Course,
            Category,
            Chapter,
            Lesson,
            Resource,
            PdfResource,
            AudioResource,
            VideoResource,
            ResourceLibrary,
          ],
        };
      },
    }),
    CategoriesModule,
    ChaptersModule,
    LessonModule,
    CloudinaryModule,
    PaginationModule,
    ResourceModule,
    ResourceLibraryModule,
    PemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
