import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponse<T> {
  @ApiProperty({
    description: 'List of data items on the current page',
    isArray: true,
    type: Object,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata for the current query',
    example: {
      itemsPerPage: 10,
      totalItems: 50,
      currentPage: 2,
      totalPages: 5,
    },
  })
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };

  @ApiProperty({
    description: 'Navigation links for pagination',
    example: {
      first: '/api/categories?page=1&limit=10',
      last: '/api/categories?page=5&limit=10',
      current: '/api/categories?page=2&limit=10',
      next: '/api/categories?page=3&limit=10',
      previous: '/api/categories?page=1&limit=10',
    },
  })
  links: {
    first: string;
    last: string;
    current: string;
    next: string;
    previous: string;
  };
}
