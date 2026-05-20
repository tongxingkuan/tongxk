import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';
import { MonitorController } from './monitor.controller';

/**
 * 监控模块（全局）：提供内存型指标采集 + 健康检查端点。
 * - 注册全局拦截器，自动采集所有 HTTP 请求
 * - 暴露 /health 与 /metrics 接口
 */
@Global()
@Module({
  controllers: [MonitorController],
  providers: [
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class MonitorModule {}
