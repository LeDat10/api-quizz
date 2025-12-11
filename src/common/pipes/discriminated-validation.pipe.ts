import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Type,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

interface DiscriminatorConfig {
  field: string;
  mapping: Record<string, Type<any>>;
}

@Injectable()
export class DiscriminatedValidationPipe implements PipeTransform {
  constructor(private config: DiscriminatorConfig) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const discriminatorValue = value[this.config.field];

    if (!discriminatorValue) {
      throw new BadRequestException(`${this.config.field} is required`);
    }

    const dtoClass = this.config.mapping[discriminatorValue];

    if (!dtoClass) {
      const allowedValues = Object.keys(this.config.mapping).join(', ');
      throw new BadRequestException(
        `Invalid ${this.config.field}: ${discriminatorValue}. Allowed: ${allowedValues}`,
      );
    }

    const dto = plainToInstance(dtoClass, value, {
      enableImplicitConversion: true,
    });

    const errors = await validate(dto, {
      whitelist: false,
      forbidNonWhitelisted: false,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      throw new BadRequestException(this.formatErrors(errors));
    }

    return dto;
  }

  private formatErrors(errors: ValidationError[]): string[] {
    return errors.flatMap((error) => {
      if (error.constraints) {
        return Object.values(error.constraints);
      }
      if (error.children && error.children.length > 0) {
        return this.formatErrors(error.children);
      }
      return [];
    });
  }
}

export function createDiscriminatedPipe(
  config: DiscriminatorConfig,
): Type<PipeTransform> {
  @Injectable()
  class DynamicDiscriminatedPipe extends DiscriminatedValidationPipe {
    constructor() {
      super(config);
    }
  }
  return DynamicDiscriminatedPipe;
}
