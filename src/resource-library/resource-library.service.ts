import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ResourceLibrary } from './resource-library.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { generateMessage } from 'src/common/utils/generateMessage.util';

@Injectable()
export class ResourceLibraryService {
  private readonly logger = new LoggerHelper(ResourceLibraryService.name);
  private readonly errorHandler = new ErrorHandlerHelper(
    ResourceLibraryService.name,
  );
  private _entity: string = 'ResourceLibrary';

  constructor(
    @InjectRepository(ResourceLibrary)
    private readonly resourceLibraryRepository: Repository<ResourceLibrary>,
  ) {}

  public async findResourceLibraryById(id: number) {
    const ctx = { method: 'findResourceLibraryById', entity: this._entity, id };
    this.logger.start(ctx);
    try {
      if (!id) {
        const reason = 'Missing parameter id';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      const resourceLibrary = await this.resourceLibraryRepository.findOne({
        where: { id },
      });

      if (!resourceLibrary) {
        const reason = 'Not found';
        this.logger.warn(ctx, 'failed', reason);
        throw new NotFoundException(
          generateMessage('failed', this._entity, id, reason),
        );
      }

      this.logger.success(ctx, 'fetched');

      return resourceLibrary;
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, id);
    }
  }
}
