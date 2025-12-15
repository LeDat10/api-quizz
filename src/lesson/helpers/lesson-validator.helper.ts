import { BadRequestException } from '@nestjs/common';
import { LoggerContext } from 'src/common/helpers/logger/logger-context.interface';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { validate as isUUID, version } from 'uuid';

export const isValidUUIDv4 = (id: string): boolean => {
  return isUUID(id) && version(id) === 4;
};

export const validateLessonIds = (
  lessonIds: string[],
  ctx: LoggerContext,
  logger: LoggerHelper,
): void => {
  // Check null/undefined
  if (!lessonIds) {
    const reason = 'lessonIds parameter is required';
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }

  // Check is array
  if (!Array.isArray(lessonIds)) {
    const reason = 'lessonIds must be an array';
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }

  // Check empty array
  if (lessonIds.length === 0) {
    const reason = 'lessonIds array must not be empty';
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }

  // Check max limit (prevent DOS attack)
  const MAX_BATCH_SIZE = 100;
  if (lessonIds.length > MAX_BATCH_SIZE) {
    const reason = `Cannot delete more than ${MAX_BATCH_SIZE} content lessons at once. Received: ${lessonIds.length}`;
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }

  const invalidIds = lessonIds.filter((id) => {
    // Check if it's a string first
    if (typeof id !== 'string') return true;
    // Then validate UUID format
    return !isValidUUIDv4(id);
  });

  if (invalidIds.length > 0) {
    const reason = `Invalid UUID format for IDs: ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? ` and ${invalidIds.length - 5} more` : ''}. Expected UUID v4 format.`;
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }
};

export const validateId = (id: string, ctx: any, logger: LoggerHelper) => {
  if (!id) {
    const reason = 'Missing parameter id';
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }

  if (!isValidUUIDv4(id)) {
    const reason = `Invalid UUID format for ID: ${id}. Expected UUID v4 format.`;
    throw new BadRequestException(reason);
  }
};
