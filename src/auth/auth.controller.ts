import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiSecurity,
  ApiHeader,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

const REFRESH_COOKIE_NAME = "refresh_token";
const CSRF_COOKIE_NAME = "csrf_token";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @ApiOperation({ summary: "User Authentication & Sign-In" })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setSessionCookies(response, result.refreshToken, result.csrfToken);

    return {
      accessToken: result.accessToken,
      csrfToken: result.csrfToken,
      user: result.user,
    };
  }

  @Get("session")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fetch Active Session & User Profile" })
  session(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  @Public()
  @Post("refresh")
  @ApiSecurity("x-csrf-token")
  @ApiHeader({
    name: "x-csrf-token",
    description: "CSRF token returned during login/refresh",
    required: true,
  })
  @ApiOperation({ summary: "Rotate Refresh Token & Issue Access Token" })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCsrfToken(request);
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is missing");
    }

    const result = await this.authService.refresh(refreshToken);
    this.setSessionCookies(response, result.refreshToken, result.csrfToken);

    return {
      accessToken: result.accessToken,
      csrfToken: result.csrfToken,
      user: result.user,
    };
  }

  @Public()
  @Post("logout")
  @ApiSecurity("x-csrf-token")
  @ApiHeader({
    name: "x-csrf-token",
    description: "CSRF token returned during login/refresh",
    required: true,
  })
  @ApiOperation({ summary: "User Logout & Cookie Revocation" })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCsrfToken(request);
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    response.clearCookie(REFRESH_COOKIE_NAME, this.sessionCookieOptions());
    response.clearCookie(CSRF_COOKIE_NAME, { ...this.sessionCookieOptions(false), path: "/" });

    return { message: "Logged out" };
  }

  private setSessionCookies(
    response: Response,
    refreshToken: string,
    csrfToken: string,
  ) {
    response.cookie(
      REFRESH_COOKIE_NAME,
      refreshToken,
      this.sessionCookieOptions(),
    );

    response.cookie(
      CSRF_COOKIE_NAME,
      csrfToken,
      { ...this.sessionCookieOptions(false), path: "/" },
    );
  }

  private sessionCookieOptions(httpOnly = true) {
    const secure =
      (process.env.COOKIE_SECURE ?? "false").toLowerCase() === "true";

    return {
      httpOnly,
      secure,
      sameSite: "lax" as const,
      path: "/api/auth",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    };
  }

  private assertCsrfToken(request: Request) {
    const csrfCookie = request.cookies?.[CSRF_COOKIE_NAME];
    const csrfHeader = request.headers["x-csrf-token"];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new UnauthorizedException("Invalid CSRF token");
    }
  }
}
