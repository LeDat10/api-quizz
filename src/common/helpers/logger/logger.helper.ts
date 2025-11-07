import { Logger } from '@nestjs/common';
import { LoggerContext } from './logger-context.interface';
import { Action, generateMessage } from 'src/common/utils/generateMessage.util';

export class LoggerHelper {
  private readonly logger: Logger;

  constructor(private readonly serviceName: string) {
    this.logger = new Logger(serviceName);
  }

  private formatMessage(
    context: LoggerContext,
    action: Action,
    reason?: string,
  ): string {
    return `[${context.method}] ${generateMessage(action, context.entity, context.id, reason)}`;
  }

  /** Log thông tin bình thường */
  info(context: LoggerContext, action: Action, reason?: string, meta?: any) {
    const message = this.formatMessage(context, action, reason);
    if (meta !== undefined) {
      this.logger.log(message, meta);
    } else {
      this.logger.log(message);
    }
  }

  /** Log cảnh báo nghiệp vụ */
  warn(context: LoggerContext, action: Action, reason?: string, meta?: any) {
    const message = this.formatMessage(context, action, reason);
    if (meta !== undefined) {
      this.logger.warn(message, meta);
    } else {
      this.logger.warn(message);
    }
  }

  /** Log lỗi hệ thống */
  error(
    context: LoggerContext,
    action: Action,
    reason?: string,
    trace?: string,
    meta?: any,
  ) {
    const message = this.formatMessage(context, action, reason);
    if (meta !== undefined) {
      this.logger.error(message, trace, meta);
    } else if (trace !== undefined) {
      this.logger.error(message, trace);
    } else {
      this.logger.error(message);
    }
  }

  /** Log debug */
  debug(context: LoggerContext, action: Action, reason?: string, meta?: any) {
    const message = this.formatMessage(context, action, reason);
    if (meta !== undefined) {
      this.logger.debug(message, meta);
    } else {
      this.logger.debug(message);
    }
  }

  /** Các helper sẵn: start, success, fail */
  start(context: LoggerContext) {
    this.info(context, 'start');
  }

  success(context: LoggerContext, action?: Action) {
    this.info(context, action || 'fetched');
  }

  fail(
    context: LoggerContext,
    reason?: string,
    action?: Action,
    trace?: string,
  ) {
    this.error(context, action || 'failed', reason, trace);
  }
}
