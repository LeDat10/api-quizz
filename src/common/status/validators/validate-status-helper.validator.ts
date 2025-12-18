import { Action } from '../enums/action.enum';
import { Status } from '../enums/status.enum';
import { ActionValidationResult } from '../interfaces/validation-result.interface';
import { DELETE_RULES } from '../matrices/delete-rules.matrix';
import { RESTORE_RULES } from '../matrices/restore-rules.matrix';
import { UPDATE_RULES } from '../matrices/update-rules.matrix';
import { validateActionOnStatus } from './validate-action-on-status.validator';

export const validateStatusHelper = (
  parentStatus: Status,
  childStatus: Status | null, // null for CREATE action
  action: Action,
  options?: {
    entityName?: string;
    parentName?: string;
  },
): ActionValidationResult => {
  const entityName = options?.entityName || 'Entity';
  const parentName = options?.parentName || 'Parent';

  switch (action) {
    case Action.CREATE:
      // Check if parent allows creating children
      const createValidation = validateActionOnStatus(
        parentStatus,
        Action.CREATE,
        {
          entityName: parentName,
        },
      );

      if (!createValidation.allowed) {
        return createValidation;
      }

      // Additional parent status checks
      if (parentStatus === Status.ARCHIVED) {
        return {
          allowed: false,
          reason: `Cannot create ${entityName.toLowerCase()} in archived ${parentName.toLowerCase()}`,
        };
      }

      // if (parentStatus === Status.INACTIVE) {
      //   return {
      //     allowed: false,
      //     reason: `Cannot create ${entityName.toLowerCase()} in inactive ${parentName.toLowerCase()}. Reactivate the ${parentName.toLowerCase()} first.`,
      //   };
      // }

      return { allowed: true };

    case Action.UPDATE:
      if (!childStatus) {
        return {
          allowed: false,
          reason: `${entityName} status is required for update action`,
        };
      }

      //  Use UPDATE_RULES matrix
      const updateAllowed = UPDATE_RULES[parentStatus]?.[childStatus];

      if (updateAllowed === false) {
        // Specific error messages
        if (parentStatus === Status.DRAFT && childStatus === Status.PUBLISHED) {
          return {
            allowed: false,
            reason: `Cannot update ${Status.PUBLISHED} ${entityName.toLowerCase()} in ${Status.DRAFT} ${parentName.toLowerCase()}. Child cannot be "more advanced" than parent.`,
          };
        }

        if (parentStatus === Status.DRAFT && childStatus === Status.INACTIVE) {
          return {
            allowed: false,
            reason: `Invalid state: ${Status.INACTIVE} ${entityName.toLowerCase()} cannot exist in ${Status.DRAFT} ${parentName.toLowerCase()}`,
          };
        }

        if (
          parentStatus === Status.PUBLISHED &&
          childStatus === Status.ARCHIVED
        ) {
          return {
            allowed: false,
            reason: `Cannot update archived ${entityName.toLowerCase()}. Restore it first.`,
          };
        }

        if (
          parentStatus === Status.INACTIVE &&
          (childStatus === Status.DRAFT || childStatus === Status.PUBLISHED)
        ) {
          return {
            allowed: false,
            reason: `Cannot update ${childStatus.toLowerCase()} ${entityName.toLowerCase()} in inactive ${parentName.toLowerCase()}. Parent is closed.`,
          };
        }

        if (parentStatus === Status.ARCHIVED) {
          return {
            allowed: false,
            reason: `Cannot update ${entityName.toLowerCase()} in archived ${parentName.toLowerCase()}. Parent is archived forever.`,
          };
        }

        return {
          allowed: false,
          reason: `Cannot update ${childStatus.toLowerCase()} ${entityName.toLowerCase()} in ${parentStatus.toLowerCase()} ${parentName.toLowerCase()}`,
        };
      }

      return { allowed: true };

    case Action.DELETE:
      if (!childStatus) {
        return {
          allowed: false,
          reason: `${entityName} status is required for delete action`,
        };
      }

      // Use DELETE_RULES matrix
      const deleteAllowed = DELETE_RULES[parentStatus]?.[childStatus];

      if (deleteAllowed === false) {
        // Specific error messages
        if (parentStatus === Status.DRAFT && childStatus === Status.PUBLISHED) {
          return {
            allowed: false,
            reason: `Cannot delete ${Status.PUBLISHED} ${entityName.toLowerCase()} from ${Status.DRAFT} ${parentName.toLowerCase()}. Child "lives" more than parent (illogical state).`,
          };
        }

        if (
          parentStatus === Status.DRAFT &&
          (childStatus === Status.INACTIVE || childStatus === Status.ARCHIVED)
        ) {
          return {
            allowed: false,
            reason: `Invalid state: ${childStatus.toLowerCase()} ${entityName.toLowerCase()} cannot exist in ${Status.DRAFT} ${parentName.toLowerCase()}`,
          };
        }

        if (
          parentStatus === Status.PUBLISHED &&
          childStatus === Status.INACTIVE
        ) {
          return {
            allowed: false,
            reason: `Cannot delete ${Status.INACTIVE} ${entityName.toLowerCase()}. Use RESTORE action instead.`,
          };
        }

        if (
          parentStatus === Status.PUBLISHED &&
          childStatus === Status.ARCHIVED
        ) {
          return {
            allowed: false,
            reason: `Cannot delete already archived ${entityName.toLowerCase()}`,
          };
        }

        if (parentStatus === Status.INACTIVE) {
          if (childStatus === Status.INACTIVE) {
            return {
              allowed: false,
              reason: `Cannot delete ${Status.INACTIVE} ${entityName.toLowerCase()} from ${Status.INACTIVE} ${parentName.toLowerCase()}. Should RESTORE first (recommended).`,
            };
          }
          return {
            allowed: false,
            reason: `Cannot delete ${entityName.toLowerCase()} from inactive ${parentName.toLowerCase()}. Parent is closed.`,
          };
        }

        if (parentStatus === Status.ARCHIVED) {
          return {
            allowed: false,
            reason: `Cannot delete ${entityName.toLowerCase()} from archived ${parentName.toLowerCase()}. Parent is archived forever.`,
          };
        }

        return {
          allowed: false,
          reason: `Cannot delete ${childStatus.toLowerCase()} ${entityName.toLowerCase()} from ${parentStatus.toLowerCase()} ${parentName.toLowerCase()}`,
        };
      }

      return { allowed: true };

    case Action.REORDER:
      // Check if parent allows reordering
      const reorderValidation = validateActionOnStatus(
        parentStatus,
        Action.REORDER,
        {
          entityName: parentName,
        },
      );

      if (!reorderValidation.allowed) {
        return reorderValidation;
      }

      if (parentStatus === Status.ARCHIVED) {
        return {
          allowed: false,
          reason: `Cannot reorder ${entityName.toLowerCase()} in archived ${parentName.toLowerCase()}`,
        };
      }

      if (parentStatus === Status.INACTIVE) {
        return {
          allowed: false,
          reason: `Cannot reorder ${entityName.toLowerCase()} in inactive ${parentName.toLowerCase()}. Reactivate it first.`,
        };
      }

      return { allowed: true };

    case Action.RESTORE:
      if (!childStatus) {
        return {
          allowed: false,
          reason: `${entityName} status is required for restore action`,
        };
      }

      //  Use RESTORE_RULES matrix
      const restoreAllowed = RESTORE_RULES[parentStatus]?.[childStatus];

      if (restoreAllowed === false) {
        // Specific error messages
        if (parentStatus === Status.DRAFT) {
          if (childStatus === Status.DRAFT) {
            return {
              allowed: false,
              reason: `${entityName} is not deleted. No need to restore.`,
            };
          }
          return {
            allowed: false,
            reason: `Cannot restore ${childStatus.toLowerCase()} ${entityName.toLowerCase()} to ${Status.DRAFT} ${parentName.toLowerCase()}. Child cannot "live" more than parent.`,
          };
        }

        if (
          parentStatus === Status.PUBLISHED &&
          (childStatus === Status.DRAFT || childStatus === Status.PUBLISHED)
        ) {
          return {
            allowed: false,
            reason: `${entityName} is not deleted. No need to restore.`,
          };
        }

        if (parentStatus === Status.INACTIVE) {
          return {
            allowed: false,
            reason: `Cannot restore ${entityName.toLowerCase()} to inactive ${parentName.toLowerCase()}. Parent is closed. Reactivate parent first.`,
          };
        }

        if (parentStatus === Status.ARCHIVED) {
          return {
            allowed: false,
            reason: `Cannot restore ${entityName.toLowerCase()} to archived ${parentName.toLowerCase()}. Parent is archived forever. Restore parent first.`,
          };
        }

        return {
          allowed: false,
          reason: `Cannot restore ${childStatus.toLowerCase()} ${entityName.toLowerCase()} to ${parentStatus.toLowerCase()} ${parentName.toLowerCase()}`,
        };
      }

      return { allowed: true };

    default:
      return {
        allowed: false,
        reason: `Unknown action: ${action}`,
      };
  }
};
