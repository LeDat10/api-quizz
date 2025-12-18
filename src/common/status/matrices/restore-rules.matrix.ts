import { Status } from '../enums/status.enum';

export const RESTORE_RULES: Record<Status, Record<Status, boolean>> = {
  [Status.DRAFT]: {
    [Status.DRAFT]: true, // Not deleted, no need to restore
    [Status.PUBLISHED]: false, // Child "sống" hơn parent (không hợp lý)
    [Status.INACTIVE]: false, // Child "sống" hơn parent
    [Status.ARCHIVED]: false, // Không hợp lệ
  },
  [Status.PUBLISHED]: {
    [Status.DRAFT]: true, // Not deleted, no need to restore
    [Status.PUBLISHED]: false, // Not deleted, no need to restore
    [Status.INACTIVE]: true, // Phù hợp - restore inactive to published
    [Status.ARCHIVED]: true, // Cho phép nếu policy cho phép
  },
  [Status.INACTIVE]: {
    [Status.DRAFT]: false, // Cha đang đóng
    [Status.PUBLISHED]: false, // Cha đang đóng
    [Status.INACTIVE]: false, // Cha đang đóng
    [Status.ARCHIVED]: false, // Cha đang đóng
  },
  [Status.ARCHIVED]: {
    [Status.DRAFT]: false, // Cha đóng vĩnh viễn
    [Status.PUBLISHED]: false, // Cha đóng vĩnh viễn
    [Status.INACTIVE]: false, // Cha đóng vĩnh viễn
    [Status.ARCHIVED]: false, // Cha đóng vĩnh viễn
  },
};
