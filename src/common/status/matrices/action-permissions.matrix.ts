import { Action } from '../enums/action.enum';
import { Status } from '../enums/status.enum';

export const ACTION_PERMISSIONS: Record<Status, Action[]> = {
  [Status.DRAFT]: [
    Action.CREATE, // Can create child entities
    Action.UPDATE, // Can update content
    Action.DELETE, // Can soft delete
    Action.REORDER, // Can reorder
  ],
  [Status.PUBLISHED]: [
    Action.CREATE, // Can create child entities
    Action.UPDATE, // Can update content
    Action.DELETE, // Can soft delete
    Action.REORDER, // Can reorder
  ],
  [Status.INACTIVE]: [
    Action.UPDATE, // Can update (to fix issues)
    Action.DELETE, // Can soft delete
    Action.RESTORE, // Can restore if soft-deleted
    // CREATE and REORDER not allowed while inactive
  ],
  [Status.ARCHIVED]: [
    Action.RESTORE, // Only restore is allowed
    // All other actions blocked
  ],
};

type ParentChangeRule = {
  disallowedChildStatuses: Status[];
  reason: (parent: string, child: string) => string;
};

export const PARENT_STATUS_CHANGE_RULES: Record<Status, ParentChangeRule[]> = {
  [Status.DRAFT]: [
    {
      disallowedChildStatuses: [Status.PUBLISHED],
      reason: (p, c) =>
        `Cannot set ${p} to DRAFT while having PUBLISHED ${c}(s). Children cannot be "more advanced" than parent.`,
    },
    {
      disallowedChildStatuses: [Status.INACTIVE],
      reason: (p, c) =>
        `Cannot set ${p} to DRAFT while having INACTIVE ${c}(s). Invalid state combination.`,
    },
    {
      disallowedChildStatuses: [Status.ARCHIVED],
      reason: (p, c) =>
        `Cannot set ${p} to DRAFT while having ARCHIVED ${c}(s). Invalid state combination.`,
    },
  ],

  [Status.INACTIVE]: [
    // {
    //   disallowedChildStatuses: [Status.PUBLISHED],
    //   reason: (p, c) =>
    //     `Cannot set ${p} to INACTIVE while having PUBLISHED ${c}(s). Deactivate children first.`,
    // },
  ],

  [Status.ARCHIVED]: [
    // {
    //   disallowedChildStatuses: [Status.PUBLISHED],
    //   reason: (p, c) =>
    //     `Cannot archive ${p} while having PUBLISHED ${c}(s). Archive or deactivate children first.`,
    // },
    // {
    //   disallowedChildStatuses: [Status.INACTIVE],
    //   reason: (p, c) =>
    //     `Cannot archive ${p} while having INACTIVE ${c}(s). Archive children first.`,
    // },
  ],

  [Status.PUBLISHED]: [],
};
