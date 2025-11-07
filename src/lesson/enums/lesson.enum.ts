export enum LessonType {
  CONTENT = 'content',
  ASSIGNMENT = 'assignment',
  QUIZ = 'quiz',
  PDF = 'pdf',
}

export enum LessonStatus {
  DRAFT = 'draft', // mới tạo, chưa công khai
  PUBLISHED = 'published', // hiển thị cho người học
  INACTIVE = 'inactive', // bị ẩn tạm thời
  ARCHIVED = 'archived', // đã kết thúc hoặc ngừng hoạt động
}
