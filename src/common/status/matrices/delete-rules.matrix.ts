import { Status } from '../enums/status.enum';

export const DELETE_RULES: Record<Status, Record<Status, boolean>> = {
  [Status.DRAFT]: {
    [Status.DRAFT]: true, // Đang soạn → xóa được
    [Status.PUBLISHED]: false, // Child "sống" hơn parent (không hợp lý)
    [Status.INACTIVE]: false, // Invalid state: nên dùng restore
    [Status.ARCHIVED]: false, // Invalid state: không bao giờ xảy ra
  },
  [Status.PUBLISHED]: {
    [Status.DRAFT]: true, // OK - can delete draft child
    [Status.PUBLISHED]: false, // OK - can delete published child
    [Status.INACTIVE]: true, // Inactive child should use restore instead
    [Status.ARCHIVED]: true, // Cannot delete already archived child
  },
  [Status.INACTIVE]: {
    [Status.DRAFT]: false, // Parent đang đóng
    [Status.PUBLISHED]: false, // Parent đang đóng
    [Status.INACTIVE]: false, // Nên restore trước (khuyến nghị)
    [Status.ARCHIVED]: false, // Cannot delete archived child
  },
  [Status.ARCHIVED]: {
    [Status.DRAFT]: false, // Parent đóng vĩnh viễn
    [Status.PUBLISHED]: false, // Parent đóng vĩnh viễn
    [Status.INACTIVE]: false, // Parent đóng vĩnh viễn
    [Status.ARCHIVED]: false, // Parent đóng vĩnh viễn
  },
};
