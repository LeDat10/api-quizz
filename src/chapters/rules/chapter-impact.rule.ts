import { Status } from 'src/common/status';
import { Chapter } from '../chapter.entity';
import { In, QueryRunner } from 'typeorm';
import { getParentStatusChangeImpact } from 'src/common/status/helpers/impact.helper';
import { getAllowedChildrenStatusesForParent } from 'src/common/status/helpers/get-allowed-children.helper';
import { Lesson } from 'src/lesson/lesson.entity';

export class ChapterImpactRule {
  static async autoFixLessons(
    chapter: Chapter,
    newStatus: Status,
    queryRunner: QueryRunner,
  ): Promise<number> {
    if (!chapter.lessons?.length) return 0;

    const lessonStatuses = chapter.lessons.map((l) => l.lessonStatus);

    const impact = getParentStatusChangeImpact(newStatus, lessonStatuses, {
      parentName: 'Chapter',
      childName: 'lessons',
    });

    if (!impact.willMakeInaccessible) return 0;

    const allowed = getAllowedChildrenStatusesForParent(newStatus);

    const toUpdate = chapter.lessons.filter(
      (l) => !allowed.includes(l.lessonStatus),
    );

    if (!toUpdate.length) return 0;

    const target =
      newStatus === Status.INACTIVE
        ? Status.INACTIVE
        : newStatus === Status.ARCHIVED
          ? Status.ARCHIVED
          : null;

    if (!target) return 0;

    await queryRunner.manager.update(
      Lesson,
      { id: In(toUpdate.map((l) => l.id)) },
      { lessonStatus: target },
    );

    return toUpdate.length;
  }
}
