import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { tap } from 'rxjs'

/** 接口调用统计：记录每次请求的方法、URL 与耗时，成功/失败均记录 */
export class CostInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now()
    const req = context.switchToHttp().getRequest<{ method: string, url: string }>()
    return next.handle().pipe(
      tap({
        next: () => console.log(`[api] ${req.method} ${req.url} ${Date.now() - start}ms`),
        error: (err: unknown) => console.error(`[api] ${req.method} ${req.url} ${Date.now() - start}ms`, err),
      }),
    )
  }
}
