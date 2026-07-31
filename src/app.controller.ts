import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { Public } from "./common/decorators/public.decorator";
import { Permissions } from "./common/decorators/permissions.decorator";

@ApiTags("System")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  @Public()
  @ApiOperation({ summary: "System Healthcheck" })
  health() {
    return this.appService.health();
  }

  @Get("dashboard")
  @Permissions("dashboard:watch")
  @ApiOperation({ summary: "Dashboard Overview Metrics" })
  dashboard() {
    return { message: "dashboard ready" };
  }
}
