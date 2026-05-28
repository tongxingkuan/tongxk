import { Inject, Injectable } from '@nestjs/common'
import { appConfig, type AppConfig } from './config/app.config'

@Injectable()
export class AppService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: AppConfig,
  ) {}

  getHello(): string {
    return `Hello World! [env=${this.config.env}, port=${this.config.port}]`
  }
}
