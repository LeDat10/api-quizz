import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { LoggerHelper } from '../logger/logger.helper';
import { generateMessage } from 'src/common/utils/generateMessage.util';

/**
 * ErrorHandlerHelper — Catches & handles common application errors.
 * Automatically logs errors using LoggerHelper and throws the appropriate Exception.
 */
export class ErrorHandlerHelper {
  private readonly logger: LoggerHelper;

  constructor(private readonly contextName: string) {
    this.logger = new LoggerHelper(contextName);
  }

  /**
   * Comprehensive error handling for services.
   * @param ctx - context object containing method, entity, id, etc.
   * @param error - the caught error
   * @param entity - the related entity name
   * @param id - entity id (if any)
   */
  handle(ctx: any, error: any, entity: string, id?: number | string): never {
    // Case of HttpException (already provided by Nest)
    if (error instanceof HttpException) {
      this.logger.fail(ctx, error.message, 'failed', error.stack);
      throw error;
    }

    // TypeORM Query Errors
    if (error instanceof QueryFailedError) {
      const message = (error as any).message?.toLowerCase() || '';

      if (message.includes('duplicate') || message.includes('unique')) {
        const reason = `${entity} already exists`;
        this.logger.fail(ctx, reason, 'failed', error.stack);
        throw new ConflictException(
          generateMessage('failed', entity, id, reason),
        );
      }

      if (
        message.includes('foreign key') ||
        message.includes('violates foreign key')
      ) {
        const reason = `${entity} is referenced by another entity`;
        this.logger.fail(ctx, reason, 'failed', error.stack);
        throw new BadRequestException(
          generateMessage('failed', entity, id, reason),
        );
      }

      if (message.includes('not-null') || message.includes('null value')) {
        const reason = `Missing required field in ${entity}`;
        this.logger.fail(ctx, reason, 'failed', error.stack);
        throw new BadRequestException(
          generateMessage('failed', entity, id, reason),
        );
      }

      const reason = 'Database query failed';
      this.logger.fail(ctx, reason, 'failed', error.stack);
      throw new InternalServerErrorException(
        generateMessage('failed', entity, id, reason),
      );
    }

    // Connection / Network / Database Errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      const reason = 'Cannot connect to database or service';
      this.logger.fail(ctx, reason, 'failed', error.stack);
      throw new ServiceUnavailableException(
        generateMessage('failed', entity, id, reason),
      );
    }

    if (
      error.code === 'ETIMEDOUT' ||
      error.message?.toLowerCase().includes('timeout')
    ) {
      const reason = 'Database or service request timed out';
      this.logger.fail(ctx, reason, 'failed', error.stack);
      throw new RequestTimeoutException(
        generateMessage('failed', entity, id, reason),
      );
    }

    // Access Errors (Forbidden / Unauthorized)
    if (error.status === 401 || error.name === 'UnauthorizedError') {
      const reason = 'Unauthorized access';
      this.logger.fail(ctx, reason, 'failed', error.stack);
      throw new UnauthorizedException(
        generateMessage('failed', entity, id, reason),
      );
    }

    if (error.status === 403) {
      const reason = 'Forbidden access';
      this.logger.fail(ctx, reason, 'failed', error.stack);
      throw new ForbiddenException(
        generateMessage('failed', entity, id, reason),
      );
    }

    // Not Found Errors
    if (error.status === 404 || /not\s?found/i.test(error.message)) {
      const reason = 'Resource not found';
      this.logger.fail(ctx, reason, 'failed', error.stack);
      throw new NotFoundException(
        generateMessage('failed', entity, id, reason),
      );
    }

    // Gateway / Service Timeout Errors
    if (error.status === 504) {
      const reason = 'Gateway timeout';
      this.logger.fail(ctx, reason, 'failed', error.stack);
      throw new GatewayTimeoutException(
        generateMessage('failed', entity, id, reason),
      );
    }

    // Validation Errors
    if (
      Array.isArray(error?.message) &&
      error.message.some((m) => typeof m === 'string')
    ) {
      const reason = `Validation failed: ${error.message.join(', ')}`;
      this.logger.fail(ctx, reason, 'failed', error.stack);
      throw new BadRequestException(
        generateMessage('failed', entity, id, reason),
      );
    }

    // 8️⃣ System or Unknown Errors
    const reason =
      error.message || error.name || 'Unexpected system error occurred';
    this.logger.fail(ctx, reason, 'failed', error.stack);

    throw new InternalServerErrorException(
      generateMessage('failed', entity, id, reason),
    );
  }
}
