import { IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from 'src/common/status/enums/status.enum';

export class BaseUpdateLessonDto {
  @ApiPropertyOptional({
    example: 'Advanced TypeScript Concepts',
    description: 'Updated title of the lesson (optional)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    enum: Status,
    example: Status.DRAFT,
    description:
      'Updated lesson status (draft, published, inactive, or archived)',
  })
  @IsEnum(Status)
  @IsOptional()
  lessonStatus?: Status;

  @ApiPropertyOptional({
    example: 3,
    description: 'Updated position/order of the lesson in the chapter',
  })
  @IsInt()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({
    example: 8,
    description:
      'Updated chapter ID if the lesson needs to be moved to another chapter',
  })
  @IsUUID('4')
  @IsOptional()
  chapterId?: string;
}
