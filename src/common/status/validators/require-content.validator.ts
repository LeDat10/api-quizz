import { Status } from '../enums/status.enum';

export const requiresContentValidation = (
  currentStatus: Status,
  newStatus: Status,
): boolean => {
  const transitionsThatRequireValidation = [
    `${Status.DRAFT}-${Status.PUBLISHED}`,
    `${Status.INACTIVE}-${Status.PUBLISHED}`,
    `${Status.ARCHIVED}-${Status.PUBLISHED}`,
  ];

  return transitionsThatRequireValidation.includes(
    `${currentStatus}-${newStatus}`,
  );
};
