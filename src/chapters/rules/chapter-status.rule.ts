import {
  Action,
  Status,
  validateParentStatusChangeWithChildren,
  validateStatusHelper,
  validateStatusTransition,
} from 'src/common/status';
import { Chapter } from '../chapter.entity';
import { BadRequestException } from '@nestjs/common';

export class ChapterStatusRule {
  static validateUpdate(chapter: Chapter) {
    const { allowed, reason } = validateStatusHelper(
      chapter.course.status,
      chapter.status,
      Action.UPDATE,
    );
    if (!allowed) throw new BadRequestException(reason);
  }

  static validateTransition(chapter: Chapter, newStatus: Status) {
    const transition = validateStatusTransition(chapter.status, newStatus);
    if (!transition.allowed) {
      throw new BadRequestException(transition.reason);
    }
  }

  static validateWithLessons(chapter: Chapter, newStatus: Status) {
    if (!chapter.lessons?.length) return;

    const childStatuses = chapter.lessons.map((l) => l.lessonStatus);
    const parentValidation = validateParentStatusChangeWithChildren(
      chapter.status,
      newStatus,
      childStatuses,
    );

    if (!parentValidation.allowed) {
      throw new BadRequestException(parentValidation.reason);
    }
  }
}
