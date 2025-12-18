import { Action } from '../enums/action.enum';
import { Status } from '../enums/status.enum';
import { ACTION_PERMISSIONS } from '../matrices/action-permissions.matrix';

export const getAllowedActions = (status: Status): Action[] => {
  return ACTION_PERMISSIONS[status] || [];
};
