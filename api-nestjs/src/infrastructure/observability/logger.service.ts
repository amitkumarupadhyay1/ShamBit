import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(private context?: string) {}

  log(message: string, context?: string) {
    console.log(`[${context || this.context}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${context || this.context}] ${message}`, trace);
  }

  warn(message: string, context?: string) {
    console.warn(`[${context || this.context}] ${message}`);
  }

  debug(message: string, context?: string) {
    console.debug(`[${context || this.context}] ${message}`);
  }

  verbose(message: string, context?: string) {
    console.log(`[${context || this.context}] ${message}`);
  }
}
