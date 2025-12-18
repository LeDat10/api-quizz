import { BadRequestException } from '@nestjs/common';
import { LoggerContext } from '../logger/logger-context.interface';
import { LoggerHelper } from '../logger/logger.helper';
import { validate as isUUID, version } from 'uuid';

export const isValidUUIDv4 = (id: string): boolean => {
  return typeof id === 'string' && isUUID(id) && version(id) === 4;
};

export interface ValidateIdsOptions {
  max?: number;
  name?: string;
}

export const validateUUIDArray = (
  ids: string[],
  ctx: LoggerContext,
  logger: LoggerHelper,
  options: ValidateIdsOptions = {},
): void => {
  const { max = 100, name = 'ids' } = options;

  if (!ids) {
    const reason = `${name} parameter is required`;
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }

  if (!Array.isArray(ids)) {
    const reason = `${name} must be an array`;
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }

  if (ids.length === 0) {
    const reason = `${name} array must not be empty`;
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }

  if (ids.length > max) {
    const reason = `Cannot process more than ${max} items at once. Received: ${ids.length}`;
    logger.warn(ctx, 'failed', reason);
    throw new BadRequestException(reason);
  }

  const invalidIds = ids.filter(
    (id) => typeof id !== 'string' || !isValidUUIDv4(id),
  );

  if (invalidIds.length > 0) {
    const reason = `Invalid UUID v4 format for ${name}: ${invalidIds
      .slice(0, 5)
      .join(', ')}${invalidIds.length > 5 ? ' ...' : ''}`;
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

// export const validateSatusHelper = (
//   parentStatus: Status,
//   status: Status,
//   action: Action,
//   options?: {
//     entityName?: string;
//   },
// ): ActionValidationResult => {
//   switch (action) {
//     case Action.CREATE:
//       break;

//     default:
//       break;
//   }
// };
