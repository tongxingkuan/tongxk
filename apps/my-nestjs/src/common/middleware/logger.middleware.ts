import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req
    const userAgent = req.headers['user-agent'] ?? '-'
    const ip = req.ip ?? req.socket.remoteAddress ?? '-'
    const startedAt = process.hrtime.bigint()

    res.on('finish', () => {
      const { statusCode } = res
      const contentLengthHeader = res.getHeader('content-length')
      const contentLength = Array.isArray(contentLengthHeader)
        ? contentLengthHeader.join(',')
        : String(contentLengthHeader ?? 0)
      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000

      const msg = `${method} ${originalUrl} ${statusCode} ${contentLength}b - ${elapsedMs.toFixed(2)}ms - ${ip} "${userAgent}"`

      if (statusCode >= 500) this.logger.error(msg)
      else if (statusCode >= 400) this.logger.warn(msg)
      else this.logger.log(msg)
    })

    next()
  }
}
