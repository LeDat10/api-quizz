import { Status } from '../enums/status.enum';
import { getAllowedChildrenStatusesForParent } from './get-allowed-children.helper';

export const getParentStatusChangeImpact = (
  newParentStatus: Status,
  childrenStatuses: Status[],
  options?: {
    parentName?: string;
    childName?: string;
  },
): {
  willMakeInaccessible: boolean;
  affectedChildren: Status[];
  recommendation: string;
} => {
  const parentName = options?.parentName || 'Parent';
  const childName = options?.childName || 'children';

  const allowedChildren = getAllowedChildrenStatusesForParent(newParentStatus);
  const affectedChildren = childrenStatuses.filter(
    (status) => !allowedChildren.includes(status),
  );

  if (affectedChildren.length === 0) {
    return {
      willMakeInaccessible: false,
      affectedChildren: [],
      recommendation: `Safe to change ${parentName.toLowerCase()} to ${newParentStatus.toUpperCase()}.`,
    };
  }

  const affectedCount = affectedChildren.reduce(
    (acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<Status, number>,
  );

  const affectedSummary = Object.entries(affectedCount)
    .map(([status, count]) => `${count} ${status.toUpperCase()}`)
    .join(', ');

  let recommendation = '';

  if (newParentStatus === Status.INACTIVE) {
    recommendation = `Deactivate ${affectedSummary} ${childName} first, or they will become inaccessible to users.`;
  } else if (newParentStatus === Status.ARCHIVED) {
    recommendation = `Archive ${affectedSummary} ${childName} first to maintain clean state.`;
  } else if (newParentStatus === Status.DRAFT) {
    recommendation = `Cannot revert to DRAFT with ${affectedSummary} ${childName}. This would create invalid state.`;
  }

  return {
    willMakeInaccessible: true,
    affectedChildren,
    recommendation,
  };
};
