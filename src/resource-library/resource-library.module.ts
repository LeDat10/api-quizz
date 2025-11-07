import { Module } from '@nestjs/common';
import { ResourceLibraryController } from './resource-library.controller';
import { ResourceLibraryService } from './resource-library.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceLibrary } from './resource-library.entity';

@Module({
  controllers: [ResourceLibraryController],
  providers: [ResourceLibraryService],
  imports: [TypeOrmModule.forFeature([ResourceLibrary])],
  exports: [ResourceLibraryService],
})
export class ResourceLibraryModule {}
