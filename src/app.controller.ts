import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { Public } from './common/decorators/public.decorator';
import { Permissions } from './common/decorators/permissions.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  @Public()
  health() {
    return this.appService.health();
  }

  @Get('dashboard')
  @Permissions('dashboard:watch')
  dashboard() {
    return { message: 'dashboard ready' };
  }
}
