import { CourseStatus } from 'src/courses/enums/type-course.enum';
import { Chapter } from '../chapter.entity';
import { Status } from 'src/common/status/enums/status.enum';

type TransitionResult = {
  canUpdate: boolean;
  reason?: string;
};

export function validateAndSetChapterStatus(
  chapter: Chapter,
  targetStatus: Status,
): TransitionResult {
  if (targetStatus === Status.DRAFT && chapter.status !== Status.DRAFT) {
    return {
      canUpdate: false,
      reason: `Cannot revert chapter "${chapter.title}" to DRAFT because it has been published`,
    };
  }

  if (chapter.status === targetStatus) {
    return { canUpdate: false, reason: `Already has status ${targetStatus}` };
  }

  // DRAFT -> PUBLISHED
  if (chapter.status === Status.DRAFT && targetStatus === Status.PUBLISHED) {
    if (!chapter.lessons?.length) {
      return {
        canUpdate: false,
        reason: `Chapter "${chapter.title}" cannot be published: no lessons found`,
      };
    }
    if (chapter.course.status !== Status.PUBLISHED) {
      return {
        canUpdate: false,
        reason: `Chapter "${chapter.title}" cannot be published: course is not published`,
      };
    }
  }

  // ARCHIVED -> PUBLISHED
  if (chapter.status === Status.ARCHIVED && targetStatus === Status.PUBLISHED) {
    if (!chapter.lessons?.length) {
      return {
        canUpdate: false,
        reason: `Chapter "${chapter.title}" cannot be republished: no lessons found`,
      };
    }
  }

  switch (targetStatus) {
    case Status.PUBLISHED:
      if (!chapter.publishedAt) chapter.publishedAt = new Date();
      break;
    case Status.INACTIVE:
      chapter.inactivedAt = new Date();
      break;
    case Status.ARCHIVED:
      chapter.archivedAt = new Date();
      break;
    default:
      break;
  }

  return { canUpdate: true };
}
