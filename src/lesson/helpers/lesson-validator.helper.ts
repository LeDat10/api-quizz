import { BadRequestException } from '@nestjs/common';
import { LoggerContext } from 'src/common/helpers/logger/logger-context.interface';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';

export const validateLessonIds = (
  lessonIds: number[],
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

  // Validate each ID
  const invalidIds = lessonIds.filter((id) => !Number.isInteger(id) || id <= 0);

  if (invalidIds.length > 0) {
    const reason = `Invalid lesson IDs: ${invalidIds.join(', ')}. IDs must be positive integers.`;
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }
};

export const validateId = (id: number, ctx: any, logger: LoggerHelper) => {
  if (!id) {
    const reason = 'Missing parameter id';
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }
};
