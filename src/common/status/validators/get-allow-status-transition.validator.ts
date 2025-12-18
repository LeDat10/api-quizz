import { Status } from '../enums/status.enum';
import { STATUS_TRANSITION_WITH_PARENT } from '../matrices/status-transition-with-parent.matrix';
import { STATUS_TRANSITIONS } from '../matrices/status-transitions.matrix';

export const getAllowedStatusTransitions = (
  currentStatus: Status,
  parentStatus?: Status,
): Status[] => {
  const baseTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  // If no parent status provided, return base transitions
  if (parentStatus === undefined) {
    return baseTransitions;
  }

  // Filter transitions based on parent status
  const allowedWithParent = baseTransitions.filter((newStatus) => {
    const transitionRules =
      STATUS_TRANSITION_WITH_PARENT[currentStatus]?.[newStatus];
    if (!transitionRules) return false;

    return transitionRules[parentStatus] === true;
  });

  return allowedWithParent;
};
