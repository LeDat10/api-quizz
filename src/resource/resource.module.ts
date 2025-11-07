import { Module } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { ResourceController } from './resource.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from './entities/resource.entity';
import { PdfResource } from './entities/pdf-resource.entity';
import { VideoResource } from './entities/video-resource.entity';
import { AudioResource } from './entities/audio-resource.entity';
import { ResourceLibraryModule } from 'src/resource-library/resource-library.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';

@Module({
  providers: [ResourceService],
  controllers: [ResourceController],
  imports: [
    TypeOrmModule.forFeature([
      Resource,
      PdfResource,
      VideoResource,
      AudioResource,
    ]),
    ResourceLibraryModule,
    PaginationModule,
  ],
})
export class ResourceModule {}
