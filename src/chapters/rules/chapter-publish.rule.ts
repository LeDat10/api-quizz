import { Status } from 'src/common/status';
import { Chapter } from '../chapter.entity';
import { BadRequestException } from '@nestjs/common';

export class ChapterPublishRule {
  static validate(chapter: Chapter, newStatus: Status) {
    if (newStatus !== Status.PUBLISHED) return;

    if (!chapter.lessons?.length) {
      throw new BadRequestException('Cannot publish chapter without lessons');
    }
  }
}
