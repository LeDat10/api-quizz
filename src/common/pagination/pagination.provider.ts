import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { FindManyOptions, ObjectLiteral, Repository } from 'typeorm';
import { PaginationQueryDto } from './dtos/pagination-query.dto';
import { Paginated } from './paginater.interface';

@Injectable()
export class PaginationProvider {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  public async paginateQuery<T extends ObjectLiteral, R>(
    paginationQueryDto: PaginationQueryDto,
    repository: Repository<T>,
    transform: (entity: T) => R,
    options?: FindManyOptions<T>,
  ) {
    const findOptions: FindManyOptions<T> = {
      skip: (paginationQueryDto.page - 1) * paginationQueryDto.limit,
      take: paginationQueryDto.limit,
      ...options,
    };

    const [entities, totalItems] = await repository.findAndCount(findOptions);
    const result = entities.map(transform);
    const totalPages = Math.ceil(totalItems / paginationQueryDto.limit);
    const currentPage = paginationQueryDto.page;
    const nextPage = currentPage === totalPages ? currentPage : currentPage + 1;
    const prevPage = currentPage === 1 ? currentPage : currentPage - 1;
    const baseUrl =
      this.request.protocol + '://' + this.request.headers.host + '/';

    const newUrl = new URL(this.request.url, baseUrl);

    const response: Paginated<R> = {
      data: result,
      meta: {
        itemsPerPage: paginationQueryDto.limit,
        totalItems: totalItems,
        currentPage: currentPage,
        totalPages: totalPages,
      },
      links: {
        first: `${newUrl.origin}${newUrl.pathname}?limit=${paginationQueryDto.limit}&page=1`,
        last: `${newUrl.origin}${newUrl.pathname}?limit=${paginationQueryDto.limit}&page=${totalPages}`,
        current: `${newUrl.origin}${newUrl.pathname}?limit=${paginationQueryDto.limit}&page=${currentPage}`,
        next: `${newUrl.origin}${newUrl.pathname}?limit=${paginationQueryDto.limit}&page=${nextPage}`,
        previous: `${newUrl.origin}${newUrl.pathname}?limit=${paginationQueryDto.limit}&page=${prevPage}`,
      },
    };

    return response;
  }
}
