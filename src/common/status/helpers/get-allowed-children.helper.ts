import { Status } from '../enums/status.enum';

export const getAllowedChildrenStatusesForParent = (
  newParentStatus: Status,
): Status[] => {
  const allowedChildren: Record<Status, Status[]> = {
    [Status.DRAFT]: [
      Status.DRAFT, // Only draft children allowed in draft parent
    ],
    [Status.PUBLISHED]: [
      Status.DRAFT, // Can have draft children (being worked on)
      Status.PUBLISHED, // Can have published children
      Status.INACTIVE, // Can have inactive children (temporarily hidden)
      Status.ARCHIVED, // Can have archived children (old content)
    ],
    [Status.INACTIVE]: [
      Status.INACTIVE, // Can have inactive children
      Status.ARCHIVED, // Can have archived children
      // DRAFT and PUBLISHED children become inaccessible
    ],
    [Status.ARCHIVED]: [
      Status.ARCHIVED, // Only archived children make sense
      // Could allow INACTIVE too, but let's be strict
    ],
  };

  return allowedChildren[newParentStatus] || [];
};
