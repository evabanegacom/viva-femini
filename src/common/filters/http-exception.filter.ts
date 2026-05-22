import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Catches all HTTP exceptions and returns a consistent JSON error shape:
 * { statusCode, message, error, path, timestamp }
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message ?? 'An error occurred';

    this.logger.error(`${request.method} ${request.url} → ${status}: ${JSON.stringify(message)}`);

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.name,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}