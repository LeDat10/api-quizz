import { CourseStatus } from 'src/courses/enums/type-course.enum';
import { Chapter } from '../chapter.entity';
import { ChapterStatus } from '../enums/chapter.enum';

type TransitionResult = {
  canUpdate: boolean;
  reason?: string;
};

export function validateAndSetChapterStatus(
  chapter: Chapter,
  targetStatus: ChapterStatus,
): TransitionResult {
  if (
    targetStatus === ChapterStatus.DRAFT &&
    chapter.status !== ChapterStatus.DRAFT
  ) {
    return {
      canUpdate: false,
      reason: `Cannot revert chapter "${chapter.title}" to DRAFT because it has been published`,
    };
  }

  if (chapter.status === targetStatus) {
    return { canUpdate: false, reason: `Already has status ${targetStatus}` };
  }

  // DRAFT -> PUBLISHED
  if (
    chapter.status === ChapterStatus.DRAFT &&
    targetStatus === ChapterStatus.PUBLISHED
  ) {
    if (!chapter.lessons?.length) {
      return {
        canUpdate: false,
        reason: `Chapter "${chapter.title}" cannot be published: no lessons found`,
      };
    }
    if (chapter.course.status !== CourseStatus.PUBLISHED) {
      return {
        canUpdate: false,
        reason: `Chapter "${chapter.title}" cannot be published: course is not published`,
      };
    }
  }

  // ARCHIVED -> PUBLISHED
  if (
    chapter.status === ChapterStatus.ARCHIVED &&
    targetStatus === ChapterStatus.PUBLISHED
  ) {
    if (!chapter.lessons?.length) {
      return {
        canUpdate: false,
        reason: `Chapter "${chapter.title}" cannot be republished: no lessons found`,
      };
    }
  }

  switch (targetStatus) {
    case ChapterStatus.PUBLISHED:
      if (!chapter.publishedAt) chapter.publishedAt = new Date();
      break;
    case ChapterStatus.INACTIVE:
      chapter.inactivedAt = new Date();
      break;
    case ChapterStatus.ARCHIVED:
      chapter.archivedAt = new Date();
      break;
    default:
      break;
  }

  return { canUpdate: true };
}
